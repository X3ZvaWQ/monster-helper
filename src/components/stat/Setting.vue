<template>
    <n-drawer class="m-stat-setting" v-model:show="visible" :default-width="400" placement="right" resizable>
        <n-drawer-content title="表格配置">
            <n-tabs type="line" default-value="column" animated>
                <n-tab-pane name="column" tab="表格列配置">
                    <n-h6 prefix="bar" align-text> 基本信息 </n-h6>
                    <n-flex>
                        <n-button
                            :key="index"
                            v-for="(item, index) in basicSelects"
                            :type="item.check ? 'primary' : 'default'"
                            @click="onBasicSelectToggle(item)"
                        >
                            {{ item.label }}
                        </n-button>
                    </n-flex>
                    <n-h6 prefix="bar" align-text> 技能等级 </n-h6>
                    <skill-select v-model:value="skillLevelSelects"></skill-select>
                    <n-h6 prefix="bar" align-text> 已选择项目 </n-h6>
                    <vue-draggable
                        class="m-stat-setting-list"
                        v-model="useSettingStore().stat.columns"
                        handle=".drag-handle"
                    >
                        <div
                            class="m-stat-setting-item"
                            v-for="(column, index) in useSettingStore().stat.columns"
                            :key="index"
                        >
                            <i-ooui:draggable class="drag-handle" />
                            <template class="u-basic" v-if="column.type === 'basic'">
                                <i-ic:baseline-beach-access />
                                <div class="u-setting-name">{{ column.label }}</div>
                            </template>
                            <template v-if="column.type === 'skill'">
                                <n-image
                                    preview-disabled
                                    :src="iconLink(useGameStore().getSkillById(column.skillId).icon)"
                                    style="width: 20px; height: 20px"
                                >
                                </n-image>
                                <div class="u-setting-name">{{ useGameStore().getSkillById(column.skillId).name }}</div>
                            </template>
                            <n-popover trigger="click">
                                <template #trigger>
                                    <n-button text type="primary">
                                        <i-material-symbols:settings-rounded />
                                    </n-button>
                                </template>
                                <div class="m-stat-item-setting">
                                    <n-flex justify="space-between" align="center">
                                        <div class="u-item-label">文字样式</div>
                                        <div class="u-item-value">全局样式（暂不支持修改）</div>
                                    </n-flex>
                                    <n-flex justify="space-between" align="center" v-if="column.type === 'basic'">
                                        <div class="u-item-label">冻结列</div>
                                        <div class="u-item-value">
                                            <n-switch
                                                v-model:value="column.fixed"
                                                :checked-value="'left'"
                                                :default-value="undefined"
                                                size="small"
                                            />
                                        </div>
                                    </n-flex>
                                    <n-flex justify="space-between" align="center" v-if="column.type === 'skill'">
                                        <div class="u-item-label">显示图标</div>
                                        <div class="u-item-value">
                                            <n-switch v-model:value="column.withIcon" size="small" />
                                        </div>
                                    </n-flex>
                                    <n-flex
                                        justify="space-between"
                                        align="center"
                                        v-if="column.type === 'basic' && column.key === 'role'"
                                    >
                                        <div class="u-item-label">显示门派图标</div>
                                        <div class="u-item-value">
                                            <n-switch v-model:value="(column as any).withSchoolIcon" size="small" />
                                        </div>
                                    </n-flex>
                                    <n-flex justify="space-between" align="center" v-if="column.type === 'skill'">
                                        <div class="u-item-label">显示技能名</div>
                                        <div class="u-item-value">
                                            <n-switch v-model:value="column.withLabel" size="small" />
                                        </div>
                                    </n-flex>
                                    <n-flex justify="space-between" align="center">
                                        <div class="u-item-label">显示名称</div>
                                        <div class="u-item-value">
                                            <n-input
                                                v-model:value="column.label"
                                                size="small"
                                                :disabled="column.type === 'skill' && !column.withLabel"
                                            />
                                        </div>
                                    </n-flex>
                                    <n-flex justify="space-between" align="center" v-if="column.type === 'skill'">
                                        <div class="u-item-label">重数显示</div>
                                        <div class="u-item-value">
                                            <n-radio-group size="small" v-model:value="column.level">
                                                <n-radio-button value="number" label="数字" />
                                                <n-radio-button value="levelLabel" label="中文" />
                                            </n-radio-group>
                                        </div>
                                    </n-flex>
                                    <n-flex
                                        justify="space-between"
                                        align="center"
                                        v-if="column.type === 'basic' && column.key === 'teach'"
                                    >
                                        <div class="u-item-label">最小显示等级</div>
                                        <div class="u-item-value">
                                            <n-input-number
                                                v-model:value="column.minLevel"
                                                size="small"
                                                :min="0"
                                                :max="10"
                                            />
                                        </div>
                                    </n-flex>
                                    <n-flex
                                        justify="space-between"
                                        align="center"
                                        v-if="column.type === 'basic' && column.key === 'teach'"
                                    >
                                        <div class="u-item-label">渲染方式</div>
                                        <div class="u-item-value">
                                            <n-radio-group size="small" v-model:value="column.render">
                                                <n-radio-button value="text" label="文本" />
                                                <n-radio-button value="tag" label="标签" />
                                            </n-radio-group>
                                        </div>
                                    </n-flex>
                                    <n-flex
                                        justify="space-between"
                                        align="center"
                                        v-if="column.type === 'basic' && column.key === 'teach'"
                                    >
                                        <div class="u-item-label">分隔符号</div>
                                        <div class="u-item-value">
                                            <n-input size="small" v-model:value="column.split" />
                                        </div>
                                    </n-flex>
                                    <n-flex
                                        justify="space-between"
                                        align="center"
                                        v-if="column.type === 'basic' && column.key === 'teach'"
                                    >
                                        <div class="u-item-label">显示等级</div>
                                        <div class="u-item-value">
                                            <n-switch v-model:value="column.showLevel" size="small" />
                                        </div>
                                    </n-flex>
                                </div>
                            </n-popover>

                            <n-button text type="warning" @click="removeColumn(column)">
                                <i-material-symbols:delete-rounded />
                            </n-button>
                        </div>
                    </vue-draggable>
                </n-tab-pane>
                <n-tab-pane name="global" tab="全局配置">
                    <n-h6 prefix="bar" align-text> 字体样式 </n-h6>
                    <n-flex align="center" justify="center">
                        <n-text :style="previewStyle">应该会是这样~</n-text>
                    </n-flex>
                    <n-flex justify="space-between" align="center">
                        <div class="u-item-label">文字大小</div>
                        <div class="u-item-value grow">
                            <n-flex align="center" :wrap="false">
                                <n-slider
                                    v-model:value="useSettingStore().stat.style.fontSize!"
                                    :step="1"
                                    :min="8"
                                    :max="30"
                                />
                                <n-button type="primary" text @click="useSettingStore().stat.style.fontSize = null">
                                    <template #icon>
                                        <i-ic:round-clear />
                                    </template>
                                </n-button>
                            </n-flex>
                        </div>
                    </n-flex>
                    <n-flex justify="space-between" align="center">
                        <div class="u-item-label">文字粗细</div>
                        <div class="u-item-value grow">
                            <n-flex align="center" :wrap="false">
                                <n-slider
                                    v-model:value="useSettingStore().stat.style.fontWeight!"
                                    :step="100"
                                    :min="100"
                                    :max="900"
                                />
                                <n-button type="primary" text @click="useSettingStore().stat.style.fontWeight = null">
                                    <template #icon>
                                        <i-ic:round-clear />
                                    </template>
                                </n-button>
                            </n-flex>
                        </div>
                    </n-flex>
                    <n-flex justify="space-between" align="center">
                        <div class="u-item-label">文字颜色</div>
                        <div class="u-item-value grow">
                            <n-flex align="center" :wrap="false">
                                <n-color-picker v-model:value="useSettingStore().stat.style.color!" size="small" />
                                <n-button type="primary" text @click="useSettingStore().stat.style.color = null">
                                    <template #icon>
                                        <i-ic:round-clear />
                                    </template>
                                </n-button>
                            </n-flex>
                        </div>
                    </n-flex>
                </n-tab-pane>
            </n-tabs>
        </n-drawer-content>
    </n-drawer>
</template>

<script setup lang="ts">
import { useSettingStore } from "@/store/setting";
import SkillSelect from "../common/SkillSelect.vue";
import { useGameStore } from "@/store/game";
import { VueDraggable } from "vue-draggable-plus";
import { iconLink } from "@/utils/game";
import type { CSSProperties } from "vue";

// 基础信息选择项
const basicSelects = ref([
    { label: "账号", value: "account", check: false },
    { label: "区服", value: "server", check: true },
    { label: "角色", value: "role", check: true },
    { label: "门派", value: "school", check: false },
    { label: "性别", value: "gender", check: true },
    { label: "精神", value: "spirit", check: true },
    { label: "耐力", value: "endurance", check: true },
    { label: "可传功", value: "teach", check: true },
    { label: "进度", value: "cd", check: true },
    { label: "进度备注", value: "cdRemark", check: true },
    { label: "备注", value: "remark", check: true },
]);
// 技能等级选择
const skillLevelSelects = ref<number[]>([]);

// 生效列
onMounted(() => {
    // 根据columns同步选项
    basicSelects.value = basicSelects.value.map((item) => {
        return {
            ...item,
            check: useSettingStore().stat.columns.some(
                (column) => column.type === "basic" && column.key === item.value
            ),
        };
    });
    skillLevelSelects.value = useSettingStore()
        .stat.columns.filter((column) => column.type === "skill")
        .map((column) => column.skillId);
});
// 监听选项变化
const onBasicSelectToggle = (item: { label: string; value: string; check: boolean }) => {
    item.check = !item.check;
    // 更新设置
    if (!item.check) {
        // 如果取消选中，移除对应列
        useSettingStore().stat.columns = useSettingStore().stat.columns.filter(
            (column) => !(column.type === "basic" && column.key === item.value)
        );
    } else {
        // 如果选中，添加对应列
        useSettingStore().stat.columns = [
            ...(useSettingStore().stat.columns as any),
            {
                type: "basic",
                key: item.value as BasicKey,
                label: item.label,
            },
        ];
    }
};
// 更新技能等级列
watch(skillLevelSelects, () => {
    // 先移除不存在的技能列
    useSettingStore().stat.columns = useSettingStore().stat.columns.filter(
        (column) => !(column.type === "skill" && !skillLevelSelects.value.includes(column.skillId))
    );
    // 添加新增的技能列
    for (const skillId of skillLevelSelects.value) {
        if (!useSettingStore().stat.columns.some((column) => column.type === "skill" && column.skillId === skillId)) {
            useSettingStore().stat.columns.push({
                type: "skill",
                skillId,
                withIcon: true,
                width: 64,
                label: useGameStore().getSkillById(skillId).name.slice(-2),
            });
        }
    }
});
const removeColumn = (column: StatSetting) => {
    if (column.type === "basic") {
        // 基础列，取消选中，从列表中移除
        basicSelects.value = basicSelects.value.map((item) => {
            if (item.value === column.key) {
                return { ...item, check: false };
            }
            return item;
        });
        useSettingStore().stat.columns = useSettingStore().stat.columns.filter(
            (c) => !(c.type === "basic" && c.key === column.key)
        );
    } else if (column.type === "skill") {
        // 技能列，从技能选择中移除
        skillLevelSelects.value = skillLevelSelects.value.filter((id) => id !== column.skillId);
        useSettingStore().stat.columns = useSettingStore().stat.columns.filter(
            (c) => !(c.type === "skill" && c.skillId === column.skillId)
        );
    }
};

// 全局配置
const previewStyle = computed(() => {
    const style: CSSProperties = {};
    const config = useSettingStore().stat.style;
    if (config.color) style.color = config.color;
    if (config.fontSize) style.fontSize = `${config.fontSize}px`;
    if (config.fontWeight) style.fontWeight = config.fontWeight;
    return style;
});

const visible = ref(false);
const open = () => {
    visible.value = true;
};
defineExpose({ open });
</script>

<style lang="less">
.m-stat-item-setting {
    display: flex;
    flex-direction: column;
    gap: 10px;
}
.m-stat-setting {
    display: flex;
    flex-direction: column;
    gap: 10px;

    .n-tag .n-tag__content {
        display: flex;
        align-items: center;
        gap: 5px;
    }

    .m-stat-setting-list {
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding: 10px;
        border: 1px solid #aeaeae;
        border-radius: 4px;

        max-height: calc(100vh - 480px);
        overflow-y: auto;
    }

    .m-stat-setting-item {
        display: flex;
        align-items: center;
        padding: 4px 8px;
        gap: 6px;
        border-radius: 4px;
        background-color: var(--n-color);
        color: var(--n-text-color);
        transition: background-color 0.3s;

        &:hover {
            background-color: var(--n-close-color-hover);
        }

        .u-setting-name {
            flex-grow: 1;
        }

        .drag-handle {
            cursor: pointer;
        }
    }
}
</style>
