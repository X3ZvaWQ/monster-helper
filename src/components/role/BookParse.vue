<template>
    <n-modal
        v-model:show="visible"
        preset="dialog"
        positive-text="确认"
        :negative-text="status === 'success' ? '重试' : '取消'"
        class="m-book-parse-dialog"
        :positive-button-props="{ disabled: !canOk }"
        @positive-click="onOk"
        :on-negative-click="onCancel"
        :show-icon="false"
    >
        <template #header>
            <n-flex class="m-dialog-header" justify="space-between" align="center" :wrap="false">
                <span class="m-dialog-title">更新角色仓库</span>
                <n-flex align="center" :size="8" :wrap="false">
                    <span class="m-dialog-debug-label">调试</span>
                    <n-switch v-model:value="debugEnabled" size="small" />
                </n-flex>
            </n-flex>
        </template>
        <div class="m-book-parse">
            <file-select v-if="!file" @select-file="file = $event">
                <template #default>
                    <n-text>选择或粘贴截图</n-text>
                </template>
            </file-select>
            <div class="m-parse-result">
                <div class="m-parse-log" v-if="status === 'processing'">
                    <div class="u-loading"></div>
                    <p class="m-parse-log-item" v-for="(log, index) in progressSummaryLines" :key="index">
                        {{ log }}
                    </p>
                </div>
                <book-list v-if="status === 'success'" :books="parseBooks" class="m-parse-books"></book-list>
            </div>
        </div>
    </n-modal>
    <ocr-debug-preview
        v-model:show="previewVisible"
        title="仓库 OCR 调试预览"
        :stages="previewStages"
        :ocr-result="previewOcrResult"
        :progress-state="previewProgressState"
    />
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useMessage } from "naive-ui";
import { useGameStore } from "@/store/game";
import FileSelect from "../common/FileSelect.vue";
import OcrDebugPreview from "../common/OcrDebugPreview.vue";
import { useOcrService } from "@/utils/use/ocr";
import { useOcrDebug } from "@/utils/use/ocr-debug";
import {
    createOcrProgressState,
    getOcrProgressSummaryLines,
    mergeOcrProgressSnapshot,
} from "@/utils/ocr-progress";

const message = useMessage();
const visible = ref(false);
const status = ref<"idle" | "processing" | "success" | "error">("idle");
const parseBooks = ref<RoleSkill[]>([]);
const file = ref<File | null>(null);
const progressState = ref<OcrProgressState>(createOcrProgressState());
const {
    debugEnabled,
    previewVisible,
    previewStages,
    previewOcrResult,
    previewProgressState,
    receiveStages,
    receiveOcrResult,
    receiveProgressState,
    openPreviewIfAvailable,
    resetDebugState,
} = useOcrDebug();

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
        progressState.value = createOcrProgressState();
        const { recognize } = await useOcrService();
        const charWhiteList = useGameStore().getBooksCharWhiteList();
        recognize(
            "skill",
            bitmap,
            {
                charWhiteList,
                preprocessProfile: "bookLog",
                debugStages: debugEnabled.value,
            },
            (_, data) => {
                const { error, result, debugStages, progress } = data as OcrWorkerData;
                receiveStages(debugStages);
                if (progress) {
                    progressState.value = mergeOcrProgressSnapshot(progressState.value, progress);
                    receiveProgressState(progressState.value);
                }
                if (error) {
                    status.value = "idle";
                    message.error("OCR 识别失败，请重新尝试");
                    openPreviewIfAvailable();
                    file.value = null;
                }
                if (result) {
                    receiveOcrResult(result);
                    status.value = "success";
                    parseBooks.value = useGameStore().getBooksFromOcrResult(result);
                    openPreviewIfAvailable();
                }
            }
        );
    }
);

const progressSummaryLines = computed(() => {
    return getOcrProgressSummaryLines(progressState.value);
});
const canOk = computed(() => {
    if (parseBooks.value.length === 0) return false;
    return true;
});
const callback = ref<[(value: any) => void, (reason?: any) => void] | null>(null);
const reset = () => {
    status.value = "idle";
    progressState.value = createOcrProgressState();
    parseBooks.value = [];
    file.value = null;
    resetDebugState();
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
    .m-dialog-header {
        width: 100%;
        min-height: 24px;
    }

    .m-dialog-title {
        font-size: 16px;
        font-weight: 500;
        line-height: 1.4;
        color: var(--n-title-text-color);
    }

    .m-dialog-debug-label {
        font-size: 12px;
        font-weight: 400;
        line-height: 1;
        color: var(--n-text-color);
        opacity: 0.68;
    }

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
            border: 2px solid var(--n-border-color);
            border-left-color: var(--n-text-color);
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
            max-width: 100%;
            line-height: 1.5;
        }
    }
    .m-parse-books {
        max-height: 400px;
    }
}
</style>
