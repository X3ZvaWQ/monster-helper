interface ResponsePagedData<T = any> {
    code: number;
    msg: string;
    data: {
        list: T[];
        total: number;
    };
}

interface ResponseData<T = any> {
    code: number;
    msg: string;
    data: T[];
}

interface OcrResultItem {
    text: string;
    confidence: number;
    box: number[];
}

type OcrProgressPhase = "preprocess" | "det" | "rec";

interface OcrProgressSnapshot {
    phase: OcrProgressPhase;
    stage: string;
    current: number;
    total: number;
    remain: number;
    detectedCount?: number;
    latestItem?: OcrResultItem;
}

interface OcrProgressState {
    preprocess?: OcrProgressSnapshot;
    detection?: OcrProgressSnapshot;
    recognition?: OcrProgressSnapshot;
    detectedCount?: number;
    latestText?: string;
}

interface OcrDebugTransform {
    offsetX: number;
    offsetY: number;
    sourceWidth: number;
    sourceHeight: number;
}

type OcrPreprocessProfile = "skillPanel" | "bookLog";

interface OcrDebugStage {
    label: string;
    dataUrl: string;
    width: number;
    height: number;
    meta?: Record<string, number>;
    transform?: OcrDebugTransform;
}

interface OcrInput {
    id: string;
    type: "skill" | "item";
    bitmap: ImageBitmap;
    options?: OcrInputOptions;
}

interface OcrInputOptions {
    charWhiteList?: string[];
    preprocessProfile?: OcrPreprocessProfile;
    debugStages?: boolean;
}

interface OcrWorkerData {
    error?: unknown;
    msg?: string;
    result?: OcrResultItem[];
    debugStages?: OcrDebugStage[];
    progress?: OcrProgressSnapshot;
}
