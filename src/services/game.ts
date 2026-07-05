import { bossList } from "@/assets/data/game";
import { url } from "@/assets/data/jx3box";
import { fetch } from "./fetch";
import { getSearchKey } from "@/utils/search";

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
                        inSkillId: raw.dwInSkillID,
                        icon: raw.Skill?.IconID || -1,
                        name: raw.szSkillName,
                        gender: sexMap[raw.nSex || 0] || null, // 技能性别
                        searchKey: getSearchKey(raw.szSkillName),
                    };
                    for (const bossName of raw.szBossName.split(";")) {
                        if (!bossName) continue;
                        let boss = bossList.value.find((b) => b.skillAlias === bossName);
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

export interface MonsterBossRaw {
    dwIndex: number;
    nGroup: number;
    dwNpcID: number;
    dwProgressID: number;
    szName: string | null;
    szSkill: number[] | null;
    ImagePath: string;
    ImageFrame: number;
}

export const getMonsterBosses = async () => {
    return fetch(`${url.node}/monster/boss`)
        .then((res) => res.json())
        .then((res) => {
            return res as ResponseData<MonsterBossRaw>;
        });
};

export interface MonsterEffectRaw {
    nID: number;
    dwIconID: number;
    szName: string;
    szDescription: string;
}

export const getMonsterEffects = async () => {
    return fetch(`${url.node}/monster/effects`)
        .then((res) => res.json())
        .then((res) => {
            return res as ResponseData<MonsterEffectRaw>;
        });
};

export interface WeeklyMonsterMapRawFloor {
    dwBossID: number;
    nEffectID: number;
    bCanGetBuff: boolean;
    nLevelState: number;
}

export interface WeeklyMonsterMapRaw {
    id: number;
    user_id: number;
    start: string;
    data: WeeklyMonsterMapRawFloor[];
    extra?: Record<string, unknown>;
    enable: boolean;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}

export const getWeeklyMonsterMap = async () => {
    return fetch(`${url.cms}/api/cms/app/monster/map`)
        .then((res) => res.json())
        .then((res) => {
            return res as {
                code: number;
                msg: string;
                data: WeeklyMonsterMapRaw;
            };
        });
};
