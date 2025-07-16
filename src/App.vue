<template>
    <n-config-provider :theme="themeRef" :locale="zhCN" :inline-theme-disabled="true">
        <n-global-style />
        <n-message-provider>
            <n-notification-provider>
                <n-dialog-provider>
                    <main class="c-layout">
                        <SideBar />
                        <div class="c-container">
                            <router-view></router-view>
                        </div>
                    </main>
                </n-dialog-provider>
            </n-notification-provider>
        </n-message-provider>
    </n-config-provider>
</template>

<script lang="ts" setup>
import SideBar from "./components/common/SideBar.vue";
import { useGameStore } from "@/store/game";
import { useSettingStore } from "./store/setting";
import { lightTheme, darkTheme, useOsTheme, zhCN } from "naive-ui";

onMounted(() => {
    const gameStore = useGameStore();
    gameStore.fetchSkills();
});

const osThemeRef = useOsTheme();
const themeRef = computed(() => {
    let theme = useSettingStore().theme;
    // 如果主题是 os，则使用系统主题
    if (theme === "os") {
        theme = osThemeRef.value;
    }
    if (theme === "dark") return darkTheme;
    else return lightTheme;
});
</script>

<style lang="less">
@import "./assets/style/common.less";
</style>
<style lang="less" scoped>
.c-layout {
    display: flex;
    height: 100dvh;
    width: 100dvw;
    overflow: hidden;
}
.c-container {
    padding: 30px;
    box-sizing: border-box;
    flex-grow: 1;
    min-width: 0;
}
</style>
