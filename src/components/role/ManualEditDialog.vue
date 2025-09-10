<template>
    <n-modal
        v-model:show="visible"
        title="编辑角色技能/仓库"
        preset="dialog"
        class="m-role-edit__dialog"
        :show-icon="false"
        :mask-closable="true"
        positive-text="确认"
        negative-text="取消"
        @positive-click="onOk"
        @negative-click="onCancel"
    >
        <n-flex class="m-role-edit" :size="10">
            <div class="m-skill-edit">
                <n-h6 prefix="bar">
                    技能编辑
                    <n-tooltip>
                        <template #trigger>
                            <n-button text size="tiny" type="info">
                                <template #icon>
                                    <i-material-symbols:info-rounded />
                                </template>
                            </n-button>
                        </template>
                        <div>该列会直接修改目标技能的等级</div>
                    </n-tooltip>
                </n-h6>
                <n-dynamic-input v-model:value="skillForm" :on-create="() => ({ skillId: null, level: null })">
                    <template #default="{ value }">
                        <n-flex :align="'center'" :size="6" :wrap="false">
                            <skill-select
                                class="u-skill-select"
                                v-model:value="value.skillId"
                                :multiple="false"
                                :clearable="false"
                                @change="onChangeSkill(value)"
                            ></skill-select>
                            <n-select
                                class="u-level-select"
                                v-model:value="value.level"
                                :options="getSkillLevelOptions(value.skillId)"
                                clearable
                                :disabled="!value.skillId"
                            ></n-select>
                        </n-flex>
                    </template>
                </n-dynamic-input>
            </div>
            <div class="m-book-edit">
                <n-h6 prefix="bar">
                    仓库编辑
                    <n-tooltip>
                        <template #trigger>
                            <n-button text size="tiny" type="info">
                                <template #icon>
                                    <i-material-symbols:info-rounded />
                                </template>
                            </n-button>
                        </template>
                        <div>该列的内容会直接加入到角色背包，不影响现有物品</div>
                    </n-tooltip>
                </n-h6>
                <n-dynamic-input v-model:value="bookForm" :on-create="() => ({ skillId: null, level: null })">
                    <template #default="{ value }">
                        <n-flex :align="'center'" :size="6" :wrap="false">
                            <skill-select
                                class="u-skill-select"
                                v-model:value="value.skillId"
                                :multiple="false"
                                :clearable="false"
                                @change="onChangeSkill(value)"
                            ></skill-select>
                            <n-select
                                class="u-level-select"
                                v-model:value="value.level"
                                :options="getSkillLevelOptions(value.skillId)"
                                clearable
                            ></n-select>
                        </n-flex>
                    </template>
                </n-dynamic-input>
            </div>
        </n-flex>
    </n-modal>
</template>

<script setup lang="ts">
import { skillLevelLabel } from "@/assets/data/game";
import SkillSelect from "../common/SkillSelect.vue";
import { useRoleStore } from "@/store/role";
import { keyBy } from "lodash";

const visible = ref<boolean>(false);
const roleId = ref<string>("");
const role = computed(() => {
    return useRoleStore().getRoleById(roleId.value);
});
const onChangeSkill = (value: any) => {
    nextTick(() => (value.level = getSkillLevelOptions(value.skillId)[0].value));
};
const getSkillLevelOptions = (skillId: number) => {
    const levelMap = useRoleStore().getSkillLevelMap(role.value!);
    return Array.from(skillLevelLabel.entries())
        .filter(([level]) => level > levelMap.value[skillId])
        .map(([level, label]) => ({
            value: level,
            label,
        }));
};

const skillForm = ref([
    {
        skillId: null,
        level: null,
    },
]);
const bookForm = ref([
    {
        skillId: null,
        level: null,
    },
]);

const onCancel = () => {
    visible.value = false;
};
const onOk = () => {
    visible.value = false;
    const role = useRoleStore().getRoleById(roleId.value);
    if (!role) return;
    const skillObj = keyBy(role.skills, "id");
    for (const item of skillForm.value) {
        const skill = skillObj[item.skillId!];
        if (!skill) {
            useRoleStore().updateRole(role.id!, {
                skills: [...role.skills, { id: item.skillId!, level: item.level! }],
            });
        } else {
            skill.level = item.level!;
        }
    }
    for (const book of bookForm.value) {
        if(!book.skillId || !book.level) continue;
        role.inventory.push({ id: book.skillId!, level: book.level! });
    }
};

const open = (_roleId: string) => {
    visible.value = true;
    roleId.value = _roleId;
    skillForm.value = [
        {
            skillId: null,
            level: null,
        },
    ];
    bookForm.value = [
        {
            skillId: null,
            level: null,
        },
    ];
};
defineExpose({
    open,
});
</script>

<style lang="less">
.m-role-edit__dialog.n-dialog.n-modal {
    width: 780px;
}
.m-role-edit {
    min-height: 240px;

    & > div {
        flex-grow: 1;
        flex-shrink: 0;
        width: 0;
    }

    .m-skill-edit,
    .m-book-edit {
        .u-skill-select {
            width: 140px;
        }
        .u-level-select {
            width: 90px;
        }
    }

    .n-dynamic-input {
        max-height: 400px;
        overflow-y: auto;
        .scrollbar();
    }
}
</style>
