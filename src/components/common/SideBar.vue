<template>
    <div class="c-sidebar" :style="sidebarStyle">
        <div class="flex justify-center pt-[16px]">
            <n-button text @click="toggleSidebarExpand">
                <template #icon>
                    <i-ri:expand-right-line v-if="!isExpand"></i-ri:expand-right-line>
                    <i-ri:expand-left-line v-else></i-ri:expand-left-line>
                </template>
            </n-button>
        </div>
        <n-menu
            class="c-sidebar-menu"
            v-model:value="menuValue"
            :options="items"
            :collapsed="!isExpand"
            :collapsed-width="64"
        ></n-menu>
        <div class="c-sidebar-footer">
            <span>广告位招租</span>
            <n-button @click="onToggleTheme" text>
                <template #icon>
                    <i-material-symbols:mode-night v-if="useSettingStore().theme == 'dark'" />
                    <i-iconamoon:mode-light v-if="useSettingStore().theme == 'light'" />
                    <i-grommet-icons:system v-if="useSettingStore().theme == 'os'" />
                </template>
                {{ useSettingStore().theme == "dark" ? "深色" : useSettingStore().theme == "light" ? "浅色" : "系统" }}
            </n-button>
        </div>
    </div>
</template>
<script lang="ts" setup>
import { useSettingStore } from "@/store/setting";
import { RouterLink } from "vue-router";

// 导航逻辑
const items = reactive([
    {
        label: () => h(RouterLink, { to: "/home" }, () => "首页"),
        key: "home",
        icon: () => h(resolveComponent("i-material-symbols:home-outline-rounded")),
    },
    {
        label: () => h(RouterLink, { to: "/stat" }, () => "统计"),
        key: "stat",
        icon: () => h(resolveComponent("i-material-symbols:table-outline")),
    },
    {
        label: () => h(RouterLink, { to: "/role" }, () => "角色"),
        key: "role",
        icon: () => h(resolveComponent("i-bx:game")),
    },
    {
        label: () => h(RouterLink, { to: "/setting" }, () => "设置"),
        key: "setting",
        icon: () => h(resolveComponent("i-material-symbols:settings-outline-rounded")),
    },
]);

const menuValue = ref("home");
const route = useRoute();
watch(
    () => route.name,
    (newName) => {
        if (newName && menuValue.value != newName) {
            menuValue.value = newName as string;
        }
    },
    { immediate: true }
);

// 伸缩逻辑
const isExpand = computed(() => useSettingStore().menu.collapsed === false);
const toggleSidebarExpand = () => {
    useSettingStore().menu.collapsed = !useSettingStore().menu.collapsed;
};
const sidebarStyle = computed(() => {
    return isExpand.value ? { width: "240px" } : { width: "64px" };
});

// 主题切换逻辑
const onToggleTheme = () => {
    const alternativeThemes = ["dark", "light", "os"] as const;
    const currentTheme = useSettingStore().theme || "dark";
    const currentIndex = alternativeThemes.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % alternativeThemes.length;
    useSettingStore().theme = alternativeThemes[nextIndex];
};
</script>

<style lang="less" scoped>
.c-sidebar {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    gap: 16px;
    border-right: 1px solid #e8e8e8;
    width: 240px;

    .c-sidebar-footer {
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        color: #999;
        padding: 10px;
    }

    .c-sidebar-menu {
        border: none;
        flex-grow: 1;
    }
}
</style>
