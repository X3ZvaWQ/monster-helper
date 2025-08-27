import { defaultStatColumns } from "@/assets/data/setting";
import { cloneDeep } from "lodash";

export const useSettingStore = defineStore("setting", {
    state: () => ({
        theme: "light" as "light" | "dark" | "os" | null,
        menu: {
            collapsed: false,
        },
        role: {
            meta: "server" as "server" | "cd",
        },
        stat: {
            columns: cloneDeep(defaultStatColumns),
            style: {
                color: null as string | null,
                fontSize: null as number | null,
                fontWeight: null as number | null,
            },
            background: [
                {
                    level: 10,
                    color: "#FC9C2D8A",
                },
                {
                    level: 9,
                    color: "#9A11988A",
                },
            ] as { level: number | null; color: string }[],
            skillColumnWidth: 40 as number, // 技能列宽
        },
        statBoss: {
            collectLevel: 9 as number, // 收集等级
            hiddenCollectedSkill: true as boolean, // 隐藏已收集
            hiddenCollectedBoss: true as boolean, // 隐藏已收集
            hiddenAddon: false as boolean, // 隐藏附带的防御技能
        },
    }),
});
