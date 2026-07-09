<template>
    <n-modal
        v-model:show="show"
        preset="card"
        title="账号分组"
        class="m-account-group-dialog"
        :style="{ width: '640px', maxWidth: 'calc(100vw - 32px)' }"
    >
        <n-flex vertical :size="12">
            <n-flex justify="space-between" align="center" :wrap="true">
                <n-flex align="center" :wrap="false">
                    <n-switch v-model:value="settingStore.planning.accountGroupsEnabled" size="small" />
                    <n-text depth="3">启用账号分组</n-text>
                </n-flex>
                <n-button size="small" type="primary" @click="addGroup">
                    <template #icon>
                        <i-material-symbols:add-rounded />
                    </template>
                    新增分组
                </n-button>
            </n-flex>

            <n-text depth="3">启用后，同一分组内账号下的角色不会出现在同一队。</n-text>

            <n-empty v-if="!accountOptions.length" description="暂无账号" />
            <n-empty v-else-if="!accountGroups.length" description="还没有账号分组" />
            <div v-else class="m-account-group-list">
                <n-card v-for="group in accountGroups" :key="group.id" size="small" class="m-account-group-item">
                    <n-flex vertical :size="10">
                        <n-flex align="center" :wrap="false">
                            <n-input v-model:value="group.name" size="small" placeholder="分组名称" />
                            <n-button quaternary circle size="small" @click="removeGroup(group.id)">
                                <template #icon>
                                    <i-material-symbols:delete-outline-rounded />
                                </template>
                            </n-button>
                        </n-flex>
                        <n-select
                            v-model:value="group.accounts"
                            multiple
                            filterable
                            clearable
                            max-tag-count="responsive"
                            placeholder="选择这个玩家名下的账号"
                            :options="getGroupAccountOptions(group.id)"
                        />
                    </n-flex>
                </n-card>
            </div>

            <n-flex v-if="ungroupedAccounts.length" align="center" :wrap="true">
                <n-text depth="3">未分组</n-text>
                <n-tag v-for="account in ungroupedAccounts" :key="account" size="small">
                    {{ account }}
                </n-tag>
            </n-flex>
        </n-flex>
    </n-modal>
</template>

<script setup lang="ts">
import { useRoleStore } from "@/store/role";
import { useSettingStore } from "@/store/setting";
import { nanoid } from "nanoid";
import type { SelectOption } from "naive-ui";

type AccountGroup = {
    id: string;
    name: string;
    accounts: string[];
};

const show = shallowRef(false);
const roleStore = useRoleStore();
const settingStore = useSettingStore();

const accountGroups = computed<AccountGroup[]>(() => settingStore.planning.accountGroups || []);
const accountOptions = computed<SelectOption[]>(() => {
    const accountOrder = roleStore.accountOrder || [];
    return Array.from(new Set(roleStore.roles.map((role) => role.account).filter(Boolean)))
        .sort((a, b) => {
            const aIndex = accountOrder.indexOf(a);
            const bIndex = accountOrder.indexOf(b);
            if (aIndex !== -1 || bIndex !== -1) {
                return (aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex) - (bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex);
            }
            return a.localeCompare(b);
        })
        .map((account) => ({
            label: account,
            value: account,
        }));
});

const availableAccountSet = computed(() => new Set(accountOptions.value.map((option) => String(option.value))));
const groupedAccountSet = computed(() => new Set(accountGroups.value.flatMap((group) => group.accounts || [])));
const ungroupedAccounts = computed(() =>
    accountOptions.value.map((option) => String(option.value)).filter((account) => !groupedAccountSet.value.has(account))
);

const getGroupAccountOptions = (groupId: string) => {
    const usedByOtherGroups = new Set(
        accountGroups.value.filter((group) => group.id !== groupId).flatMap((group) => group.accounts || [])
    );
    return accountOptions.value.map((option) => ({
        ...option,
        disabled: usedByOtherGroups.has(String(option.value)),
    }));
};

const normalizeGroups = (groups: AccountGroup[]) => {
    const usedAccounts = new Set<string>();
    return groups.map((group, index) => {
        const accounts = Array.from(new Set(group.accounts || [])).filter((account) => {
            if (!availableAccountSet.value.has(account) || usedAccounts.has(account)) return false;
            usedAccounts.add(account);
            return true;
        });
        return {
            id: group.id || nanoid(),
            name: group.name || `分组${index + 1}`,
            accounts,
        };
    });
};

const addGroup = () => {
    settingStore.planning.accountGroups = [
        ...accountGroups.value,
        {
            id: nanoid(),
            name: `分组${accountGroups.value.length + 1}`,
            accounts: [],
        },
    ];
};

const removeGroup = (id: string) => {
    settingStore.planning.accountGroups = accountGroups.value.filter((group) => group.id !== id);
};

const open = () => {
    show.value = true;
};

watch(
    () => [settingStore.planning.accountGroups, accountOptions.value] as const,
    () => {
        const normalized = normalizeGroups(accountGroups.value);
        if (JSON.stringify(normalized) !== JSON.stringify(accountGroups.value)) {
            settingStore.planning.accountGroups = normalized;
        }
    },
    { deep: true, immediate: true }
);

defineExpose({ open });
</script>

<style scoped lang="less">
.m-account-group-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-height: 420px;
    overflow: auto;
}

.m-account-group-item {
    flex-shrink: 0;
}
</style>
