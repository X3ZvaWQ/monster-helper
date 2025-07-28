<template>
    <n-select
        v-bind="$attrs"
        v-model:value="value"
        filterable
        :options="roleOptions"
        :filter="filter"
        :render-label="renderLabel"
        :render-tag="renderTag"
    >
    </n-select>
</template>

<script setup lang="ts">
import { useRoleStore } from "@/store/role";
import { getSchoolName, iconLink } from "@/utils/game";
import { getSearchKey, matchSearch } from "@/utils/search";
import { SelectOption } from "naive-ui";

const value = defineModel<string>("value", {
    required: true,
});

// 角色选项
const roleOptions = computed(() => {
    const roles = useRoleStore().roles;
    return roles
        .map((role) => ({
            label: role.name,
            value: role.id,
            cd: role.cd,
            schoolId: role.schoolId!,
            account: role.account,
            server: role.server,
            searchKey: getSearchKey(role.name, role.account, role.server, getSchoolName(role.schoolId!)),
            class: "m-role-select-option",
        }))
        .sort((a, b) => {
            return (
                a.account.localeCompare(b.account) || a.server.localeCompare(b.server) || a.label.localeCompare(b.label)
            );
        });
});
// 筛选函数
const filter = (pattern: string, option: any) => {
    if (!pattern) return true;
    return matchSearch(pattern, option.searchKey);
};
// 选项渲染函数
const renderLabel = (option: SelectOption) => {
    return h(
        resolveComponent("n-flex"),
        { vertical: true, size: 2 },
        {
            default: () => [
                h(
                    resolveComponent("n-flex"),
                    { align: "center", size: 2 },
                    {
                        default: () => [
                            h(resolveComponent("n-image"), {
                                style: { width: "20px", height: "20px", flexShrink: 0 },
                                src: iconLink(option.schoolId as number, "school"),
                                previewDisabled: true,
                            }),
                            h(resolveComponent("n-text"), null, { default: () => option.label }),
                        ],
                    }
                ),
                h(
                    resolveComponent("n-flex"),
                    { align: "center", size: 4, justify: "space-between", style: { fontSize: "0.6rem", width: "100%" } },
                    {
                        default: () => [
                            h(resolveComponent("n-text"), { depth: 3 }, { default: () => option.account }),
                            h(resolveComponent("n-text"), { depth: 3 }, { default: () => option.server }),
                        ],
                    }
                ),
            ],
        }
    );
};
const renderTag = ({ option }: { option: SelectOption }) => {
    return h(
        resolveComponent("n-flex"),
        { align: "center", size: 2 },
        {
            default: () => [
                h(resolveComponent("n-image"), {
                    style: { width: "20px", height: "20px", flexShrink: 0 },
                    src: iconLink(option.schoolId as number, "school"),
                    previewDisabled: true,
                }),
                h(resolveComponent("n-text"), null, { default: () => option.label }),
            ],
        }
    );
};
</script>

<style lang="less">
.m-role-select-option .n-base-select-option__content {
    width: 100%;
}
</style>
