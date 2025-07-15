import {
    bossSpiritEnduranceCoef,
    levelSpiritEnduranceCoef,
    noSpiritEnduranceSkills,
    noThreeLevelSpiritEnduranceSkills,
    threeLevelSpiritEndurance,
} from "@/assets/data/game";
import { useGameStore } from "./game";
import { chain, sum } from "lodash";

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
        getSkillLevelMap(role: Role): Record<number, number> {
            return chain(role.skills).keyBy("id").mapValues("level").value();
        },
        calcSpiritAndEndurance(role: Role): { spirit: number; endurance: number } {
            let result = { spirit: 10000, endurance: 10000 }; // 精耐初始值
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
            // 2. boss 全收集精耐
            const skillIdMap = this.getSkillLevelMap(role);
            for (const { boss, coef } of bossSpiritEnduranceCoef) {
                // 取出属于该boss的计算精耐的技能
                const bossSkills = useGameStore().skills.filter(
                    (s) =>
                        s.belongBoss?.includes(boss) &&
                        !noSpiritEnduranceSkills.has(s.id) &&
                        (s.gender === null || s.gender == role.gender)
                );
                if (bossSkills.length === 0) continue; // 没有技能，跳过
                const actualCoef = typeof coef[0] === "number" ? coef : role.gender === "female" ? coef[0] : coef[1];
                for (const [level, levelCoef] of levelSpiritEnduranceCoef.entries()) {
                    // 如果所有技能都大于等于该等级，则增加精耐
                    if (bossSkills.every((s) => (skillIdMap[s.id] || 0) >= level)) {
                        result.spirit += levelCoef * actualCoef[0];
                        result.endurance += levelCoef * actualCoef[1];
                    } else {
                        break; // 如果有一个技能不满足条件，则不再增加该等级的精耐
                    }
                }
            }
            return result;
        },
    },
});
