import { TeamPlannerOptions, TeamPlannerResult } from "@/services/teamPlanner";
import TeamPlannerWorker from "@/utils/team-planner.worker?worker";

interface TeamPlannerWorkerRequest {
    id: number;
    type: "plan";
    roles: Role[];
    map: WeeklyMonsterMap | null;
    skillMap: Record<number, MonsterSkill>;
    options: TeamPlannerOptions;
}

interface TeamPlannerWorkerResponse {
    id: number;
    type: "plan";
    data: {
        result?: TeamPlannerResult[];
        elapsedMs?: number;
        error?: unknown;
    };
}

const clonePayload = <T>(payload: T): T => {
    return JSON.parse(JSON.stringify(payload)) as T;
};

export const useTeamPlannerWorker = () => {
    const results = shallowRef<TeamPlannerResult[]>([]);
    const calculating = shallowRef(false);
    const error = shallowRef("");
    const elapsedMs = shallowRef(0);
    let requestId = 0;
    let worker: Worker | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const terminateWorker = () => {
        worker?.terminate();
        worker = null;
    };

    const calculate = (payload: Omit<TeamPlannerWorkerRequest, "id" | "type">) => {
        if (timer) {
            clearTimeout(timer);
        }
        timer = setTimeout(() => {
            const id = ++requestId;
            terminateWorker();
            calculating.value = true;
            error.value = "";
            worker = new TeamPlannerWorker();
            worker.onmessage = (event: MessageEvent<TeamPlannerWorkerResponse>) => {
                if (event.data.id !== requestId) return;
                const data = event.data.data;
                results.value = data.result || [];
                elapsedMs.value = data.elapsedMs || 0;
                error.value = data.error instanceof Error ? data.error.message : data.error ? String(data.error) : "";
                calculating.value = false;
                terminateWorker();
            };
            worker.onerror = (event) => {
                if (id !== requestId) return;
                results.value = [];
                error.value = event.message || "组队规划计算失败";
                calculating.value = false;
                terminateWorker();
            };
            worker.postMessage({
                id,
                type: "plan",
                ...clonePayload(payload),
            } satisfies TeamPlannerWorkerRequest);
        }, 80);
    };

    const clear = () => {
        requestId++;
        results.value = [];
        calculating.value = false;
        error.value = "";
        elapsedMs.value = 0;
        if (timer) {
            clearTimeout(timer);
            timer = null;
        }
        terminateWorker();
    };

    onUnmounted(() => {
        if (timer) {
            clearTimeout(timer);
        }
        terminateWorker();
    });

    return {
        results,
        calculating,
        error,
        elapsedMs,
        calculate,
        clear,
    };
};
