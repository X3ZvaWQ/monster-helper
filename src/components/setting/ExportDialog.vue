<template>
    <n-modal
        v-model:show="visible"
        title="导出数据"
        preset="dialog"
        :closable="true"
        :show-icon="false"
        @positive-click="onConfirm"
        @negative-click="visible = false"
    >
        <n-flex vertical :size="10">
            <n-text>选择要导出的项目</n-text>
            <n-flex vertical>
                <n-checkbox v-model:checked="exportItems.roles">角色数据</n-checkbox>
                <n-checkbox v-model:checked="exportItems.settings">应用设置</n-checkbox>
            </n-flex>
            <n-flex>
                <n-text>导出数据内容</n-text>
                <n-button type="primary" text size="small" @click="onCopy">
                    <template #icon>
                        <i-material-symbols:copy-all />
                    </template>
                </n-button>
                <n-button type="primary" text size="small" @click="onDownload">
                    <template #icon>
                        <i-material-symbols:download-rounded />
                    </template>
                </n-button>
            </n-flex>
            <n-input
                v-model:value="exportData"
                readonly
                type="textarea"
                size="small"
                :autosize="{
                    minRows: 3,
                    maxRows: 6,
                }"
            />
        </n-flex>
        <template #action>
            <n-flex justify="end">
                <n-button @click="onConfirm" type="primary">好的</n-button>
            </n-flex>
        </template>
    </n-modal>
</template>

<script setup lang="ts">
import { useRoleStore } from "@/store/role";
import { compressToBase64 } from "lz-string";
import { useMessage } from "naive-ui";
import saveAs from "file-saver";
import { useSettingStore } from "@/store/setting";
const message = useMessage();

const visible = ref(false);
const exportItems = ref({
    roles: true,
    settings: true,
});

const exportData = computed(() => {
    const data: Record<string, any> = {};
    if (exportItems.value.roles) data.roles = useRoleStore().$state;
    if (exportItems.value.settings) data.settings = useSettingStore().$state;
    const compressedData = compressToBase64(JSON.stringify(data));
    // base64
    return compressedData;
});

const onCopy = () => {
    navigator.clipboard
        .writeText(exportData.value)
        .then(() => {
            message.success("数据已复制到剪贴板");
        })
        .catch(() => {
            message.error("复制失败，请手动复制");
        });
};
const onDownload = () => {
    saveAs(exportData.value, "百战助手导出数据.txt");
};
const onConfirm = () => {
    visible.value = false;
};
const open = () => {
    visible.value = true;
};
defineExpose({
    open,
});
</script>

<style lang="less" scoped></style>
