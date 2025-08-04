<template>
    <n-modal
        v-model:show="visible"
        title="更新角色仓库"
        preset="dialog"
        positive-text="确认"
        :negative-text="status === 'success' ? '重试' : '取消'"
        class="m-book-parse-dialog"
        :positive-button-props="{ disabled: !canOk }"
        @positive-click="onOk"
        :on-negative-click="onCancel"
        :show-icon="false"
    >
        <div class="m-book-parse">
            <file-select v-if="!file" @select-file="file = $event">
                <template #default>
                    <n-text>选择或粘贴物品获得截图</n-text>
                </template>
            </file-select>
            <div class="m-parse-result">
                <div class="m-parse-log" v-if="status === 'processing'">
                    <div class="u-loading"></div>
                    <p class="m-parse-log-item" v-for="(log, index) in logs" :key="index">
                        {{ log }}
                    </p>
                </div>
                <book-list v-if="status === 'success'" :books="parseBooks" class="m-parse-books"></book-list>
            </div>
        </div>
    </n-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useMessage } from "naive-ui";
import { useGameStore } from "@/store/game";
import FileSelect from "../common/FileSelect.vue";
import { useOcrService } from "@/utils/use/ocr";

const message = useMessage();
const visible = ref(false);
const status = ref<"idle" | "processing" | "success" | "error">("idle");
const parseBooks = ref<RoleSkill[]>([]);
const file = ref<File | null>(null);

watch(
    () => file.value,
    async () => {
        if (!file.value) return;
        if (!file.value.type.startsWith("image/")) {
            message.error("只支持处理图片文件哦~");
            file.value = null;
            return;
        }
        const bitmap = await createImageBitmap(file.value);
        status.value = "processing";
        const { recognize } = await useOcrService();
        const charWhiteList = useGameStore().getBooksCharWhiteList();
        recognize(
            "skill",
            bitmap,
            {
                charWhiteList,
            },
            (_, data) => {
                const { error, msg, result } = data;
                if (error) {
                    logs.value.push(`错误: ${error}，请重新尝试`);
                    file.value = null;
                }
                if (msg) {
                    logs.value.push(msg);
                }
                if (result) {
                    status.value = "success";
                    parseBooks.value = useGameStore().getBooksFromOcrResult(result);
                }
            }
        );
    }
);

const logs = ref<string[]>(["正在驯养上品的好鸽子~"]);
const canOk = computed(() => {
    if (parseBooks.value.length === 0) return false;
    return true;
});
const callback = ref<[(value: any) => void, (reason?: any) => void] | null>(null);
const reset = () => {
    status.value = "idle";
    logs.value = ["正在驯养上品的好鸽子~"];
    parseBooks.value = [];
    file.value = null;
};
const open = () => {
    reset();
    visible.value = true;
    return new Promise<RoleSkill[]>((resolve, reject) => {
        callback.value = [resolve, reject];
    });
};
const onOk = () => {
    callback.value![0](parseBooks.value);
    visible.value = false;
};
const onCancel = () => {
    if (status.value === "success") {
        reset();
        return;
    }
    callback.value![1]("cancel");
    visible.value = false;
};

defineExpose({
    open,
});
</script>

<style lang="less" scoped>
.m-book-parse-dialog {
    .m-book-parse {
        padding-top: 16px;
        display: flex;
        flex-direction: column;
        gap: 10px;
    }
    .m-parse-log {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;

        .u-loading {
            position: relative;
            width: 30px;
            height: 30px;
            border: 2px solid #000;
            border-top-color: rgba(0, 0, 0, 0.2);
            border-right-color: rgba(0, 0, 0, 0.2);
            border-bottom-color: rgba(0, 0, 0, 0.2);
            border-radius: 100%;

            animation: circle infinite 0.75s linear;

            @keyframes circle {
                0% {
                    transform: rotate(0);
                }
                100% {
                    transform: rotate(360deg);
                }
            }
        }

        .m-parse-log-item {
            margin: 0;
        }
    }
    .m-parse-books {
        max-height: 400px;
    }
}
</style>
