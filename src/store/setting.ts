import { defaultStatColumns } from "@/assets/data/setting";
import { cloneDeep } from "lodash";

export const useSettingStore = defineStore("setting", {
    state: () => ({
        theme: "light" as "light" | "dark" | "os" | null,
        menu: {
            collapsed: false,
        },
        stat: {
            columns: cloneDeep(defaultStatColumns),
            style: {
                color: null as string | null,
                fontSize: null as number | null,
                fontWeight: null as number | null,
            },
        },
        alias: {
            boss: {} as Record<string, string>,
            skill: {} as Record<string, string>,
        },
    }),
    actions: {
        buildStatData() {},
    },
});
