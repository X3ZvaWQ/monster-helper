<template>
    <n-select
        v-bind="$attrs"
        :options="props.options"
        filterable
        :filter="filter"
        max-tag-count="responsive"
        multiple
        clearable
        :render-label="skillLabelRender"
        :render-tag="skillSelectTag"
    ></n-select>
</template>

<script setup lang="ts">
import { useGameStore } from "@/store/game";
import { iconLink } from "@/utils/game";
import { getSearchKey } from "@/utils/search";
import { SelectRenderLabel, SelectRenderTag } from "naive-ui";
import { SelectMixedOption } from "naive-ui/es/select/src/interface";

const props = withDefaults(
    defineProps<{
        options?: SelectMixedOption[];
    }>(),
    {
        options: () =>
            useGameStore().skills.map((skill) => {
                return {
                    label: skill.name,
                    value: skill.id,
                    icon: skill.icon,
                    search: getSearchKey(skill.name),
                };
            }),
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
const skillSelectTag: SelectRenderTag = ({ option, handleClose }) => {
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
const filter = (pattern: string, option: any) => {
    return option.search.toLowerCase().includes(pattern.toLowerCase());
};
</script>

<style lang="less" scoped></style>
