<template>
    <n-modal
        v-model:show="visible"
        title="更新角色技能"
        preset="dialog"
        positive-text="确认"
        :negative-text="status === 'success' ? '重试' : '取消'"
        class="m-skill-parse-dialog"
        :positive-button-props="{ disabled: !canOk }"
        @positive-click="onOk"
        :on-negative-click="onCancel"
        :show-icon="false"
    >
        <div class="m-skill-parse">
            <div class="m-parse-input" v-if="!file">
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
            <div class="m-parse-result">
                <div class="m-parse-log" v-if="status === 'processing'">
                    <div class="u-loading"></div>
                    <p class="m-parse-log-item" v-for="(log, index) in logs" :key="index">
                        {{ log }}
                    </p>
                </div>
                <skill-list v-if="status === 'success'" class="m-parse-skills" :skills="parseSkills"></skill-list>
            </div>
        </div>
    </n-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useMessage, UploadFileInfo } from "naive-ui";
import { useGameStore } from "@/store/game";
import SkillList from "./SkillList.vue";
import { useOcrService } from "@/utils/use/ocr";

const message = useMessage();
const visible = ref(false);
const status = ref<"idle" | "processing" | "success" | "error">("idle");
const parseSkills = ref<RoleSkill[]>([]);
const mode = ref<"file" | "paste">("paste");
const file = ref<File | null>(null);
const onFileChange = (options: { file: UploadFileInfo; fileList: Array<UploadFileInfo> }) => {
    if (!options.file?.file) return;
    file.value = options.file.file!;
};
const onPaste = async (event: ClipboardEvent) => {
    const pasteFile = event.clipboardData?.files?.[0];
    if (!pasteFile) return;
    file.value = pasteFile;
};

watch(
    () => file.value,
    async () => {
        if (!file.value) return;
        if (!file.value.type.startsWith("image/")) {
            message.error("只支持处理图片文件哦~");
            file.value = null;
            return;
        }
        const bitmap = await createImageBitmap(file.value);
        status.value = "processing";
        const { recognize } = await useOcrService();
        recognize(
            "skill",
            bitmap,
            {
                charWhiteList: useGameStore().getSkillNameCharWhiteList(),
            },
            (_, data) => {
                const { error, msg, result } = data;
                if (error) {
                    logs.value.push(`错误: ${error}，请重新尝试`);
                    file.value = null;
                }
                if (msg) {
                    logs.value.push(msg);
                }
                if (result) {
                    status.value = "success";
                    const skillList = useGameStore().getSkillsFromOcrResult(result as OcrResultItem[]);
                    parseSkills.value = skillList;
                }
            }
        );
    }
);

const logs = ref<string[]>(["正在驯养上品的好鸽子~"]);
const canOk = computed(() => {
    if (parseSkills.value.length === 0) return false;
    return true;
});
const callback = ref<[(value: any) => void, (reason?: any) => void] | null>(null);
const reset = () => {
    status.value = "idle";
    logs.value = ["正在驯养上品的好鸽子~"];
    parseSkills.value = [];
    file.value = null;
};
const open = () => {
    reset();
    visible.value = true;
    return new Promise<RoleSkill[]>((resolve, reject) => {
        callback.value = [resolve, reject];
    });
};
const onOk = () => {
    callback.value![0](parseSkills.value);
    visible.value = false;
};
const onCancel = () => {
    if (status.value === "success") {
        reset();
        return;
    }
    callback.value![1]("cancel");
    visible.value = false;
};

defineExpose({
    open,
});
</script>

<style lang="less" scoped>
.m-skill-parse-dialog {
    .m-skill-parse {
        padding-top: 16px;
        display: flex;
        flex-direction: column;
        gap: 10px;
    }
    .m-parse-input {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }
    .m-upload-inner {
        .flex-center;
        flex-direction: column;
        gap: 10px;
        color: #aaa;
    }
    .m-parse-log {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;

        .u-loading {
            position: relative;
            width: 30px;
            height: 30px;
            border: 2px solid #000;
            border-top-color: rgba(0, 0, 0, 0.2);
            border-right-color: rgba(0, 0, 0, 0.2);
            border-bottom-color: rgba(0, 0, 0, 0.2);
            border-radius: 100%;

            animation: circle infinite 0.75s linear;

            @keyframes circle {
                0% {
                    transform: rotate(0);
                }
                100% {
                    transform: rotate(360deg);
                }
            }
        }

        .m-parse-log-item {
            margin: 0;
        }
    }
    .m-parse-skills {
        max-height: 400px;
    }
}
</style>
