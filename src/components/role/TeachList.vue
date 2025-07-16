<template>
    <n-flex vertical class="m-role-teach-list">
        <n-flex v-for="[level, bosses] in teachList" :key="level">
            <n-text>{{ skillLevelLabel[level] }}</n-text>
            <n-tag size="small" type="info" v-for="(boss, index) in bosses" :key="index">
                {{ boss }}
            </n-tag>
        </n-flex>
    </n-flex>
</template>

<script setup lang="ts">
import { skillLevelLabel } from "@/assets/data/game";
defineProps<{
    teachList: [number, string[]][];
}>();
</script>

<style lang="less" scoped>
.m-role-teach-list {
    max-width: 400px;
}
</style>
