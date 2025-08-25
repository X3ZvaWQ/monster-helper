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
            <span class="u-count">x {{ book.count }}</span>
            <n-button @click="emits('use-book', book)" text>
                <template #icon>
                    <i-lets-icons:ticket-use />
                </template>
            </n-button>
        </n-flex>
    </n-flex>
</template>

<script setup lang="ts">
import { MonsterSkillBook } from "@/services/game";
import { useGameStore } from "@/store/game";
import { iconLink } from "@/utils/game";
import { groupBy } from "lodash";

const props = defineProps<{
    books: SkillBook[];
}>();
const renderBookItem = computed(() => {
    const result: MonsterSkillBook[] = [];
    const bookGroup = groupBy(props.books, (b) => `${b.id}-${b.level}`);
    for (const key in bookGroup) {
        const book = bookGroup[key][0];
        const skillBook = useGameStore().bookMap[book.id][book.level];
        if (!skillBook) continue;
        result.push({ ...skillBook, count: bookGroup[key].length });
    }
    return result;
});

const emits = defineEmits<{
    (e: "use-book", book: MonsterSkillBook): void;
}>();
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

    .u-count {
        margin-right: 10px;
    }
}
</style>
