<script setup lang="ts">
import { skillWeights } from "@/assets/data/game";
import { useGameStore } from "@/store/game";
import { useSettingStore } from "@/store/setting";
import { iconLink } from "@/utils/game";
import { matchSearch } from "@/utils/search";
import type { DataTableColumns } from "naive-ui";

interface SkillPreferenceRow {
    skillId: number;
    skillName: string;
    icon: number;
    searchKey: string;
    defaultWeight: number;
    customWeight: number | null;
    effectiveWeight: number;
    starred: boolean;
}

const settingStore = useSettingStore();
const gameStore = useGameStore();

const show = shallowRef(false);
const searchValue = shallowRef("");

const normalizeWeight = (value: number | null | undefined) => {
    if (typeof value !== "number" || Number.isNaN(value)) return 1;
    return Math.min(Math.max(value, 0.1), 100);
};
const normalizeLevelMultiplier = (value: number | null | undefined) => {
    if (typeof value !== "number" || Number.isNaN(value)) return 2;
    return Math.min(Math.max(value, 0.1), 100);
};

const getDefaultWeight = (skillId: number) => skillWeights.get(skillId) ?? 1;

const tenLevelWeightMultiplier = computed<number>({
    get() {
        return settingStore.planning.levelWeightMultipliers?.[10] ?? 2;
    },
    set(value) {
        settingStore.planning.levelWeightMultipliers = {
            ...(settingStore.planning.levelWeightMultipliers || {}),
            9: 1,
            10: normalizeLevelMultiplier(value),
        };
    },
});

const toggleStar = (skillId: number) => {
    const starSkillIds = new Set(settingStore.planning.starSkillIds || []);
    if (starSkillIds.has(skillId)) {
        starSkillIds.delete(skillId);
    } else {
        starSkillIds.add(skillId);
    }
    settingStore.planning.starSkillIds = Array.from(starSkillIds);
};

const updateSkillWeight = (skillId: number, value: number | null) => {
    settingStore.planning.customSkillWeights = {
        ...(settingStore.planning.customSkillWeights || {}),
        [skillId]: normalizeWeight(value),
    };
};

const resetSkillWeight = (skillId: number) => {
    const next = { ...(settingStore.planning.customSkillWeights || {}) };
    delete next[skillId];
    settingStore.planning.customSkillWeights = next;
};

const rows = computed<SkillPreferenceRow[]>(() => {
    const customSkillWeights = settingStore.planning.customSkillWeights || {};
    const starSkillIds = new Set(settingStore.planning.starSkillIds || []);
    return gameStore.skills
        .map((skill) => {
            const defaultWeight = getDefaultWeight(skill.id);
            const customWeight =
                typeof customSkillWeights[skill.id] === "number" ? normalizeWeight(customSkillWeights[skill.id]) : null;
            return {
                skillId: skill.id,
                skillName: skill.name,
                icon: skill.icon,
                searchKey: skill.searchKey || skill.name,
                defaultWeight,
                customWeight,
                effectiveWeight: customWeight ?? defaultWeight,
                starred: starSkillIds.has(skill.id),
            };
        })
        .filter((row) => !searchValue.value || matchSearch(searchValue.value, row.searchKey))
        .sort((a, b) => {
            return (
                Number(b.starred) - Number(a.starred) ||
                Number(b.customWeight !== null) - Number(a.customWeight !== null) ||
                b.defaultWeight - a.defaultWeight ||
                a.skillName.localeCompare(b.skillName)
            );
        });
});

const columns: DataTableColumns<SkillPreferenceRow> = [
    {
        key: "star",
        title: "",
        width: 64,
        align: "center",
        render(row) {
            return h(
                resolveComponent("n-button"),
                {
                    quaternary: true,
                    size: "small",
                    type: row.starred ? "warning" : "default",
                    onClick: () => toggleStar(row.skillId),
                },
                { default: () => (row.starred ? "置顶" : "置顶") }
            );
        },
    },
    {
        key: "skill",
        title: "技能",
        minWidth: 190,
        render(row) {
            return h("div", { class: "m-skill-weight-skill flex items-center gap-1" }, [
                h(resolveComponent("n-image"), {
                    class: "u-skill-icon w-6 h-6 shrink-0",
                    src: iconLink(row.icon),
                    previewDisabled: true,
                }),
                h("span", { class: "u-skill-name" }, row.skillName),
            ]);
        },
    },
    {
        key: "defaultWeight",
        title: "默认",
        width: 80,
        align: "center",
        render(row) {
            return row.defaultWeight;
        },
    },
    {
        key: "customWeight",
        title: "权重",
        width: 140,
        render(row) {
            return h(resolveComponent("n-input-number"), {
                value: row.effectiveWeight,
                min: 0.1,
                max: 100,
                step: 0.1,
                precision: 1,
                size: "small",
                onUpdateValue: (value: number | null) => updateSkillWeight(row.skillId, value),
            });
        },
    },
    {
        key: "actions",
        title: "操作",
        width: 70,
        align: "center",
        render(row) {
            return h(
                resolveComponent("n-button"),
                {
                    text: true,
                    type: "primary",
                    size: "small",
                    disabled: row.customWeight === null,
                    onClick: () => resetSkillWeight(row.skillId),
                },
                { default: () => "恢复" }
            );
        },
    },
];

const open = () => {
    show.value = true;
};

defineExpose({ open });
</script>

<template>
    <n-modal
        v-model:show="show"
        preset="card"
        title="技能偏好"
        class="m-skill-preference-dialog"
        :style="{ width: '720px', maxWidth: 'calc(100vw - 32px)' }"
    >
        <n-flex vertical :size="12">
            <n-flex align="center" :wrap="true" class="m-level-weight">
                <n-text depth="3">十重权重倍率</n-text>
                <n-input-number
                    v-model:value="tenLevelWeightMultiplier"
                    size="small"
                    :min="0.1"
                    :max="100"
                    :step="0.1"
                    :precision="1"
                    class="u-level-weight-input"
                />
                <n-text depth="3">九重固定按 1 倍计算</n-text>
            </n-flex>
            <n-input v-model:value="searchValue" clearable placeholder="搜索技能">
                <template #prefix>
                    <i-material-symbols:search-rounded />
                </template>
            </n-input>
            <n-data-table
                size="small"
                :columns="columns"
                :data="rows"
                :pagination="false"
                :bordered="true"
                :max-height="460"
                :row-key="(row) => row.skillId"
                virtual-scroll
            />
        </n-flex>
    </n-modal>
</template>

<style scoped lang="less">
.m-skill-preference-dialog {
    .m-level-weight {
        padding: 8px 10px;
        border-radius: 6px;
        background-color: var(--n-merged-th-color, var(--n-color));
    }

    .u-level-weight-input {
        width: 112px;
    }

    :deep(.m-skill-weight-skill) {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
    }

    :deep(.u-skill-icon) {
        width: 22px;
        height: 22px;
        flex-shrink: 0;
        border-radius: 4px;
        overflow: hidden;
    }

    :deep(.u-skill-name) {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
}
</style>
