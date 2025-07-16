<template>
    <n-modal
        v-model:show="visible"
        title="角色详情"
        preset="dialog"
        class="m-role-detail-dialog"
        :show-icon="false"
        :mask-closable="true"
    >
        <div class="m-role-detail">
            <div class="m-role-info" v-if="role">
                <div class="m-role-account">
                    <n-flex :align="'center'" class="w-full">
                        <n-text>{{ role.account }}</n-text>
                        <n-text>{{ role.server }}</n-text>
                        <n-text>
                            <i-material-symbols:male-rounded v-if="role.gender === 'male'" />
                            <i-material-symbols:female-rounded v-else />
                        </n-text>
                        <editable-value justify="flex-end" :value="role.remark!" @update:value="role.remark = $event" />
                    </n-flex>
                </div>
                <div class="m-role-title">
                    <img class="u-school-icon" :src="schoolIconLink(role.schoolId!)" />
                    <n-text class="u-role-name">{{ role.name }}</n-text>
                    <div class="u-value">
                        <span class="u-spirit">精力：{{ spiritEndurance.spirit }}</span>
                        <span class="u-endurance">耐力：{{ spiritEndurance.endurance }}</span>
                        <n-button size="tiny" text @click="onPlanValue">
                            <i-icon-park-outline:up-c />
                        </n-button>
                    </div>
                </div>
            </div>
            <div class="m-role-detail-content">
                <div class="m-left">
                    <p class="m-section-title">
                        <n-text>角色技能</n-text>
                        <n-button text type="primary" class="u-edit" @click="onUpdateSkills" size="small">
                            <template #icon>
                                <i-material-symbols:edit-rounded />
                            </template>
                        </n-button>
                    </p>
                    <skill-list v-if="role?.skills?.length" class="m-role-skills" :skills="role.skills"></skill-list>
                    <div v-else class="m-empty">暂未记录技能，点击上方按钮更新技能列表</div>
                    <p class="m-section-title">
                        <n-text>角色背包</n-text>
                        <n-button text type="primary" class="u-edit" size="small">
                            <template #icon>
                                <i-material-symbols:edit-rounded />
                            </template>
                        </n-button>
                    </p>
                    <div v-if="role.inventory.length" class="m-role-inventory"></div>
                    <div v-else class="m-empty">
                        暂未记录仓库，点击上方按钮更新仓库列表（其实还在做）<br />
                        仓库记录主要是为了精耐规划以及后面计划的技能书需求功能~
                    </div>
                </div>
                <div class="m-right">
                    <n-text class="m-section-title">当前进度</n-text>
                    <n-flex vertical>
                        <n-flex justify="space-between">
                            <span class="u-label">当前</span>
                            <n-flex v-if="role.cd">
                                <n-text>已经打咯~</n-text>
                                <n-tooltip>
                                    <template #trigger>
                                        <n-button text size="tiny" type="info" @click="role.cd = false">
                                            <template #icon>
                                                <i-material-symbols:refresh-rounded />
                                            </template>
                                        </n-button>
                                    </template>
                                    点错了可以点这里重置到没打的状态~
                                </n-tooltip>
                            </n-flex>
                            <n-flex v-else>
                                <n-text>还没打</n-text>
                                <n-button size="tiny" type="success" @click="role.cd = true">
                                    <template #icon>
                                        <i-material-symbols:check-rounded />
                                    </template>
                                    打完咯！
                                </n-button>
                            </n-flex>
                        </n-flex>
                        <n-flex justify="space-between">
                            <span class="u-label">备注</span>
                            <editable-value
                                justify="flex-end"
                                :value="role.cdRemark!"
                                @update:value="role.cdRemark = $event"
                            />
                        </n-flex>
                    </n-flex>
                    <n-text class="m-section-title">传功</n-text>
                    <n-flex vertical>
                        <n-flex justify="space-between">
                            <span class="u-label">剩余传功计数</span>
                            <editable-value
                                type="number"
                                justify="flex-end"
                                :value="role.teachCount ?? 20"
                                @update:value="role.teachCount = $event"
                                :min="0"
                                :max="20"
                            >
                                <template #default="{ value }">
                                    <n-text>{{ value }} / 20</n-text>
                                </template>
                            </editable-value>
                        </n-flex>
                        <n-flex justify="space-between">
                            <span class="u-label">已被传功计数</span>
                            <editable-value
                                type="number"
                                justify="flex-end"
                                :value="role.taughtCount ?? 10"
                                @update:value="role.taughtCount = $event"
                                :min="0"
                                :max="10"
                            >
                                <template #default="{ value }">
                                    <n-text>{{ value }} / 10</n-text>
                                </template>
                            </editable-value>
                        </n-flex>
                    </n-flex>
                    <n-text class="u-label">可传功</n-text>
                    <teach-list class="m-teach-list" :teach-list="teachList"></teach-list>
                </div>
            </div>
        </div>
        <template #action>
            <div class="m-actions">
                <n-popconfirm @positive-click="onDelete">
                    <template #trigger>
                        <n-button secondary type="warning">删除</n-button>
                    </template>
                    确定要删除该角色吗？这个操作没有后悔药可以吃！（虽然新建一个也很简单）
                </n-popconfirm>

                <n-button @click="onClose" type="primary">了解了</n-button>
            </div>
        </template>
    </n-modal>
    <skill-parse ref="skillParse" />
</template>

<script setup lang="ts">
import SkillList from "./SkillList.vue";
import SkillParse from "./SkillParse.vue";
import EditableValue from "../common/EditableValue.vue";
import TeachList from "./TeachList.vue";

import { useMessage } from "naive-ui";
import { useRoleStore } from "../../store/role";
import { schoolIconLink } from "../../utils/game";
import { cloneDeep } from "lodash";
import { defaultRole } from "@/assets/data/role";

// 更新技能列表逻辑
const skillParse = ref<InstanceType<typeof SkillParse> | null>(null);
const onUpdateSkills = async () => {
    if (!skillParse.value) return;
    try {
        const skills = await skillParse.value.open();
        useRoleStore().updateRole(roleId.value, { skills });
    } catch (error) {
        console.error("技能更新失败:", error);
    }
};

// 对话框打开/关闭逻辑
const visible = ref(false);
const open = (id: string) => {
    visible.value = true;
    roleId.value = id;
};
const onDelete = () => {
    useRoleStore().deleteRole(roleId.value);
    visible.value = false;
    roleId.value = "";
    message.success("角色已删除");
};
const onClose = () => {
    visible.value = false;
};
// 角色信息获取
const roleId = ref<string>("");
const role = computed(() => {
    return useRoleStore().roles.find((item) => item.id === roleId.value)! || cloneDeep(defaultRole);
});
const spiritEndurance = computed(() => {
    return useRoleStore().calcSpiritAndEndurance(role.value);
});
const teachList = computed(() => {
    const result: [number, string[]][] = [];
    const calc = cloneDeep(spiritEndurance.value.teach);
    for (const [level, bosses] of calc.entries()) {
        if (level > 0 && bosses.length) {
            result.push([level, bosses]);
        }
    }
    // 从大到小排序
    result.sort((a, b) => b[0] - a[0]);
    return result;
});
const message = useMessage();
const onPlanValue = () => {
    message.info("精耐提升规划功能正在开发中，敬请期待~");
};

defineExpose({
    open,
});
</script>

<style lang="less">
.m-role-detail-dialog.n-modal {
    width: 720px !important;
}
</style>
<style lang="less" scoped>
.m-role-detail-dialog {
    .m-role-detail {
        margin-top: 10px;
        display: flex;
        flex-direction: column;
        gap: 10px;
    }
    .m-role-info {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 10px 10px 4px;
        border: 1px solid #e8e8e8;
        border-radius: 8px;
    }
    .m-role-account {
        font-size: 0.8rem;
        color: #888;
        display: flex;
        justify-content: space-between;
    }
    .m-role-title {
        display: flex;
        align-items: center;
        gap: 4px;

        .u-school-icon {
            width: 32px;
            height: 32px;
        }

        .u-role-name {
            flex-grow: 1;
        }

        .u-value {
            display: flex;
            gap: 16px;
            font-weight: bold;
        }

        .u-spirit {
            color: #8c36b6;
        }

        .u-endurance {
            color: #b17f4c;
        }
    }
    .m-section-title {
        font-weight: bold;
        font-size: 0.9rem;
        display: flex;
        align-items: center;
        gap: 6px;

        .u-edit {
            padding: 0;
        }
    }
    .m-empty {
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        line-height: 1.8;
        color: #aeaeae;
        border: var(--n-border);
        border-radius: var(--n-border-radius);
        padding: 12px 0;
    }
    .m-role-skills {
        max-height: 240px;
    }
    .m-role-inventory {
        border-radius: 8px;
        border: 1px solid #e8e8e8;
        min-height: 240px;
    }
    .m-role-detail-content {
        display: flex;
        gap: 10px;

        & > div {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
    }
    .m-left {
        width: 400px;
        flex-shrink: 0;
    }
    .m-right {
        flex-grow: 1;

        .u-label {
            opacity: 0.7;
        }
    }
    .m-teach-list {
        max-height: 160px;
        overflow-y: auto;
        .scrollbar;
    }
    .m-actions {
        width: 100%;
        display: flex;
        justify-content: space-between;
    }
}
</style>
