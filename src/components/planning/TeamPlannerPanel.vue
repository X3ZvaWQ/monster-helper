<template>
    <div class="m-team-planner">
        <n-card size="small" class="m-planner-setting">
            <n-flex justify="space-between" align="center" :wrap="true">
                <n-flex align="center" :wrap="true">
                    <n-text strong>组队规划</n-text>
                    <n-text depth="3">地图更新于 {{ mapUpdatedAt }}</n-text>
                    <n-text depth="3">未打角色 {{ availableRoleCount }} 个</n-text>
                    <n-text depth="3">可用账号 {{ availableAccountCount }} 个</n-text>
                    <n-text depth="3">治疗候选 {{ healerRoleCount }} 个</n-text>
                </n-flex>
                <n-button type="primary" :loading="loading" @click="emit('refresh')">
                    <template #icon>
                        <i-material-symbols:refresh-rounded />
                    </template>
                    刷新地图
                </n-button>
            </n-flex>

            <n-divider />

            <n-flex class="m-planner-controls" align="center" :wrap="true">
                <n-flex align="center" :wrap="false" class="m-sort-weight">
                    <n-text depth="3" class="u-sort-label">冲突优先</n-text>
                    <n-slider
                        v-model:value="sortWeightDraft"
                        :min="0"
                        :max="100"
                        :step="5"
                        @dragend="commitSortWeight"
                        @mouseup="commitSortWeight"
                        @touchend="commitSortWeight"
                    />
                    <n-text depth="3" class="u-sort-label">收益优先</n-text>
                </n-flex>
                <n-flex align="center" :wrap="false">
                    <n-radio-group v-model:value="planningMode" size="small">
                        <n-radio-button value="recommend">推荐队伍</n-radio-button>
                        <n-radio-button value="assign">分队编排</n-radio-button>
                    </n-radio-group>
                </n-flex>
                <n-flex v-if="planningMode === 'assign'" align="center" :wrap="false">
                    <n-text depth="3">最大组数</n-text>
                    <n-input-number
                        v-model:value="maxGroupCount"
                        size="small"
                        :min="1"
                        :max="99"
                        :step="1"
                        class="u-max-group-count"
                    />
                </n-flex>
                <n-flex align="center" :wrap="false">
                    <n-switch v-model:value="settingStore.planning.boostMissingNineWithTenBook" size="small" />
                    <n-text depth="3">有十缺九提高权重</n-text>
                </n-flex>
            </n-flex>

            <n-collapse class="m-requirements">
                <n-collapse-item title="队伍硬性限制" name="requirements">
                    <n-dynamic-input v-model:value="settingStore.planning.requirements" :on-create="createRequirement">
                        <template #default="{ value }">
                            <n-flex align="center" :wrap="false" class="m-requirement-row">
                                <skill-select
                                    v-model:value="value.skillId"
                                    :multiple="false"
                                    placeholder="选择必须拥有的技能"
                                    class="u-requirement-skill"
                                />
                                <n-select
                                    v-model:value="value.level"
                                    :options="levelOptions"
                                    class="u-requirement-level"
                                />
                            </n-flex>
                        </template>
                    </n-dynamic-input>
                    <n-flex vertical class="m-required-roles">
                        <n-text depth="3">必须上场角色</n-text>
                        <role-select
                            v-model:value="requiredRoleIdsModel"
                            multiple
                            clearable
                            :disabled="planningMode === 'assign'"
                            :max-tag-count="2"
                            :placeholder="planningMode === 'assign' ? '分队编排模式不使用必须上场角色' : '选择 1-2 个必须上场的角色'"
                            :role-filter="isRequiredRoleSelectable"
                            class="u-required-role"
                        />
                    </n-flex>
                    <n-flex vertical class="m-required-roles">
                        <n-text depth="3">不参与角色</n-text>
                        <role-select
                            v-model:value="excludedRoleIdsModel"
                            multiple
                            clearable
                            max-tag-count="responsive"
                            placeholder="手动排除本次不参与规划的角色"
                            :role-filter="isExcludedRoleSelectable"
                            class="u-required-role"
                        />
                    </n-flex>
                    <n-text depth="3"
                        >当前限制：技能 {{ requirementText }}；角色 {{ requiredRoleText }}；排除 {{ excludedRoleText }}</n-text
                    >
                </n-collapse-item>
            </n-collapse>
        </n-card>

        <n-spin :show="isBusy" class="m-result-spin">
            <template #description>
                {{ plannerWorker.calculating.value ? "正在计算推荐" : "正在加载数据" }}
            </template>
            <n-empty v-if="!map" description="还没有本周地图数据，点击刷新地图加载" />
            <n-alert v-else-if="plannerWorker.error.value" type="error">
                {{ plannerWorker.error.value }}
            </n-alert>
            <n-empty
                v-else-if="!plannerWorker.results.value.length && !plannerWorker.calculating.value"
                description="没有符合条件的队伍，请检查未打角色、治疗候选和硬性限制"
            />
            <div v-else class="m-team-list">
                <n-card v-if="planningMode === 'assign'" size="small" class="m-assign-summary">
                    <n-flex align="center" :wrap="true">
                        <n-tag type="primary">分组结果</n-tag>
                        <n-text>共 {{ plannerWorker.results.value.length }} 组</n-text>
                        <n-text depth="3">同一角色只会出现一次，同队内账号/账号分组互斥</n-text>
                    </n-flex>
                </n-card>
                <team-planner-result-table
                    v-for="(result, index) in pagedResults"
                    :key="result.id"
                    :result="result"
                    :index="(resultPage - 1) * resultPageSize + index"
                    :mode="planningMode"
                    :star-skill-ids="settingStore.planning.starSkillIds || []"
                />
                <n-pagination
                    v-if="plannerWorker.results.value.length > resultPageSize"
                    v-model:page="resultPage"
                    :page-size="resultPageSize"
                    :item-count="plannerWorker.results.value.length"
                    size="small"
                    class="m-result-pagination"
                />
            </div>
        </n-spin>
    </div>
</template>

<script setup lang="ts">
import SkillSelect from "@/components/common/SkillSelect.vue";
import RoleSelect from "@/components/common/RoleSelect.vue";
import AccountGroupDialog from "@/components/planning/AccountGroupDialog.vue";
import SkillPreferenceDialog from "@/components/planning/SkillPreferenceDialog.vue";
import TeamPlannerResultTable from "@/components/planning/TeamPlannerResultTable.vue";
import { formatPlannerLevel, TeamPlannerMode } from "@/services/teamPlanner";
import { genderSkillReplaceMap, skillWeights } from "@/assets/data/game";
import { useGameStore } from "@/store/game";
import { useRoleStore } from "@/store/role";
import { useSettingStore } from "@/store/setting";
import { normalizeCanTreat } from "@/utils/role";
import { useTeamPlannerWorker } from "@/utils/use/team-planner";

const props = defineProps<{
    map: WeeklyMonsterMap | null;
    loading: boolean;
}>();

const emit = defineEmits<{
    refresh: [];
}>();

const gameStore = useGameStore();
const roleStore = useRoleStore();
const settingStore = useSettingStore();
const plannerWorker = useTeamPlannerWorker();

const levelOptions = [
    { label: "九重", value: 9 },
    { label: "十重", value: 10 },
];
const plannerResultLimit = 10;
const resultPageSize = 1;

const createRequirement = () => ({
    skillId: null,
    level: 9,
});
const plannerGenderSkillReplaceMap = Object.fromEntries(genderSkillReplaceMap.entries()) as Record<number, number>;
const sortWeightDraft = shallowRef(settingStore.planning.sortWeight ?? 0);
const skillPreferenceDialog = useTemplateRef<InstanceType<typeof SkillPreferenceDialog>>("skillPreferenceDialog");
const accountGroupDialog = useTemplateRef<InstanceType<typeof AccountGroupDialog>>("accountGroupDialog");

const commitSortWeight = () => {
    settingStore.planning.sortWeight = sortWeightDraft.value;
};

watch(
    () => settingStore.planning.sortWeight,
    (value) => {
        sortWeightDraft.value = value ?? 0;
    }
);

const planningMode = computed<TeamPlannerMode>({
    get() {
        return settingStore.planning.mode || "recommend";
    },
    set(value) {
        settingStore.planning.mode = value;
    },
});

const maxGroupCount = computed<number>({
    get() {
        return Math.min(Math.max(settingStore.planning.maxGroupCount || 25, 1), 99);
    },
    set(value) {
        settingStore.planning.maxGroupCount = Math.min(Math.max(value || 1, 1), 99);
    },
});

const plannerSkillWeights = computed<Record<number, number>>(() => {
    const result = Object.fromEntries(skillWeights.entries()) as Record<number, number>;
    for (const [skillId, weight] of Object.entries(settingStore.planning.customSkillWeights || {})) {
        if (typeof weight !== "number" || Number.isNaN(weight)) continue;
        result[Number(skillId)] = Math.min(Math.max(weight, 0.1), 100);
    }
    return result;
});

const plannerOptions = computed(() => ({
    topN: plannerResultLimit,
    mode: planningMode.value,
    maxGroupCount: maxGroupCount.value,
    sortWeight: settingStore.planning.sortWeight ?? 0,
    boostMissingNineWithTenBook: settingStore.planning.boostMissingNineWithTenBook,
    requirements: settingStore.planning.requirements,
    requiredRoleIds: settingStore.planning.requiredRoleIds || [],
    excludedRoleIds: settingStore.planning.excludedRoleIds || [],
    accountGroupsEnabled: settingStore.planning.accountGroupsEnabled,
    accountGroups: settingStore.planning.accountGroups || [],
    genderSkillReplaceMap: plannerGenderSkillReplaceMap,
    skillWeights: plannerSkillWeights.value,
    levelWeightMultipliers: settingStore.planning.levelWeightMultipliers || { 9: 1, 10: 2 },
}));
const resultPage = shallowRef(1);

const normalizeRequiredRoleIds = (roleIds: string[]) => {
    const accounts = new Set<string>();
    const result: string[] = [];
    for (const roleId of roleIds.filter(Boolean)) {
        const role = roleStore.getRoleById(roleId);
        if (!role || role.cd || accounts.has(role.account)) continue;
        accounts.add(role.account);
        result.push(roleId);
        if (result.length >= 2) break;
    }
    return result;
};

const normalizeExcludedRoleIds = (roleIds: string[]) => {
    const requiredRoleIds = new Set(settingStore.planning.requiredRoleIds || []);
    return Array.from(
        new Set(
            roleIds.filter((roleId) => {
                const role = roleStore.getRoleById(roleId);
                return Boolean(role && !role.cd && !requiredRoleIds.has(roleId));
            })
        )
    );
};

const requiredRoleIdsModel = computed<string[]>({
    get() {
        return settingStore.planning.requiredRoleIds || [];
    },
    set(value) {
        settingStore.planning.requiredRoleIds = normalizeRequiredRoleIds(value);
    },
});
const excludedRoleIdsModel = computed<string[]>({
    get() {
        return settingStore.planning.excludedRoleIds || [];
    },
    set(value) {
        settingStore.planning.excludedRoleIds = normalizeExcludedRoleIds(value);
    },
});
const isRequiredRoleSelectable = (role: Role) => {
    if (role.cd) return false;
    if (role.id && (settingStore.planning.excludedRoleIds || []).includes(role.id)) return false;
    const selectedRoleIds = requiredRoleIdsModel.value;
    if (role.id && selectedRoleIds.includes(role.id)) return true;
    if (selectedRoleIds.length >= 2) return false;
    const selectedAccounts = new Set(
        selectedRoleIds.map((roleId) => roleStore.getRoleById(roleId)?.account).filter(Boolean)
    );
    return !selectedAccounts.has(role.account);
};
const isExcludedRoleSelectable = (role: Role) => {
    if (role.cd) return false;
    if (role.id && requiredRoleIdsModel.value.includes(role.id)) return false;
    return true;
};

const availableRoles = computed(() =>
    roleStore.roles.filter((role) => !role.cd && !(settingStore.planning.excludedRoleIds || []).includes(role.id!))
);
const availableRoleCount = computed(() => availableRoles.value.length);
const availableAccountCount = computed(() => new Set(availableRoles.value.map((role) => role.account)).size);
const healerRoleCount = computed(() => availableRoles.value.filter((role) => normalizeCanTreat(role)).length);
const pagedResults = computed(() => {
    const start = (resultPage.value - 1) * resultPageSize;
    return plannerWorker.results.value.slice(start, start + resultPageSize);
});

const mapUpdatedAt = computed(() => {
    if (!props.map?.updatedAt) return "暂未加载";
    return new Date(props.map.updatedAt).toLocaleString("zh-CN", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
});

const requirementText = computed(() => {
    const requirements = settingStore.planning.requirements.filter(
        (item) => typeof item.skillId === "number" && typeof item.level === "number"
    );
    if (!requirements.length) return "无";
    return requirements
        .map(
            (item) =>
                `${gameStore.getSkillById(item.skillId!)?.name || "未知技能"} ≥ ${formatPlannerLevel(item.level!)}`
        )
        .join("、");
});
const requiredRoleText = computed(() => {
    if (planningMode.value === "assign") return "分队编排模式不使用";
    if (!requiredRoleIdsModel.value.length) return "无";
    return requiredRoleIdsModel.value.map((roleId) => roleStore.getRoleById(roleId)?.name || "未知角色").join("、");
});
const excludedRoleText = computed(() => {
    if (!excludedRoleIdsModel.value.length) return "无";
    return excludedRoleIdsModel.value.map((roleId) => roleStore.getRoleById(roleId)?.name || "未知角色").join("、");
});

const openSkillPreference = () => {
    skillPreferenceDialog.value?.open();
};
const openAccountGroup = () => {
    accountGroupDialog.value?.open();
};

const isPlannerReady = computed(() => Boolean(props.map && Object.keys(gameStore.skillMap).length));
const isBusy = computed(() => props.loading || plannerWorker.calculating.value);

watch(
    () => ({
        roles: roleStore.roles,
        map: props.map,
        skillMap: gameStore.skillMap,
        options: plannerOptions.value,
        ready: isPlannerReady.value,
    }),
    (payload) => {
        if (!payload.ready) {
            plannerWorker.clear();
            return;
        }
        plannerWorker.calculate({
            roles: payload.roles,
            map: payload.map,
            skillMap: payload.skillMap,
            options: payload.options,
        });
    },
    {
        deep: true,
        immediate: true,
    }
);

watch(
    () => [settingStore.planning.requiredRoleIds, settingStore.planning.excludedRoleIds, roleStore.roles] as const,
    () => {
        const normalized = normalizeRequiredRoleIds(settingStore.planning.requiredRoleIds || []);
        if (normalized.join("|") !== (settingStore.planning.requiredRoleIds || []).join("|")) {
            settingStore.planning.requiredRoleIds = normalized;
        }
        const normalizedExcluded = normalizeExcludedRoleIds(settingStore.planning.excludedRoleIds || []);
        if (normalizedExcluded.join("|") !== (settingStore.planning.excludedRoleIds || []).join("|")) {
            settingStore.planning.excludedRoleIds = normalizedExcluded;
        }
    },
    {
        deep: true,
        immediate: true,
    }
);

watch(
    () => plannerWorker.results.value.length,
    (length) => {
        const maxPage = Math.max(Math.ceil(length / resultPageSize), 1);
        if (resultPage.value > maxPage) {
            resultPage.value = maxPage;
        }
    }
);
</script>

<style lang="less" scoped>
.m-team-planner {
    display: flex;
    flex-direction: column;
    gap: 16px;

    .m-planner-setting {
        position: sticky;
        top: 0;
        z-index: 10;
        flex-shrink: 0;

        :deep(.n-divider) {
            margin: 10px 0;
        }
    }

    .m-planner-controls {
        margin-bottom: 10px;
    }

    .m-sort-weight {
        width: 320px;
    }

    .u-sort-label {
        flex-shrink: 0;
    }

    .u-max-group-count {
        width: 92px;
    }

    .m-requirement-row {
        width: 100%;
    }

    .u-requirement-skill {
        width: 240px;
    }

    .u-requirement-level {
        width: 100px;
        flex-shrink: 0;
    }

    .m-required-roles {
        margin: 10px 0;
    }

    .u-required-role {
        width: 360px;
        max-width: 100%;
    }

    .m-result-spin {
        :deep(.n-spin-content) {
            padding-top: 8px;
        }
    }

    .m-team-list {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .m-assign-summary {
        flex-shrink: 0;
    }

    .m-result-pagination {
        justify-content: center;
    }
}
</style>
