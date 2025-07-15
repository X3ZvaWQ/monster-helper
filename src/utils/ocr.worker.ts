import * as ort from "onnxruntime-web"; // Use onnxruntime-web for browser compatibility
import det_onnx_url from "@/assets/onnx/PP-OCRv5_mobile_det_infer.onnx?url";
import rec_onnx_url from "@/assets/onnx/PP-OCRv5_mobile_rec_infer.onnx?url";
import ppocr_dict_url from "@/assets/onnx/ppocrv5_dict.txt?url";
import { PaddleOcrService } from "paddleocr";

let paddleOcrService: PaddleOcrService;

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
                .then((text) => text.split("\n"));
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
        console.time("OCR服务识别技能图片");
        const { bitmap, options } = data as OcrInput;
        postMessage({ id, type: "skill", data: { msg: "图片读取成功~" } });
        // 在上下左右添加20px的空白边框
        const padding = 20;
        const { width, height } = bitmap;
        const canvas = new OffscreenCanvas(width + padding * 2, height + padding * 2);
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = "#000"; // 白色背景
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(bitmap, padding, padding);
        const imageData = ctx!.getImageData(0, 0, canvas.width, canvas.height);
        const rgbaData = imageData.data;
        // for (let i = 0; i < rgbaData.length; i += 4) {
        //     const r = rgbaData[i];
        //     const g = rgbaData[i + 1];
        //     const b = rgbaData[i + 2];
        //     if (skillColors.some((color) => isColorMatch([r, g, b], color))) {
        //         rgbaData[i] = rgbaData[i + 1] = rgbaData[i + 2] = 0;
        //     } else {
        //         rgbaData[i] = rgbaData[i + 1] = rgbaData[i + 2] = 255;
        //     }
        // }
        // ctx.putImageData(imageData, 0, 0);
        // debug
        // {
        //     const blob = await canvas.convertToBlob({ type: "image/png" });
        //     const reader = new FileReader();

        //     reader.onload = () => {
        //         const dataURL = reader.result as string;
        //         console.log(dataURL); // base64 字符串
        //     };

        //     reader.readAsDataURL(blob);
        // }
        // postMessage({ id, type: "skill", data: { msg: "图片二值化完毕~" } });
        postMessage({ id, type: "skill", data: { msg: "OCR处理中~" } });
        const ocrResult = await paddleOcrService.recognize(
            {
                width: canvas.width,
                height: canvas.height,
                data: new Uint8Array(rgbaData.buffer, rgbaData.byteOffset, rgbaData.byteLength),
            },
            {
                charWhiteList: options?.charWhiteList,
            }
        );
        postMessage({ id, type: "skill", data: { msg: "OCR结果已返回" } });
        console.log("OCR结果", ocrResult);
        postMessage({ id, type: "skill", data: { result: ocrResult } });
        console.timeEnd("OCR服务识别技能图片");
    }
};
