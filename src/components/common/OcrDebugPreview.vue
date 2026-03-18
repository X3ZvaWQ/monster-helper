<script setup lang="ts">
import { computed, ref, watch } from "vue";

const props = withDefaults(
    defineProps<{
        show: boolean;
        title?: string;
        stages: OcrDebugStage[];
        ocrResult?: OcrResultItem[];
        progressState?: OcrProgressState;
    }>(),
    {
        title: "OCR 调试预览",
        ocrResult: () => [],
        progressState: () => ({}),
    }
);

const emit = defineEmits<{
    "update:show": [value: boolean];
}>();

const visible = computed({
    get: () => props.show,
    set: (value: boolean) => emit("update:show", value),
});

const stageLabelMap: Record<string, string> = {
    input: "原始输入",
    score: "特征打分图",
    mask: "文本遮罩",
    final: "OCR输入",
};

const getStageTitle = (label: string, index: number) => {
    return stageLabelMap[label] ?? `步骤 ${index + 1}`;
};

const formatMeta = (meta?: Record<string, number>) => {
    if (!meta) {
        return "";
    }

    return Object.entries(meta)
        .map(([key, value]) => `${key}: ${value}`)
        .join(" / ");
};

const mappingStage = computed(() => {
    return props.stages.find((stage) => stage.label === "input") ?? null;
});

const finalStage = computed(() => {
    return props.stages.find((stage) => stage.label === "final") ?? null;
});

const leftMappingDataUrl = ref("");
const rightMappingDataUrl = ref("");

const mappingDisplay = computed(() => {
    if (!mappingStage.value) {
        return null;
    }

    const maxWidth = 320;
    const maxHeight = 480;
    const scale = Math.min(
        1,
        maxWidth / mappingStage.value.width,
        maxHeight / mappingStage.value.height
    );

    return {
        scale,
        width: Math.round(mappingStage.value.width * scale),
        height: Math.round(mappingStage.value.height * scale),
    };
});

const mappedOcrResult = computed(() => {
    if (!mappingStage.value) {
        return [];
    }

    const transform = finalStage.value?.transform;
    return props.ocrResult
        .map((item) => {
            const [x, y, width, height] = item.box;
            const mappedBox: number[] = transform
                ? [x + transform.offsetX, y + transform.offsetY, width, height]
                : item.box;

            return {
                ...item,
                box: fitBoxIntoStage(mappedBox, mappingStage.value!.width, mappingStage.value!.height),
            };
        })
        .filter((item) => item.box[2] > 0 && item.box[3] > 0);
});

const mappingMeta = computed(() => {
    const detectedCount = props.progressState?.detectedCount ?? props.ocrResult.length;
    const recognizedCount = props.progressState?.recognition?.current ?? props.ocrResult.length;
    return `${detectedCount} 个文本框 / 已识别 ${recognizedCount} 个`;
});

const fitBoxIntoStage = (box: number[], stageWidth: number, stageHeight: number) => {
    const [x, y, width, height] = box;
    const nextLeft = clamp(x, 0, stageWidth);
    const nextTop = clamp(y, 0, stageHeight);
    const nextRight = clamp(x + width, 0, stageWidth);
    const nextBottom = clamp(y + height, 0, stageHeight);

    return [
        nextLeft,
        nextTop,
        Math.max(0, nextRight - nextLeft),
        Math.max(0, nextBottom - nextTop),
    ];
};

const clamp = (value: number, min: number, max: number) => {
    return Math.min(max, Math.max(min, value));
};

const textMeasureContext = typeof document === "undefined"
    ? null
    : document.createElement("canvas").getContext("2d");

const getTextDrawMetrics = (item: OcrResultItem) => {
    const [x, y, width, height] = item.box;
    const paddingX = Math.max(4, Math.min(8, width * 0.08));
    const paddingY = Math.max(2, Math.min(6, height * 0.12));
    const minFontSize = 10;
    const fontFamily = '"PingFang SC", "Microsoft YaHei", sans-serif';
    let fontSize = Math.max(minFontSize, Math.floor(height * 0.78));
    const text = item.text?.trim() || "";

    if (textMeasureContext && text) {
        while (fontSize > minFontSize) {
            textMeasureContext.font = `${fontSize}px ${fontFamily}`;
            if (textMeasureContext.measureText(text).width <= width - paddingX * 2) {
                break;
            }
            fontSize -= 1;
        }
    }

    return {
        x,
        y,
        width,
        height,
        paddingX,
        paddingY,
        fontSize,
        lineHeight: Math.max(minFontSize, Math.floor(height - paddingY * 2)),
        fontFamily,
        text,
    };
};

function loadImage(src: string) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("Failed to load OCR mapping image"));
        image.src = src;
    });
}

const renderMappingImages = async () => {
    if (
        typeof document === "undefined" ||
        !mappingStage.value ||
        !mappedOcrResult.value.length
    ) {
        leftMappingDataUrl.value = "";
        rightMappingDataUrl.value = "";
        return;
    }

    const { width, height, dataUrl } = mappingStage.value;
    const inputImage = await loadImage(dataUrl);

    const leftCanvas = document.createElement("canvas");
    leftCanvas.width = width;
    leftCanvas.height = height;
    const leftContext = leftCanvas.getContext("2d");

    const rightCanvas = document.createElement("canvas");
    rightCanvas.width = width;
    rightCanvas.height = height;
    const rightContext = rightCanvas.getContext("2d");

    if (!leftContext || !rightContext) {
        leftMappingDataUrl.value = "";
        rightMappingDataUrl.value = "";
        return;
    }

    leftContext.drawImage(inputImage, 0, 0, width, height);
    rightContext.fillStyle = "#ffffff";
    rightContext.fillRect(0, 0, width, height);
    rightContext.textBaseline = "middle";

    mappedOcrResult.value.forEach((item, index) => {
        const [x, y, boxWidth, boxHeight] = item.box;
        const label = `${index + 1}`;
        const metrics = getTextDrawMetrics(item);

        leftContext.strokeStyle = "rgba(255, 255, 255, 0.92)";
        leftContext.lineWidth = 2;
        leftContext.strokeRect(x, y, boxWidth, boxHeight);
        leftContext.fillStyle = "rgba(255, 255, 255, 0.96)";
        leftContext.fillRect(x, Math.max(0, y - 24), 24, 20);
        leftContext.fillStyle = "#111111";
        leftContext.font = `600 14px ${metrics.fontFamily}`;
        leftContext.fillText(label, x + 6, Math.max(10, y - 14));

        rightContext.strokeStyle = "rgba(0, 0, 0, 0.16)";
        rightContext.lineWidth = 1;
        rightContext.strokeRect(x, y, boxWidth, boxHeight);
        rightContext.fillStyle = "#111111";
        rightContext.font = `${metrics.fontSize}px ${metrics.fontFamily}`;
        rightContext.fillText(
            metrics.text || `#${index + 1}`,
            metrics.x + metrics.paddingX,
            metrics.y + metrics.height / 2
        );
    });

    leftMappingDataUrl.value = leftCanvas.toDataURL("image/png");
    rightMappingDataUrl.value = rightCanvas.toDataURL("image/png");
};

watch(
    [() => props.show, mappingStage, finalStage, mappedOcrResult],
    async ([show]) => {
        if (!show) {
            return;
        }
        await renderMappingImages();
    },
    { deep: true, immediate: true }
);
</script>

<template>
    <n-modal
        v-model:show="visible"
        preset="card"
        class="m-ocr-debug-preview"
        :title="title"
        :bordered="false"
        style="width: min(860px, calc(100vw - 32px))"
    >
        <div class="m-preview-scroll">
            <section class="m-preview-mapping" v-if="mappingStage && mappingDisplay">
                <div class="m-preview-mapping__header">
                    <div>
                        <div class="u-stage-index">识别映射</div>
                        <div class="u-stage-title">左侧原图定位，右侧 OCR 原始文本排布</div>
                    </div>
                    <div class="u-stage-meta">
                        <span>{{ mappingStage.width }} x {{ mappingStage.height }}</span>
                        <span>{{ mappingMeta }}</span>
                    </div>
                </div>
                <div class="m-preview-mapping__grid">
                    <section class="m-preview-mapping__panel">
                        <div class="m-preview-mapping__label">原图定位</div>
                        <div
                            class="m-preview-mapping__viewport"
                            :style="{ width: `${mappingDisplay.width}px`, height: `${mappingDisplay.height}px` }"
                        >
                            <n-image
                                v-if="leftMappingDataUrl"
                                class="m-preview-mapping__preview"
                                :src="leftMappingDataUrl"
                                alt="OCR 原图定位"
                                object-fit="contain"
                                width="100%"
                                :img-props="{
                                    style: {
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'contain',
                                        display: 'block',
                                    },
                                }"
                            />
                        </div>
                    </section>
                    <section class="m-preview-mapping__panel">
                        <div class="m-preview-mapping__label">识别文本</div>
                        <div
                            class="m-preview-mapping__viewport m-preview-mapping__viewport--text"
                            :style="{ width: `${mappingDisplay.width}px`, height: `${mappingDisplay.height}px` }"
                        >
                            <n-image
                                v-if="rightMappingDataUrl"
                                class="m-preview-mapping__preview"
                                :src="rightMappingDataUrl"
                                alt="OCR 识别文本"
                                object-fit="contain"
                                width="100%"
                                :img-props="{
                                    style: {
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'contain',
                                        display: 'block',
                                    },
                                }"
                            />
                        </div>
                    </section>
                </div>
            </section>
            <div class="m-preview-list" v-if="stages.length">
                <section class="m-preview-stage" v-for="(stage, index) in stages" :key="`${stage.label}-${index}`">
                    <div class="m-preview-stage__header">
                        <div>
                            <div class="u-stage-index">步骤 {{ index + 1 }}</div>
                            <div class="u-stage-title">{{ getStageTitle(stage.label, index) }}</div>
                        </div>
                        <div class="u-stage-meta">
                            <span>{{ stage.width }} x {{ stage.height }}</span>
                            <span v-if="stage.meta">{{ formatMeta(stage.meta) }}</span>
                        </div>
                    </div>
                    <div class="m-preview-stage__image">
                        <n-image
                            :src="stage.dataUrl"
                            :alt="getStageTitle(stage.label, index)"
                            object-fit="contain"
                            width="100%"
                            :img-props="{
                                style: {
                                    width: '100%',
                                    height: '148px',
                                    objectFit: 'contain',
                                    display: 'block',
                                },
                            }"
                        />
                    </div>
                </section>
            </div>
            <n-empty v-else description="没有可展示的调试图"></n-empty>
        </div>
    </n-modal>
</template>

<style scoped lang="less">
.m-ocr-debug-preview {
    .m-preview-scroll {
        max-height: min(78vh, 900px);
        overflow-y: auto;
        padding-right: 4px;
    }

    .m-preview-mapping {
        margin-bottom: 18px;
        border: 1px solid var(--n-border-color);
        border-radius: 12px;
        padding: 14px;
        background: var(--n-color);
    }

    .m-preview-mapping__header {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        align-items: flex-start;
        margin-bottom: 12px;
    }

    .m-preview-mapping__grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 16px;
        align-items: start;
    }

    .m-preview-mapping__panel {
        display: flex;
        flex-direction: column;
        gap: 8px;
        align-items: center;
    }

    .m-preview-mapping__label {
        font-size: 13px;
        color: var(--n-text-color);
        opacity: 0.72;
    }

    .m-preview-mapping__viewport {
        position: relative;
        overflow: hidden;
        border-radius: 10px;
        border: 1px solid var(--n-border-color);
        background: rgba(127, 127, 127, 0.08);
        flex: 0 0 auto;
    }

    .m-preview-mapping__viewport--text {
        background: #ffffff;
    }

    .m-preview-mapping__image {
        display: block;
        width: 100%;
        height: 100%;
    }

    .m-preview-mapping__preview {
        display: block;
        width: 100%;
        height: 100%;
    }

    .m-preview-list {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 16px;
        max-height: min(72vh, 920px);
        overflow-y: auto;
        padding-right: 4px;
    }

    .m-preview-stage {
        border: 1px solid var(--n-border-color);
        border-radius: 12px;
        padding: 14px;
        background: var(--n-color);
    }

    .m-preview-stage__header {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        align-items: flex-start;
        margin-bottom: 12px;
    }

    .u-stage-index {
        font-size: 12px;
        color: var(--n-text-color);
        opacity: 0.6;
        margin-bottom: 2px;
    }

    .u-stage-title {
        font-size: 16px;
        font-weight: 600;
        color: var(--n-title-text-color);
    }

    .u-stage-meta {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 4px;
        font-size: 12px;
        color: var(--n-text-color);
        opacity: 0.68;
        text-align: right;
    }

    .m-preview-stage__image {
        overflow: hidden;
        border-radius: 10px;
        background: rgba(127, 127, 127, 0.08);
        border: 1px solid var(--n-border-color);
        padding: 6px;
    }

    @media (max-width: 768px) {
        .m-preview-mapping__grid {
            grid-template-columns: 1fr;
        }

        .m-preview-mapping__header,
        .m-preview-stage__header {
            flex-direction: column;
        }

        .u-stage-meta {
            align-items: flex-start;
            text-align: left;
        }
    }
}
</style>
