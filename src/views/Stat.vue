<template>
    <div class="p-stat" ref="pageEl">
        <div class="m-toolbar">
            <n-input v-model:value="search" placeholder="搜索" clearable>
                <template #suffix>
                    <n-tooltip>
                        <template #trigger>
                            <i-material-symbols:info-rounded />
                        </template>
                        <n-el tag="p">有人说想要搜索能传功指定boss的角色</n-el>
                        <n-el tag="p">我寻思确实有必要，于是有了这个想做成 omni search 的输入框</n-el>
                        <n-el tag="p">但是一时间除了传功不知道搜点啥，有什么想法可以提反馈</n-el>
                        <n-el tag="p">这里输入boss的名称或者拼音首字母即可过滤可传该boss技能的角色</n-el>
                        <n-el tag="p">（默认7重，可以通过在列展示可传功调整最小显示等级来修改）</n-el>
                    </n-tooltip>
                </template>
            </n-input>
            <n-flex :wrap="false">
                <n-button @click="openSetting" type="primary">表格配置</n-button>
                <n-popconfirm @positive-click="useRoleStore().resetCd()">
                    <template #trigger>
                        <n-button type="warning">新的一周</n-button>
                    </template>
                    该操作会重置所有角色的百战CD和传功/被传功计数，周一的时候点一点就好，不可撤销哦~
                </n-popconfirm>
            </n-flex>
        </div>
        <div class="m-data" ref="tableWrapperRef" :style="tableStyle">
            <n-data-table
                :max-height="maxHeight"
                :columns="columns"
                :data="filterData"
                :bordered="true"
                :scroll-x="tableWidth"
                :on-unstable-column-resize="onColumnResize"
            />
        </div>
    </div>
    <stat-setting ref="settingPanel"></stat-setting>
    <role-detail-dialog ref="roleDetail"></role-detail-dialog>
</template>

<script setup lang="ts">
import RoleDetailDialog from "@/components/role/RoleDetailDialog.vue";
import StatSetting from "@/components/stat/Setting.vue";
import TeachList from "@/components/role/TeachList.vue";

import { bossList, skillLevelLabel } from "@/assets/data/game";
import { useGameStore } from "@/store/game";
import { useRoleStore } from "@/store/role";
import { useSettingStore } from "@/store/setting";
import { getSchoolName, iconLink } from "@/utils/game";
import { sumBy } from "lodash";
import { DataTableColumns } from "naive-ui";
import { TableBaseColumn, TableColumn } from "naive-ui/es/data-table/src/interface";
import { CSSProperties } from "vue";
import { useResizeObserver } from "@vueuse/core";
import { matchSearch } from "@/utils/search";

const search = ref("");

const onColumnResize = (newWidth: number, _: number, column: TableBaseColumn) => {
    const settingColumn = useSettingStore().stat.columns.find(
        (item) =>
            (item.type === "basic" && item.key === column.key) ||
            (item.type === "skill" && `skill-${item.skillId}` === column.key)
    );
    settingColumn!.width = newWidth;
};

const columns = computed(() => {
    const setting = useSettingStore().stat.columns;
    const result: DataTableColumns<StatTableDataRow> = [];

    const getColumnKey = (item: StatSetting): keyof StatTableDataRow => {
        if (item.type === "basic") return item.key;
        if (item.type === "skill") return `skill-${item.skillId}`;
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
                    if (item.key == "cd" && row.cd) {
                        divContent.push(
                            h(resolveComponent("i-material-symbols:check-rounded"), {
                                style: {
                                    ...getStyle(item),
                                    position: "relative",
                                    bottom: "2px",
                                },
                            })
                        );
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
                            h(resolveComponent("n-text"), { style: getStyle(item) }, { default: () => row[key] })
                        );
                    }
                } else if (item.type === "skill") {
                    const skillLevel = row[`skill-${item.skillId}`] || 0;

                    divContent.push(
                        h(
                            resolveComponent("n-text"),
                            { style: getStyle(item), class: `level-${skillLevel} u-skill-level` },
                            { default: () => (item.level === "levelLabel" ? skillLevelLabel[skillLevel] : skillLevel) }
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
                                        h(
                                            resolveComponent("n-text"),
                                            { style: getStyle(item) },
                                            {
                                                default: () =>
                                                    `包里有书：${row[`skill-book-${item.skillId}`]
                                                        .map((l) => skillLevelLabel[l])
                                                        .join(", ")}`,
                                            }
                                        ),
                                    trigger: () =>
                                        h(resolveComponent("i-mingcute:alert-diamond-fill"), {
                                            class: "u-skill-book-tip",
                                        }),
                                }
                            )
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
        } as TableColumn<StatTableDataRow>;

        column.width = item.width || 100;
        if (item.fixed) column.fixed = item.fixed;
        result.push(column);
    }
    return result;
});

const data = computed(() => {
    const roles = useRoleStore().roles;
    const result: any[] = [];
    for (const role of roles) {
        const { spirit, endurance, teach } = useRoleStore().calcSpiritAndEndurance(role).value;
        const row: StatTableDataRow = {
            id: role.id!,
            account: role.account,
            server: role.server,
            role: role.name,
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
            }
        }

        result.push(row);
    }
    return result;
});
const filterData = computed(() => {
    if (!search.value) return data.value;
    const searchBosses = bossList.filter((boss) => matchSearch(search.value, boss.searchKey));
    const column = useSettingStore().stat.columns.find((item) => item.type === "basic" && item.key === "teach");
    const teachMinLevel = column?.minLevel || 7;
    return data.value.filter((row) => {
        if (!searchBosses.length) return true;
        // 如果有匹配到的boss，仅展示这些boss之中可传功等级为「表格配置内的传功最小显示等级」的角色
        const hasTeach = row.teach.some(([level, bosses]: [number, string[]]) => {
            return searchBosses.some((boss) => bosses.includes(boss.name)) && level >= teachMinLevel;
        });
        if (!hasTeach) return false;
        return true;
    });
});
const tableStyle = computed((): CSSProperties => {
    return useSettingStore().stat.background.reduce((style, item) => {
        if (item.level !== null) {
            style[`--skill-level-${item.level}-bg`] = item.color;
        }
        return style;
    }, {} as CSSProperties);
});

const settingPanel = ref<InstanceType<typeof StatSetting> | null>(null);
const openSetting = () => {
    settingPanel.value?.open();
};

const tableWidth = computed(() => {
    const setting = useSettingStore().stat.columns;
    return sumBy(setting, (item) => item.width || 100);
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
        justify-content: flex-end;
        position: sticky;
        top: 0;
        gap: 12px;
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
