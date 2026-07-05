<template>
    <n-modal v-model:show="visible" preset="card" width="520px" title="管理自定义列" class="m-custom-column-manage" :bordered="false">
        <n-tabs type="line" animated>
            <n-tab-pane name="custom" :tab="`自定义列(${customColumnItems.length})`">
                <n-empty v-if="!customColumnItems.length" description="暂无自定义列" />
                <n-list v-else bordered hoverable>
                    <n-list-item v-for="item in customColumnItems" :key="item.column.key">
                        <template #suffix>
                            <n-space class="justify-end!" size="small">
                                <n-switch
                                class="min-w-15!"
                                    :value="item.enabled"
                                    size="small"
                                    :round="false"
                                    @update:value="(enabled) => onEnabledChange(item.column, enabled)"
                                >
                                    <template #checked>启用</template>
                                    <template #unchecked>隐藏</template>
                                </n-switch>
                                <n-button size="small" text type="primary" @click="onEdit(item.column)">编辑</n-button>
                                <n-button size="small" text type="warning" @click="onSoftDelete(item.column)"
                                    >删除</n-button
                                >
                            </n-space>
                        </template>
                        <n-thing>
                            <template #header>
                                <n-space align="center" size="small">
                                    <span>{{ item.column.label }}</span>
                                    <n-tag size="small" :type="item.enabled ? 'success' : 'default'">
                                        {{ item.enabled ? "启用" : "隐藏" }}
                                    </n-tag>
                                    <n-tag size="small">{{ getTypeLabel(item.column.valueType) }}</n-tag>
                                    <n-tag v-if="item.column.refresh" size="small" type="info">随CD重置</n-tag>
                                </n-space>
                            </template>
                            <template #description>
                                <n-text depth="3">识别名：{{ item.column.key }}</n-text>
                            </template>
                        </n-thing>
                    </n-list-item>
                </n-list>
            </n-tab-pane>
            <n-tab-pane name="deleted" :tab="`回收站(${deletedCustomColumns.length})`">
                <n-empty v-if="!deletedCustomColumns.length" description="回收站为空" />
                <n-list v-else bordered hoverable>
                    <n-list-item v-for="column in deletedCustomColumns" :key="column.key">
                        <template #suffix>
                            <n-space size="small">
                                <n-button size="small" type="primary" @click="onRestore(column.key)">恢复</n-button>
                                <n-popconfirm @positive-click="onPurge(column.key)">
                                    <template #trigger>
                                        <n-button size="small" type="error" ghost>彻底删除</n-button>
                                    </template>
                                    彻底删除会清除所有角色在该列中的记录，无法恢复。
                                </n-popconfirm>
                            </n-space>
                        </template>
                        <n-thing>
                            <template #header>
                                <n-space align="center" size="small">
                                    <span>{{ column.label }}</span>
                                    <n-tag size="small">{{ getTypeLabel(column.valueType) }}</n-tag>
                                    <n-tag v-if="column.refresh" size="small" type="info">随CD重置</n-tag>
                                </n-space>
                            </template>
                            <template #description>
                                <n-text depth="3">识别名：{{ column.key }}</n-text>
                            </template>
                        </n-thing>
                    </n-list-item>
                </n-list>
            </n-tab-pane>
        </n-tabs>
        <add-custom-stat ref="addCustomStatRef"></add-custom-stat>
    </n-modal>
</template>

<script setup lang="ts">
import { useMessage } from "naive-ui";
import AddCustomStat from "./AddCustomStat.vue";
import { useRoleStore } from "@/store/role";
import { useSettingStore } from "@/store/setting";
import {
    hideCustomColumn,
    migrateCustomColumnValues,
    normalizeCustomColumn,
    normalizeCustomValueType,
    purgeCustomColumn,
    restoreCustomColumn,
    showCustomColumn,
    softDeleteCustomColumn,
} from "@/utils/stat-custom";

const message = useMessage();
const roleStore = useRoleStore();
const settingStore = useSettingStore();
const visible = ref(false);

const activeCustomColumns = computed(() => {
    return settingStore.stat.columns.filter((column) => column.type === "custom") as CustomStatSetting[];
});

const hiddenCustomColumns = computed(() => {
    return settingStore.stat.hiddenCustomColumns || [];
});

const customColumnItems = computed(() => {
    return [
        ...activeCustomColumns.value.map((column) => ({ column, enabled: true })),
        ...hiddenCustomColumns.value.map((column) => ({ column, enabled: false })),
    ];
});

const deletedCustomColumns = computed(() => {
    return settingStore.stat.deletedCustomColumns || [];
});

const getTypeLabel = (valueType: CustomStatValueType | "text") => {
    const labelMap: Record<CustomStatValueType, string> = {
        boolean: "是/否",
        number: "数字",
        string: "文本",
    };
    return labelMap[normalizeCustomValueType(valueType)];
};

const onSoftDelete = (column: CustomStatSetting) => {
    softDeleteCustomColumn(settingStore.stat, column);
    message.success("已移入回收站");
};

const onRestore = (key: string) => {
    restoreCustomColumn(settingStore.stat, key);
    message.success("已恢复为隐藏状态");
};

const onPurge = (key: string) => {
    purgeCustomColumn(settingStore.stat, roleStore.roles, key);
    message.success("已彻底删除自定义列");
};

const onEnabledChange = (column: CustomStatSetting, enabled: boolean) => {
    if (enabled) {
        showCustomColumn(settingStore.stat, column.key);
    } else {
        hideCustomColumn(settingStore.stat, column);
    }
};

const findCustomColumn = (key: string) => {
    return (
        activeCustomColumns.value.find((column) => column.key === key) ||
        hiddenCustomColumns.value.find((column) => column.key === key) ||
        deletedCustomColumns.value.find((column) => column.key === key)
    );
};

const addCustomStatRef = ref<InstanceType<typeof AddCustomStat>>();
const onEdit = (column: CustomStatSetting) => {
    addCustomStatRef.value
        ?.open(column)
        .then((value) => {
            if (!value.key) return;
            const currentColumn = findCustomColumn(value.key);
            if (!currentColumn) return;
            const previousValueType = currentColumn.valueType;
            Object.assign(currentColumn, normalizeCustomColumn(value));
            if (previousValueType !== currentColumn.valueType) {
                migrateCustomColumnValues(roleStore.roles, currentColumn);
            }
        })
        .catch(() => {});
};

const open = () => {
    if (!settingStore.stat.hiddenCustomColumns) {
        settingStore.stat.hiddenCustomColumns = [];
    }
    if (!settingStore.stat.deletedCustomColumns) {
        settingStore.stat.deletedCustomColumns = [];
    }
    visible.value = true;
};

defineExpose({ open });
</script>

<style lang="less">
.m-custom-column-manage {
    width: 680px;
}
</style>
