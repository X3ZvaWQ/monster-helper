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

interface OcrInput {
    id: string;
    type: "skill" | "item";
    bitmap: ImageBitmap;
    options?: OcrInputOptions;
}

interface OcrInputOptions {
    charWhiteList?: string[];
}
