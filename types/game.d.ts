interface MonsterSkill {
    id: number;
    name: string;
    icon: number;
    gender: Gender | null; // 技能性别，null表示通用技能
    belongBoss?: string[];
}
