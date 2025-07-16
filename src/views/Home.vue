<template>
    Home
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
</style>