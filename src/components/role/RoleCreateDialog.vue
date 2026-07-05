<template>
    <n-modal
        v-model:show="visible"
        :title="isEdit ? '编辑角色' : '新建角色'"
        preset="dialog"
        positive-text="确定"
        negative-text="取消"
        :closable="true"
        :show-icon="false"
        @negative-click="visible = false"
    >
        <template #action>
            <div class="flex justify-between w-full">
                <n-button text type="primary" @click="onImport"> 导入 </n-button>
                <n-flex>
                    <n-button @click="visible = false">取消</n-button>
                    <n-button type="primary" @click="onConfirm">确定</n-button>
                </n-flex>
            </div>
        </template>
        <n-form ref="form" :model="formData" :rules="rules" label-placement="left" label-width="auto">
            <n-form-item label="id" v-if="isEdit">
                <n-input v-model:value="formData.id" disabled />
            </n-form-item>
            <n-form-item label="账号" path="account">
                <n-auto-complete
                    v-model:value="formData.account"
                    placeholder="输入游戏账号"
                    :options="accountOptions"
                />
            </n-form-item>
            <n-form-item label="区服" path="server">
                <n-select
                    v-model:value="formData.server"
                    placeholder="选择服务器"
                    :options="serverOptions"
                    :filter="optionFilter"
                    filterable
                />
            </n-form-item>
            <n-form-item label="门派" path="schoolId">
                <n-select
                    v-model:value="formData.schoolId"
                    placeholder="选择门派"
                    :options="schoolOptions"
                    :filter="optionFilter"
                    filterable
                />
            </n-form-item>
            <n-form-item label="性别" path="gender">
                <n-radio-group v-model:value="formData.gender">
                    <n-radio-button value="female" label="成女/萝莉" />
                    <n-radio-button value="male" label="成男/正太" />
                </n-radio-group>
            </n-form-item>
            <n-form-item label="可治疗">
                <n-flex align="center" :size="8">
                    <n-switch v-model:value="formData.canTreat" :disabled="!canCurrentSchoolTreat" />
                    <n-text depth="3">
                        {{ canCurrentSchoolTreat ? "该门派可切治疗心法" : "该门派暂无治疗心法" }}
                    </n-text>
                </n-flex>
            </n-form-item>

            <n-form-item label="角色名称" path="name">
                <n-input v-model:value="formData.name" placeholder="输入角色名" />
            </n-form-item>

            <n-form-item label="角色备注" path="remark">
                <n-input v-model:value="formData.remark" placeholder="输入备注" />
            </n-form-item>
        </n-form>
    </n-modal>
</template>

<script setup lang="ts">
import { cloneDeep, pick, uniq } from "lodash";
import { useRoleStore } from "../../store/role";
import serverList from "@jx3box/jx3box-data/data/server/server_std.json";
import mountMap from "@jx3box/jx3box-data/data/xf/school.json";
import { nanoid } from "nanoid";
import { getSearchKey, matchSearch } from "@/utils/search";
import type { FormInst, FormRules } from "naive-ui";
import { defaultRole } from "@/assets/data/role";
import { useRouter } from "vue-router";
import { canSchoolTreat, normalizeCanTreat } from "@/utils/role";

const router = useRouter();

// 账号选项
const accountOptions = computed(() => {
    const roles = useRoleStore().roles;
    return uniq(roles.map((role) => role.account).filter(Boolean)).map((account) => ({
        label: account,
        value: account,
    }));
});
// 服务器选项
const serverOptions = computed(() => {
    return uniq(serverList).map((server) => ({
        label: server,
        value: server,
    }));
});
// 门派选项
const schoolOptions = computed(() => {
    const schools = Object.entries(mountMap).map(([key, value]) => ({
        name: key,
        ...value,
    }));
    return schools.map((school) => ({
        label: school.name,
        value: Number(school.school_id),
    }));
});
const optionFilter = (pattern: string, option: any) => {
    return matchSearch(pattern, getSearchKey(option.label));
};

const visible = ref(false);
const form = ref<FormInst | null>(null);
const rules: FormRules = {
    account: [{ required: true, message: "请输入游戏账号", trigger: "blur" }],
    server: [{ required: true, message: "请选择所在服务器", trigger: "change" }],
    schoolId: [{ required: true, type: "number", message: "请选择门派", trigger: "change" }],
    name: [{ required: true, message: "请输入角色名", trigger: "blur" }],
};
const formData = ref(cloneDeep(defaultRole));
const onConfirm = () => {
    form.value?.validate((errors) => {
        if (!errors) {
            formData.value.canTreat = normalizeCanTreat(formData.value);
            if (!isEdit.value) {
                const role = cloneDeep(formData.value);
                role.id = nanoid();
                useRoleStore().roles.push(role);
                formData.value = cloneDeep(defaultRole);
                visible.value = false;
            } else {
                const role = useRoleStore().getRoleById(formData.value.id!)!;
                Object.assign(
                    role,
                    pick(formData.value, ["account", "server", "schoolId", "gender", "canTreat", "name", "remark"])
                );
            }
        }
    });
};
const open = (role?: Role) => {
    visible.value = true;
    if (role) {
        formData.value = cloneDeep(role);
    } else {
        formData.value = cloneDeep(defaultRole);
    }
    formData.value.canTreat = normalizeCanTreat(formData.value);
};
const isEdit = computed(() => {
    return !!formData.value.id;
});
const canCurrentSchoolTreat = computed(() => canSchoolTreat(formData.value.schoolId));

watch(
    () => formData.value.schoolId,
    (schoolId, oldSchoolId) => {
        if (!canSchoolTreat(schoolId)) {
            formData.value.canTreat = false;
            return;
        }
        if (formData.value.canTreat === undefined || !canSchoolTreat(oldSchoolId)) {
            formData.value.canTreat = true;
        }
    }
);

const onImport = () => {
    visible.value = false;
    router.push({
        name: "setting",
        query: {
            action: "import",
        },
    });
};

defineExpose({
    open,
    onConfirm,
});
</script>

<style lang="less" scoped></style>
