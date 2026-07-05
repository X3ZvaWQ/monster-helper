<template>
    <div class="p-stat-boss">
        <n-flex class="m-toolbar" :wrap="false" :align="'center'">
            <n-button type="primary" @click="$router.back()">
                <template #icon>
                    <i-mdi:arrow-back-circle />
                </template>
                返回
            </n-button>
            <role-select
                v-model:value="selectedRoleIds"
                class="m-role-select"
                multiple
                clearable
                :max-tag-count="1"
                :max-tag-placeholder="renderRoleSelectOverflowTag"
                placeholder="选择角色"
            ></role-select>
            <n-popover trigger="click">
                <template #trigger>
                    <n-button text type="primary">
                        <i-material-symbols:settings-rounded />
                    </n-button>
                </template>
                <n-flex vertical :size="8" class="m-stat-boss-setting">
                    <n-flex justify="space-between" align="center">
                        <n-text class="flex items-center gap-1">
                            收集等级
                            <n-tooltip>
                                <template #trigger>
                                    <n-icon>
                                        <i-material-symbols:info />
                                    </n-icon>
                                </template>
                                如果某个首领的技能等级都大于该重数，则认为是已收集首领
                            </n-tooltip>
                        </n-text>
                        <n-input-number
                            v-model:value="settingStore.statBoss.collectLevel"
                            size="small"
                            :min="0"
                            :max="10"
                            :step="1"
                            :style="{ width: '100px' }"
                        ></n-input-number>
                    </n-flex>
                    <n-flex justify="space-between" align="center">
                        <n-text>隐藏不上班</n-text>
                        <n-select
                            v-model:value="dutyFloorSelectValue"
                            size="small"
                            :options="dutyFloorOptions"
                            :style="{ width: '180px' }"
                        ></n-select>
                    </n-flex>
                    <n-flex justify="space-between" align="center">
                        <n-text>显示楼层</n-text>
                        <n-select
                            v-model:value="dutyRecordFloorSelectValue"
                            size="small"
                            :options="dutyRecordFloorOptions"
                            :style="{ width: '180px' }"
                        ></n-select>
                    </n-flex>
                    <n-flex justify="space-between" align="center">
                        <n-text> 隐藏已收集技能 </n-text>
                        <n-switch
                            v-model:value="settingStore.statBoss.hiddenCollectedSkill"
                            size="small"
                            :style="{ width: '40px' }"
                        ></n-switch>
                    </n-flex>
                    <n-flex justify="space-between" align="center">
                        <n-text> 隐藏已收集首领 </n-text>
                        <n-switch
                            v-model:value="settingStore.statBoss.hiddenCollectedBoss"
                            size="small"
                            :style="{ width: '40px' }"
                        ></n-switch>
                    </n-flex>
                    <n-flex justify="space-between" align="center">
                        <n-text> 隐藏附带技能 </n-text>
                        <n-switch
                            v-model:value="settingStore.statBoss.hiddenAddon"
                            size="small"
                            :style="{ width: '40px' }"
                        ></n-switch>
                    </n-flex>
                </n-flex>
            </n-popover>
            <n-input v-model:value="searchValue" placeholder="筛选BOSS、角色、技能"></n-input>
            <n-text class="shrink-0">三本同等级技能收集提供精耐：{{ threeSkillSummary }}</n-text>
            <n-spin v-if="isLoadingWeeklyMap" size="small" />
        </n-flex>
        <div class="m-boss-list__wrapper">
            <n-empty v-if="selectedRoles.length === 0" description="请选择角色查看首领需求" />
            <n-empty v-else-if="renderData.length === 0" description="没有匹配的首领需求" />
            <div v-else class="m-boss-list">
                <n-card v-for="item in renderData" :key="item.boss" class="m-boss-card">
                    <template #header>
                        <n-flex class="m-boss-header" justify="space-between" align="center">
                            <n-flex align="center" :size="8">
                                <n-text strong>{{ item.boss }}</n-text>
                                <n-tag
                                    :type="
                                        item.dutyInfo
                                            ? item.dutyInfo.hasEliteFloor
                                                ? 'warning'
                                                : 'success'
                                            : 'default'
                                    "
                                    size="small"
                                >
                                    {{ getDutyText(item.dutyInfo) }}
                                </n-tag>
                            </n-flex>
                        </n-flex>
                    </template>
                    <div class="m-role-boss-list">
                        <div v-for="row in item.roleRows" :key="row.roleId" class="m-role-boss-row">
                            <div class="m-role-info">
                                <n-text class="u-role-name">{{ row.roleName }}</n-text>
                                <n-text depth="3" class="u-role-meta">
                                    {{ getNextCollectText(row, item.boss) }}
                                </n-text>
                                <n-text v-if="item.boss !== '恶战'" depth="3" class="u-role-meta">
                                    当前首领提供精耐：{{ row.spirit }}/{{ row.endurance }}
                                </n-text>
                                <n-text v-if="item.boss !== '恶战'" depth="3" class="u-role-meta">
                                    可传功层数：{{ skillLevelLabel[row.teachLevel] }}
                                </n-text>
                            </div>
                            <n-flex class="m-boss-skill-list">
                                <div
                                    v-for="skill in row.skillList"
                                    :key="skill.id"
                                    class="m-boss-skill"
                                    :class="{ 'is-addon': skill.isAddon }"
                                >
                                    <div class="u-icon-wrap">
                                        <n-image
                                            class="u-icon"
                                            :preview-disabled="true"
                                            :src="iconLink(gameStore.getSkillById(skill.id)?.icon)"
                                        ></n-image>
                                        <n-text class="u-level">{{ skillLevelLabel[skill.level] }}</n-text>
                                    </div>
                                    <n-text class="u-name">
                                        <n-tooltip v-if="skill.book.length > 0" placement="top">
                                            <template #trigger>
                                                <n-icon class="u-book-tip">
                                                    <i-mingcute:alert-diamond-fill />
                                                </n-icon>
                                            </template>
                                            <div class="m-boss-skill__tooltip">
                                                包里有书：{{
                                                    skill.book.map((level) => skillLevelLabel[level]).join("、")
                                                }}
                                            </div>
                                        </n-tooltip>
                                        {{ gameStore.getSkillById(skill.id)?.name }}
                                    </n-text>
                                </div>
                            </n-flex>
                        </div>
                    </div>
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
import { chain, orderBy } from "lodash";
import type { SelectOption } from "naive-ui";

const route = useRoute();
const router = useRouter();
const gameStore = useGameStore();
const roleStore = useRoleStore();
const settingStore = useSettingStore();

const searchValue = shallowRef("");
const selectedRoleIds = shallowRef<string[]>([]);
const isLoadingWeeklyMap = shallowRef(false);

const dutyFloorOptions = [
    { label: "不隐藏不上班", value: 0 },
    { label: "只看 70 层以后上班", value: 70 },
    { label: "只看 80 层以后上班", value: 80 },
    { label: "只看 90 层以后上班", value: 90 },
];

const dutyRecordFloorOptions = [
    { label: "全部楼层", value: 0 },
    { label: "仅展示 70 层以上", value: 70 },
    { label: "仅展示 80 层以上", value: 80 },
    { label: "仅展示 90 层以上", value: 90 },
];

const dutyFloorSelectValue = computed({
    get: () => settingStore.statBoss.dutyFloorLimit || 0,
    set: (value: number) => {
        settingStore.statBoss.dutyFloorLimit = value || null;
    },
});

const dutyRecordFloorSelectValue = computed({
    get: () => settingStore.statBoss.dutyRecordFloorLimit ?? 80,
    set: (value: number) => {
        settingStore.statBoss.dutyRecordFloorLimit = value;
    },
});

const selectedRoles = computed(() => {
    return selectedRoleIds.value
        .map((roleId) => roleStore.getRoleById(roleId))
        .filter((role): role is Role => Boolean(role));
});

const calcResultMap = computed(() => {
    return new Map(selectedRoles.value.map((role) => [role.id!, roleStore.calcSpiritAndEndurance(role).value]));
});

const threeSkillSummary = computed(() => {
    if (selectedRoles.value.length === 0) return "未选择角色";
    if (selectedRoles.value.length === 1) {
        const role = selectedRoles.value[0];
        return String(calcResultMap.value.get(role.id!)?.threeSkillSpiritEndurance || 0);
    }
    return `已选择 ${selectedRoles.value.length} 个角色`;
});

const weeklyDutyMap = computed(() => {
    const result = new Map<string, DutyInfo>();
    for (const floor of gameStore.monsterMap?.floors || []) {
        const bossName = floor.boss?.name;
        if (!bossName) continue;
        const info = result.get(bossName) || {
            floors: [],
            hasEliteFloor: false,
            minFloor: Number.MAX_SAFE_INTEGER,
        };
        info.floors.push(floor.floor);
        info.hasEliteFloor ||= floor.floor % 10 === 0;
        info.minFloor = Math.min(info.minFloor, floor.floor);
        result.set(bossName, info);
    }
    for (const info of result.values()) {
        info.floors.sort((a, b) => b - a);
    }
    return result;
});

const hasWeeklyDutyData = computed(() => Boolean(gameStore.monsterMap?.floors.length));

const listData = computed<ListItem[]>(() => {
    if (selectedRoles.value.length === 0) return [];

    const result: ListItem[] = [];
    const sourceBossList = [...bossList.value.filter((boss) => !boss.name.includes("恶战")), { name: "恶战" }];
    for (const { name: boss } of sourceBossList) {
        const dutyInfo = getDutyInfo(boss);
        const roleRows = selectedRoles.value
            .map((role) => createRoleRow(role, boss))
            .filter((row): row is RoleBossRow => Boolean(row));

        result.push({
            boss,
            dutyInfo,
            roleRows,
            searchKey: getSearchKey(boss, dutyInfo?.floors.join("") || ""),
        });
    }

    return orderBy(
        result,
        [
            (item) => getDutySortGroup(item),
            (item) => item.dutyInfo?.minFloor || Number.MAX_SAFE_INTEGER,
            (item) => item.boss,
        ],
        ["asc", "asc", "asc"]
    );
});

const renderData = computed<ListItem[]>(() => {
    const { collectLevel, dutyFloorLimit, hiddenAddon, hiddenCollectedBoss, hiddenCollectedSkill } =
        settingStore.statBoss;

    let result = listData.value.map((item) => ({
        ...item,
        roleRows: item.roleRows
            .map((row) => ({
                ...row,
                skillList: row.skillList.filter((skill) => {
                    if (hiddenAddon && skill.isAddon) return false;
                    if (hiddenCollectedSkill && skill.level >= collectLevel) return false;
                    return true;
                }),
            }))
            .filter((row) => row.skillList.length > 0),
    }));

    if (dutyFloorLimit !== null && hasWeeklyDutyData.value) {
        result = result.filter((item) => hasDutyFloorAfter(item.dutyInfo, dutyFloorLimit));
    }

    if (hiddenCollectedBoss) {
        result = result.filter((item) => item.roleRows.length > 0);
    }

    if (!searchValue.value) return result;

    return result
        .map((item) => {
            if (matchSearch(searchValue.value, item.searchKey)) return item;

            const roleRows = item.roleRows
                .map((row) => {
                    if (matchSearch(searchValue.value, row.searchKey)) return row;
                    const skillList = row.skillList.filter((skill) => matchSearch(searchValue.value, skill.searchKey));
                    return skillList.length ? { ...row, skillList } : null;
                })
                .filter((row): row is RoleBossRow => Boolean(row));

            return roleRows.length ? { ...item, roleRows } : null;
        })
        .filter((item): item is ListItem => Boolean(item));
});

function createRoleRow(role: Role, boss: string): RoleBossRow | null {
    const calcResult = calcResultMap.value.get(role.id!);
    if (!calcResult) return null;

    const teachLevelMap = chain(calcResult.teach)
        .map((bosses, level) => bosses.map((teachBoss) => ({ boss: teachBoss, level: Number(level) })))
        .flatten()
        .keyBy("boss")
        .mapValues("level")
        .value();

    const {
        spirit = 0,
        endurance = 0,
        collectCount = 0,
        collectLevel = 0,
        collectTotal = 0,
    } = calcResult.bossSpiritEndurance[boss] || {};

    const skillLevelMap = roleStore.getSkillLevelMap(role).value;
    const bookMap = roleStore.getBookMap(role).value;
    const skillList = orderBy(getBossSkills(boss, role), (skill) => skillLevelMap[skill.id] || 0, "desc").map(
        (skill) => {
            const level = skillLevelMap[skill.id] || 0;
            const book = Object.keys(bookMap[skill.id] || {})
                .map(Number)
                .filter((bookLevel) => bookLevel > level)
                .sort((a, b) => a - b);

            return {
                id: skill.id,
                level,
                book,
                isExtra: noSpiritEnduranceSkills.has(skill.id),
                isAddon: noThreeLevelSpiritEnduranceSkills.has(skill.id),
                searchKey: getSearchKey(skill.name),
            };
        }
    );

    return {
        roleId: role.id!,
        roleName: role.name,
        skillList,
        spirit,
        endurance,
        teachLevel: teachLevelMap[boss] || 0,
        collectCount,
        collectTotal,
        collectLevel,
        searchKey: getSearchKey(role.name),
    };
}

function getBossSkills(boss: string, role: Role) {
    const skills = gameStore.skills.filter(
        (skill) => skill.belongBoss?.includes(boss) && (skill.gender === null || skill.gender === role.gender)
    );
    const result: MonsterSkill[] = [];
    const queue = [...skills];
    while (queue.length > 0) {
        const skill = queue.shift()!;
        result.push(skill);
        // 变招贴着原技能展示，用户对照缺口时更不容易漏看。
        if (addonSkillMap.has(skill.id)) {
            const addonSkillId = addonSkillMap.get(skill.id)!;
            const addonSkill = queue.find((item) => item.id === addonSkillId);
            if (addonSkill) {
                result.push(addonSkill);
                queue.splice(queue.indexOf(addonSkill), 1);
            }
        }
    }
    return result;
}

function getDutyInfo(boss: string) {
    if (boss !== "恶战") return weeklyDutyMap.value.get(boss) || null;

    const matched = [...weeklyDutyMap.value.entries()]
        .filter(([name]) => name.includes("恶战"))
        .map(([, info]) => info);
    if (matched.length === 0) return null;

    const floors = matched.flatMap((info) => info.floors).sort((a, b) => b - a);
    return {
        floors,
        hasEliteFloor: matched.some((info) => info.hasEliteFloor),
        minFloor: Math.min(...floors),
    };
}

function getDutySortGroup(item: ListItem) {
    const { dutyFloorLimit } = settingStore.statBoss;
    if (!hasWeeklyDutyData.value) return 2;
    if (!hasDutyFloorAfter(item.dutyInfo, dutyFloorLimit)) return 2;
    return item.dutyInfo!.hasEliteFloor ? 1 : 0;
}

function hasDutyFloorAfter(dutyInfo: DutyInfo | null, floorLimit: number | null) {
    if (!dutyInfo) return false;
    if (floorLimit === null) return true;
    return dutyInfo.floors.some((floor) => floor >= floorLimit);
}

function getDutyText(dutyInfo: DutyInfo | null) {
    if (!hasWeeklyDutyData.value) return "本周地图未加载";
    if (!dutyInfo) return "本周不上班";
    const floors = getDisplayDutyFloors(dutyInfo);
    if (floors.length === 0) return "本周值班低于显示层数";
    return `本周第 ${floors.join("、")} 层上班`;
}

function getDisplayDutyFloors(dutyInfo: DutyInfo) {
    const floorLimit = settingStore.statBoss.dutyRecordFloorLimit ?? 80;
    if (!floorLimit) return dutyInfo.floors;
    return dutyInfo.floors.filter((floor) => floor >= floorLimit);
}

function getNextCollectText(row: RoleBossRow, boss: string) {
    if (boss === "恶战") return "收集进度：恶战技能";
    if (row.collectLevel > 10) return "收集进度：已满";
    const missingCount = Math.max(row.collectTotal - row.collectCount, 0);
    const nextLevel = skillLevelLabel[row.collectLevel] || "下一重";
    if (missingCount === 0) return `收集进度：${nextLevel} 已达成`;
    return `距 ${nextLevel} 收集还差 ${missingCount} 个技能`;
}

function renderRoleSelectOverflowTag(omittedOptions: SelectOption[]) {
    return h(
        resolveComponent("n-popover"),
        { trigger: "hover", placement: "bottom" },
        {
            trigger: () =>
                h(
                    resolveComponent("n-tag"),
                    { size: "small", class: "u-role-overflow-tag" },
                    { default: () => `+${omittedOptions.length}` }
                ),
            default: () =>
                h(
                    "div",
                    { class: "m-role-overflow-popover" },
                    omittedOptions.map((option) =>
                        h("div", { class: "u-role-overflow-option", key: option.value as string }, String(option.label))
                    )
                ),
        }
    );
}

function updateRouteRole(roleIds: string[]) {
    const nextRoleId = roleIds[0];
    const currentRoleId = route.params.roleId as string | undefined;
    if (nextRoleId === currentRoleId) return;
    router.replace({
        name: "stat-boss",
        params: nextRoleId ? { roleId: nextRoleId } : {},
    });
}

watch(selectedRoleIds, updateRouteRole);

onMounted(async () => {
    const routeRoleId = route.params.roleId as string | undefined;
    selectedRoleIds.value = routeRoleId ? [routeRoleId] : [];
    isLoadingWeeklyMap.value = true;
    try {
        await gameStore.fetchWeeklyMonsterMap();
    } catch (error) {
        console.error(error);
    } finally {
        isLoadingWeeklyMap.value = false;
    }
});

interface DutyInfo {
    floors: number[];
    hasEliteFloor: boolean;
    minFloor: number;
}

interface ListItem {
    boss: string;
    dutyInfo: DutyInfo | null;
    roleRows: RoleBossRow[];
    searchKey: string;
}

interface RoleBossRow {
    roleId: string;
    roleName: string;
    skillList: SkillItem[];
    teachLevel: number;
    spirit: number;
    endurance: number;
    collectCount: number;
    collectLevel: number;
    collectTotal: number;
    searchKey: string;
}

interface SkillItem {
    id: number;
    level: number;
    book: number[];
    isExtra: boolean;
    isAddon: boolean;
    searchKey: string;
}
</script>
<style lang="less" scoped>
.p-stat-boss {
    display: flex;
    flex-direction: column;
    height: 100%;
    gap: 16px;

    .m-toolbar {
        min-height: 34px;
    }

    .m-role-select {
        max-width: 320px;
        min-width: 240px;
    }

    :global(.u-role-overflow-tag) {
        cursor: default;
    }

    :global(.m-role-overflow-popover) {
        display: flex;
        flex-direction: column;
        gap: 6px;
        max-width: 220px;
    }

    :global(.u-role-overflow-option) {
        max-width: 200px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 12px;
    }

    .m-stat-boss-setting {
        min-width: 280px;
    }

    .m-boss-list__wrapper {
        .scrollbar();
        flex-grow: 1;
        height: 0;
        overflow-y: auto;
    }

    .m-boss-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(620px, 1fr));
        gap: 16px;
    }

    .m-boss-card {
        min-width: 620px;
    }

    .m-boss-header {
        font-size: 14px;
    }

    .m-role-boss-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .m-role-boss-row {
        display: grid;
        grid-template-columns: 180px minmax(0, 1fr);
        gap: 16px;
        align-items: center;
        padding-bottom: 12px;
        border-bottom: 1px solid var(--n-border-color);

        &:last-child {
            padding-bottom: 0;
            border-bottom: 0;
        }
    }

    .m-role-info {
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .u-role-name {
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-weight: 600;
    }

    .u-role-meta {
        font-size: 12px;
        line-height: 1.4;
    }

    .m-boss-skill-list {
        display: flex;
        gap: 16px;
        align-items: center;
        min-width: 0;
        overflow-x: auto;
        padding-bottom: 4px;
    }

    .m-boss-skill {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        position: relative;
        flex: 0 0 58px;

        &.is-addon {
            opacity: 0.5;
        }

        .u-icon-wrap {
            position: relative;
            width: 46px;
            height: 46px;
            overflow: hidden;
            border-radius: 8px;
            border: 1px solid var(--n-border-color);
            background: var(--n-color-modal);
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.18);
        }

        .u-icon {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .u-level {
            position: absolute;
            right: 2px;
            top: 2px;
            min-width: 22px;
            padding: 1px 4px;
            border-radius: 4px;
            background: rgba(0, 0, 0, 0.72);
            border: 1px solid rgba(255, 255, 255, 0.35);
            color: white;
            font-size: 11px;
            font-weight: 700;
            line-height: 14px;
            text-align: center;
            text-shadow: none;
        }

        .u-name {
            font-size: 12px;
            max-width: 58px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            display: flex;
            align-items: center;
            gap: 2px;
        }

        .u-book-tip {
            position: absolute;
            top: 2px;
            left: 2px;
            flex-shrink: 0;
            font-size: 16px;
            color: white;
            padding: 1px;
            border-radius: 50%;
            background: rgba(0, 0, 0, 0.62);
            animation: bookTip 0.25s infinite;
            text-shadow: none;
        }

        @keyframes bookTip {
            0% {
                transform: scale(1);
            }
            50% {
                transform: scale(1.3);
            }
            100% {
                transform: scale(1);
            }
        }
    }
}
</style>
