import { defaultStatColumns } from "@/assets/data/setting";
import { cloneDeep } from "lodash";

// 用户设置，随导入导出走的
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
            enableEdit: false as boolean,
            dragSortList: [] as string[],
            enableDragSort: false as boolean,
            enableSelect: false as boolean,
            selectRoles: [] as string[],
            hiddenSelected: false as boolean, // 隐藏选择项
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
            sort: [],
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
