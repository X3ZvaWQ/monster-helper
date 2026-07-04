<template>
    <div class="m-weekly-map" :style="mapThemeStyle">
        <div class="m-map-header">
            <div class="m-map-title">
                <n-h3 class="u-title" prefix="bar">本周地图</n-h3>
                <n-text depth="3" v-if="weekRange">{{ weekRange }}</n-text>
                <n-radio-group v-model:value="settingStore.map.range" size="small">
                    <n-radio-button v-for="option in rangeOptions" :key="option.value" :value="option.value">
                        {{ option.label }}
                    </n-radio-button>
                </n-radio-group>
            </div>
            <n-flex align="center" :wrap="false">
                <n-text depth="3" v-if="updatedText">更新于 {{ updatedText }}</n-text>
                <n-button type="primary" :loading="loading" @click="emit('refresh')">
                    <template #icon>
                        <i-material-symbols:refresh-rounded />
                    </template>
                    刷新
                </n-button>
            </n-flex>
        </div>

        <n-spin class="pt-10" :show="loading && !map?.floors.length">
            <n-empty v-if="!map?.floors.length" class="m-empty" description="暂未加载本周地图" />
            <div v-else class="m-map-simple">
                <div class="u-list" :class="rowListClass">
                    <div
                        class="u-row"
                        v-for="row in rows"
                        :key="row[0]?.floor"
                        :class="{ 'is-reverse': isReverseRow(row) }"
                    >
                        <n-tooltip
                            v-for="floor in row"
                            :key="floor.floor"
                            trigger="hover"
                            placement="top"
                            class="m-map-cell-tooltip"
                        >
                            <template #trigger>
                                <div
                                    class="u-column"
                                    :class="{
                                        'is-effect': floor.nEffectID > 0,
                                        'is-elite': floor.floor % column === 0,
                                    }"
                                >
                                    <div class="u-img-index">
                                        <div class="u-img">
                                            <img class="u-effect-icon" :src="getEffectIcon(floor)" alt="" />
                                        </div>
                                        <div class="u-index">
                                            <span class="u-index-number">{{ floor.floor }}</span>
                                        </div>
                                    </div>
                                    <div class="u-name">{{ floor.boss?.name || "未知首领" }}</div>
                                    <div class="u-gift">
                                        <span class="u-tag" v-if="getEffectName(floor)">{{
                                            getEffectName(floor)
                                        }}</span>
                                        <span class="u-coin" v-if="floor.effect?.reward"
                                            >+{{ floor.effect.reward }}</span
                                        >
                                    </div>
                                    <div class="u-elite"></div>
                                </div>
                            </template>
                            <div class="m-map-tip">
                                <div class="u-top">
                                    <div class="u-avatar">
                                        <img
                                            :src="floor.boss?.avatar || fallbackAvatar"
                                            :alt="floor.boss?.name || '未知首领'"
                                        />
                                    </div>
                                    <div class="u-right">
                                        <div class="u-name">
                                            第 {{ floor.floor }} 层
                                            {{ floor.boss?.name || `未知首领 ${floor.dwBossID}` }}
                                        </div>
                                        <div class="u-desc" v-if="floor.effect?.tags.length || floor.effect?.reward">
                                            <span v-if="floor.effect?.tags.length">{{
                                                floor.effect.tags.join("/")
                                            }}</span>
                                            <span v-if="floor.effect?.reward"> + {{ floor.effect.reward }}</span>
                                        </div>
                                    </div>
                                </div>
                                <div v-if="floor.effect && floor.effect.id" class="u-bottom">
                                    <div class="u-name">{{ floor.effect.name }}</div>
                                    <div class="u-desc">{{ floor.effect.description }}</div>
                                </div>
                            </div>
                        </n-tooltip>
                    </div>
                </div>
            </div>
        </n-spin>
    </div>
</template>

<script setup lang="ts">
import { chunk } from "lodash";
import { useThemeVars } from "naive-ui";
import { useSettingStore } from "@/store/setting";
import { iconLink } from "@/utils/game";
import type { CSSProperties } from "vue";

const props = defineProps<{
    map: WeeklyMonsterMap | null;
    loading: boolean;
}>();

const emit = defineEmits<{
    refresh: [];
}>();

const settingStore = useSettingStore();
const themeVars = useThemeVars();
const column = 10;
const fallbackAvatar = "https://img.jx3box.com/pve/baizhan/fbcdpanel02_51.png";
const fallbackEffectIcon = 18505;
const rangeOptions = [
    { label: "全部", value: "all" },
    { label: "后50层", value: "last50" },
    { label: "后30层", value: "last30" },
];

const visibleFloors = computed(() => {
    const floors = props.map?.floors || [];
    if (settingStore.map.range === "last30") return floors.slice(-30);
    if (settingStore.map.range === "last50") return floors.slice(-50);
    return floors;
});

const rows = computed(() => chunk(visibleFloors.value, column));

const rowListClass = computed(() => (rows.value.length % 2 ? "is-odd" : "is-even"));

const isReverseRow = (row: WeeklyMonsterMapFloor[]) => {
    const firstFloor = row[0]?.floor || 1;
    return Math.ceil(firstFloor / column) % 2 === 0;
};

const mapThemeStyle = computed<CSSProperties>(() => {
    const vars = themeVars.value;
    const isDark = vars.baseColor === "#000";
    return {
        "--m-map-card-color": vars.cardColor,
        "--m-map-header-color": vars.cardColor,
        "--m-map-text-color": vars.textColor2,
        "--m-map-text-color-strong": vars.textColor1,
        "--m-map-text-color-weak": vars.textColor3,
        "--m-map-border-color": vars.borderColor,
        "--m-map-divider-color": vars.dividerColor,
        "--m-map-avatar-color": vars.avatarColor,
        "--m-map-hover-color": vars.hoverColor,
        "--m-map-warning-color": vars.warningColor,
        "--m-map-warning-color-suppl": vars.warningColorSuppl,
        "--m-map-index-color": vars.textColor3,
        "--m-map-index-active-color": vars.warningColorPressed,
        "--m-map-index-text-color": isDark ? "#000" : "#fff",
        "--m-map-effect-index-text-color": isDark ? "#000" : "#fff",
        "--m-scrollbar-color": vars.scrollbarColor,
        "--m-scrollbar-color-hover": vars.scrollbarColorHover,
    } as CSSProperties;
});

const getEffectName = (floor: WeeklyMonsterMapFloor) => {
    return floor.effect?.tags[0] || "";
};

const getEffectIcon = (floor: WeeklyMonsterMapFloor) => {
    return iconLink(floor.effect?.icon || fallbackEffectIcon);
};

const formatDate = (value: string | number | Date) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("zh-CN", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
};

const formatShortDate = (value: string | number | Date) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("zh-CN", {
        month: "2-digit",
        day: "2-digit",
    }).format(date);
};

const weekRange = computed(() => {
    if (!props.map?.start) return "";
    const start = new Date(props.map.start);
    if (Number.isNaN(start.getTime())) return "";
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return `${formatShortDate(start)} - ${formatShortDate(end)}`;
});

const updatedText = computed(() => {
    if (!props.map?.updatedAt) return "";
    return formatDate(props.map.updatedAt);
});
</script>

<style lang="less" scoped>
.m-weekly-map {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-height: 100%;

    .m-map-header {
        position: sticky;
        top: 0;
        z-index: 5;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        flex-wrap: wrap;
        padding: 18px 0 14px;
        background: var(--m-map-header-color);
    }

    .m-map-title {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;

        .u-title {
            margin: 0;
        }
    }

    .m-empty {
        .flex-center;
        min-height: 360px;
    }
}

.m-map-simple {
    overflow-x: auto;
    padding: 10px 0 18px;
    color: var(--m-map-text-color);
    background: var(--m-map-card-color);
    border-radius: 8px;
    .scrollbar();

    .u-list {
        @line-color: var(--m-map-border-color);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 20px;
        width: max-content;
        min-width: 100%;
        margin: 0 auto;
        padding: 10px 24px;
        position: relative;
    }

    .u-row {
        position: relative;
        display: flex;
        gap: 12px;
        height: 75px;

        &.is-reverse {
            flex-direction: row-reverse;
        }
    }

    .u-column {
        @size: 32px;
        @border: 2px;
        @elite: @size + @border * 6;
        @mark: 16px;
        position: relative;
        z-index: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        width: 60px;
        color: var(--m-map-text-color);
        font-size: 12px;
        cursor: default;

        .u-img-index {
            cursor: default;

            &:hover {
                .u-img {
                    filter: brightness(1.2) saturate(1.2);
                    transform: scale(1.1);
                }
            }
        }

        .u-img {
            position: relative;
            z-index: 1;
            width: @size;
            height: @size;
            overflow: hidden;
            flex: none;
            border: @border solid var(--m-map-border-color);
            border-radius: 50%;
            background: var(--m-map-avatar-color);
            box-shadow: 0 0 1px var(--m-map-divider-color);
            transition: 0.2s ease-in-out;

            .u-effect-icon {
                position: relative;
                top: -@border;
                width: @size + @border;
                height: @size + @border;
                object-fit: cover;
            }
        }

        .u-index {
            position: absolute;
            top: @size - @border - (@mark / 2);
            left: 50%;
            z-index: 2;
            width: @mark;
            height: @mark;
            margin-left: -(@mark / 2);
            text-align: center;

            &::after {
                content: "";
                position: absolute;
                top: 0;
                left: 0;
                display: block;
                width: 100%;
                height: 100%;
                background-color: var(--m-map-index-color);
                box-shadow: 1px 1px 0 var(--m-map-divider-color);
                transform: rotate(45deg);
            }
        }

        .u-index-number {
            position: absolute;
            inset: 0;
            z-index: 5;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            color: var(--m-map-index-text-color);
            font-size: 10px;
            line-height: @mark;
            text-align: center;
        }

        .u-name {
            max-width: 74px;
            margin-top: 5px;
            overflow: hidden;
            color: var(--m-map-text-color);
            font-size: 12px;
            line-height: 1.2;
            text-align: center;
            text-overflow: ellipsis;
            white-space: nowrap;
            transform: scale(0.9);
        }

        .u-gift {
            width: 160px;
            margin-top: -5px;
            overflow: hidden;
            color: var(--m-map-warning-color);
            font-size: 20px;
            line-height: 1.2;
            text-align: center;
            text-overflow: ellipsis;
            white-space: nowrap;
            transform: scale(0.5);
        }

        .u-coin {
            margin-left: 5px;
            color: var(--m-map-warning-color-suppl);
        }

        .u-elite {
            display: none;
            position: absolute;
            top: -@border;
            z-index: 0;
            width: @elite;
            height: @elite * 0.9;
            background-color: var(--m-map-index-active-color);
            clip-path: polygon(25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%, 0 50%);
            transform: rotate(90deg);
        }

        &.is-effect {
            .u-index::after {
                background-color: var(--m-map-index-active-color);
            }

            .u-index-number {
                color: var(--m-map-effect-index-text-color);
            }
        }

        &.is-elite {
            .u-elite {
                display: block;
            }
        }
    }

    .u-list {
        @line-color: var(--m-map-border-color);

        .u-row:not(:last-of-type)::after {
            content: "";
            position: absolute;
            top: 16px;
            right: -15px;
            width: 1px;
            height: 95px;
            background-color: @line-color;
        }

        .u-row.is-reverse:not(:last-of-type)::after {
            right: auto;
            left: -15px;
        }

        .u-row:not(:last-of-type) .u-column::after {
            content: "";
            position: absolute;
            top: 16px;
            right: -15px;
            width: 20px;
            height: 1px;
            background-color: @line-color;
        }

        .u-row.is-reverse:not(:last-of-type) .u-column::after {
            right: auto;
            left: -15px;
        }

        .u-row:not(.is-reverse):not(:first-of-type) .u-column:first-of-type::before {
            content: "";
            position: absolute;
            top: 16px;
            left: -15px;
            width: 15px;
            height: 1px;
            background-color: @line-color;
        }

        .u-row.is-reverse:not(:last-of-type) .u-column:last-of-type::before {
            content: "";
            position: absolute;
            top: 16px;
            left: -15px;
            width: 15px;
            height: 1px;
            background-color: @line-color;
        }

        &.is-odd .u-row:last-of-type .u-column:not(:last-of-type)::after,
        &.is-even .u-row:last-of-type .u-column::after {
            content: "";
            position: absolute;
            top: 16px;
            right: -15px;
            width: 20px;
            height: 1px;
            background-color: @line-color;
        }

        &.is-even .u-row:last-of-type.is-reverse .u-column::after {
            right: auto;
            left: -15px;
        }
    }
}

.m-map-tip {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-width: 240px;

    .u-top {
        display: flex;
        align-items: flex-start;
        gap: 10px;
    }

    .u-avatar {
        width: 36px;
        height: 36px;
        flex: none;
        overflow: hidden;
        border-radius: 4px;
        background: var(--n-color);

        img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
    }

    .u-right {
        display: flex;
        flex-direction: column;
        justify-content: center;
        min-width: 0;
        gap: 5px;
    }

    .u-name {
        color: var(--n-text-color);
        font-size: 13px;
        font-weight: 700;
        line-height: 1.3;
    }

    .u-desc {
        color: var(--n-text-color);
        font-size: 12px;
        line-height: 1.5;
    }

    .u-bottom {
        font-size: 12px;
        line-height: 1.5;
    }
}
</style>
