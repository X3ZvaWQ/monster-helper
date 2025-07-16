<template>
    <div class="p-stat" ref="pageEl">
        <div class="m-toolbar">
            <n-flex>
                <n-button @click="openSetting" type="primary">表格配置</n-button>
                <n-popconfirm @positive-click="useRoleStore().resetCd()">
                    <template #trigger>
                        <n-button type="warning">新的一周</n-button>
                    </template>
                    该操作会重置所有角色的百战CD和传功/被传功计数，周一的时候点一点就好，不可撤销哦~
                </n-popconfirm>
            </n-flex>
        </div>
        <div class="m-data">
            <n-data-table
                ref="tableEl"
                :columns="columns"
                :data="data"
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

import { skillLevelLabel } from "@/assets/data/game";
import { useGameStore } from "@/store/game";
import { useRoleStore } from "@/store/role";
import { useSettingStore } from "@/store/setting";
import { getSchoolName, iconLink } from "@/utils/game";
import { sumBy } from "lodash";
import { DataTableColumns } from "naive-ui";
import { TableBaseColumn, TableColumn } from "naive-ui/es/data-table/src/interface";
import { CSSProperties } from "vue";

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
        if (item.label) return item.label;
        if (item.type === "basic") return item.key;
        if (item.type === "skill") {
            const skill = useGameStore().getSkillById(item.skillId);
            return skill ? skill.name : `技能-${item.skillId}`;
        }
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
            sorter: "default",
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
                            { style: getStyle(item) },
                            { default: () => (item.level === "levelLabel" ? skillLevelLabel[skillLevel] : skillLevel) }
                        )
                    );
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
        // 可传功技能需要tooltip

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
        const { spirit, endurance, teach } = useRoleStore().calcSpiritAndEndurance(role);
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

        for (const column of useSettingStore().stat.columns) {
            const levelMap = useRoleStore().getSkillLevelMap(role);
            if (column.type === "skill") {
                row[`skill-${column.skillId}`] = levelMap[column.skillId] || 0;
            }
        }

        result.push(row);
    }
    return result;
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
        overflow-x: auto;

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
    }

    .m-toolbar {
        display: flex;
        justify-content: flex-end;
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
