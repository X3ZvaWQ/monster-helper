import { ref, watch } from "vue";
import { createOcrProgressState } from "@/utils/ocr-progress";

const OCR_DEBUG_STORAGE_KEY = "ocr-debug";

const readDebugEnabled = () => {
    if (typeof localStorage === "undefined") {
        return false;
    }
    return localStorage.getItem(OCR_DEBUG_STORAGE_KEY) === "1";
};

const writeDebugEnabled = (enabled: boolean) => {
    if (typeof localStorage === "undefined") {
        return;
    }
    localStorage.setItem(OCR_DEBUG_STORAGE_KEY, enabled ? "1" : "0");
};

export const useOcrDebug = () => {
    const debugEnabled = ref(readDebugEnabled());
    const previewVisible = ref(false);
    const previewStages = ref<OcrDebugStage[]>([]);
    const previewOcrResult = ref<OcrResultItem[]>([]);
    const previewProgressState = ref<OcrProgressState>(createOcrProgressState());
    const pendingStages = ref<OcrDebugStage[]>([]);
    const pendingOcrResult = ref<OcrResultItem[]>([]);
    const pendingProgressState = ref<OcrProgressState>(createOcrProgressState());

    watch(debugEnabled, (enabled) => {
        writeDebugEnabled(enabled);
        if (!enabled) {
            pendingStages.value = [];
            pendingOcrResult.value = [];
            pendingProgressState.value = createOcrProgressState();
            previewStages.value = [];
            previewOcrResult.value = [];
            previewProgressState.value = createOcrProgressState();
            previewVisible.value = false;
        }
    });

    const receiveStages = (stages?: OcrDebugStage[]) => {
        if (!stages?.length) {
            return;
        }
        pendingStages.value = stages;
    };

    const receiveOcrResult = (result?: OcrResultItem[]) => {
        if (!result?.length) {
            return;
        }
        pendingOcrResult.value = result;
    };

    const receiveProgressState = (state?: OcrProgressState) => {
        if (!state) {
            return;
        }
        pendingProgressState.value = state;
    };

    const openPreviewIfAvailable = () => {
        if (
            !debugEnabled.value ||
            (
                !pendingStages.value.length &&
                !pendingOcrResult.value.length &&
                !pendingProgressState.value.preprocess &&
                !pendingProgressState.value.detection &&
                !pendingProgressState.value.recognition
            )
        ) {
            return;
        }
        previewStages.value = pendingStages.value;
        previewOcrResult.value = pendingOcrResult.value;
        previewProgressState.value = pendingProgressState.value;
        previewVisible.value = true;
        pendingStages.value = [];
        pendingOcrResult.value = [];
        pendingProgressState.value = createOcrProgressState();
    };

    const resetDebugState = () => {
        previewVisible.value = false;
        previewStages.value = [];
        previewOcrResult.value = [];
        previewProgressState.value = createOcrProgressState();
        pendingStages.value = [];
        pendingOcrResult.value = [];
        pendingProgressState.value = createOcrProgressState();
    };

    return {
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
    };
};
