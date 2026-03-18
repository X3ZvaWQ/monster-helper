import * as ort from "onnxruntime-web"; // Use onnxruntime-web for browser compatibility
import det_onnx_url from "@/assets/onnx/PP-OCRv5_mobile_det_infer.onnx?url";
import rec_onnx_url from "@/assets/onnx/PP-OCRv5_mobile_rec_infer.onnx?url";
import ppocr_dict_url from "@/assets/onnx/ppocrv5_dict.txt?url";
import { PaddleOcrService, type PaddleOcrProgressEvent, type RecognitionResult } from "paddleocr";
import { preprocessBitmapForOcr } from "@/utils/ocr-preprocess";

let paddleOcrService: PaddleOcrService;

const normalizeRecognitionResult = (item: RecognitionResult): OcrResultItem => ({
    text: item.text,
    confidence: item.confidence,
    box: [item.box.x, item.box.y, item.box.width, item.box.height],
});

const toProgressSnapshot = (event: PaddleOcrProgressEvent): OcrProgressSnapshot => {
    if (event.type === "det") {
        return {
            phase: "det",
            stage: event.stage,
            current: event.progress.current,
            total: event.progress.total,
            remain: event.progress.remain,
            detectedCount: event.detectedCount,
        };
    }

    return {
        phase: "rec",
        stage: event.stage,
        current: event.progress.current,
        total: event.progress.total,
        remain: event.progress.remain,
        latestItem: event.result ? normalizeRecognitionResult(event.result) : undefined,
    };
};

const postProgress = (id: string, type: string, progress: OcrProgressSnapshot) => {
    postMessage({
        id,
        type,
        data: {
            progress,
        } satisfies OcrWorkerData,
    });
};

// biome-ignore lint/suspicious/noGlobalAssign: worker就是这么写的
onmessage = async (event) => {
    const { data } = event;
    const { type, id } = data;
    if (type === "init") {
        // 初始化OCR服务
        try {
            console.time("OCR服务初始化");
            const det_onnx_buffer = await fetch(det_onnx_url).then((res) => res.arrayBuffer());
            const rec_onnx_buffer = await fetch(rec_onnx_url).then((res) => res.arrayBuffer());
            const ppocr_dict_string = await fetch(ppocr_dict_url)
                .then((res) => res.text())
                .then((text) => text.split("\n").map((char) => char.trim()));
            paddleOcrService = await PaddleOcrService.createInstance({
                ort: ort,
                detection: {
                    modelBuffer: det_onnx_buffer,
                },
                recognition: {
                    modelBuffer: rec_onnx_buffer,
                    charactersDictionary: ppocr_dict_string,
                },
            });
            postMessage({ type: "init", data: { result: "success" } });
            console.timeEnd("OCR服务初始化");
        } catch (e) {
            postMessage({ type: "init", data: { error: e } });
        }
    } else if (data.type === "skill") {
        console.time(`OCR服务识别技能图片-${id}`);
        try {
            const { bitmap, options } = data as OcrInput;
            postMessage({ id, type: "skill", data: { msg: "图片读取成功~" } satisfies OcrWorkerData });
            postProgress(id, type, {
                phase: "preprocess",
                stage: "start",
                current: 0,
                total: 1,
                remain: 1,
            });
            const preprocessProfile = options?.preprocessProfile ?? "skillPanel";
            const preprocessed = await preprocessBitmapForOcr(bitmap, preprocessProfile, options?.debugStages);
            postMessage({ id, type: "skill", data: { msg: "图片预处理完毕~" } satisfies OcrWorkerData });
            postProgress(id, type, {
                phase: "preprocess",
                stage: "complete",
                current: 1,
                total: 1,
                remain: 0,
            });

            if (preprocessed.debugStages.length) {
                postMessage({
                    id,
                    type: "skill",
                    data: {
                        debugStages: preprocessed.debugStages,
                    } satisfies OcrWorkerData,
                });
            }

            postMessage({ id, type: "skill", data: { msg: "OCR处理中~" } satisfies OcrWorkerData });
            const ocrResult = await paddleOcrService.recognize(
                {
                    width: preprocessed.imageData.width,
                    height: preprocessed.imageData.height,
                    data: new Uint8Array(
                        preprocessed.imageData.data.buffer,
                        preprocessed.imageData.data.byteOffset,
                        preprocessed.imageData.data.byteLength
                    ),
                },
                {
                    detection: {
                        minimumAreaThreshold: 40,
                    },
                    charWhiteList: options?.charWhiteList,
                    onProgress: (progressEvent) => {
                        postProgress(id, type, toProgressSnapshot(progressEvent));
                    },
                }
            );
            const normalizedResult: OcrResultItem[] = ocrResult.map(normalizeRecognitionResult);
            postMessage({ id, type: "skill", data: { msg: "OCR结果已返回" } satisfies OcrWorkerData });
            postMessage({ id, type: "skill", data: { result: normalizedResult } satisfies OcrWorkerData });
        } catch (error) {
            postMessage({ id, type: "skill", data: { error } satisfies OcrWorkerData });
        } finally {
            console.timeEnd(`OCR服务识别技能图片-${id}`);
        }
    }
};
