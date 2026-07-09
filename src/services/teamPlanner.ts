import { normalizeCanTreat } from "@/utils/role";
import { getBossDropSkillEntries } from "@/utils/boss-drop";

export interface TeamPlannerRequirement {
    skillId: number | null;
    level: number | null;
}

export type TeamPlannerMode = "recommend" | "assign";

export interface TeamPlannerAccountGroup {
    id: string;
    name: string;
    accounts: string[];
}

export interface TeamPlannerOptions {
    topN: number;
    sortWeight: number;
    boostMissingNineWithTenBook: boolean;
    requirements: TeamPlannerRequirement[];
    requiredRoleIds: string[];
    excludedRoleIds?: string[];
    accountGroupsEnabled?: boolean;
    accountGroups?: TeamPlannerAccountGroup[];
    levelWeightMultipliers?: Record<number, number>;
    genderSkillReplaceMap?: Record<number, number>;
    skillWeights?: Record<number, number>;
}

export interface TeamPlannerRoleNeed {
    roleId: string;
    skillId: number;
    skillName: string;
    droppedSkillId: number;
    droppedSkillName: string;
    targetLevel: number;
    currentLevel: number;
    effectiveLevel: number;
    weight: number;
    score: number;
    converted: boolean;
    hasHigherBookBlocked: boolean;
    floors: number[];
    bosses: string[];
}

export interface TeamPlannerRoleReport {
    role: Role;
    slot: "dps" | "healer";
    needs: TeamPlannerRoleNeed[];
    benefitScore: number;
}

export interface TeamPlannerConflict {
    skillId: number;
    skillName: string;
    targetLevel: number;
    roles: Role[];
    penalty: number;
}

export interface TeamPlannerWastedDrop {
    skillId: number;
    skillName: string;
    targetLevel: number;
    bosses: string[];
    floors: number[];
    penalty: number;
}

export interface TeamPlannerResult {
    id: string;
    roles: Role[];
    healer: Role;
    dps: [Role, Role];
    roleReports: TeamPlannerRoleReport[];
    benefitScore: number;
    conflictScore: number;
    needCount: number;
    uniqueBossCount: number;
    conflicts: TeamPlannerConflict[];
    wastedDrops: TeamPlannerWastedDrop[];
    wastedDropScore: number;
}

const targetFloors = {
    min: 81,
    max: 100,
};
const missingNineWithTenBookMultiplier = 2;
const plannerSkillLevelLabel = [
    "未学习",
    "一重",
    "二重",
    "三重",
    "四重",
    "五重",
    "六重",
    "七重",
    "八重",
    "九重",
    "十重",
] as const;

const getLevelWeightMultiplier = (targetLevel: number, options: Pick<TeamPlannerOptions, "levelWeightMultipliers">) => {
    return options.levelWeightMultipliers?.[targetLevel] ?? (targetLevel >= 10 ? 2 : 1);
};

const getSkillWeight = (
    skillId: number,
    targetLevel: number,
    options: Pick<TeamPlannerOptions, "skillWeights" | "levelWeightMultipliers">
) => {
    return (options.skillWeights?.[skillId] ?? 1) * getLevelWeightMultiplier(targetLevel, options);
};

const getBookTargetLevel = (floor: number) => {
    return floor >= 91 ? 10 : 9;
};

const canLearnSkill = (skill: MonsterSkill, gender: Gender) => {
    return skill.gender === null || skill.gender === gender;
};

const getSkillLookupMap = (skillMap: Record<number, MonsterSkill>) => {
    const lookupMap = { ...skillMap };
    for (const skill of Object.values(skillMap)) {
        if (typeof skill.inSkillId === "number") {
            lookupMap[skill.inSkillId] = skill;
        }
    }
    return lookupMap;
};

const resolveDroppedSkillForRole = (
    droppedSkill: MonsterSkill,
    role: Role,
    skillMap: Record<number, MonsterSkill>,
    options: Pick<TeamPlannerOptions, "genderSkillReplaceMap">
) => {
    if (canLearnSkill(droppedSkill, role.gender)) {
        return droppedSkill;
    }
    const replaceSkillId = options.genderSkillReplaceMap?.[droppedSkill.id];
    const replaceSkill = replaceSkillId ? skillMap[replaceSkillId] : null;
    if (replaceSkill && canLearnSkill(replaceSkill, role.gender)) {
        return replaceSkill;
    }
    return null;
};

const getRoleSkillLevelMap = (role: Role) => {
    return Object.fromEntries((role.skills || []).map((skill) => [skill.id, skill.level]));
};

const getUsableBookLevels = (
    role: Role,
    targetSkillId: number,
    skillMap: Record<number, MonsterSkill>,
    includeConvertibleBooks: boolean,
    options: Pick<TeamPlannerOptions, "genderSkillReplaceMap">
) => {
    const levels: number[] = [];
    for (const book of role.inventory || []) {
        const bookSkill = skillMap[book.id];
        if (!bookSkill) continue;
        const usableSkill = includeConvertibleBooks ? resolveDroppedSkillForRole(bookSkill, role, skillMap, options) : bookSkill;
        if (usableSkill?.id === targetSkillId) {
            levels.push(book.level);
        }
    }
    return levels.sort((a, b) => a - b);
};

export const getRoleEffectiveSkillLevel = (
    role: Role,
    skillId: number,
    skillMap: Record<number, MonsterSkill>,
    includeConvertibleBooks = true,
    options: Pick<TeamPlannerOptions, "genderSkillReplaceMap"> = {}
) => {
    const skillLevelMap = getRoleSkillLevelMap(role);
    let level = skillLevelMap[skillId] || 0;
    const bookLevels = getUsableBookLevels(role, skillId, skillMap, includeConvertibleBooks, options);
    for (const bookLevel of bookLevels) {
        if (bookLevel <= level) continue;
        if (bookLevel === level + 1) {
            level = bookLevel;
        }
    }
    return level;
};

const hasUsableBookLevel = (
    role: Role,
    skillId: number,
    level: number,
    skillMap: Record<number, MonsterSkill>,
    includeConvertibleBooks = true,
    options: Pick<TeamPlannerOptions, "genderSkillReplaceMap"> = {}
) => {
    return getUsableBookLevels(role, skillId, skillMap, includeConvertibleBooks, options).includes(level);
};

const getPlanningFloors = (map: WeeklyMonsterMap | null) => {
    return (map?.floors || []).filter((floor) => floor.floor >= targetFloors.min && floor.floor <= targetFloors.max && floor.boss);
};

const getBossDroppedSkillEntries = (
    boss: MonsterBoss,
    skillMap: Record<number, MonsterSkill>,
    skillLookupMap: Record<number, MonsterSkill>
) => {
    const skillById = new Map<number, { skill: MonsterSkill; sourceBossName: string; isExtraDrop: boolean }>();
    for (const skillId of boss.skills || []) {
        const skill = skillLookupMap[skillId];
        if (skill) {
            skillById.set(skill.id, {
                skill,
                sourceBossName: boss.name,
                isExtraDrop: false,
            });
        }
    }
    for (const entry of getBossDropSkillEntries(boss, Object.values(skillMap))) {
        if (!skillById.has(entry.skill.id)) {
            skillById.set(entry.skill.id, {
                skill: entry.skill,
                sourceBossName: entry.sourceBossName,
                isExtraDrop: entry.isExtraDrop,
            });
        }
    }
    return Array.from(skillById.values());
};

export const getRolePlanningNeeds = (
    role: Role,
    map: WeeklyMonsterMap | null,
    skillMap: Record<number, MonsterSkill>,
    options: Pick<TeamPlannerOptions, "boostMissingNineWithTenBook" | "genderSkillReplaceMap" | "skillWeights" | "levelWeightMultipliers">
) => {
    const needMap = new Map<string, TeamPlannerRoleNeed>();
    const skillLookupMap = getSkillLookupMap(skillMap);
    for (const floor of getPlanningFloors(map)) {
        const boss = floor.boss;
        if (!boss) continue;
        const targetLevel = getBookTargetLevel(floor.floor);
        for (const dropEntry of getBossDroppedSkillEntries(boss, skillMap, skillLookupMap)) {
            const droppedSkill = dropEntry.skill;
            const targetSkill = resolveDroppedSkillForRole(droppedSkill, role, skillMap, options);
            if (!targetSkill) continue;
            if (hasUsableBookLevel(role, targetSkill.id, targetLevel, skillMap, true, options)) continue;

            const currentLevel = getRoleSkillLevelMap(role)[targetSkill.id] || 0;
            if (currentLevel >= targetLevel) continue;
            const effectiveLevel = getRoleEffectiveSkillLevel(role, targetSkill.id, skillMap, true, options);
            if (effectiveLevel >= targetLevel) continue;

            const key = `${targetSkill.id}-${targetLevel}`;
            const hasHigherBookBlocked =
                targetLevel === 9 && effectiveLevel < 9 && hasUsableBookLevel(role, targetSkill.id, 10, skillMap, true, options);
            const baseWeight = getSkillWeight(targetSkill.id, targetLevel, options);
            const weight =
                options.boostMissingNineWithTenBook && hasHigherBookBlocked
                    ? baseWeight * missingNineWithTenBookMultiplier
                    : baseWeight;
            const existing = needMap.get(key);
            if (existing) {
                if (!existing.floors.includes(floor.floor)) existing.floors.push(floor.floor);
                if (!existing.bosses.includes(boss.name)) existing.bosses.push(boss.name);
                continue;
            }
            needMap.set(key, {
                roleId: role.id!,
                skillId: targetSkill.id,
                skillName: targetSkill.name,
                droppedSkillId: droppedSkill.id,
                droppedSkillName: droppedSkill.name,
                targetLevel,
                currentLevel,
                effectiveLevel,
                weight,
                score: weight,
                converted: droppedSkill.id !== targetSkill.id,
                hasHigherBookBlocked,
                floors: [floor.floor],
                bosses: [boss.name],
            });
        }
    }
    return Array.from(needMap.values()).sort((a, b) => b.score - a.score || b.targetLevel - a.targetLevel);
};

const getValidRequirements = (requirements: TeamPlannerRequirement[]) => {
    return requirements.filter(
        (requirement): requirement is { skillId: number; level: number } =>
            typeof requirement.skillId === "number" && typeof requirement.level === "number"
    );
};

const matchRequirements = (
    roles: Role[],
    requirements: TeamPlannerRequirement[],
    skillMap: Record<number, MonsterSkill>
) => {
    const validRequirements = getValidRequirements(requirements);
    return validRequirements.every((requirement) =>
        roles.some(
            (role) =>
                getRoleEffectiveSkillLevel(role, requirement.skillId, skillMap, false) >= requirement.level
        )
    );
};

const matchRequiredRoles = (roles: Role[], requiredRoleIds: string[]) => {
    const validRequiredRoleIds = Array.from(new Set(requiredRoleIds.filter(Boolean)));
    if (!validRequiredRoleIds.length) return true;
    const teamRoleIds = new Set(roles.map((role) => role.id));
    return validRequiredRoleIds.every((roleId) => teamRoleIds.has(roleId));
};

const getTeamConflicts = (needs: TeamPlannerRoleNeed[], roles: Role[]) => {
    const roleMap = Object.fromEntries(roles.map((role) => [role.id!, role]));
    const groupedNeeds = needs.reduce<Record<string, TeamPlannerRoleNeed[]>>((result, need) => {
        const key = `${need.skillId}-${need.targetLevel}`;
        result[key] = result[key] || [];
        result[key].push(need);
        return result;
    }, {});
    const conflicts: TeamPlannerConflict[] = [];
    for (const group of Object.values(groupedNeeds)) {
        const uniqueRoleIds = Array.from(new Set(group.map((need) => need.roleId)));
        if (uniqueRoleIds.length <= 1) continue;
        const firstNeed = group[0];
        conflicts.push({
            skillId: firstNeed.skillId,
            skillName: firstNeed.skillName,
            targetLevel: firstNeed.targetLevel,
            roles: uniqueRoleIds.map((roleId) => roleMap[roleId]).filter(Boolean),
            penalty: (uniqueRoleIds.length - 1) * Math.max(...group.map((need) => need.score)),
        });
    }
    return conflicts.sort((a, b) => b.penalty - a.penalty);
};

const getTeamWastedDrops = (
    needs: TeamPlannerRoleNeed[],
    roles: Role[],
    map: WeeklyMonsterMap | null,
    skillMap: Record<number, MonsterSkill>,
    options: Pick<TeamPlannerOptions, "genderSkillReplaceMap" | "skillWeights" | "levelWeightMultipliers">
) => {
    const fightingFloors = new Set(needs.flatMap((need) => need.floors));
    const skillLookupMap = getSkillLookupMap(skillMap);
    const wastedDropMap = new Map<string, TeamPlannerWastedDrop>();
    for (const floor of getPlanningFloors(map)) {
        if (!fightingFloors.has(floor.floor) || !floor.boss) continue;
        const targetLevel = getBookTargetLevel(floor.floor);
        for (const dropEntry of getBossDroppedSkillEntries(floor.boss, skillMap, skillLookupMap)) {
            const hasUsefulRole = roles.some((role) => {
                const targetSkill = resolveDroppedSkillForRole(dropEntry.skill, role, skillMap, options);
                if (!targetSkill) return false;
                if (hasUsableBookLevel(role, targetSkill.id, targetLevel, skillMap, true, options)) return false;
                return getRoleEffectiveSkillLevel(role, targetSkill.id, skillMap, true, options) < targetLevel;
            });
            if (hasUsefulRole) continue;
            const key = `${dropEntry.skill.id}-${targetLevel}`;
            const penalty = getSkillWeight(dropEntry.skill.id, targetLevel, options);
            const existing = wastedDropMap.get(key);
            if (existing) {
                if (!existing.bosses.includes(floor.boss.name)) existing.bosses.push(floor.boss.name);
                if (!existing.floors.includes(floor.floor)) existing.floors.push(floor.floor);
                continue;
            }
            wastedDropMap.set(key, {
                skillId: dropEntry.skill.id,
                skillName: dropEntry.skill.name,
                targetLevel,
                bosses: [floor.boss.name],
                floors: [floor.floor],
                penalty,
            });
        }
    }
    return Array.from(wastedDropMap.values()).sort((a, b) => b.penalty - a.penalty);
};

const compareTeams = (a: TeamPlannerResult, b: TeamPlannerResult, sortWeight: number) => {
    const benefitWeight = Math.min(Math.max(sortWeight, 0), 100) / 100;
    const conflictWeight = 1 - benefitWeight;
    const aScore = (a.conflictScore + a.wastedDropScore) * conflictWeight - a.benefitScore * benefitWeight;
    const bScore = (b.conflictScore + b.wastedDropScore) * conflictWeight - b.benefitScore * benefitWeight;
    return (
        aScore - bScore ||
        a.conflictScore - b.conflictScore ||
        a.wastedDropScore - b.wastedDropScore ||
        b.benefitScore - a.benefitScore ||
        b.needCount - a.needCount ||
        a.id.localeCompare(b.id)
    );
};

export const planTeams = (
    roles: Role[],
    map: WeeklyMonsterMap | null,
    skillMap: Record<number, MonsterSkill>,
    options: TeamPlannerOptions
) => {
    const availableRoles = roles.filter((role) => role.id && !role.cd);
    const roleNeeds = new Map<string, TeamPlannerRoleNeed[]>();
    for (const role of availableRoles) {
        roleNeeds.set(role.id!, getRolePlanningNeeds(role, map, skillMap, options));
    }

    const healerCandidates = availableRoles.filter((role) => normalizeCanTreat(role));
    const results: TeamPlannerResult[] = [];
    const seenTeamKeys = new Set<string>();
    for (const healer of healerCandidates) {
        for (let i = 0; i < availableRoles.length; i++) {
            const dpsA = availableRoles[i];
            if (dpsA.id === healer.id || dpsA.account === healer.account) continue;
            for (let j = i + 1; j < availableRoles.length; j++) {
                const dpsB = availableRoles[j];
                if (dpsB.id === healer.id || dpsB.account === healer.account || dpsB.account === dpsA.account) continue;
                const teamRoles = [dpsA, dpsB, healer];
                const teamKey = teamRoles.map((role) => role.id!).sort().join("-");
                if (seenTeamKeys.has(teamKey)) continue;
                seenTeamKeys.add(teamKey);
                if (!matchRequiredRoles(teamRoles, options.requiredRoleIds || [])) continue;
                if (!matchRequirements(teamRoles, options.requirements, skillMap)) continue;

                const roleReports: TeamPlannerRoleReport[] = [
                    {
                        role: dpsA,
                        slot: "dps",
                        needs: roleNeeds.get(dpsA.id!) || [],
                        benefitScore: (roleNeeds.get(dpsA.id!) || []).reduce((sum, need) => sum + need.score, 0),
                    },
                    {
                        role: dpsB,
                        slot: "dps",
                        needs: roleNeeds.get(dpsB.id!) || [],
                        benefitScore: (roleNeeds.get(dpsB.id!) || []).reduce((sum, need) => sum + need.score, 0),
                    },
                    {
                        role: healer,
                        slot: "healer",
                        needs: roleNeeds.get(healer.id!) || [],
                        benefitScore: (roleNeeds.get(healer.id!) || []).reduce((sum, need) => sum + need.score, 0),
                    },
                ];
                const needs = roleReports.flatMap((report) => report.needs);
                const conflicts = getTeamConflicts(needs, teamRoles);
                const wastedDrops = getTeamWastedDrops(needs, teamRoles, map, skillMap, options);
                const uniqueBossCount = new Set(needs.flatMap((need) => need.bosses)).size;
                results.push({
                    id: teamKey,
                    roles: teamRoles,
                    healer,
                    dps: [dpsA, dpsB],
                    roleReports,
                    benefitScore: needs.reduce((sum, need) => sum + need.score, 0),
                    conflictScore: conflicts.reduce((sum, conflict) => sum + conflict.penalty, 0),
                    needCount: needs.length,
                    uniqueBossCount,
                    conflicts,
                    wastedDrops,
                    wastedDropScore: wastedDrops.reduce((sum, drop) => sum + drop.penalty, 0),
                });
            }
        }
    }

    return results.sort((a, b) => compareTeams(a, b, options.sortWeight)).slice(0, Math.max(options.topN, 0));
};

export const formatPlannerLevel = (level: number) => {
    return plannerSkillLevelLabel[level] || `${level}重`;
};
