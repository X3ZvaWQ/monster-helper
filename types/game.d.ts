interface MonsterSkill {
    id: number;
    name: string;
    icon: number;
    gender: Gender | null; // 技能性别，null表示通用技能
    belongBoss?: string[];
    books?: MonsterSkillBook[];
    searchKey?: string;
}

interface MonsterBoss {
    id: number;
    name: string;
    skills: number[];
    avatar: string;
    imagePath?: string;
    imageFrame?: number;
}

interface MonsterEffect {
    id: number;
    icon: number;
    name: string;
    description: string;
    reward: number;
    tags: string[];
    buffID?: number;
    buffLevel?: number;
}

interface WeeklyMonsterMapFloor {
    floor: number;
    dwBossID: number;
    nEffectID: number;
    bCanGetBuff: boolean;
    nLevelState: number;
    boss: MonsterBoss | null;
    effect: MonsterEffect | null;
}

interface WeeklyMonsterMap {
    id: number;
    start: string;
    updatedAt: string;
    enable: boolean;
    floors: WeeklyMonsterMapFloor[];
    extra?: Record<string, unknown>;
}
