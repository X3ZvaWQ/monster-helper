<template>
    <n-modal
        v-model:show="visible"
        :title="formData.key ? '编辑自定义列' : '新增自定义列'"
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
                    <n-radio-button value="string" label="文本" />
                </n-radio-group>
            </n-form-item>
            <n-form-item label="随CD重置">
                <n-switch v-model:value="formData.refresh" />
            </n-form-item>
            <n-form-item label="初始值">
                <n-input-number v-if="formData.valueType === 'number'" v-model:value.number="numberDefault" />
                <n-checkbox v-else-if="formData.valueType === 'boolean'" v-model:checked="booleanDefault" />
                <n-input v-else-if="formData.valueType === 'string'" v-model:value="stringDefault" />
            </n-form-item>
        </n-form>
    </n-modal>
</template>

<script setup lang="ts">
import { useMessage } from "naive-ui";
import { normalizeCustomValue, normalizeCustomValueType } from "@/utils/stat-custom";
const message = useMessage();

interface CustomStatForm {
    key: string | null;
    label: string;
    valueType: CustomStatValueType | "text";
    refresh: boolean;
    default: CustomStatValue;
}

const visible = ref(false);

const onConfirm = () => {
    if (!formData.value.label) {
        message.error("请输入列名");
        return false;
    }
    const valueType = normalizeCustomValueType(formData.value.valueType);
    callback.value?.resolve({
        ...formData.value,
        valueType,
        default: normalizeCustomValue(formData.value.default, valueType),
    });
    visible.value = false;
};
const onCancel = () => {
    callback.value?.reject("cancel");
};

const callback = ref<{
    resolve: (value: CustomStatForm) => void;
    reject: (reason?: any) => void;
} | null>(null);
const open = (payload?: Partial<CustomStatForm>) => {
    visible.value = true;
    suppressDefaultReset.value = true;
    formData.value = {
        ...defaultForm,
        ...(payload || {}),
    };
    if (formData.value.valueType === "text") {
        formData.value.valueType = "string";
    }
    nextTick(() => {
        suppressDefaultReset.value = false;
    });
    return new Promise<CustomStatForm>((resolve, reject) => {
        callback.value = { resolve, reject };
    });
};

const defaultForm: CustomStatForm = {
    key: null,
    label: "",
    valueType: "boolean",
    refresh: false,
    default: false,
};
const formData = ref({ ...defaultForm });
const suppressDefaultReset = ref(false);
const numberDefault = computed({
    get: () => (typeof formData.value.default === "number" ? formData.value.default : 0),
    set: (value: number | null) => {
        formData.value.default = value ?? 0;
    },
});
const booleanDefault = computed({
    get: () => Boolean(formData.value.default),
    set: (value: boolean) => {
        formData.value.default = value;
    },
});
const stringDefault = computed({
    get: () => String(formData.value.default ?? ""),
    set: (value: string) => {
        formData.value.default = value;
    },
});
watch(
    () => formData.value.valueType,
    (type) => {
        if (suppressDefaultReset.value) return;
        if (type === "boolean") {
            formData.value.default = false;
        } else if (type === "number") {
            formData.value.default = 0;
        } else if (type === "string") {
            formData.value.default = "";
        }
    }
);

defineExpose({
    open,
});
</script>

<style lang="less" scoped></style>
