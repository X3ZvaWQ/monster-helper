interface OcrProfileConfig {
    blurRadius: number;
    brightFloor: number;
    saturationFloor: number;
    contrastWeight: number;
    brightnessWeight: number;
    saturationWeight: number;
    colorWeight: number;
    edgeWeight: number;
    thresholdBias: number;
    minThreshold: number;
    maxThreshold: number;
    minInkRatio: number;
    maxInkRatio: number;
    minArea: number;
    dilateRadius: number;
    pruneNeighbors: number;
    scale: number;
    padding: number;
    paddingGuard: number;
    cropMargin: number;
    squareArtifactMinSize: number;
    squareArtifactMaxSize: number;
    squareArtifactFillRatio: number;
    squareArtifactAspectTolerance: number;
    lineArtifactMaxThickness: number;
    lineArtifactMinLength: number;
    lineArtifactFillRatio: number;
    edgeLineGuard: number;
    edgeLineMinRunRatio: number;
    softOutput: boolean;
}

interface OcrPreprocessResult {
    imageData: ImageData;
    debugStages: OcrDebugStage[];
}

interface ScoreBuildResult {
    score: Uint8ClampedArray;
    threshold: number;
    inkRatio: number;
}

interface CroppedMaskImageData {
    imageData: ImageData;
    transform: OcrDebugTransform;
}

const PROFILE_CONFIG: Record<OcrPreprocessProfile, OcrProfileConfig> = {
    skillPanel: {
        blurRadius: 5,
        brightFloor: 96,
        saturationFloor: 18,
        contrastWeight: 5.2,
        brightnessWeight: 1.3,
        saturationWeight: 0.25,
        colorWeight: 0.95,
        edgeWeight: 0.35,
        thresholdBias: 18,
        minThreshold: 132,
        maxThreshold: 220,
        minInkRatio: 0.012,
        maxInkRatio: 0.16,
        minArea: 10,
        dilateRadius: 0,
        pruneNeighbors: 1,
        scale: 2,
        padding: 24,
        paddingGuard: 20,
        cropMargin: 14,
        squareArtifactMinSize: 42,
        squareArtifactMaxSize: 96,
        squareArtifactFillRatio: 0.62,
        squareArtifactAspectTolerance: 0.18,
        lineArtifactMaxThickness: 10,
        lineArtifactMinLength: 120,
        lineArtifactFillRatio: 0.7,
        edgeLineGuard: 0,
        edgeLineMinRunRatio: 0,
        softOutput: true,
    },
    bookLog: {
        blurRadius: 3,
        brightFloor: 72,
        saturationFloor: 8,
        contrastWeight: 4.3,
        brightnessWeight: 1.7,
        saturationWeight: 0.7,
        colorWeight: 0,
        edgeWeight: 0.3,
        thresholdBias: 8,
        minThreshold: 112,
        maxThreshold: 208,
        minInkRatio: 0.02,
        maxInkRatio: 0.24,
        minArea: 8,
        dilateRadius: 0,
        pruneNeighbors: 1,
        scale: 2,
        padding: 16,
        paddingGuard: 12,
        cropMargin: 10,
        squareArtifactMinSize: 0,
        squareArtifactMaxSize: 0,
        squareArtifactFillRatio: 0,
        squareArtifactAspectTolerance: 0,
        lineArtifactMaxThickness: 8,
        lineArtifactMinLength: 90,
        lineArtifactFillRatio: 0.72,
        edgeLineGuard: 18,
        edgeLineMinRunRatio: 0.32,
        softOutput: true,
    },
};

export const preprocessBitmapForOcr = async (
    bitmap: ImageBitmap,
    profile: OcrPreprocessProfile,
    enableDebug = false
): Promise<OcrPreprocessResult> => {
    const config = PROFILE_CONFIG[profile];
    const baseImageData = createBaseImageData(bitmap, config.scale, config.padding);
    const rgba = baseImageData.data;
    const width = baseImageData.width;
    const height = baseImageData.height;

    const gray = new Uint8ClampedArray(width * height);
    const bright = new Uint8ClampedArray(width * height);
    const saturation = new Uint8ClampedArray(width * height);
    const colorHint = new Uint8ClampedArray(width * height);

    for (let pixelIndex = 0, rgbaIndex = 0; pixelIndex < gray.length; pixelIndex++, rgbaIndex += 4) {
        const r = rgba[rgbaIndex];
        const g = rgba[rgbaIndex + 1];
        const b = rgba[rgbaIndex + 2];
        const maxChannel = Math.max(r, g, b);
        const minChannel = Math.min(r, g, b);
        gray[pixelIndex] = Math.round(r * 0.299 + g * 0.587 + b * 0.114);
        bright[pixelIndex] = maxChannel;
        saturation[pixelIndex] = maxChannel === 0 ? 0 : Math.round(((maxChannel - minChannel) / maxChannel) * 255);
        colorHint[pixelIndex] = getColorHint(profile, r, g, b, bright[pixelIndex], saturation[pixelIndex]);
    }

    const blurred = boxBlurGray(gray, width, height, config.blurRadius);
    const scoreBuild = buildScoreMap(gray, bright, saturation, colorHint, blurred, width, height, config);
    suppressCanvasPadding(scoreBuild.score, width, height, config.paddingGuard);
    let threshold = scoreBuild.threshold;
    let mask = buildMask(scoreBuild.score, threshold);

    if (scoreBuild.inkRatio < config.minInkRatio) {
        threshold = Math.max(config.minThreshold, threshold - 14);
        mask = buildMask(scoreBuild.score, threshold);
    } else if (scoreBuild.inkRatio > config.maxInkRatio) {
        threshold = Math.min(config.maxThreshold, threshold + 12);
        mask = buildMask(scoreBuild.score, threshold);
    }

    mask = removeSmallComponents(mask, width, config.minArea);
    mask = removeSquareArtifacts(mask, width, height, config);
    mask = removeLineArtifacts(mask, width, height, config);

    if (config.dilateRadius > 0) {
        mask = dilateMask(mask, width, height, config.dilateRadius);
    }

    mask = removeEdgeLineRuns(mask, width, height, config);
    mask = pruneIsolatedPixels(mask, width, height, config.pruneNeighbors);

    const finalResult = cropMaskToImageData(
        mask,
        config.softOutput ? scoreBuild.score : undefined,
        width,
        height,
        config.cropMargin,
        config.padding
    );
    const finalImageData = finalResult.imageData;
    const debugStages = enableDebug
        ? await buildDebugStages(baseImageData, scoreBuild.score, mask, finalResult, threshold)
        : [];

    return {
        imageData: finalImageData,
        debugStages,
    };
};

const createBaseImageData = (bitmap: ImageBitmap, scale: number, padding: number) => {
    const scaledWidth = Math.max(1, Math.round(bitmap.width * scale));
    const scaledHeight = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = new OffscreenCanvas(scaledWidth + padding * 2, scaledHeight + padding * 2);
    const ctx = canvas.getContext("2d");

    if (!ctx) {
        throw new Error("Unable to create OCR preprocessing canvas");
    }

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, padding, padding, scaledWidth, scaledHeight);
    bitmap.close();

    return ctx.getImageData(0, 0, canvas.width, canvas.height);
};

const boxBlurGray = (gray: Uint8ClampedArray, width: number, height: number, radius: number) => {
    if (radius <= 0) {
        return new Uint8ClampedArray(gray);
    }

    const horizontal = new Float32Array(gray.length);
    const blurred = new Uint8ClampedArray(gray.length);
    const windowSize = radius * 2 + 1;

    for (let y = 0; y < height; y++) {
        const rowOffset = y * width;
        let sum = 0;

        for (let sampleX = -radius; sampleX <= radius; sampleX++) {
            const x = clamp(sampleX, 0, width - 1);
            sum += gray[rowOffset + x];
        }

        for (let x = 0; x < width; x++) {
            horizontal[rowOffset + x] = sum / windowSize;
            const removeX = clamp(x - radius, 0, width - 1);
            const addX = clamp(x + radius + 1, 0, width - 1);
            sum += gray[rowOffset + addX] - gray[rowOffset + removeX];
        }
    }

    for (let x = 0; x < width; x++) {
        let sum = 0;

        for (let sampleY = -radius; sampleY <= radius; sampleY++) {
            const y = clamp(sampleY, 0, height - 1);
            sum += horizontal[y * width + x];
        }

        for (let y = 0; y < height; y++) {
            blurred[y * width + x] = Math.round(sum / windowSize);
            const removeY = clamp(y - radius, 0, height - 1);
            const addY = clamp(y + radius + 1, 0, height - 1);
            sum += horizontal[addY * width + x] - horizontal[removeY * width + x];
        }
    }

    return blurred;
};

const buildScoreMap = (
    gray: Uint8ClampedArray,
    bright: Uint8ClampedArray,
    saturation: Uint8ClampedArray,
    colorHint: Uint8ClampedArray,
    blurred: Uint8ClampedArray,
    width: number,
    height: number,
    config: OcrProfileConfig
): ScoreBuildResult => {
    const score = new Uint8ClampedArray(gray.length);

    for (let pixelIndex = 0; pixelIndex < score.length; pixelIndex++) {
        const localContrast = Math.max(gray[pixelIndex] - blurred[pixelIndex], 0);
        const brightnessBoost = Math.max(bright[pixelIndex] - config.brightFloor, 0);
        const saturationBoost = Math.max(saturation[pixelIndex] - config.saturationFloor, 0);
        const x = pixelIndex % width;
        const y = Math.floor(pixelIndex / width);
        const rightIndex = y * width + Math.min(x + 1, width - 1);
        const bottomIndex = Math.min(y + 1, height - 1) * width + x;
        const edge =
            (Math.abs(gray[pixelIndex] - gray[rightIndex]) + Math.abs(gray[pixelIndex] - gray[bottomIndex])) / 2;

        score[pixelIndex] = clamp(
            Math.round(
                localContrast * config.contrastWeight +
                    brightnessBoost * config.brightnessWeight +
                    saturationBoost * config.saturationWeight +
                    colorHint[pixelIndex] * config.colorWeight +
                    edge * config.edgeWeight
            ),
            0,
            255
        );
    }

    const otsuThreshold = getOtsuThreshold(score);
    const threshold = clamp(otsuThreshold + config.thresholdBias, config.minThreshold, config.maxThreshold);
    const inkRatio = countForegroundPixels(score, threshold) / score.length;

    return {
        score,
        threshold,
        inkRatio,
    };
};

const getOtsuThreshold = (values: Uint8ClampedArray) => {
    const histogram = new Uint32Array(256);

    for (const value of values) {
        histogram[value]++;
    }

    let totalWeight = 0;
    for (let value = 0; value < histogram.length; value++) {
        totalWeight += value * histogram[value];
    }

    let backgroundWeight = 0;
    let backgroundSum = 0;
    let maxVariance = -1;
    let threshold = 0;

    for (let value = 0; value < histogram.length; value++) {
        backgroundWeight += histogram[value];
        if (!backgroundWeight) {
            continue;
        }

        const foregroundWeight = values.length - backgroundWeight;
        if (!foregroundWeight) {
            break;
        }

        backgroundSum += value * histogram[value];
        const backgroundMean = backgroundSum / backgroundWeight;
        const foregroundMean = (totalWeight - backgroundSum) / foregroundWeight;
        const betweenClassVariance =
            backgroundWeight * foregroundWeight * (backgroundMean - foregroundMean) * (backgroundMean - foregroundMean);

        if (betweenClassVariance > maxVariance) {
            maxVariance = betweenClassVariance;
            threshold = value;
        }
    }

    return threshold;
};

const countForegroundPixels = (values: Uint8ClampedArray, threshold: number) => {
    let count = 0;
    for (const value of values) {
        if (value >= threshold) {
            count++;
        }
    }
    return count;
};

const suppressCanvasPadding = (score: Uint8ClampedArray, width: number, height: number, guard: number) => {
    if (guard <= 0) {
        return;
    }

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (x < guard || x >= width - guard || y < guard || y >= height - guard) {
                score[y * width + x] = 0;
            }
        }
    }
};

const buildMask = (score: Uint8ClampedArray, threshold: number) => {
    const mask = new Uint8Array(score.length);
    for (let index = 0; index < score.length; index++) {
        mask[index] = score[index] >= threshold ? 1 : 0;
    }
    return mask;
};

const removeSmallComponents = (mask: Uint8Array, width: number, minArea: number): Uint8Array => {
    const visited = new Uint8Array(mask.length);
    const nextMask = new Uint8Array(mask);
    const neighbors = [-width - 1, -width, -width + 1, -1, 1, width - 1, width, width + 1];

    for (let index = 0; index < mask.length; index++) {
        if (!mask[index] || visited[index]) {
            continue;
        }

        const component: number[] = [];
        const stack = [index];
        visited[index] = 1;

        while (stack.length) {
            const current = stack.pop()!;
            component.push(current);
            const x = current % width;
            const y = Math.floor(current / width);

            for (const offset of neighbors) {
                const next = current + offset;
                if (next < 0 || next >= mask.length || visited[next] || !mask[next]) {
                    continue;
                }

                const nextX = next % width;
                const nextY = Math.floor(next / width);
                if (Math.abs(nextX - x) > 1 || Math.abs(nextY - y) > 1) {
                    continue;
                }

                visited[next] = 1;
                stack.push(next);
            }
        }

        if (component.length < minArea) {
            for (const pixelIndex of component) {
                nextMask[pixelIndex] = 0;
            }
        }
    }

    return nextMask;
};

const removeSquareArtifacts = (
    mask: Uint8Array,
    width: number,
    height: number,
    config: OcrProfileConfig
): Uint8Array => {
    if (!config.squareArtifactMinSize || !config.squareArtifactMaxSize) {
        return mask;
    }

    const visited = new Uint8Array(mask.length);
    const nextMask = new Uint8Array(mask);
    const neighbors = [-width - 1, -width, -width + 1, -1, 1, width - 1, width, width + 1];

    for (let index = 0; index < mask.length; index++) {
        if (!mask[index] || visited[index]) {
            continue;
        }

        const component: number[] = [];
        const stack = [index];
        visited[index] = 1;
        let minX = width;
        let minY = height;
        let maxX = -1;
        let maxY = -1;

        while (stack.length) {
            const current = stack.pop()!;
            component.push(current);
            const x = current % width;
            const y = Math.floor(current / width);
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);

            for (const offset of neighbors) {
                const next = current + offset;
                if (next < 0 || next >= mask.length || visited[next] || !mask[next]) {
                    continue;
                }

                const nextX = next % width;
                const nextY = Math.floor(next / width);
                if (Math.abs(nextX - x) > 1 || Math.abs(nextY - y) > 1) {
                    continue;
                }

                visited[next] = 1;
                stack.push(next);
            }
        }

        const componentWidth = maxX - minX + 1;
        const componentHeight = maxY - minY + 1;
        const aspect = componentWidth / componentHeight;
        const fillRatio = component.length / (componentWidth * componentHeight);
        const touchesEdge =
            componentWidth <= 4 &&
            componentHeight >= height * 0.3 &&
            (minX <= config.paddingGuard || maxX >= width - config.paddingGuard - 1);
        const isSquareArtifact =
            componentWidth >= config.squareArtifactMinSize &&
            componentHeight >= config.squareArtifactMinSize &&
            componentWidth <= config.squareArtifactMaxSize &&
            componentHeight <= config.squareArtifactMaxSize &&
            Math.abs(aspect - 1) <= config.squareArtifactAspectTolerance &&
            fillRatio >= config.squareArtifactFillRatio;

        if (touchesEdge || isSquareArtifact) {
            for (const pixelIndex of component) {
                nextMask[pixelIndex] = 0;
            }
        }
    }

    return nextMask;
};

const removeLineArtifacts = (
    mask: Uint8Array,
    width: number,
    height: number,
    config: OcrProfileConfig
): Uint8Array => {
    if (!config.lineArtifactMaxThickness || !config.lineArtifactMinLength) {
        return mask;
    }

    const visited = new Uint8Array(mask.length);
    const nextMask = new Uint8Array(mask);
    const neighbors = [-width - 1, -width, -width + 1, -1, 1, width - 1, width, width + 1];

    for (let index = 0; index < mask.length; index++) {
        if (!mask[index] || visited[index]) {
            continue;
        }

        const component: number[] = [];
        const stack = [index];
        visited[index] = 1;
        let minX = width;
        let minY = height;
        let maxX = -1;
        let maxY = -1;

        while (stack.length) {
            const current = stack.pop()!;
            component.push(current);
            const x = current % width;
            const y = Math.floor(current / width);
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);

            for (const offset of neighbors) {
                const next = current + offset;
                if (next < 0 || next >= mask.length || visited[next] || !mask[next]) {
                    continue;
                }

                const nextX = next % width;
                const nextY = Math.floor(next / width);
                if (Math.abs(nextX - x) > 1 || Math.abs(nextY - y) > 1) {
                    continue;
                }

                visited[next] = 1;
                stack.push(next);
            }
        }

        const componentWidth = maxX - minX + 1;
        const componentHeight = maxY - minY + 1;
        const fillRatio = component.length / (componentWidth * componentHeight);
        const isVerticalLine =
            componentWidth <= config.lineArtifactMaxThickness && componentHeight >= config.lineArtifactMinLength;
        const isHorizontalLine =
            componentHeight <= config.lineArtifactMaxThickness && componentWidth >= config.lineArtifactMinLength;

        if ((isVerticalLine || isHorizontalLine) && fillRatio >= config.lineArtifactFillRatio) {
            for (const pixelIndex of component) {
                nextMask[pixelIndex] = 0;
            }
        }
    }

    return nextMask;
};

const removeEdgeLineRuns = (
    mask: Uint8Array,
    width: number,
    height: number,
    config: OcrProfileConfig
): Uint8Array => {
    if (!config.edgeLineGuard || !config.edgeLineMinRunRatio) {
        return mask;
    }

    const nextMask = new Uint8Array(mask);
    const guard = Math.min(config.edgeLineGuard, Math.floor(Math.min(width, height) / 2));
    const minVerticalRun = Math.ceil(height * config.edgeLineMinRunRatio);
    const minHorizontalRun = Math.ceil(width * config.edgeLineMinRunRatio);

    for (let x = 0; x < guard; x++) {
        if (getLongestColumnRun(mask, width, height, x) >= minVerticalRun) {
            clearColumn(nextMask, width, height, x);
        }
    }

    for (let x = Math.max(width - guard, 0); x < width; x++) {
        if (getLongestColumnRun(mask, width, height, x) >= minVerticalRun) {
            clearColumn(nextMask, width, height, x);
        }
    }

    for (let y = 0; y < guard; y++) {
        if (getLongestRowRun(mask, width, y) >= minHorizontalRun) {
            clearRow(nextMask, width, y);
        }
    }

    for (let y = Math.max(height - guard, 0); y < height; y++) {
        if (getLongestRowRun(mask, width, y) >= minHorizontalRun) {
            clearRow(nextMask, width, y);
        }
    }

    return nextMask;
};

const dilateMask = (mask: Uint8Array, width: number, height: number, radius: number) => {
    const dilated = new Uint8Array(mask.length);

    for (let index = 0; index < mask.length; index++) {
        if (!mask[index]) {
            continue;
        }

        const x = index % width;
        const y = Math.floor(index / width);

        for (let offsetY = -radius; offsetY <= radius; offsetY++) {
            const nextY = y + offsetY;
            if (nextY < 0 || nextY >= height) {
                continue;
            }

            for (let offsetX = -radius; offsetX <= radius; offsetX++) {
                const nextX = x + offsetX;
                if (nextX < 0 || nextX >= width) {
                    continue;
                }

                dilated[nextY * width + nextX] = 1;
            }
        }
    }

    return dilated;
};

const getLongestColumnRun = (mask: Uint8Array, width: number, height: number, x: number) => {
    let longest = 0;
    let current = 0;

    for (let y = 0; y < height; y++) {
        if (mask[y * width + x]) {
            current++;
            longest = Math.max(longest, current);
        } else {
            current = 0;
        }
    }

    return longest;
};

const getLongestRowRun = (mask: Uint8Array, width: number, y: number) => {
    let longest = 0;
    let current = 0;
    const offset = y * width;

    for (let x = 0; x < width; x++) {
        if (mask[offset + x]) {
            current++;
            longest = Math.max(longest, current);
        } else {
            current = 0;
        }
    }

    return longest;
};

const clearColumn = (mask: Uint8Array, width: number, height: number, x: number) => {
    for (let y = 0; y < height; y++) {
        mask[y * width + x] = 0;
    }
};

const clearRow = (mask: Uint8Array, width: number, y: number) => {
    mask.fill(0, y * width, (y + 1) * width);
};

const pruneIsolatedPixels = (mask: Uint8Array, width: number, height: number, minNeighbors: number) => {
    const pruned = new Uint8Array(mask.length);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const index = y * width + x;
            if (!mask[index]) {
                continue;
            }

            let neighborCount = 0;
            for (let offsetY = -1; offsetY <= 1; offsetY++) {
                for (let offsetX = -1; offsetX <= 1; offsetX++) {
                    if (offsetX === 0 && offsetY === 0) {
                        continue;
                    }

                    const nextX = x + offsetX;
                    const nextY = y + offsetY;
                    if (nextX < 0 || nextX >= width || nextY < 0 || nextY >= height || !mask[nextY * width + nextX]) {
                        continue;
                    }

                    neighborCount++;
                }
            }

            if (neighborCount >= minNeighbors) {
                pruned[index] = 1;
            }
        }
    }

    return pruned;
};

const cropMaskToImageData = (
    mask: Uint8Array,
    score: Uint8ClampedArray | undefined,
    width: number,
    height: number,
    margin: number,
    padding: number
): CroppedMaskImageData => {
    const bounds = findMaskBounds(mask, width, height);

    if (!bounds) {
        return {
            imageData: maskToImageData(mask, width, height),
            transform: {
                offsetX: 0,
                offsetY: 0,
                sourceWidth: width,
                sourceHeight: height,
            },
        };
    }

    const cropLeft = Math.max(bounds.left - margin, 0);
    const cropTop = Math.max(bounds.top - margin, 0);
    const cropRight = Math.min(bounds.right + margin, width - 1);
    const cropBottom = Math.min(bounds.bottom + margin, height - 1);
    const cropWidth = cropRight - cropLeft + 1;
    const cropHeight = cropBottom - cropTop + 1;
    const outWidth = cropWidth + padding * 2;
    const outHeight = cropHeight + padding * 2;
    const output = new Uint8ClampedArray(outWidth * outHeight * 4);

    for (let index = 0; index < output.length; index += 4) {
        output[index] = 255;
        output[index + 1] = 255;
        output[index + 2] = 255;
        output[index + 3] = 255;
    }

    for (let y = 0; y < cropHeight; y++) {
        for (let x = 0; x < cropWidth; x++) {
            const sourceIndex = (cropTop + y) * width + cropLeft + x;
            if (!mask[sourceIndex]) {
                continue;
            }

            const targetIndex = ((y + padding) * outWidth + (x + padding)) * 4;
            const inkValue = score ? clamp(255 - Math.round(score[sourceIndex] * 1.05), 0, 220) : 0;
            output[targetIndex] = inkValue;
            output[targetIndex + 1] = inkValue;
            output[targetIndex + 2] = inkValue;
            output[targetIndex + 3] = 255;
        }
    }

    return {
        imageData: new ImageData(output, outWidth, outHeight),
        transform: {
            offsetX: cropLeft - padding,
            offsetY: cropTop - padding,
            sourceWidth: width,
            sourceHeight: height,
        },
    };
};

const findMaskBounds = (mask: Uint8Array, width: number, height: number) => {
    let left = width;
    let top = height;
    let right = -1;
    let bottom = -1;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (!mask[y * width + x]) {
                continue;
            }

            left = Math.min(left, x);
            top = Math.min(top, y);
            right = Math.max(right, x);
            bottom = Math.max(bottom, y);
        }
    }

    if (right === -1 || bottom === -1) {
        return null;
    }

    return { left, top, right, bottom };
};

const maskToImageData = (mask: Uint8Array, width: number, height: number) => {
    const data = new Uint8ClampedArray(width * height * 4);

    for (let index = 0; index < mask.length; index++) {
        const rgbaIndex = index * 4;
        const value = mask[index] ? 0 : 255;
        data[rgbaIndex] = value;
        data[rgbaIndex + 1] = value;
        data[rgbaIndex + 2] = value;
        data[rgbaIndex + 3] = 255;
    }

    return new ImageData(data, width, height);
};

const grayscaleToImageData = (gray: Uint8ClampedArray, width: number, height: number) => {
    const data = new Uint8ClampedArray(width * height * 4);

    for (let index = 0; index < gray.length; index++) {
        const rgbaIndex = index * 4;
        data[rgbaIndex] = gray[index];
        data[rgbaIndex + 1] = gray[index];
        data[rgbaIndex + 2] = gray[index];
        data[rgbaIndex + 3] = 255;
    }

    return new ImageData(data, width, height);
};

const buildDebugStages = async (
    baseImageData: ImageData,
    score: Uint8ClampedArray,
    mask: Uint8Array,
    finalResult: CroppedMaskImageData,
    threshold: number
) => {
    const inputStage = await imageDataToDebugStage(baseImageData, "input");
    const scoreStage = await imageDataToDebugStage(
        grayscaleToImageData(score, baseImageData.width, baseImageData.height),
        "score",
        { threshold }
    );
    const maskStage = await imageDataToDebugStage(
        maskToImageData(mask, baseImageData.width, baseImageData.height),
        "mask"
    );
    const finalStage = await imageDataToDebugStage(finalResult.imageData, "final", undefined, finalResult.transform);

    return [inputStage, scoreStage, maskStage, finalStage];
};

const imageDataToDebugStage = async (
    imageData: ImageData,
    label: string,
    meta?: Record<string, number>,
    transform?: OcrDebugTransform
): Promise<OcrDebugStage> => {
    return {
        label,
        width: imageData.width,
        height: imageData.height,
        dataUrl: await imageDataToDataUrl(imageData),
        meta,
        transform,
    };
};

const imageDataToDataUrl = async (imageData: ImageData) => {
    const canvas = new OffscreenCanvas(imageData.width, imageData.height);
    const ctx = canvas.getContext("2d");

    if (!ctx) {
        throw new Error("Unable to serialize OCR debug image");
    }

    ctx.putImageData(imageData, 0, 0);
    const blob = await canvas.convertToBlob({ type: "image/png" });
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let binary = "";

    for (let index = 0; index < bytes.length; index += 0x8000) {
        binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
    }

    return `data:${blob.type};base64,${globalThis.btoa(binary)}`;
};

const getColorHint = (
    profile: OcrPreprocessProfile,
    r: number,
    g: number,
    b: number,
    bright: number,
    saturation: number
) => {
    if (profile !== "skillPanel") {
        return 0;
    }

    const { h, s, l } = rgbToHsl(r, g, b);
    const isWhiteText = bright >= 154 && saturation <= 52 && l >= 0.62;
    if (isWhiteText) {
        return 180;
    }

    const isWarmText = h >= 30 && h <= 78 && s >= 0.18 && l >= 0.34 && bright >= 110;
    const isGreenText = h >= 78 && h <= 165 && s >= 0.16 && l >= 0.3 && bright >= 100;
    const isCyanText = h >= 165 && h <= 235 && s >= 0.16 && l >= 0.34 && bright >= 105;

    if (isWarmText || isGreenText || isCyanText) {
        return 110;
    }

    return 0;
};

const rgbToHsl = (r: number, g: number, b: number) => {
    const red = r / 255;
    const green = g / 255;
    const blue = b / 255;
    const max = Math.max(red, green, blue);
    const min = Math.min(red, green, blue);
    const lightness = (max + min) / 2;

    if (max === min) {
        return {
            h: 0,
            s: 0,
            l: lightness,
        };
    }

    const delta = max - min;
    const saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    let hue = 0;

    switch (max) {
        case red:
            hue = (green - blue) / delta + (green < blue ? 6 : 0);
            break;
        case green:
            hue = (blue - red) / delta + 2;
            break;
        default:
            hue = (red - green) / delta + 4;
            break;
    }

    return {
        h: hue * 60,
        s: saturation,
        l: lightness,
    };
};

const clamp = (value: number, min: number, max: number) => {
    return Math.min(max, Math.max(min, value));
};
