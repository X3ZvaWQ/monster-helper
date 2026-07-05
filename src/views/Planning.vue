<template>
    <div class="p-planning">
        <team-planner-panel :map="gameStore.monsterMap" :loading="loading" @refresh="loadData(true)" />
    </div>
</template>

<script setup lang="ts">
import TeamPlannerPanel from "@/components/planning/TeamPlannerPanel.vue";
import { useGameStore } from "@/store/game";

const gameStore = useGameStore();
const message = useMessage();
const loading = ref(false);

const loadData = async (force = false) => {
    if (loading.value) return;
    loading.value = true;
    try {
        await gameStore.fetchSkills();
        await gameStore.fetchWeeklyMonsterMap(force);
        if (force) {
            message.success("规划数据已刷新");
        }
    } catch (error) {
        console.error("规划数据加载失败:", error);
        message.error(error instanceof Error ? error.message : "规划数据加载失败");
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    loadData();
});
</script>

<style lang="less" scoped>
.p-planning {
    height: 100%;
    overflow-y: auto;
    .scrollbar();
}
</style>
