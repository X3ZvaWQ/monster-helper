import { bossList } from "@/assets/data/game";
import { url } from "@/assets/data/jx3box";
// 判断是否在tauri下
import { fetch } from "./fetch";

interface MonsterSkillRaw {
    ParsedSkill: {
        desc: string;
        id: number;
        tooltip: string[][];
    };
    Skill: {
        Desc: string;
        HelpDesc: string;
        IconID: number;
        Level: number;
        Name: string;
        Remark: string;
        SimpleDesc: string;
        SkillID: number;
        SkillName: string;
    };
    bDeprecated: number;
    dwInSkillID: number;
    dwOutSkillID: number;
    nColor: number;
    nCost: number;
    nSex: number;
    szBossName: string;
    szSkillName: string;
    szType: number[];
}
const sexMap: Record<number, Gender | null> = {
    0: null,
    1: "male",
    2: "female",
};
export const getMonsterSkills = async () => {
    return fetch(`${url.node}/monster/skills`)
        .then((res) => res.json())
        .then((data) => {
            return data as ResponsePagedData<MonsterSkillRaw>;
        })
        .then((res) => {
            const raw_skills = res.data.list;
            const skills = raw_skills
                .filter((skill) => skill.bDeprecated != 1)
                .map((raw) => {
                    const skill: MonsterSkill = {
                        id: raw.dwOutSkillID,
                        icon: raw.Skill.IconID,
                        name: raw.szSkillName,
                        gender: sexMap[raw.nSex || 0] || null, // 技能性别
                    };
                    for (const bossName of raw.szBossName.split(";")) {
                        if (!bossName) continue;
                        let boss = bossList.find((b) => b.skillAlias === bossName);
                        if (!boss) continue;
                        if (!skill.belongBoss) skill.belongBoss = [];
                        const name = boss.name.includes("恶战") ? "恶战" : boss.name;
                        skill.belongBoss.push(name);
                    }
                    return skill;
                });
            return skills;
        });
};

export interface MonsterSkillBook {
    itemId: number;
    itemQuality: 3 | 4;
    skillName: string;
    skillId: number;
    iconId: number;
    itemName: string;
    isDirectUpgrade: 0 | 1;
    level: number;
    count?: number;
}
export const getMonsterBooks = async () => {
    return fetch(`${url.node}/monster/books`)
        .then((res) => res.json())
        .then((res) => {
            return res.data as ResponseData<MonsterSkillBook>;
        });
};
