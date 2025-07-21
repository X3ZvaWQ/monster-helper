<template>
    <n-flex class="p-home" :align="'center'" justify="center" vertical>
        <n-h3>一时间不知道写点啥，以后再说吧（广告位招租）</n-h3>
        <n-text>剑三真好玩 魔盒真好用</n-text>
        <n-text class="mb-4">支持魔盒谢谢喵~</n-text>
        <n-flex :align="'center'" class="m-info-item">
            <i-mdi:user class="u-icon" />
            <n-text>作者：秀秀不咕@梦江南</n-text>
        </n-flex>
        <n-flex :align="'center'" class="m-info-item">
            <jx3box-icon class="u-icon" />
            <n-text>
                发布地址：<n-button text type="primary" @click="openUrl('https://www.jx3box.com/tool/101669')">
                    JX3BOX
                </n-button>
            </n-text>
        </n-flex>
        <n-flex :align="'center'" class="m-info-item">
            <i-mingcute:qq-fill class="u-icon" />
            <n-text>联系方式(群)：785995635</n-text>
        </n-flex>
        <n-flex :align="'center'" class="m-info-item">
            <i-mdi:github class="u-icon" />
            <n-text>
                仓库地址：<n-button text type="primary" @click="openUrl('https://github.com/X3ZvaWQ/monster-helper')">
                    MonsterHelper
                </n-button>
            </n-text>
        </n-flex>
    </n-flex>
</template>

<script setup lang="ts">
import { useCheckUpdate } from "@/utils/use/update";
import { useNotification } from "naive-ui";
import { useStateStore } from "@/store/state";
import { openUrl } from "@/utils/actions";
import Jx3boxIcon from "@/assets/jx3box.svg";

const notification = useNotification();
const { checkUpdate } = useCheckUpdate(notification);
const doCheckUpdate = () => {
    checkUpdate();
};

onMounted(() => {
    if (Date.now() - useStateStore().lastCheckUpdate < 1000 * 60 * 60 * 3) return;
    useStateStore().lastCheckUpdate = Date.now();
    doCheckUpdate();
});
</script>

<style lang="less" scoped>
.p-home {
    height: 100%;

    .m-info-item {
        min-width: 240px;
    }
    .u-icon {
        width: 24px;
        height: 24px;
    }
}
</style>
