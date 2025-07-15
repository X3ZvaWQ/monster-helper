<template>
    <div class="p-stat" ref="pageEl">
        <div class="m-toolbar">
            <n-button @click="openSetting" type="primary">表格配置</n-button>
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
</template>

<script setup lang="ts">
import StatSetting from "@/components/stat/Setting.vue";
import { useGameStore } from "@/store/game";
import { useRoleStore } from "@/store/role";
import { useSettingStore } from "@/store/setting";
import { getSchoolName, iconLink } from "@/utils/game";
import { DataTableColumns } from "naive-ui";
import { TableBaseColumn, TableColumn } from "naive-ui/es/data-table/src/interface";

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
    const result: DataTableColumns = [];

    const getColumnKey = (item: StatSetting) => {
        if (item.type === "basic") return item.key;
        if (item.type === "skill") return `skill-${item.skillId}`;
        return "";
    };
    const getColumnLabel = (item: StatSetting) => {
        if (item.label) return item.label;
        if (item.type === "basic") return item.key;
        if (item.type === "skill") {
            const skill = useGameStore().getSkillById(item.skillId);
            return skill ? skill.name : `技能-${item.skillId}`;
        }
    };
    const getTitleRender = (item: StatSetting) => {
        if (item.type === "basic") {
            return () => h("div", { class: "u-basic" }, getColumnLabel(item));
        }
        if (item.type === "skill") {
            return () =>
                h(resolveComponent("n-text"), { style: item.style || {} }, { default: () => getColumnLabel(item) });
        }
        return () => "";
    };
    const getColumnRender = (item: StatSetting) => {
        if (item.type === "basic") {
            return (row: any) => h("div", { class: "u-basic" }, row[getColumnKey(item)]);
        }
        if (item.type === "skill") {
            return (row: any) =>
                h(resolveComponent("n-text"), { style: item.style || {} }, { default: () => row[getColumnKey(item)] });
        }
        return () => "";
    };

    for (const item of setting) {
        // 构造key
        const key = getColumnKey(item);
        const column = {
            key,
            resizable: true,
            minWidth: 1,
            title() {
                const divContent: any[] = [getColumnLabel(item)];
                if (item.type === "skill" && item.withIcon) {
                    divContent.unshift(
                        h(resolveComponent("n-image"), {
                            previewDisabled: true,
                            src: iconLink(useGameStore().getSkillById(item.skillId)?.icon || 0),
                            style: "width: 20px; height: 20px",
                        })
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
            render(row) {
                return h(
                    resolveComponent("n-text"),
                    {
                        style: item.style || {},
                    },
                    { default: () => row[key] }
                );
            },
        } as TableColumn;
        if (item.width) column.width = item.width;
        if (item.fixed) column.fixed = item.fixed;
        result.push(column);
    }
    return result;
});

const data = computed(() => {
    const roles = useRoleStore().roles;
    const result: any[] = [];
    for (const role of roles) {
        const { spirit, endurance } = useRoleStore().calcSpiritAndEndurance(role);
        const row: any = {
            account: role.account,
            server: role.server,
            role: role.name,
            school: getSchoolName(role.schoolId!),
            gender: role.gender,
            spirit,
            endurance,
        };
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

const tableWidth = ref<number>(0);
const pageEl = ref<HTMLElement | null>(null);
// 监听页面宽度变化
onMounted(() => {
    const resizeObserver = new ResizeObserver(() => {
        if (pageEl.value) {
            tableWidth.value = pageEl.value.clientWidth - 2;
        }
    });
    if (pageEl.value) {
        resizeObserver.observe(pageEl.value);
        tableWidth.value = pageEl.value.clientWidth - 2;
    }
});
</script>

<style lang="less">
.p-stat {
    display: flex;
    flex-direction: column;
    width: 100%;
    gap: 10px;
    height: 100%;

    .m-toolbar {
        display: flex;
        justify-content: flex-end;
    }

    .u-column-title {
        display: flex;
        align-items: center;
        gap: 8px;
        .n-image {
            flex-shrink: 0;
        }
    }

    .n-data-table-th,
    .n-data-table-td {
        width: auto !important;
    }
}
</style>
