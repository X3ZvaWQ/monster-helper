import { planTeams, TeamPlannerOptions, TeamPlannerResult } from "@/services/teamPlanner";

interface TeamPlannerWorkerRequest {
    id: number;
    type: "plan";
    roles: Role[];
    map: WeeklyMonsterMap | null;
    skillMap: Record<number, MonsterSkill>;
    options: TeamPlannerOptions;
}

interface TeamPlannerWorkerData {
    result?: TeamPlannerResult[];
    elapsedMs?: number;
    error?: unknown;
}

// biome-ignore lint/suspicious/noGlobalAssign: worker就是这么写的
onmessage = (event: MessageEvent<TeamPlannerWorkerRequest>) => {
    const { id, type, roles, map, skillMap, options } = event.data;
    if (type !== "plan") return;
    const startedAt = performance.now();
    try {
        postMessage({
            id,
            type,
            data: {
                result: planTeams(roles, map, skillMap, options),
                elapsedMs: performance.now() - startedAt,
            } satisfies TeamPlannerWorkerData,
        });
    } catch (error) {
        postMessage({
            id,
            type,
            data: {
                result: [],
                elapsedMs: performance.now() - startedAt,
                error,
            } satisfies TeamPlannerWorkerData,
        });
    }
};
