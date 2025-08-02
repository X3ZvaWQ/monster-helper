<template>
    <div class="p-stat-boss">
        <n-flex class="m-toolbar" :wrap="false" :align="'center'">
            <n-button type="primary" @click="$router.back()">
                <template #icon>
                    <i-mdi:arrow-back-circle />
                </template>
                返回
            </n-button>
            <role-select class="m-role-select" v-model:value="roleId"></role-select>
            <n-popover trigger="click">
                <template #trigger>
                    <n-button text type="primary">
                        <i-material-symbols:settings-rounded />
                    </n-button>
                </template>
                <n-flex vertical :size="6" class="m-stat-boss-setting">
                    <n-flex justify="space-between">
                        <n-text class="flex items-center gap-1">
                            收集等级
                            <n-tooltip>
                                <template #trigger>
                                    <n-icon>
                                        <i-material-symbols:info />
                                    </n-icon>
                                </template>
                                <n-text>如果某个首领的技能等级都大于该重数，则认为是已收集首领</n-text>
                            </n-tooltip>
                        </n-text>
                        <n-input-number
                            v-model:value="useSettingStore().statBoss.collectLevel"
                            size="small"
                            :min="0"
                            :max="10"
                            :step="1"
                            :style="{ width: '100px' }"
                        ></n-input-number>
                    </n-flex>
                    <n-flex justify="space-between">
                        <n-text> 隐藏已收集技能 </n-text>
                        <n-switch
                            v-model:value="useSettingStore().statBoss.hiddenCollectedSkill"
                            size="small"
                            :style="{ width: '40px' }"
                        ></n-switch>
                    </n-flex>
                    <n-flex justify="space-between">
                        <n-text> 隐藏已收集首领 </n-text>
                        <n-switch
                            v-model:value="useSettingStore().statBoss.hiddenCollectedBoss"
                            size="small"
                            :style="{ width: '40px' }"
                        ></n-switch>
                    </n-flex>
                    <n-flex justify="space-between">
                        <n-text> 隐藏附带技能 </n-text>
                        <n-switch
                            v-model:value="useSettingStore().statBoss.hiddenAddon"
                            size="small"
                            :style="{ width: '40px' }"
                        ></n-switch>
                    </n-flex>
                </n-flex>
            </n-popover>
            <n-input v-model:value="searchValue" placeholder="筛选BOSS、技能"></n-input>
            <n-text class="shrink-0">三本同等级技能收集提供精耐： {{ calcResult?.threeSkillSpiritEndurance }}</n-text>
        </n-flex>
        <div class="m-boss-list__wrapper">
            <div class="m-boss-list" v-if="renderData">
                <n-card v-for="item in renderData" :key="item.boss" class="m-boss-card">
                    <template #header>
                        <n-flex class="m-boss-header" justify="space-between" align="center">
                            <n-flex>
                                <n-text>{{ item.boss }}</n-text>
                                <template v-if="item.boss != '恶战'">
                                    <n-text>{{ item.collectCount }} / {{ item.collectTotal }}</n-text>
                                    <n-text>→【{{ skillLevelLabel[item.collectLevel] }}】</n-text>
                                </template>
                            </n-flex>
                            <n-flex v-if="item.boss != '恶战'">
                                <n-text>提供精耐：{{ item.spirit }}/{{ item.endurance }}</n-text>
                                <n-text>可传功：{{ skillLevelLabel[item.teachLevel!] }}</n-text>
                            </n-flex>
                        </n-flex>
                    </template>
                    <n-flex class="m-boss-skill-list">
                        <div
                            class="m-boss-skill"
                            v-for="skill in item.skillList"
                            :key="skill.id"
                            :class="{ 'is-addon': noThreeLevelSpiritEnduranceSkills.has(skill.id) }"
                        >
                            <n-text class="u-level">{{ skillLevelLabel[skill.level] }}</n-text>
                            <n-image
                                class="u-icon"
                                :preview-disabled="true"
                                :src="iconLink(useGameStore().getSkillById(skill.id)?.icon)"
                            ></n-image>
                            <n-text class="u-name">{{ useGameStore().getSkillById(skill.id)?.name }}</n-text>
                        </div>
                    </n-flex>
                </n-card>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import {
    addonSkillMap,
    bossList,
    noSpiritEnduranceSkills,
    noThreeLevelSpiritEnduranceSkills,
    skillLevelLabel,
} from "@/assets/data/game";
import { useGameStore } from "@/store/game";
import { useRoleStore } from "@/store/role";
import { useSettingStore } from "@/store/setting";
import { iconLink } from "@/utils/game";
import { getSearchKey, matchSearch } from "@/utils/search";
import { chain, cloneDeep, orderBy } from "lodash";

const searchValue = ref<string>("");
const roleId = ref<string>("");

const role = computed(() => {
    return useRoleStore().getRoleById(roleId.value);
});
const calcResult = computed(() => {
    if (!role.value) return null;
    return useRoleStore().calcSpiritAndEndurance(role.value);
});
const listData = computed(() => {
    if (!role.value || !calcResult.value) return null;
    const result = [];
    const teachLevelMap = chain(calcResult.value.teach)
        .map((bossList, level) => bossList.map((boss) => ({ boss, level: Number(level) })))
        .flatten()
        .keyBy("boss")
        .mapValues("level")
        .value();
    for (const { name: boss } of [...bossList.filter((b) => !b.name.includes("恶战")), { name: "恶战" }]) {
        const {
            spirit = 0,
            endurance = 0,
            collectCount = 0,
            collectLevel = 0,
            collectTotal = 0,
        } = calcResult.value.bossSpiritEndurance[boss] || [];

        const item = {
            boss,
            skillList: [],
            spirit,
            endurance,
            teachLevel: teachLevelMap[boss] || 0,
            collectCount,
            collectTotal,
            collectLevel,
            searchKey: getSearchKey(boss),
        } as ListItem;
        const _skills = useGameStore().skills.filter(
            (s) => s.belongBoss?.includes(boss) && (s.gender === null || s.gender == role.value!.gender)
        );
        const skills: MonsterSkill[] = [];
        while (_skills.length > 0) {
            const skill = _skills.shift()!;
            skills.push(skill);
            // 如果有变招找出来优先放入
            if (addonSkillMap.has(skill.id)) {
                const addonSkillId = addonSkillMap.get(skill.id)!;
                const addonSkill = _skills.find((s) => s.id === addonSkillId);
                if (addonSkill) {
                    skills.push(addonSkill);
                    _skills.splice(_skills.indexOf(addonSkill), 1);
                }
            }
        }

        const skillLevelMap = useRoleStore().getSkillLevelMap(role.value!);
        for (const skill of skills) {
            item.skillList.push({
                id: skill.id,
                level: skillLevelMap[skill.id] || 0,
                book: [],
                isExtra: noSpiritEnduranceSkills.has(skill.id),
                isAddon: noThreeLevelSpiritEnduranceSkills.has(skill.id),
                searchKey: getSearchKey(skill.name),
            });
        }
        item.skillList = orderBy(item.skillList, (s) => s.level, "desc");
        result.push(item);
    }
    return orderBy(result, ["collectLevel", "collectCount"], ["desc", "desc"]);
});
const renderData = computed(() => {
    let result = cloneDeep(listData.value || []);
    const { collectLevel, hiddenAddon, hiddenCollectedBoss, hiddenCollectedSkill } = useSettingStore().statBoss;
    if (hiddenAddon) {
        result.forEach((item) => {
            item.skillList = item.skillList.filter((s) => !s.isAddon);
        });
    }
    if (hiddenCollectedSkill) {
        result.forEach((item) => {
            item.skillList = item.skillList.filter((s) => s.level < collectLevel);
        });
    }
    if (hiddenCollectedBoss) {
        result = result.filter((item) => {
            return item.collectLevel - 1 < collectLevel;
        });
    }
    if (!searchValue.value) return result;
    // 筛选
    result = result.map((boss) => {
        boss.skillList = boss.skillList.filter((skill) => matchSearch(searchValue.value, skill.searchKey));
        return boss;
    });
    // 技能组为空且boss本身没有匹配到则过滤掉
    result = result.filter((item) => {
        return item.skillList.length > 0 || matchSearch(searchValue.value, item.searchKey);
    });

    return result;
});

interface ListItem {
    boss: string;
    skillList: {
        id: number;
        level: number;
        book: number[];
        isExtra: boolean; // 是否是变招，即不计算精耐
        isAddon: boolean; // 是否是附加的防御技能
        searchKey: string; // 用于搜索的关键字
    }[];
    teachLevel?: number; // 可传功等级
    spirit: number;
    endurance: number;
    collectCount?: number;
    collectLevel: number;
    collectTotal?: number;
    searchKey: string; // 用于搜索的关键字
}

// 路由参数与当前角色ID的双向绑定
const router = useRouter();
watch(
    () => roleId.value,
    (newRoleId) => {
        if (newRoleId != route.params.roleId) {
            router.replace({ name: "stat-boss", params: { roleId: newRoleId } });
        }
    }
);
const route = useRoute();
onMounted(() => {
    roleId.value = route.params.roleId as string;
});
</script>

<style lang="less" scoped>
.p-stat-boss {
    display: flex;
    flex-direction: column;
    height: 100%;
    gap: 16px;

    .m-role-select {
        max-width: 200px;
    }

    .m-boss-list__wrapper {
        .scrollbar();
        flex-grow: 1;
        height: 0;
        overflow-y: auto;
    }

    .m-boss-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(520px, 1fr));
        gap: 16px;
    }

    .m-boss-skill-list {
        display: flex;
        gap: 20px;
        align-items: center;
    }

    .m-boss-card {
        flex-grow: 1;
        min-width: 520px;
        max-width: 800px;
    }

    .m-boss-header {
        font-size: 14px;
    }

    .m-boss-skill {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        position: relative;

        &.is-addon {
            opacity: 0.5;
        }

        .u-icon {
            width: 48px;
            height: 48px;
            object-fit: cover;
        }

        .u-level {
            position: absolute;
            top: 0;
            right: 0;
            font-size: 12px;
            // 黑色轮廓
            text-shadow: -1px -1px 0 black, 1px -1px 0 black, -1px 1px 0 black, 1px 1px 0 black;
            color: white;
            
        }

        .u-name {
            font-size: 12px;
            max-width: 48px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
    }
}
</style>
