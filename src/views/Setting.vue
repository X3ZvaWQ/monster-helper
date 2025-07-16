<template>
    <div class="p-setting">
        <n-flex :size="10" vertical>
            <n-h6 prefix="bar">数据存储</n-h6>
            <n-alert title="注意" type="info">
                <n-text>
                    该应用暂不提供云端存储功能，当你需要在不同的设备或者浏览器上使用该应用时，可以在这里将你的个人数据进行导入或者导出
                </n-text>
                <br />
                <n-text>
                    同时，本应用数据保存在 localStorage 内，当清空浏览器缓存或者使用隐私模式的时候数据也会丢失哦~
                </n-text>
            </n-alert>
            <n-flex>
                <n-button type="info" @click="exportDialog?.open()">导出数据</n-button>
                <n-button type="primary" @click="importDialog?.open()">导入数据</n-button>
            </n-flex>
            <n-h6 prefix="bar">别名配置</n-h6>
        </n-flex>
    </div>
    <export-dialog ref="exportDialog"></export-dialog>
    <import-dialog ref="importDialog"></import-dialog>
</template>

<script setup lang="ts">
import ExportDialog from "@/components/setting/ExportDialog.vue";
import ImportDialog from "@/components/setting/ImportDialog.vue";

const exportDialog = ref<InstanceType<typeof ExportDialog> | null>(null);
const importDialog = ref<InstanceType<typeof ImportDialog> | null>(null);
</script>

<style lang="less" scoped></style>
