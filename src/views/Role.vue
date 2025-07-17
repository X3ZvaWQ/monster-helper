<template>
    <div class="p-role">
        <n-flex class="m-toolbar" :wrap="false">
            <n-input class="grow" v-model:value="search" placeholder="搜索角色" clearable />
            <n-button @click="onCreateRole" type="primary">创建角色</n-button>
            <n-popconfirm @positive-click="useRoleStore().resetCd()">
                <template #trigger>
                    <n-button type="warning">新的一周</n-button>
                </template>
                该操作会重置所有角色的百战CD和传功/被传功计数，周一的时候点一点就好，不可撤销哦~
            </n-popconfirm>
        </n-flex>

        <div class="m-account-list" v-if="roleList.length">
            <n-card class="m-account-item" v-for="(account, index) in roleList" :key="index" size="small">
                <template #header>
                    <div class="m-account-title">{{ account.account }}</div>
                </template>
                <div class="m-role-list">
                    <div
                        class="m-role-item"
                        v-for="(role, i) in account.roles"
                        :key="i"
                        @click="onOpenDetail(role.id!)"
                    >
                        <img class="u-school-icon" :src="schoolIconLink(role.schoolId!)" alt="" />
                        <span class="u-role-name">{{ role.name }}</span>
                        <span class="u-role-server">{{ role.server }}</span>
                    </div>
                </div>
            </n-card>
        </div>
        <n-empty class="m-empty" v-else description="没找到符合条件的角色，请点击右上角新建角色~" />
    </div>
    <role-create-dialog ref="createDialog" />
    <role-detail-dialog ref="detailDialog" />
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { chain } from "lodash";
import RoleCreateDialog from "../components/role/RoleCreateDialog.vue";
import RoleDetailDialog from "../components/role/RoleDetailDialog.vue";
import { useRoleStore } from "../store/role";
import { getSearchKey } from "../utils/search";
import { getSchoolName, schoolIconLink } from "../utils/game";

const createDialog = ref<InstanceType<typeof RoleCreateDialog> | null>(null);
const onCreateRole = () => {
    if (!createDialog.value) return;
    createDialog.value.open();
};

const detailDialog = ref<InstanceType<typeof RoleDetailDialog> | null>(null);
const onOpenDetail = (id: string) => {
    if (!detailDialog.value) return;
    detailDialog.value.open(id);
};

const search = ref<string>("");
const roleList = computed(() => {
    return chain(useRoleStore().roles)
        .map((role) => ({
            ...role,
            searchKey:
                getSearchKey(role.name) + getSearchKey(role.server) + getSearchKey(getSchoolName(role.schoolId!)),
        }))
        .filter((role) => {
            if (!search.value) return true;
            return role.searchKey.toLowerCase().includes(search.value.toLowerCase());
        })
        .groupBy((role) => role.account)
        .map((roles, account) => ({
            account,
            roles,
        }))
        .value();
});
</script>

<style lang="less" scoped>
.p-role {
    display: flex;
    flex-direction: column;
    height: 100%;
    gap: 16px;

    .m-toolbar {
        display: flex;
        align-items: center;
        position: sticky;
        top: 0;
    }

    .m-empty {
        .flex-center;
        flex-grow: 1;
        flex-direction: column;
        padding-bottom: 100px;
    }

    .m-account-list {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;

        overflow-y: auto;
        .scrollbar();
    }

    .m-account-item {
        width: 300px;
    }

    .m-role-list {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .m-role-item {
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 0 4px;
        border-radius: 4px;
        transition: all 0.15s ease;
        &:hover {
            background-color: --n-color-fill-1;
        }

        .u-school-icon {
            width: 32px;
            height: 32px;
        }

        .u-role-name {
            flex-grow: 1;
        }

        .u-role-server {
            color: #999;
            font-size: 0.8rem;
        }
    }
}
</style>
