<template>
    <div class="m-parse-input">
        <n-input
            v-if="mode === 'paste'"
            readonly
            @paste="onPaste"
            placeholder="可以直接在这里粘贴截图哦~ 也可以 -> "
            clearable
        >
            <template #suffix>
                <n-button text class="no-padding" size="small" @click="mode = 'file'"> 选择图片 </n-button>
            </template>
        </n-input>
        <n-upload
            v-else
            :show-file-list="false"
            accept="image/*"
            :on-change="onFileChange"
            :custom-request="() => false"
            class="m-upload-inner"
            abstract
        >
            <n-upload-dragger>
                <div class="m-upload-inner">
                    <i-ant-design:inbox-outlined />
                    <div>
                        <span> 点击选择图片或者拖拽图片到此处~ 或者直接 </span>
                        <n-button text class="no-padding" size="small" @click.stop="mode = 'paste'">
                            粘贴图片
                        </n-button>
                    </div>
                </div>
            </n-upload-dragger>
        </n-upload>
    </div>
</template>

<script setup lang="ts">
import type { UploadFileInfo } from "naive-ui";

const emits = defineEmits<{
    (e: "select-file", file: File | null): void;
}>();

const mode = ref<"file" | "paste">("paste");
const onFileChange = (options: { file: UploadFileInfo; fileList: Array<UploadFileInfo> }) => {
    if (!options.file?.file) return;
    emits("select-file", options.file.file);
};
const onPaste = async (event: ClipboardEvent) => {
    const pasteFile = event.clipboardData?.files?.[0];
    if (!pasteFile) return;
    emits("select-file", pasteFile);
};
</script>

<style lang="less" scoped></style>
