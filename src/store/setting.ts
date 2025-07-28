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
        statBoss: {
            collectLevel: 9 as number, // 收集等级
            hiddenCollectedSkill: true as boolean, // 隐藏已收集
            hiddenCollectedBoss: true as boolean, // 隐藏已收集
            hiddenAddon: false as boolean, // 隐藏附带的防御技能
        },
    })
});
