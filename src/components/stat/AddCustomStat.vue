<template>
    <n-modal
        v-model:show="visible"
        :title="formData.key ? '编辑自定义统计列' : '新增自定义统计列'"
        preset="dialog"
        positive-text="确定"
        negative-text="取消"
        :closable="true"
        :show-icon="false"
        @negative-click="onCancel"
        @positive-click="onConfirm()"
    >
        <n-form ref="form" :model="formData" label-placement="left" label-width="auto">
            <n-form-item label="识别名" v-if="formData.key">
                <n-input :value="formData.key" disabled />
            </n-form-item>
            <n-form-item label="名称">
                <n-input v-model:value="formData.label" placeholder="输入列名" />
            </n-form-item>
            <n-form-item label="类型">
                <n-radio-group v-model:value="formData.valueType">
                    <n-radio-button value="boolean" label="是/否" />
                    <n-radio-button value="number" label="数字" />
                    <n-radio-button value="text" label="文本" />
                </n-radio-group>
            </n-form-item>
            <n-form-item label="随CD重置">
                <n-switch v-model:value="formData.refresh" />
            </n-form-item>
            <n-form-item label="初始值">
                <n-input-number v-if="formData.valueType === 'number'" v-model:value.number="formData.default" />
                <n-checkbox v-else-if="formData.valueType === 'boolean'" v-model:checked="formData.default" />
                <n-input v-else-if="formData.valueType === 'text'" v-model:value="formData.default" />
            </n-form-item>
        </n-form>
    </n-modal>
</template>

<script setup lang="ts">
import { useMessage } from "naive-ui";
const message = useMessage();

const visible = ref(false);

const onConfirm = () => {
    if (!formData.value.label) {
        message.error("请输入列名");
        return false;
    }
    callback.value?.resolve(formData.value);
    visible.value = false;
};
const onCancel = () => {
    callback.value?.reject("cancel");
};

const callback = ref<{
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
} | null>(null);
const open = (payload?: any) => {
    visible.value = true;
    formData.value = {
        ...defaultForm,
        ...(payload || {}),
    };
    return new Promise((resolve, reject) => {
        callback.value = { resolve, reject };
    });
};

const defaultForm = {
    key: null,
    label: "",
    valueType: "boolean",
    refresh: false,
    default: null as any,
};
const formData = ref({ ...defaultForm });
watch(
    () => formData.value.valueType,
    (type) => {
        if (type === "boolean") {
            formData.value.default = false;
        } else if (type === "number") {
            formData.value.default = 0;
        } else if (type === "text") {
            formData.value.default = "";
        }
    }
);

defineExpose({
    open,
});
</script>

<style lang="less" scoped></style>
