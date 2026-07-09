export interface BossDropSkillEntry {
    skill: MonsterSkill;
    dropBossName: string;
    sourceBossName: string;
    isExtraDrop: boolean;
}

export const getBossDropSourceNames = (boss: Pick<MonsterBoss, "name" | "extraDrop"> | null) => {
    if (!boss) return [];
    return Array.from(new Set([boss.name, ...(boss.extraDrop || [])].filter(Boolean)));
};

export const getBossDropSkillEntries = (
    boss: Pick<MonsterBoss, "name" | "extraDrop"> | null,
    skills: MonsterSkill[],
    role?: Pick<Role, "gender">
) => {
    if (!boss) return [];
    const entries: BossDropSkillEntry[] = [];
    const seen = new Set<string>();
    for (const sourceBossName of getBossDropSourceNames(boss)) {
        for (const skill of skills) {
            if (!skill.belongBoss?.includes(sourceBossName)) continue;
            if (role && skill.gender !== null && skill.gender !== role.gender) continue;
            const key = `${skill.id}-${sourceBossName}`;
            if (seen.has(key)) continue;
            seen.add(key);
            entries.push({
                skill,
                dropBossName: boss.name,
                sourceBossName,
                isExtraDrop: sourceBossName !== boss.name,
            });
        }
    }
    return entries;
};
