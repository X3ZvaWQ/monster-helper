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
        },
    }),
    actions: {
        buildStatData() {},
    },
});
