<template>
    <n-flex v-bind="$attrs" :align="'center'">
        <slot :value="value">
            <n-text>{{ value }}</n-text>
        </slot>
        <n-popover ref="popoverRef" trigger="click" @update:show="onShowChange">
            <template #trigger>
                <n-button text type="primary">
                    <template #icon>
                        <i-material-symbols:edit-rounded />
                    </template>
                </n-button>
            </template>
            <n-input-group>
                <n-input-number
                    v-if="type === 'number'"
                    v-bind="$attrs"
                    ref="inputRef"
                    @keyup.enter="onEdit"
                    v-model:value="inputValue"
                />
                <n-input
                    v-if="type === 'string'"
                    v-bind="$attrs"
                    ref="inputRef"
                    @keyup.enter="onEdit"
                    v-model:value="inputValue"
                />
                <n-button type="primary" ghost @click="onEdit"> 更新 </n-button>
            </n-input-group>
        </n-popover>
    </n-flex>
</template>

<script setup lang="ts">
import type { InputInst, NPopover } from "naive-ui";

// 传入类型与当前值
const props = withDefaults(
    defineProps<{
        value: any;
        type?: "number" | "string";
    }>(),
    {
        type: "string",
    }
);
// 更新事件
const emits = defineEmits<{
    (e: "update:value", value: any): void;
}>();
const inputValue = ref<any>(null);

watch(
    () => props.value,
    (newValue) => {
        inputValue.value = newValue;
    },
    { immediate: true }
);

const inputRef = ref<InputInst | null>(null);
const onShowChange = (value: boolean) => {
    if (value) {
        nextTick(() => {
            inputRef.value?.focus();
        });
    }
};
const popoverRef = ref<InstanceType<typeof NPopover> | null>(null);
const onEdit = () => {
    emits("update:value", inputValue);
    popoverRef.value?.setShow(false);
};
</script>

<style lang="less" scoped></style>
