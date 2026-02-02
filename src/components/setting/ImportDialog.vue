<template>
    <n-modal
        v-model:show="visible"
        title="导入数据"
        preset="dialog"
        :closable="true"
        :show-icon="false"
        @positive-click="onConfirm"
        @negative-click="visible = false"
    >
        <n-flex vertical :size="10">
            <n-text>导入数据文件</n-text>
            <file-select @select-file="onSelectFile" type="file"></file-select>
            <n-text>或者直接粘贴内容</n-text>
            <n-input
                v-model:value="inputValue"
                type="textarea"
                size="small"
                :autosize="{
                    minRows: 3,
                    maxRows: 6,
                }"
            />
            <n-text>导入内容</n-text>
            <template v-if="parsed">
                <n-flex v-if="parsed.roles" :align="'center'">
                    <n-text>角色数据</n-text>
                    <n-radio-group v-model:value="importItems.roles" name="role" size="small">
                        <n-radio-button value="ignore" label="忽视" />
                        <n-radio-button value="override" label="覆盖" />
                        <n-radio-button value="merge" label="合并" />
                    </n-radio-group>
                    <n-radio-group
                        v-if="importItems.roles === 'merge'"
                        v-model:value="roleMergeType"
                        name="role"
                        size="small"
                    >
                        <n-radio-button value="old" label="旧的优先" />
                        <n-radio-button value="new" label="新的优先" />
                    </n-radio-group>
                </n-flex>
                <n-flex v-if="parsed.settings" :align="'center'">
                    <n-text>设置数据</n-text>
                    <n-radio-group v-model:value="importItems.settings" name="role" size="small">
                        <n-radio-button value="ignore" label="忽视" />
                        <n-radio-button value="override" label="覆盖" />
                    </n-radio-group>
                </n-flex>
            </template>
            <n-empty v-else description="没有从输入中解析到可用数据~"> </n-empty>
        </n-flex>
        <template #action>
            <n-flex justify="end">
                <n-button @click="onCancel">取消</n-button>
                <n-button :disabled="!parsed" @click="onConfirm" type="primary">确认导入</n-button>
            </n-flex>
        </template>
    </n-modal>
</template>

<script setup lang="ts">
import { useSettingStore } from "@/store/setting";
import { useRoleStore } from "@/store/role";
import { decompressFromBase64 } from "lz-string";
import { useMessage } from "naive-ui";
import FileSelect from "@/components/common/FileSelect.vue";
const message = useMessage();
const inputValue = ref("");

const importItems = ref<Record<string, "override" | "ignore" | "merge">>({
    roles: "override",
    settings: "override",
});
const roleMergeType = ref<"old" | "new">("new");

const parsed = computed(() => {
    try {
        return JSON.parse(decompressFromBase64(inputValue.value));
    } catch (e) {
        return null;
    }
});
const onSelectFile = (file?: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        inputValue.value = reader.result as string;
    };
    reader.readAsText(file);
};

const visible = ref(false);
const onCancel = () => {
    visible.value = false;
};
const onConfirm = () => {
    if (!parsed.value) return;
    if (parsed.value.roles) {
        if (importItems.value.roles === "override") {
            useRoleStore().$patch(parsed.value.roles);
        } else if (importItems.value.roles === "merge") {
            // 合并模式，账号顺序直接覆盖
            if (parsed.value.roles.accountOrder) {
                useRoleStore().accountOrder = parsed.value.roles.accountOrder;
            }
            // 角色合并，id相同 或者 account+server+name 都相同，认为是重复的
            for (const role of parsed.value.roles.roles) {
                const existRole = useRoleStore().roles.find(
                    (r) =>
                        r.id === role.id ||
                        (r.account === role.account && r.server === role.server && r.name === role.name)
                );
                if (existRole) {
                    if (roleMergeType.value === "new") {
                        useRoleStore().updateRole(role.id, role);
                    }
                } else {
                    useRoleStore().roles.push(role);
                }
            }
        }
    }
    if (parsed.value.settings && importItems.value.settings === "override") {
        useSettingStore().$patch(parsed.value.settings);
    }
    message.success("数据导入成功");
    visible.value = false;
};
const open = () => {
    visible.value = true;
};
defineExpose({
    open,
});
</script>

<style lang="less" scoped></style>
