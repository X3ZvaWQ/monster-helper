<template>
    <n-flex class="m-book-container" vertical :size="6">
        <n-flex
            class="m-book-item"
            :class="`quality-${book.itemQuality}`"
            :size="6"
            :align="'center'"
            v-for="(book, index) in renderBookItem"
            :key="index"
        >
            <img class="u-icon size-[24px]" :src="iconLink(book.iconId)" alt="" />
            <span class="u-name">{{ book.itemName }}</span>
        </n-flex>
    </n-flex>
</template>

<script setup lang="ts">
import { MonsterSkillBook } from "@/services/game";
import { useGameStore } from "@/store/game";
import { iconLink } from "@/utils/game";

const props = defineProps<{
    books: SkillBook[];
}>();
const renderBookItem = computed(() => {
    const result: MonsterSkillBook[] = [];
    for (const book of props.books) {
        const skillBook = useGameStore().bookMap[book.id][book.level];
        if (!skillBook) continue;
        result.push(skillBook);
    }
    return result;
});
</script>

<style lang="less" scoped>
.m-book-container {
    background-color: #1c2022;
    padding: 10px;
    overflow-y: auto;
    .scrollbar();

    .m-book-item {
        &.quality-3 {
            color: rgb(0, 126, 255);
        }
        &.quality-4 {
            color: rgb(254, 45, 254);
        }

        .u-icon {
            background: transparent;
        }
    }
}
</style>
