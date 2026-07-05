<template>
    <div class="p-stat" ref="pageEl">
        <div class="m-toolbar">
            <n-flex :wrap="false" :align="'center'" justify="space-between" class="m-toolbar-inner">
                <n-flex :wrap="false" :align="'center'" class="m-profile-select">
                    <n-select
                        v-model:value="activeStatProfileKey"
                        :options="statProfileOptions"
                        size="small"
                        placeholder="选择统计方案"
                    />
                    <n-button quaternary circle size="small" @click="openProfileManage">
                        <template #icon>
                            <i-material-symbols:settings-rounded />
                        </template>
                    </n-button>
                </n-flex>
                <n-flex :wrap="false" :align="'center'" class="shrink-0">
                    <n-popover trigger="click" placement="bottom-end">
                        <template #trigger>
                            <n-button>
                                <template #icon>
                                    <i-material-symbols:tune />
                                </template>
                                模式
                            </n-button>
                        </template>
                        <n-flex vertical class="m-mode-popover">
                            <n-flex justify="space-between" :align="'center'" :wrap="false">
                                <n-text>选择模式</n-text>
                                <n-switch v-model:value="useSettingStore().stat.enableSelect" :round="false" />
                            </n-flex>
                            <n-flex
                                justify="space-between"
                                :align="'center'"
                                :wrap="false"
                                v-if="useSettingStore().stat.enableSelect"
                            >
                                <n-text>隐藏未选择</n-text>
                                <n-switch v-model:value="useSettingStore().stat.hiddenSelected" :round="false" />
                            </n-flex>
                            <n-flex justify="space-between" :align="'center'" :wrap="false">
                                <n-text>拖拽排序</n-text>
                                <n-switch v-model:value="useSettingStore().stat.enableDragSort" :round="false" />
                            </n-flex>
                            <n-flex justify="space-between" :align="'center'" :wrap="false">
                                <n-text>编辑模式</n-text>
                                <n-switch v-model:value="useSettingStore().stat.enableEdit" :round="false" />
                            </n-flex>
                        </n-flex>
                    </n-popover>
                    <n-button @click="openSetting" type="primary">表格配置</n-button>
                    <n-popconfirm @positive-click="useRoleStore().resetCd()">
                        <template #trigger>
                            <n-button type="warning">新的一周</n-button>
                        </template>
                        该操作会重置所有角色的百战CD/传功/被传功计数/自定义的随CD刷新列，周一的时候点一点就好，不可撤销哦~
                    </n-popconfirm>
                </n-flex>
            </n-flex>
        </div>
        <div class="m-data" ref="tableWrapperRef" :style="tableStyle">
            <VueDraggable
                v-if="useSettingStore().stat.enableDragSort"
                v-model="writableFilterData"
                :animation="150"
                target=".n-data-table-tbody"
                handle=".drag-handle"
            >
                <n-data-table
                    ref="tableRef"
                    :max-height="maxHeight"
                    :columns="columns"
                    :data="filterData"
                    :bordered="true"
                    :scroll-x="tableWidth"
                    :on-unstable-column-resize="onColumnResize"
                    :row-key="(row) => row.id"
                    v-model:checked-row-keys="useSettingStore().stat.selectRoles"
                    :on-update:sorter="onUpdateSorter"
                />
            </VueDraggable>
            <n-data-table
                v-else
                ref="tableRef"
                :max-height="maxHeight"
                :columns="columns"
                :data="filterData"
                :bordered="true"
                :scroll-x="tableWidth"
                :on-unstable-column-resize="onColumnResize"
                :row-key="(row) => row.id"
                v-model:checked-row-keys="useSettingStore().stat.selectRoles"
                :on-update:sorter="onUpdateSorter"
            />
        </div>

        <stat-setting ref="settingPanel"></stat-setting>
        <stat-profile-manage-dialog ref="profileManageDialog"></stat-profile-manage-dialog>
        <role-detail-dialog ref="roleDetail"></role-detail-dialog>
    </div>
</template>

<script setup lang="ts">
import RoleDetailDialog from "@/components/role/RoleDetailDialog.vue";
import StatSetting from "@/components/stat/Setting.vue";
import StatProfileManageDialog from "@/components/stat/StatProfileManageDialog.vue";
import TeachList from "@/components/role/TeachList.vue";

import { bossList, skillLevelLabel } from "@/assets/data/game";
import { useGameStore } from "@/store/game";
import { useRoleStore } from "@/store/role";
import { useSettingStore } from "@/store/setting";
import { getSchoolName, iconLink } from "@/utils/game";
import { sumBy } from "lodash";
import { DataTableColumns, SelectOption } from "naive-ui";
import { OnUpdateSorter, TableBaseColumn, TableColumn } from "naive-ui/es/data-table/src/interface";
import { CSSProperties } from "vue";
import { useResizeObserver } from "@vueuse/core";
import { VueDraggable } from "vue-draggable-plus";
import { getSearchKey, matchSearch } from "@/utils/search";
import EditableValue from "@/components/common/EditableValue.vue";
import { getCustomCellKey, getCustomRoleValue, setCustomRoleValue } from "@/utils/stat-custom";

const settingStore = useSettingStore();
settingStore.ensureStatProfiles();

const statProfileOptions = computed<SelectOption[]>(() =>
    settingStore.statProfiles.map((profile) => ({
        label: profile.name || "未命名方案",
        value: profile.key,
    }))
);
const activeStatProfileKey = computed({
    get: () => settingStore.activeStatProfileKey,
    set: (key: string) => {
        settingStore.switchStatProfile(key);
    },
});

watch(
    () => settingStore.stat,
    () => {
        settingStore.saveActiveStatProfile();
    },
    { deep: true }
);

const filterPattern = ref<Record<string, string>>({
    account: "",
    role: "",
    teach: "",
    remark: "",
    cdRemark: "",
});

// 表格输入框引用
const filterInputRefs = ref<Record<string, InstanceType<typeof import("naive-ui").NInput> | null>>({});

// 表格列定义
const onColumnResize = (newWidth: number, _: number, column: TableBaseColumn) => {
    const settingColumn = useSettingStore().stat.columns.find(
        (item) =>
            (item.type === "basic" && item.key === column.key) ||
            (item.type === "skill" && `skill-${item.skillId}` === column.key) ||
            (item.type === "custom" && getCustomCellKey(item) === column.key)
    );
    settingColumn!.width = newWidth;
};
const columns = computed(() => {
    const setting = useSettingStore().stat.columns;
    const result: DataTableColumns<StatTableDataRow> = [];

    const getColumnKey = (item: StatSetting): keyof StatTableDataRow => {
        if (item.type === "basic") return item.key;
        if (item.type === "skill") return `skill-${item.skillId}`;
        if (item.type === "custom") return getCustomCellKey(item);
        return "default";
    };
    const getColumnLabel = (item: StatSetting) => {
        let label = "";
        if (item.label) label = item.label;
        else if (item.type === "basic") label = item.key;
        else if (item.type === "skill") {
            const skill = useGameStore().getSkillById(item.skillId);
            label = skill ? skill.name : `技能-${item.skillId}`;
        }
        if (item.type === "basic" && item.key === "cd" && item.stat !== false) {
            const count = filterData.value.filter((row) => row.cd).length;
            label += `(${count}/${filterData.value.length})`;
        }
        return label;
    };
    const getStyle = (item: StatSetting): CSSProperties => {
        const style: CSSProperties = {};
        if (item.style?.fontSize) {
            style.fontSize = `${item.style.fontSize}px`;
        } else if (useSettingStore().stat.style.fontSize) {
            style.fontSize = `${useSettingStore().stat.style.fontSize}px`;
        }
        if (item.style?.color) {
            style.color = item.style.color;
        } else if (useSettingStore().stat.style.color) {
            style.color = useSettingStore().stat.style.color!;
        }
        if (item.style?.fontWeight) {
            style.fontWeight = item.style.fontWeight;
        } else if (useSettingStore().stat.style.fontWeight) {
            style.fontWeight = useSettingStore().stat.style.fontWeight!;
        }
        return style;
    };
    const getEditableValueType = (valueType: CustomStatSetting["valueType"]) => {
        return valueType === "number" ? "number" : "string";
    };
    if (useSettingStore().stat.enableDragSort) {
        result.push({
            width: 40,
            fixed: "left",
            align: "center",
            className: "shrink-0",
            render: () => {
                return h(
                    "div",
                    {
                        style: "cursor: move; display: flex; align-items: center; justify-content: center; gap: 4px;",
                        class: "drag-handle",
                    },
                    [h(resolveComponent("i-codicon:three-bars"), { style: "font-size: 16px;" })]
                );
            },
        } as unknown as TableColumn<StatTableDataRow>);
    }
    if (useSettingStore().stat.enableSelect) {
        result.push({
            type: "selection",
            width: 40,
            fixed: "left",
            align: "center",
            className: "shrink-0",
        } as TableColumn<StatTableDataRow>);
    }
    if (useSettingStore().stat.enableIndex) {
        result.push({
            title: "#",
            key: "__index",
            width: 52,
            fixed: "left",
            align: "center",
            className: "shrink-0",
            render: (_row, index) => index + 1,
        } as TableColumn<StatTableDataRow>);
    }
    for (const item of setting) {
        // 构造key
        const key = getColumnKey(item);
        const column = {
            key,
            resizable: true,
            sorter(a, b) {
                if (typeof a[key] === "string" && typeof b[key] === "string") {
                    return a[key].localeCompare(b[key]);
                } else if (typeof a[key] === "number" && typeof b[key] === "number") {
                    return a[key] - b[key];
                } else if (typeof a[key] === "boolean" && typeof b[key] === "boolean") {
                    return Number(a[key]) - Number(b[key]);
                } else if (a[key] === null || a[key] === undefined) {
                    return 1;
                } else if (b[key] === null || b[key] === undefined) {
                    return -1;
                }
            },
            minWidth: 1,
            ellipsis: true,
            title() {
                const divContent: any[] = [];
                if (item.type === "basic") {
                    divContent.push(
                        h(
                            resolveComponent("n-text"),
                            { style: getStyle(item) },
                            { default: () => getColumnLabel(item) }
                        )
                    );
                }
                if (item.type === "skill") {
                    if (item.withIcon) {
                        divContent.push(
                            h(resolveComponent("n-image"), {
                                previewDisabled: true,
                                src: iconLink(useGameStore().getSkillById(item.skillId)?.icon || 0),
                                style: "width: 20px; height: 20px",
                            })
                        );
                    }
                    if (item.withLabel) {
                        divContent.push(
                            h(
                                resolveComponent("n-text"),
                                { style: getStyle(item) },
                                { default: () => getColumnLabel(item) }
                            )
                        );
                    }
                }
                if (item.type === "custom") {
                    divContent.push(
                        h(
                            resolveComponent("n-text"),
                            { style: getStyle(item) },
                            { default: () => getColumnLabel(item) }
                        )
                    );
                }
                return h(
                    "div",
                    {
                        class: "u-column-title",
                    },
                    divContent
                );
            },
            render(row: StatTableDataRow) {
                const divContent: any[] = [];
                if (item.type === "basic") {
                    if (item.key === "role" && item.withSchoolIcon) {
                        divContent.push(
                            h(resolveComponent("n-image"), {
                                previewDisabled: true,
                                src: iconLink(row.schoolId, "school"),
                                style: "width: 20px; height: 20px",
                            })
                        );
                    }
                    if (item.key == "cd") {
                        if (useSettingStore().stat.enableEdit) {
                            divContent.push(
                                h(resolveComponent("n-checkbox"), {
                                    checked: row.cd,
                                    "onUpdate:checked": (value: boolean) => {
                                        onUpdateRole(row.id, "cd", value);
                                    },
                                })
                            );
                        } else {
                            if (row.cd) {
                                divContent.push(
                                    h(resolveComponent("i-material-symbols:check-rounded"), {
                                        style: {
                                            ...getStyle(item),
                                            position: "relative",
                                            bottom: "2px",
                                        },
                                    })
                                );
                            }
                        }
                    } else if (item.key === "role") {
                        divContent.push(
                            h(
                                resolveComponent("n-button"),
                                {
                                    text: true,
                                    type: "primary",
                                    style: getStyle(item),
                                    onClick: () => {
                                        roleDetail.value?.open(row.id);
                                    },
                                    class: "u-role-name",
                                },
                                { default: () => row.role }
                            )
                        );
                    } else if (item.key === "teach") {
                        // 表格内容渲染
                        const renderData = row.teach.filter(([level]) => level >= (item.minLevel || 7));
                        const renderTexts: string[] = [];
                        for (const [level, bosses] of renderData) {
                            for (const boss of bosses) {
                                renderTexts.push(`${boss}${item.showLevel ? `·${skillLevelLabel[level]}` : ""}`);
                            }
                        }
                        for (const [index, text] of renderTexts.entries()) {
                            if (item.render === "tag") {
                                divContent.push(
                                    h(
                                        resolveComponent("n-tag"),
                                        { type: "info", size: "small", style: getStyle(item) },
                                        { default: () => text }
                                    )
                                );
                            } else {
                                divContent.push(
                                    h(resolveComponent("n-text"), { style: getStyle(item) }, { default: () => text })
                                );
                            }
                            if (item.split && index < renderTexts.length - 1) {
                                divContent.push(
                                    h(
                                        resolveComponent("n-text"),
                                        { style: getStyle(item) },
                                        { default: () => item.split }
                                    )
                                );
                            }
                        }
                        // tooltip渲染
                        const tooltipContent = h(TeachList, {
                            teachList: row.teach,
                        });
                        return h(
                            resolveComponent("n-tooltip"),
                            {
                                trigger: "hover",
                                placement: "top",
                                showArrow: true,
                                style: getStyle(item),
                            },
                            {
                                default: () => tooltipContent,
                                trigger: () =>
                                    h(
                                        resolveComponent("n-flex"),
                                        {
                                            wrap: false,
                                            size: 2,
                                            align: "center",
                                        },
                                        { default: () => divContent }
                                    ),
                            }
                        );
                    } else {
                        divContent.push(
                            h(
                                EditableValue,
                                {
                                    style: getStyle(item),
                                    value: row[key],
                                    type: "string",
                                    disabled:
                                        !useSettingStore().stat.enableEdit ||
                                        !["cdRemark", "remark"].includes(item.key),
                                    hideIcon: true,
                                    "onUpdate:value": (value: any) => {
                                        onUpdateRole(row.id, key, value);
                                    },
                                }
                            )
                        );
                    }
                } else if (item.type === "skill") {
                    const skillLevel = row[`skill-${item.skillId}`] || 0;

                    divContent.push(
                        h(
                            EditableValue,
                            {
                                style: getStyle(item),
                                class: `level-${skillLevel} u-skill-level`,
                                value: skillLevel,
                                displayValue: item.level === "levelLabel" ? skillLevelLabel[skillLevel] : skillLevel,
                                disabled: !useSettingStore().stat.enableEdit,
                                hideIcon: true,
                                type: "number",
                                "onUpdate:value": (value: any) => {
                                    onUpdateRole(row.id, ["skill", item.skillId], Number(value));
                                },
                            }
                        )
                    );
                    if (row[`skill-book-${item.skillId}`] && row[`skill-book-${item.skillId}`].length > 0) {
                        divContent.push(
                            h(
                                resolveComponent("n-tooltip"),
                                {
                                    trigger: "hover",
                                    placement: "top",
                                    showArrow: true,
                                },
                                {
                                    default: () =>
                                        `包里有书：${row[`skill-book-${item.skillId}`]
                                            .map((l) => skillLevelLabel[l])
                                            .join(", ")}`,
                                    trigger: () =>
                                        h(resolveComponent("i-mingcute:alert-diamond-fill"), {
                                            class: "u-skill-book-tip",
                                        }),
                                }
                            )
                        );
                    }
                } else if (item.type === "custom") {
                    const value = row[getCustomCellKey(item)];
                    if (item.valueType === "boolean") {
                        if (useSettingStore().stat.enableEdit) {
                            divContent.push(
                                h(resolveComponent("n-checkbox"), {
                                    checked: value,
                                    "onUpdate:checked": (newValue: boolean) => {
                                        onUpdateRole(row.id, ["custom", item.key], newValue);
                                    },
                                })
                            );
                        } else {
                            if (value) {
                                divContent.push(
                                    h(resolveComponent("i-material-symbols:check-rounded"), {
                                        style: {
                                            ...getStyle(item),
                                            position: "relative",
                                            bottom: "2px",
                                        },
                                    })
                                );
                            }
                        }
                    } else {
                        divContent.push(
                            h(EditableValue, {
                                style: getStyle(item),
                                value,
                                type: getEditableValueType(item.valueType),
                                disabled: !useSettingStore().stat.enableEdit,
                                hideIcon: true,
                                "onUpdate:value": (newValue: any) => {
                                    onUpdateRole(row.id, ["custom", item.key], newValue);
                                },
                            })
                        );
                    }
                }
                return h(
                    resolveComponent("n-flex"),
                    {
                        wrap: false,
                        align: "center",
                        size: 2,
                    },
                    { default: () => divContent }
                );
            },
            filter: item.type === "basic" && ["account", "role", "teach", "remark", "cdRemark"].includes(item.key),
            renderFilter() {
                const key = item.type === "basic" ? item.key : "";
                return h(
                    resolveComponent("n-button"),
                    {
                        text: true,
                        size: "small",
                        class: { "n-data-table-filter": true, "is-active": filterPattern.value[key] },
                    },
                    {
                        default: () => h(resolveComponent("i-mdi:filter")),
                    }
                );
            },
            renderFilterMenu() {
                const key = item.type === "basic" ? item.key : "";
                return h(
                    resolveComponent("n-flex"),
                    {
                        align: "center",
                        wrap: false,
                    },
                    {
                        default: () =>
                            h(resolveComponent("n-input"), {
                                ref: (el: any) => {
                                    filterInputRefs.value[key] = el;
                                },
                                clearable: true,
                                placeholder: `筛选 ${getColumnLabel(item)}`,
                                value: filterPattern.value[key],
                                onUpdateValue: (value: string) => {
                                    filterPattern.value[key] = value;
                                },
                                onVnodeMounted() {
                                    nextTick(() => {
                                        filterInputRefs.value[key]?.focus();
                                    });
                                },
                            }),
                    }
                );
            },
        } as TableColumn<StatTableDataRow>;

        column.width = item.width || 100;
        if (item.fixed) column.fixed = item.fixed;
        result.push(column);
    }
    return result;
});
const onUpdateRole = (id: string, key: string | [string, any], value: any) => {
    if (Array.isArray(key)) {
        const [scope, scopeId] = key;
        if (scope === "skill") {
            const role = useRoleStore().getRoleById(id);
            const skillId = scopeId;
            const skill = role?.skills.find((s) => s.id === skillId);
            if (skill) {
                skill.level = value;
            } else {
                role?.skills.push({
                    id: skillId,
                    level: value,
                });
            }
        } else if (scope === "custom") {
            const role = useRoleStore().getRoleById(id)!;
            const column = useSettingStore().stat.columns.find(
                (item) => item.type === "custom" && item.key === scopeId
            ) as CustomStatSetting | undefined;
            if (column) {
                setCustomRoleValue(role, column, value);
            }
        }
    } else {
        useRoleStore().updateRole(id, {
            [key]: value,
        });
    }
};

// 确保所有角色都在 dragSortList 中
watch(
    () => useRoleStore().roles.map((r) => r.id),
    (ids) => {
        const { dragSortList } = useSettingStore().stat;
        const newIds = ids.filter((id) => !dragSortList.includes(id!));
        if (newIds.length) {
            useSettingStore().stat.dragSortList.push(...(newIds as string[]));
        }
    },
    { immediate: true, deep: true }
);
// 表格数据 - 排序后
const data = computed(() => {
    const roles = useRoleStore().roles;
    const { dragSortList } = useSettingStore().stat;
    const orderMap = dragSortList.reduce(
        (acc, id, index) => {
            acc[id] = index + 1;
            return acc;
        },
        {} as Record<string, number>
    );

    // 按照 dragSortList 排序
    const sortedRoles = [...roles].sort((a, b) => {
        const indexA = orderMap[a.id!] || Number.MAX_SAFE_INTEGER;
        const indexB = orderMap[b.id!] || Number.MAX_SAFE_INTEGER;
        return indexA - indexB;
    });

    const result: any[] = [];
    for (const role of sortedRoles) {
        const { spirit, endurance, teach } = useRoleStore().calcSpiritAndEndurance(role).value;
        const row: StatTableDataRow = {
            id: role.id!,
            account: role.account,
            server: role.server,
            role: role.name,
            roleSearchKey: getSearchKey(role.name),
            school: getSchoolName(role.schoolId!),
            schoolId: Number(role.schoolId),
            gender: role.gender,
            spirit,
            endurance,
            cd: role.cd || false,
            cdRemark: role.cdRemark || "",
            remark: role.remark || "",
            teach: [],
            default: "-",
        };
        {
            // 可传功技能
            for (const [level, bosses] of teach.entries()) {
                if (level > 0 && bosses.length) {
                    row.teach.push([level, bosses]);
                }
            }
            row.teach.sort((a, b) => b[0] - a[0]);
        }

        const levelMap = useRoleStore().getSkillLevelMap(role).value;
        const bookMap = useRoleStore().getBookMap(role).value;
        for (const column of useSettingStore().stat.columns) {
            if (column.type === "skill") {
                const skillLevel = levelMap[column.skillId] || 0;
                row[`skill-${column.skillId}`] = skillLevel;
                row[`skill-book-${column.skillId}`] = [];
                if (bookMap[column.skillId]) {
                    const hasHigherBookLevel = Object.keys(bookMap[column.skillId])
                        .map(Number)
                        .filter((level) => level > skillLevel)
                        .sort((a, b) => a - b);
                    if (hasHigherBookLevel.length > 0) {
                        row[`skill-book-${column.skillId}`].push(...hasHigherBookLevel);
                    }
                }
            } else if (column.type === "custom") {
                row[getCustomCellKey(column)] = getCustomRoleValue(role, column);
            }
        }

        result.push(row);
    }
    return result;
});
const filterData = computed(() => {
    const teachFilter = filterPattern.value.teach;
    const searchBosses = teachFilter
        ? bossList.value.filter((boss) => {
              // 1. boss名称匹配
              if (matchSearch(teachFilter, boss.searchKey)) return true;
              // 2. boss的技能名称匹配
              const bossSkills = useGameStore().skills.filter((skill) => {
                  return skill.belongBoss?.includes(boss.skillAlias);
              });
              if (bossSkills.some((skill) => matchSearch(teachFilter, skill.searchKey!))) return true;
          })
        : [];
    const column = useSettingStore().stat.columns.find((item) => item.type === "basic" && item.key === "teach");
    const teachMinLevel = column?.minLevel || 7;
    return data.value.filter((row: StatTableDataRow) => {
        // 隐藏未选择角色~
        if (useSettingStore().stat.enableSelect && useSettingStore().stat.hiddenSelected) {
            if (!useSettingStore().stat.selectRoles.includes(row.id)) {
                return false;
            }
        }
        // 账号筛选
        if (filterPattern.value.account && !row.account.includes(filterPattern.value.account)) {
            return false;
        }
        if (filterPattern.value.role && !matchSearch(filterPattern.value.role, row.roleSearchKey!)) {
            return false;
        }
        // 如果有匹配到的boss，仅展示这些boss之中可传功等级为「表格配置内的传功最小显示等级」的角色;
        if (
            filterPattern.value.teach &&
            !row.teach.some(([level, bosses]: [number, string[]]) => {
                return searchBosses.some((boss) => bosses.includes(boss.name)) && level >= teachMinLevel;
            })
        ) {
            return false;
        }
        if (filterPattern.value.remark && !row.remark.includes(filterPattern.value.remark)) {
            return false;
        }
        if (filterPattern.value.cdRemark && !row.cdRemark.includes(filterPattern.value.cdRemark)) {
            return false;
        }

        return true;
    });
});
const writableFilterData = computed({
    get: () => filterData.value,
    set: (val) => {
        // 更新 logic
        const { dragSortList } = useSettingStore().stat;
        // 1. 获取当前 filterData 所有 ID 在 dragSortList 中的位置
        const currentIds = filterData.value.map((row) => row.id);
        const indices = currentIds.map((id) => dragSortList.indexOf(id)).sort((a, b) => a - b);

        // 2. 将新的顺序填入这些位置
        const newIds = val.map((row) => row.id);
        const newDragSortList = [...dragSortList];

        for (const [i, index] of indices.entries()) {
            newDragSortList[index] = newIds[i];
        }
        useSettingStore().stat.dragSortList = newDragSortList;
    },
});
const tableStyle = computed((): CSSProperties => {
    return useSettingStore().stat.background.reduce((style, item) => {
        if (item.level !== null) {
            style[`--skill-level-${item.level}-bg`] = item.color;
        }
        return style;
    }, {} as CSSProperties);
});

// 表格排序事件
const tableRef = ref<InstanceType<typeof import("naive-ui").NDataTable> | null>(null);

const onUpdateSorter: OnUpdateSorter = ({ columnKey, order }) => {
    if (order === false) {
        useSettingStore().stat.sort = [];
    } else {
        useSettingStore().stat.sort = [columnKey, order];
    }
};
const initSorter = () => {
    const { sort } = useSettingStore().stat;
    if (sort?.length) {
        const [columnKey, order] = sort;
        tableRef.value?.sort(columnKey, order as "ascend" | "descend");
    }
};
onMounted(() => {
    initSorter();
});
watch(
    () => settingStore.activeStatProfileKey,
    () => {
        nextTick(initSorter);
    }
);

const settingPanel = ref<InstanceType<typeof StatSetting> | null>(null);
const openSetting = () => {
    settingPanel.value?.open();
};
const profileManageDialog = ref<InstanceType<typeof StatProfileManageDialog> | null>(null);
const openProfileManage = () => {
    profileManageDialog.value?.open();
};

const tableWidth = computed(() => {
    const setting = useSettingStore().stat.columns;
    let width = sumBy(setting, (item) => item.width || 100);
    if (useSettingStore().stat.enableDragSort) width += 40;
    if (useSettingStore().stat.enableSelect) width += 40;
    if (useSettingStore().stat.enableIndex) width += 52;
    return width;
});

const roleDetail = ref<InstanceType<typeof RoleDetailDialog> | null>(null);
const tableWrapperRef = ref<HTMLElement | null>(null);
const maxHeight = ref(0);
useResizeObserver(tableWrapperRef, (entries) => {
    const entry = entries[0];
    const { height } = entry.contentRect;
    maxHeight.value = height - 50; // 减去顶部工具栏的高度
});
</script>

<style lang="less">
.p-stat {
    display: flex;
    flex-direction: column;
    width: 100%;
    gap: 10px;
    height: 100%;

    .m-data {
        width: 100%;
        flex-shrink: 0;
        flex-grow: 1;
        height: 0;

        .u-column-title {
            display: flex;
            align-items: center;
            gap: 8px;
            .n-image,
            img {
                flex-shrink: 0;
                width: 20px;
                height: 20px;
            }
        }
        .n-data-table-td:has(.u-skill-level) {
            text-align: center;
        }

        .n-data-table-td {
            .loop-level-bg(@i: 0) when (@i <= 20) {
                &:has(.level-@{i}) {
                    background-color: ~"var(--skill-level-@{i}-bg)" !important;
                }
                .loop-level-bg(@i + 1);
            }
            .loop-level-bg();
        }

        .n-data-table .n-data-table-th .n-data-table-filter {
            right: 10px;

            &.is-active {
                background-color: var(--n-color-focus);
                color: var(--n-text-color-focus);
            }
        }

        @keyframes bookTip {
            0% {
                transform: scale(1);
            }
            50% {
                transform: scale(1.1);
            }
            100% {
                transform: scale(1);
            }
        }
        .u-skill-book-tip {
            animation: bookTip 0.25s infinite;
        }
    }

    .m-toolbar {
        display: flex;
        position: sticky;
        top: 0;
        gap: 12px;

        .m-toolbar-inner {
            width: 100%;
            min-width: 0;
        }

        .m-profile-select {
            width: 240px;
            min-width: 180px;

            .n-select {
                flex: 1;
                min-width: 0;
            }
        }

        .n-input {
            flex-grow: 1;
            width: 0px;
        }
    }

    .m-mode-popover {
        width: 160px;
    }

    .n-data-table {
        .u-role-name {
            line-height: 1.6;
        }
    }
    .n-data-table-th__ellipsis {
        max-width: 100% !important;
    }
}
</style>
