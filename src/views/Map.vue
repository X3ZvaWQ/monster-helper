<template>
    <div class="p-map">
        <weekly-monster-map :map="gameStore.monsterMap" :loading="loading" @refresh="loadMap(true)" />
    </div>
</template>

<script setup lang="ts">
import WeeklyMonsterMap from "@/components/map/WeeklyMonsterMap.vue";
import { useGameStore } from "@/store/game";

const gameStore = useGameStore();
const message = useMessage();
const loading = ref(false);

const loadMap = async (force = false) => {
    if (loading.value) return;
    loading.value = true;
    try {
        await gameStore.fetchWeeklyMonsterMap(force);
        if (force) {
            message.success("本周地图已刷新");
        }
    } catch (error) {
        console.error("本周地图加载失败:", error);
        message.error(error instanceof Error ? error.message : "本周地图加载失败");
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    loadMap();
});
</script>

<style lang="less" scoped>
.p-map {
    height: 100%;
    overflow: auto;
    .scrollbar(5px);
}
</style>
