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
                <n-popconfirm @positive-click="onResetSetting">
                    <template #trigger>
                        <n-button secondary type="warning"> 重置设置 </n-button>
                    </template>
                    <n-text> 该操作会重置你所有的配置（目前主要是统计表格列配置，不包括角色数据） </n-text>
                </n-popconfirm>
            </n-flex>
            <n-h6 prefix="bar">别名配置</n-h6>
            <n-alert title="占位" type="info">
                <n-text>
                    大伙平时还是习惯称呼boss和技能的别名，比如“黑煞落贪狼”一般都直接叫“黑”或者“黑煞”更多。
                </n-text>
                <br />
                <n-text>
                    俺寻思提供一个配置别名的地方，配置一次别的地方默认就显示别名可能会更符合习惯一点。更短的名字也可以显示出更多东西
                </n-text>
                <br />
                <n-text> 但是这个功能没什么动力写，到时候再说吧~ </n-text>
            </n-alert>
            <n-flex>
                <n-button type="info" @click="message.info('还没做哦~')">首领别名配置</n-button>
                <n-button type="info" @click="message.info('还没做哦~')">技能别名配置</n-button>
            </n-flex>
        </n-flex>
    </div>
    <export-dialog ref="exportDialog"></export-dialog>
    <import-dialog ref="importDialog"></import-dialog>
</template>

<script setup lang="ts">
import { useMessage } from "naive-ui";
import ExportDialog from "@/components/setting/ExportDialog.vue";
import ImportDialog from "@/components/setting/ImportDialog.vue";
import { useSettingStore } from "@/store/setting";

const message = useMessage();
const exportDialog = ref<InstanceType<typeof ExportDialog> | null>(null);
const importDialog = ref<InstanceType<typeof ImportDialog> | null>(null);

const onResetSetting = () => {
    useSettingStore().$reset();
}
</script>

<style lang="less" scoped></style>
