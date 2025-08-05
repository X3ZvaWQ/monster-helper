import {
    bossSpiritEnduranceCoef,
    levelSpiritEnduranceCoef,
    noSpiritEnduranceSkills,
    noThreeLevelSpiritEnduranceSkills,
    teachSpritEnduranceRequire,
    threeLevelSpiritEndurance,
} from "@/assets/data/game";
import { useGameStore } from "./game";
import { chain, sum } from "lodash";

interface SpiritAndEnduranceCalcResult {
    spirit: number;
    endurance: number;
    teach: string[][];
    threeSkillSpiritEndurance: number;
    bossSpiritEndurance: Record<
        string,
        {
            spirit: number;
            endurance: number;
            collectLevel: number;
            collectCount: number;
            collectTotal: number;
        }
    >;
}
const spiritAndEnduranceCache = new Map<string, ComputedRef<SpiritAndEnduranceCalcResult>>();

const skillLevelMapCache = new Map<string, ComputedRef<Record<number, number>>>();

export const useRoleStore = defineStore("role", {
    state: () => ({
        roles: [] as Role[],
    }),
    actions: {
        resetCd() {
            this.roles.forEach((role) => {
                role.cd = false; // 重置百战CD
                role.cdRemark = ""; // 重置百战CD备注
                role.teachCount = 20; // 重置传功计数
                role.taughtCount = 0; // 重置被传功计数
            });
        },
        deleteRole(id: string) {
            const index = this.roles.findIndex((r) => r.id === id);
            if (index === -1) return;
            this.roles.splice(index, 1);
        },
        updateRole(id: string, payload: Partial<Role>) {
            const role = this.roles.find((r) => r.id === id);
            if (!role) return;
            Object.assign(role, payload);
        },
        getRoleById(id: string) {
            return this.roles.find((r) => r.id === id);
        },
        _getSkillLevelMap(role: Role): ComputedRef<Record<number, number>> {
            return computed(() => chain(role.skills).keyBy("id").mapValues("level").value());
        },
        getSkillLevelMap(role: Role): ComputedRef<Record<number, number>> {
            if (skillLevelMapCache.has(role.id!)) {
                return skillLevelMapCache.get(role.id!)!;
            }
            const result = this._getSkillLevelMap(role);
            skillLevelMapCache.set(role.id!, result);
            return result;
        },
        _calcSpiritAndEndurance(role: Role): SpiritAndEnduranceCalcResult {
            let result: SpiritAndEnduranceCalcResult = {
                spirit: 10000,
                endurance: 10000,
                teach: Array.from({ length: 11 }, () => []) as string[][],
                threeSkillSpiritEndurance: 0,
                bossSpiritEndurance: {} as Record<
                    string,
                    {
                        spirit: number;
                        endurance: number;
                        collectLevel: number;
                        collectCount: number;
                        collectTotal: number;
                    }
                >,
            }; // 精耐初始值
            if (!role.skills?.length) return result;
            // 1. 三本技能书判断
            const skillLevelCount = Array.from({ length: threeLevelSpiritEndurance.length }, () => 0);
            for (const skill of role.skills) {
                if (noThreeLevelSpiritEnduranceSkills.has(skill.id)) continue;
                if (skill.level > skillLevelCount.length - 1) continue; // 超出范围的技能等级
                skillLevelCount[skill.level] += 1;
            }
            for (const [level, value] of threeLevelSpiritEndurance.entries()) {
                // 统计大于等于该等级的所有技能数量
                const count = sum(skillLevelCount.slice(level));
                if (count >= 3) {
                    result.spirit += value;
                    result.endurance += value;
                }
            }
            result.threeSkillSpiritEndurance = result.spirit;
            // 2. boss 全收集精耐
            const skillIdMap = this.getSkillLevelMap(role).value;
            for (const { boss, coef } of bossSpiritEnduranceCoef) {
                let bossSpirit = 0;
                let bossEndurance = 0;
                let highestTeachLevel = 0; // 可传功等级
                let collectLevel = 0; // 全收集等级
                // 取出属于该boss的计算精耐的技能
                const bossSkills = useGameStore().skills.filter(
                    (s) =>
                        s.belongBoss?.includes(boss) &&
                        !noSpiritEnduranceSkills.has(s.id) &&
                        !noThreeLevelSpiritEnduranceSkills.has(s.id) &&
                        (s.gender === null || s.gender == role.gender)
                );
                if (bossSkills.length === 0) continue; // 没有技能，跳过
                const actualCoef = typeof coef[0] === "number" ? coef : role.gender === "female" ? coef[0] : coef[1];
                let enoughLevelSkill = [];
                for (const [level, levelCoef] of levelSpiritEnduranceCoef.entries()) {
                    // 如果所有技能都大于等于该等级，则增加精耐
                    enoughLevelSkill = bossSkills.filter((s) => (skillIdMap[s.id] || 0) >= level);
                    if (enoughLevelSkill.length === bossSkills.length) {
                        bossSpirit += levelCoef * actualCoef[0];
                        bossEndurance += levelCoef * actualCoef[1];
                        collectLevel = level; // 更新全收集等级
                        if (level > 3) {
                            // 3级以上可以传功，可传功等级为 全收集等级 - 2
                            highestTeachLevel = level - 2;
                        }
                    } else {
                        break;
                    }
                }
                result.bossSpiritEndurance[boss] = {
                    spirit: bossSpirit,
                    endurance: bossEndurance,
                    collectCount: enoughLevelSkill.length, // 初始收集数为0
                    collectTotal: bossSkills.length, // 总收集数
                    collectLevel: collectLevel + 1, // 全收集等级
                };
                result.spirit += bossSpirit;
                result.endurance += bossEndurance;

                result.teach[highestTeachLevel].push(boss);
            }
            // 3. 传功技能计算
            // 计算当前精耐可以传功的最大数值
            const effectiveValue = Math.max(result.spirit, result.endurance);
            for (const [level, requireValue] of teachSpritEnduranceRequire.entries()) {
                if (!requireValue) continue;
                if (effectiveValue < requireValue) {
                    // 如果精耐最大值小于当前等级的传功需求，该等级的boss移到上一级
                    if (level > 0) {
                        result.teach[level - 1].push(...result.teach[level]);
                        result.teach[level] = [];
                    }
                }
            }

            return result;
        },
        calcSpiritAndEndurance(role: Role) {
            if (spiritAndEnduranceCache.has(role.id!)) {
                return spiritAndEnduranceCache.get(role.id!)!;
            }
            const result = computed(() => this._calcSpiritAndEndurance(role));
            spiritAndEnduranceCache.set(role.id!, result);
            return result;
        },
    },
});
