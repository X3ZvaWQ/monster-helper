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
                    <div>{{ role.account }}</div>
                    <div class="m-role-meta">
                        <span>{{ role.server }}</span>
                        <span>
                            <i-material-symbols:male-rounded v-if="role.gender === 'male'" />
                            <i-material-symbols:female-rounded v-else />
                        </span>
                    </div>
                </div>
                <div class="m-role-title">
                    <img class="u-school-icon" :src="getSchoolIcon(role.schoolId!)" />
                    <span class="u-role-name">{{ role.name }}</span>
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
                        <span>角色技能</span>
                        <n-button text class="u-edit" @click="onUpdateSkills" size="small">
                            <template #icon>
                                <i-ant-design:edit-outlined />
                            </template>
                        </n-button>
                    </p>
                    <skill-list v-if="role?.skills?.length" class="m-role-skills" :skills="role.skills"></skill-list>
                    <div v-else class="m-empty">暂未记录技能，点击上方按钮更新技能列表</div>
                    <p class="m-section-title">
                        <span>角色背包</span>
                        <n-button text class="u-edit" size="small">
                            <template #icon>
                                <i-ant-design:edit-outlined />
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
                    <p class="m-section-title">可传功技能</p>
                    <div class="m-empty">暂无可传功技能（功能还没做~）</div>
                    <p class="m-section-title">本周进度</p>
                    <div class="m-empty">本周暂无进度（功能还没做~）</div>
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
import { useMessage } from "naive-ui";
import { ref, computed } from "vue";
import { getSchoolIcon } from "../../utils/game";
import { useRoleStore } from "../../store/role";
import SkillParse from "./SkillParse.vue";
import SkillList from "./SkillList.vue";
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
    const reuslt = useRoleStore().calcSpiritAndEndurance(role.value);
    return reuslt;
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
    .m-role-meta {
        display: flex;
        align-items: center;
        gap: 4px;
        align-items: center;
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
        color: #777;
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
        border: 1px solid #e8e8e8;
        border-radius: 4px;
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
    }
    .m-right {
        flex-grow: 1;
    }
    .m-actions {
        width: 100%;
        display: flex;
        justify-content: space-between;
    }
}
</style>
