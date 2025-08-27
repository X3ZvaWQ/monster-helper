<template>
    <n-select
        :options="props.options"
        filterable
        :filter="filter"
        max-tag-count="responsive"
        :multiple="multiple"
        clearable
        :render-label="skillLabelRender"
        :render-tag="multiple ? multipleSkillSelectTag : singleSkillSelectTag"
        v-bind="$attrs"
    ></n-select>
</template>

<script setup lang="ts">
import { useGameStore } from "@/store/game";
import { iconLink } from "@/utils/game";
import { matchSearch } from "@/utils/search";
import { SelectRenderLabel, SelectRenderTag } from "naive-ui";
import { SelectMixedOption } from "naive-ui/es/select/src/interface";

const props = withDefaults(
    defineProps<{
        options?: SelectMixedOption[];
        multiple?: boolean;
    }>(),
    {
        options: () =>
            useGameStore().skills.map((skill) => {
                return {
                    label: skill.name,
                    value: skill.id,
                    icon: skill.icon,
                    search: skill.searchKey,
                };
            }),
        multiple: true,
    }
);

const skillLabelRender: SelectRenderLabel = (option) => {
    return h(
        "div",
        {
            style: {
                display: "flex",
                alignItems: "center",
                gap: "8px",
            },
        },
        [
            h(resolveComponent("n-image"), {
                style: { width: "20px", height: "20px" },
                src: iconLink(option.icon as number),
                previewDisabled: true,
            }),
            h(
                resolveComponent("n-text"),
                { depth: 3, tag: "div" },
                {
                    default: () => option.label,
                }
            ),
        ]
    );
};
const multipleSkillSelectTag: SelectRenderTag = ({ option, handleClose }) => {
    return h(
        resolveComponent("n-tag"),
        {
            style: {
                display: "flex",
                alignItems: "center",
            },
            closable: true,
            onClose: (e: any) => {
                e.stopPropagation();
                handleClose();
            },
        },
        {
            default: () =>
                h(resolveComponent("n-image"), {
                    style: { width: "20px", height: "20px" },
                    src: iconLink(option.icon as number),
                    previewDisabled: true,
                }),
        }
    );
};
const singleSkillSelectTag: SelectRenderTag = ({ option }) => {
    return h(
        resolveComponent("n-flex"),
        {
            align: "center",
            size: 6,
        },
        {
            default: () => [
                h(resolveComponent("n-image"), {
                    style: { width: "20px", height: "20px" },
                    src: iconLink(option.icon as number),
                    previewDisabled: true,
                }),
                option.label,
            ],
        }
    );
};
const filter = (pattern: string, option: any) => {
    return matchSearch(pattern, option.search);
};
</script>

<style lang="less" scoped></style>
