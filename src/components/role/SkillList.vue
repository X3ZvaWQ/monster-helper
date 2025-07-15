<template>
    <div class="m-skill-container">
        <div
            class="m-skill-section"
            v-for="(skills, level) in displayParseResult"
            :key="level"
        >
            <div class="m-skill-level">{{ level }}</div>
            <div class="m-skill-list">
                <div
                    class="m-skill-item"
                    v-for="(skill, index) in skills"
                    :key="index"
                >
                    <img class="u-icon" :src="iconLink(skill.icon)" alt="" />
                    <span class="u-name">{{ skill.name }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { skillLevelLabel } from "@/assets/data/game";
import { useGameStore } from "@/store/game";
import { iconLink } from "@/utils/game";
import { chain } from "lodash";
const props = defineProps<{
    skills: RoleSkill[];
}>();

const displayParseResult = computed(() => {
    return chain(props.skills)
        .map((skill) => ({
            levelLabel: skillLevelLabel[skill.level] || "未知",
            ...useGameStore().getSkillById(skill.id),
        }))
        .groupBy("levelLabel")
        .value();
}); // 技能列表
</script>

<style lang="less" scoped>
.m-skill-container {
    display: flex;
    flex-direction: column;
    gap: 8px;
    background-color: #1c2022;
    padding: 10px;
    overflow-y: auto;

    .m-skill-section {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }
    .m-skill-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
    }
    .m-skill-level {
        font-size: 14px;
        font-weight: bold;
        color: #fcfd42;
    }

    .m-skill-item {
        display: flex;
        align-items: center;
        gap: 4px;
        width: 30%;

        .u-icon {
            width: 20px;
            height: 20px;
            object-fit: cover;
        }

        .u-name {
            color: #fefefe;
        }
    }
}
</style>
