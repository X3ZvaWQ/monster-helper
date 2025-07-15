import OcrWorker from "@/utils/ocr.worker?worker";
import { nanoid } from "nanoid";

type Handler = (type: string, data: any) => void;

let handlers = new Map<string, Handler>();
let ocrWorker: Worker | null = null;
let queue: [(value: unknown) => void, (reason?: any) => void][] = [];
let initializing = false;

const recognize = (
    type: string,
    bitmap: ImageBitmap,
    options: OcrInputOptions,
    handler: Handler
) => {
    const id = nanoid();
    ocrWorker!.postMessage({ id, type, bitmap, options } as OcrInput, [bitmap]);
    handlers.set(id, handler);
};

export const useOcrService = async (): Promise<{
    recognize: typeof recognize;
}> => {
    // 正在初始化
    if (initializing) {
        await new Promise((resolve, reject) => {
            queue.push([resolve, reject]);
        });
        return { recognize };
    }
    // 第一次调用
    if (!ocrWorker && !initializing) {
        ocrWorker = new OcrWorker();
        ocrWorker.onmessage = (event: MessageEvent) => {
            const { id, type, data } = event.data;
            if (type == "init") {
                initializing = false;
                if (data.result) {
                    queue.forEach(([resolve]) => {
                        resolve(true);
                    });
                    queue = [];
                } else if (data.error) {
                    ocrWorker = null;
                    queue.forEach(([, reject]) => {
                        reject(data.error);
                    });
                    queue = [];
                }
            } else {
                const handler = handlers.get(id)!;
                handler(type, data);
            }
        };
        ocrWorker.postMessage({ type: "init" });
        await new Promise((resolve, reject) => {
            queue.push([resolve, reject]);
        });
    }
    return { recognize };
};
