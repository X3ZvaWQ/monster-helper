export const createOcrProgressState = (): OcrProgressState => {
    return {};
};

export const mergeOcrProgressSnapshot = (
    state: OcrProgressState,
    snapshot: OcrProgressSnapshot
): OcrProgressState => {
    const next: OcrProgressState = {
        preprocess: state.preprocess,
        detection: state.detection,
        recognition: state.recognition,
        detectedCount: state.detectedCount,
        latestText: state.latestText,
    };

    if (snapshot.phase === "preprocess") {
        next.preprocess = snapshot;
        return next;
    }

    if (snapshot.phase === "det") {
        next.detection = snapshot;
        if (typeof snapshot.detectedCount === "number") {
            next.detectedCount = snapshot.detectedCount;
        }
        return next;
    }

    next.recognition = snapshot;

    if (typeof next.detectedCount !== "number") {
        next.detectedCount = snapshot.total;
    }

    const latestText = snapshot.latestItem?.text?.trim();
    if (latestText) {
        next.latestText = latestText;
    } else if (snapshot.stage === "complete" && snapshot.total === 0) {
        next.latestText = "未检测到文本框";
    }

    return next;
};

export const getOcrProgressSummaryLines = (state: OcrProgressState): string[] => {
    return [
        getPreprocessLine(state.preprocess),
        getDetectionLine(state),
        getRecognitionLine(state.recognition),
        getCurrentTextLine(state),
    ];
};

const getPreprocessLine = (snapshot?: OcrProgressSnapshot) => {
    if (!snapshot) {
        return "图片预处理已跳过";
    }

    if (snapshot?.stage === "complete") {
        return "图片预处理完毕";
    }
    return "图片预处理中";
};

const getDetectionLine = (state: OcrProgressState) => {
    const current = state.detection?.current ?? 0;
    const total = state.detection?.total ?? 3;
    const detectedCount = state.detectedCount ?? 0;

    return `文本检测 ${current}/${total}，已识别到 ${detectedCount} 个文本框`;
};

const getRecognitionLine = (snapshot?: OcrProgressSnapshot) => {
    const current = snapshot?.current ?? 0;
    const total = snapshot?.total ?? 0;

    return `OCR 识别 ${current}/${total}`;
};

const getCurrentTextLine = (state: OcrProgressState) => {
    if (state.latestText?.trim()) {
        return `当前文本：${truncateText(state.latestText, 24)}`;
    }

    if (state.recognition?.stage === "complete" && state.recognition.total === 0) {
        return "当前文本：未检测到文本框";
    }

    return "当前文本：等待识别";
};

const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) {
        return text;
    }
    return `${text.slice(0, maxLength)}…`;
};
