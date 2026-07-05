<script setup lang="ts">
import { skillWeights } from "@/assets/data/game";
import { formatPlannerLevel, TeamPlannerResult, TeamPlannerRoleNeed } from "@/services/teamPlanner";
import { useGameStore } from "@/store/game";
import { useSettingStore } from "@/store/setting";
import { iconLink, schoolIconLink } from "@/utils/game";
import { DataTableColumns, useThemeVars } from "naive-ui";
import { CSSProperties } from "vue";

const props = defineProps<{
    result: TeamPlannerResult;
    index: number;
}>();

interface PlannerTableCell {
    roleId: string;
    currentLevel: number;
    effectiveLevel: number;
    owned: boolean;
    conflict: boolean;
    needs: TeamPlannerRoleNeed[];
}

interface PlannerTableRow {
    key: number;
    skillId: number;
    skillName: string;
    important: boolean;
    weeklyLevels: number[];
    cells: Record<string, PlannerTableCell>;
}

const gameStore = useGameStore();
const settingStore = useSettingStore();
const themeVars = useThemeVars();

const tableStyle = computed<CSSProperties>(() => {
    const vars = themeVars.value;
    const style = {
        "--m-planning-owned-color": vars.textColorDisabled,
        "--m-planning-border-color": vars.borderColor,
        "--m-planning-text-color": vars.textColor1,
        "--m-planning-tag-text": vars.textColor1,
        "--m-planning-level-empty-bg": vars.actionColor,
    } as Record<string, string>;

    for (const item of settingStore.stat.background) {
        if (item.level !== null) {
            style[`--m-planning-level-${item.level}-bg`] = item.color;
        }
    }
    return style as CSSProperties;
});

const roleColumns = computed(() => props.result.roleReports);

const getCellKey = (need: TeamPlannerRoleNeed) => `${need.skillId}-${need.targetLevel}`;

const conflictRoleIdsByNeedKey = computed(() => {
    const result = new Map<string, Set<string>>();
    for (const conflict of props.result.conflicts) {
        result.set(
            `${conflict.skillId}-${conflict.targetLevel}`,
            new Set(conflict.roles.map((role) => role.id!).filter(Boolean))
        );
    }
    return result;
});

const isConflictNeed = (need: TeamPlannerRoleNeed) => {
    return conflictRoleIdsByNeedKey.value.get(getCellKey(need))?.has(need.roleId) || false;
};

const getRoleSkillLevel = (role: Role, skillId: number) => {
    return role.skills.find((skill) => skill.id === skillId)?.level || 0;
};

const getLevelClass = (level: number) => {
    return `is-level-${level}`;
};

const tableRows = computed<PlannerTableRow[]>(() => {
    const rowMap = new Map<
        number,
        {
            skillId: number;
            skillName: string;
            important: boolean;
            weeklyLevels: Set<number>;
            needs: Record<string, TeamPlannerRoleNeed[]>;
        }
    >();

    for (const report of props.result.roleReports) {
        for (const need of report.needs) {
            const row = rowMap.get(need.skillId) || {
                skillId: need.skillId,
                skillName: need.skillName,
                important: skillWeights.has(need.skillId),
                weeklyLevels: new Set<number>(),
                needs: {},
            };
            row.weeklyLevels.add(need.targetLevel);
            row.needs[report.role.id!] = row.needs[report.role.id!] || [];
            if (!row.needs[report.role.id!].some((item) => getCellKey(item) === getCellKey(need))) {
                row.needs[report.role.id!].push(need);
            }
            rowMap.set(need.skillId, row);
        }
    }

    return Array.from(rowMap.values())
        .map((row) => {
            const weeklyLevels = Array.from(row.weeklyLevels).sort((a, b) => a - b);
            const maxWeeklyLevel = Math.max(...weeklyLevels);
            const cells = Object.fromEntries(
                props.result.roleReports.map((report) => {
                    const roleId = report.role.id!;
                    const needs = row.needs[roleId] || [];
                    const currentLevel = getRoleSkillLevel(report.role, row.skillId);
                    const effectiveLevel = Math.max(currentLevel, ...needs.map((need) => need.effectiveLevel));
                    return [
                        roleId,
                        {
                            roleId,
                            currentLevel,
                            effectiveLevel,
                            owned: currentLevel >= maxWeeklyLevel,
                            conflict: needs.some(isConflictNeed),
                            needs,
                        } satisfies PlannerTableCell,
                    ];
                })
            );
            return {
                key: row.skillId,
                skillId: row.skillId,
                skillName: row.skillName,
                important: row.important,
                weeklyLevels,
                cells,
            };
        })
        .sort((a, b) => {
            const aMaxLevel = Math.max(...a.weeklyLevels);
            const bMaxLevel = Math.max(...b.weeklyLevels);
            return bMaxLevel - aMaxLevel || Number(b.important) - Number(a.important) || a.skillName.localeCompare(b.skillName);
        });
});

const getCellTooltip = (cell: PlannerTableCell) => {
    const pieces = [`当前${formatPlannerLevel(cell.currentLevel)}`];
    if (cell.effectiveLevel > cell.currentLevel) {
        pieces.push(`背包后可到${formatPlannerLevel(cell.effectiveLevel)}`);
    }
    for (const need of cell.needs) {
        pieces.push(`${need.floors.map((floor) => `${floor}层`).join("、")} ${need.bosses.join("、")} 可补${formatPlannerLevel(need.targetLevel)}`);
        if (need.converted) {
            pieces.push(`${need.droppedSkillName}可转换`);
        }
        if (need.hasHigherBookBlocked) {
            pieces.push("背包已有十重书，建议先补九重");
        }
    }
    if (cell.conflict) {
        pieces.push("与队友需求同一本技能书");
    }
    if (cell.owned) {
        pieces.push("已拥有本周可补最高重数");
    }
    return pieces.join("，");
};

const renderLevelCell = (row: PlannerTableRow, roleId: string) => {
    const cell = row.cells[roleId];
    if (!cell) return null;
    return h(
        resolveComponent("n-tooltip"),
        {},
        {
            trigger: () =>
                h(
                    "span",
                    {
                        class: {
                            "u-planner-level": true,
                            [getLevelClass(cell.currentLevel)]: true,
                            "is-owned": cell.owned,
                        },
                    },
                    formatPlannerLevel(cell.currentLevel)
                ),
            default: () => getCellTooltip(cell),
        }
    );
};

const columns = computed<DataTableColumns<PlannerTableRow>>(() => [
    {
        key: "skill",
        title: "技能",
        width: 190,
        fixed: "left",
        render(row) {
            return h(
                "div",
                {
                    class: "m-skill-cell",
                },
                [
                    h(resolveComponent("n-image"), {
                        src: iconLink(gameStore.getSkillById(row.skillId)?.icon),
                        previewDisabled: true,
                        class: "u-skill-icon",
                    }),
                    h("span", { class: "u-skill-name" }, row.skillName),
                ]
            );
        },
    },
    {
        key: "weeklyLevels",
        title: "本周值班",
        width: 96,
        align: "center",
        render(row) {
            return h(
                "div",
                {
                    class: "m-weekly-levels",
                },
                row.weeklyLevels.map((level) =>
                    h(
                        "span",
                        {
                            class: {
                                "u-planner-level": true,
                                [getLevelClass(level)]: true,
                            },
                        },
                        formatPlannerLevel(level)
                    )
                )
            );
        },
    },
    ...roleColumns.value.map((report) => ({
        key: report.role.id!,
        title: report.role.name,
        width: 92,
        ellipsis: {
            tooltip: true,
        },
        align: "center" as const,
        cellProps(row: PlannerTableRow) {
            const cell = row.cells[report.role.id!];
            return {
                class: {
                    "is-conflict-cell": cell?.conflict,
                    "is-owned-cell": cell?.owned,
                },
            };
        },
        render(row: PlannerTableRow) {
            return renderLevelCell(row, report.role.id!);
        },
    })),
]);

const tableScrollX = computed(() => 286 + roleColumns.value.length * 92);
</script>

<template>
    <n-card size="small" class="m-team-result" :style="tableStyle">
        <template #header>
            <n-flex justify="space-between" align="center" :wrap="true">
                <n-flex align="center">
                    <n-tag type="primary" round>#{{ index + 1 }}</n-tag>
                    <n-text strong>推荐队伍</n-text>
                    <n-tag size="small" type="info">缺口 {{ result.needCount }} 个</n-tag>
                    <n-tag size="small" type="success">覆盖 {{ result.uniqueBossCount }} 个首领</n-tag>
                    <n-tag size="small" :type="result.conflicts.length ? 'warning' : 'success'">
                        {{ result.conflicts.length ? `冲突 ${result.conflicts.length} 个` : "无冲突" }}
                    </n-tag>
                </n-flex>
            </n-flex>
        </template>

        <div class="m-role-summary">
            <div v-for="report in roleColumns" :key="report.role.id" class="m-role-chip">
                <n-image :src="schoolIconLink(report.role.schoolId!)" :preview-disabled="true" class="u-school-icon" />
                <div class="m-role-name">
                    <n-text strong>{{ report.role.name }}</n-text>
                    <n-text depth="3">{{ report.slot === "healer" ? "治疗" : "输出" }} / {{ report.role.account }}</n-text>
                </div>
            </div>
        </div>

        <n-data-table
            v-if="tableRows.length"
            size="small"
            :columns="columns"
            :data="tableRows"
            :pagination="false"
            :bordered="true"
            :single-line="false"
            :max-height="360"
            :scroll-x="tableScrollX"
            :row-key="(row) => row.key"
        />
        <n-empty v-else description="这组队伍本周 81-100 暂无规划缺口" />
    </n-card>
</template>

<style scoped lang="less">
.m-team-result {
    :deep(.n-data-table) {
        --n-td-padding: 7px 8px;
        --n-th-padding: 8px 8px;
        --n-td-color-hover: transparent;
        overflow: hidden;
    }

    :deep(.n-data-table-th) {
        font-size: 14px;
        font-weight: 600;
        white-space: nowrap;
    }

    :deep(.n-data-table-th__title) {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    :deep(.n-data-table-td) {
        height: 48px;
        vertical-align: middle;
    }

    .m-role-summary {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        gap: 10px;
        margin-bottom: 12px;
    }

    .m-role-chip {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .u-school-icon {
        width: 28px;
        height: 28px;
    }

    .m-role-name {
        display: flex;
        flex-direction: column;
        min-width: 0;
    }

    :deep(.m-skill-cell) {
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
        box-shadow: inset 0 0 0 1px var(--m-planning-border-color);
    }

    :deep(.u-skill-name) {
        min-width: 0;
        overflow: hidden;
        color: var(--m-planning-text-color);
        font-weight: 600;
        line-height: 1.2;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    :deep(.m-weekly-levels) {
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        min-height: 32px;
    }

    :deep(.u-planner-level) {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 38px;
        height: 22px;
        padding: 0 6px;
        border: 1px solid color-mix(in srgb, currentColor 36%, transparent);
        border-radius: 4px;
        background: var(--m-planning-level-empty-bg);
        color: var(--m-planning-tag-text);
        font-size: 12px;
        font-weight: 600;
        font-variant-numeric: tabular-nums;
        line-height: 1;
        white-space: nowrap;

        &.is-level-9 {
            background: var(--m-planning-level-9-bg);
            color: #fff;
        }

        &.is-level-10 {
            background: var(--m-planning-level-10-bg);
            color: #fff;
        }

        &.is-owned {
            border-color: color-mix(in srgb, currentColor 10%, transparent);
            background: transparent;
            color: var(--m-planning-owned-color);
            opacity: 0.42;
        }
    }

    :deep(.is-conflict-cell .u-planner-level:not(.is-owned)) {
        box-shadow: 0 0 0 1px color-mix(in srgb, currentColor 24%, transparent);
    }

    :deep(.is-owned-cell:not(.is-conflict-cell)) {
        color: var(--m-planning-owned-color);
    }
}
</style>
