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
            <img class="u-icon" src="@/assets/jx3box.svg" alt="魔盒" />
            <n-text>
                发布地址：<n-button text type="primary" @click="openUrl('https://www.jx3box.com/tool/101669')">
                    JX3BOX
                </n-button>
            </n-text>
        </n-flex>
        <n-flex :align="'center'" class="m-info-item">
            <i-mingcute:qq-fill class="u-icon" />
            <n-text>联系方式：3303928580</n-text>
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
import { checkUpdate } from "@/utils/update";
import { useNotification } from "naive-ui";
import { openUrl } from "@tauri-apps/plugin-opener";

const notification = useNotification();
onMounted(() => {
    checkUpdate()
        .then(({ isNewest, newestVersion }) => {
            if (isNewest) {
                notification.create({
                    type: "success",
                    title: "版本检查",
                    description: "当前已经是最新版本咯~",
                });
            } else {
                const n = notification.create({
                    type: "warning",
                    title: "版本检查",
                    description: `当前版本不是最新版本，最新版本为 ${newestVersion}，请前往魔盒下载最新版本。`,
                    duration: 0, // 持续显示
                    closable: true, // 可关闭
                    action: () =>
                        h(
                            resolveComponent("n-button"),
                            {
                                text: true,
                                type: "primary",
                                onClick: () => {
                                    n.destroy();
                                    openUrl("https://www.jx3box.com/tool/101669");
                                },
                            },
                            {
                                default: () => "Go!",
                            }
                        ),
                });
            }
        })
        .catch((error) => {
            notification.create({
                type: "error",
                title: "版本检查",
                description: error.message,
            });
        });
});
</script>

<style lang="less" scoped>
.p-home {
    height: 100%;

    .m-info-item {
        min-width: 240px;
    }
    .u-icon {
        color: white;
        width: 24px;
        height: 24px;
    }
}
</style>
