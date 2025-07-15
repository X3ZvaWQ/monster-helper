import { getMonsterSkills } from "@/services/game";
import { distance } from "fastest-levenshtein";
import { keyBy } from "lodash";
import { skillLevelLabel } from "@/assets/data/game";

export const useGameStore = defineStore("game", {
    state: () => ({
        skills: [] as MonsterSkill[],
        skillMap: {} as Record<number, MonsterSkill>,
    }),
    actions: {
        fetchSkills() {
            getMonsterSkills().then((res) => {
                this.skills = res;
                this.skillMap = keyBy(res, "id");
            });
        },
        getSkillById(id: number) {
            return this.skillMap[id] || null;
        },
        getSkillNameCharWhiteList() {
            const levelString = skillLevelLabel.slice(1).join("");
            const skillName = this.skills.map((s) => s.name).join("");
            return [...new Set((levelString + skillName).split(""))];
        },
        getSkillsFromOcrResult(ocrResult: OcrResultItem[]) {
            const result: RoleSkill[] = [];
            const skillMap = keyBy(this.skills, "name");
            let currentLevel = 0;
            for (const item of ocrResult) {
                let ocrSkillName = item.text;
                const level = skillLevelLabel.findIndex((l) => l === ocrSkillName);
                if (level != -1) {
                    // 如果是技能等级的label，配置当前等级
                    currentLevel = level;
                    continue;
                }
                // 如果技能名称完全相同
                if (skillMap[ocrSkillName]) {
                    result.push({
                        id: skillMap[ocrSkillName].id,
                        level: currentLevel,
                    });
                    delete skillMap[ocrSkillName]; // 删除完全匹配的技能
                    continue;
                }
                // 如果技能名称包含现有技能
                for (const name in skillMap) {
                    if (ocrSkillName.includes(name)) {
                        result.push({
                            id: skillMap[name].id,
                            level: currentLevel,
                        });
                        delete skillMap[name]; // 删除包含的技能
                        ocrSkillName = ocrSkillName.replace(name, ""); // 从字符串中移除已识别的技能名称
                        if (ocrSkillName.length === 0) break; // 如果字符串为空，消耗完毕
                    }
                }
                // 如果还有空的，大概率是有错字/错字与技能粘黏同时出现了
                for (const name in skillMap) {
                    if (ocrSkillName.length < name.length - 1) continue; // 如果字符串长度小于技能名称长度 - 1，跳过
                    const lengths = [name.length - 1, name.length, name.length + 1];
                    for (const len of lengths) {
                        if (!len) continue; // 如果长度小于1，跳过
                        let founded = false;
                        for (let i = 0; i <= ocrSkillName.length - len; i++) {
                            const subStr = ocrSkillName.slice(i, i + len);
                            if (distance(subStr, name) <= 1) {
                                result.push({
                                    id: skillMap[name].id,
                                    level: currentLevel,
                                });
                                console.log(`${ocrSkillName} => ${name}`);
                                delete skillMap[name]; // 删除包含的技能
                                founded = true;
                                break; // 找到一个匹配的就可以了
                            }
                        }
                        if (founded) break; // 如果已经找到匹配的技能，跳出循环
                    }
                }
            }
            return result;
        }
    },
});
