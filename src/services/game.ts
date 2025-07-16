import { bossList } from "@/assets/data/game";
import { url } from "@/assets/data/jx3box";
import { fetch } from '@tauri-apps/plugin-http';

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
                        const boss = bossList.find((b) => b.skillAlias === bossName);
                        if (!boss) continue;
                        if (!skill.belongBoss) skill.belongBoss = [];
                        skill.belongBoss.push(boss.name);
                    }
                    return skill;
                });
            return skills;
        });
};
