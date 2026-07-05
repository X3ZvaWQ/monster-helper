<template>
    <n-modal
        v-model:show="visible"
        preset="card"
        title="管理统计方案"
        class="m-stat-profile-manage w-[680px]!"
        :bordered="false"
    >
        <n-list bordered hoverable>
            <n-list-item v-for="profile in settingStore.statProfiles" :key="profile.key">
                <template #suffix>
                    <n-space size="small" align="center">
                        <n-tag v-if="profile.key === settingStore.activeStatProfileKey" size="small" type="success">
                            当前
                        </n-tag>
                        <n-button
                            size="small"
                            text
                            type="primary"
                            @click="settingStore.duplicateStatProfile(profile.key)"
                        >
                            复制
                        </n-button>
                        <n-popconfirm
                            v-if="!Boolean(profile.isDefault)"
                            @positive-click="settingStore.deleteStatProfile(profile.key)"
                        >
                            <template #trigger>
                                <n-button size="small" text type="error" :disabled="Boolean(profile.isDefault)">
                                    删除
                                </n-button>
                            </template>
                            删除后无法恢复该统计方案。
                        </n-popconfirm>
                    </n-space>
                </template>
                <n-space vertical size="small">
                    <n-input
                        :value="profile.name"
                        size="small"
                        maxlength="20"
                        @update:value="(value) => settingStore.renameStatProfile(profile.key, value)"
                    />
                    <n-space size="small" align="center">
                        <n-text depth="3">识别名：{{ profile.key }}</n-text>
                        <n-tag v-if="profile.isDefault" size="small">默认</n-tag>
                    </n-space>
                </n-space>
            </n-list-item>
        </n-list>
    </n-modal>
</template>

<script setup lang="ts">
import { useSettingStore } from "@/store/setting";

const settingStore = useSettingStore();
const visible = ref(false);

const open = () => {
    settingStore.ensureStatProfiles();
    visible.value = true;
};

defineExpose({ open });
</script>

<style scoped lang="less">
.m-stat-profile-manage {
    width: 560px;
    max-width: calc(100vw - 32px);
}
</style>
