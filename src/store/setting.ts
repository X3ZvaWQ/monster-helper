import { defaultStatColumns } from "@/assets/data/setting";
import { cloneDeep } from "lodash";
import { nanoid } from "nanoid";

const createDefaultStatSetting = (): StatProfileSetting => ({
    enableEdit: false,
    dragSortList: [],
    enableDragSort: false,
    enableSelect: false,
    enableIndex: false,
    selectRoles: [],
    hiddenSelected: false,
    columns: cloneDeep(defaultStatColumns) as StatSetting[],
    hiddenCustomColumns: [],
    deletedCustomColumns: [],
    style: {
        color: null,
        fontSize: null,
        fontWeight: null,
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
    ],
    sort: [],
    skillColumnWidth: 40,
});

const createStatProfile = (name: string, stat: StatProfileSetting, isDefault = false): StatProfile => ({
    key: nanoid(),
    name,
    isDefault,
    stat: cloneDeep(stat),
});

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
        stat: createDefaultStatSetting(),
        activeStatProfileKey: "" as string,
        statProfiles: [] as StatProfile[],
        statBoss: {
            collectLevel: 9 as number, // 收集等级
            hiddenCollectedSkill: true as boolean, // 隐藏已收集
            hiddenCollectedBoss: true as boolean, // 隐藏已收集
            hiddenAddon: false as boolean, // 隐藏附带的防御技能
            dutyFloorLimit: null as number | null, // 只看指定层数之后本周上班的首领
            dutyRecordFloorLimit: 80 as number, // 0表示全部，只展示指定层数之后的值班记录
        },
        map: {
            range: "last50" as "all" | "last50" | "last30",
        },
        planning: {
            sortWeight: 0,
            boostMissingNineWithTenBook: true,
            requirements: [] as { skillId: number | null; level: number | null }[],
            requiredRoleIds: [] as string[],
        },
    }),
    actions: {
        ensureStatProfiles() {
            if (!this.stat.hiddenCustomColumns) this.stat.hiddenCustomColumns = [];
            if (!this.stat.deletedCustomColumns) this.stat.deletedCustomColumns = [];
            if (!this.statProfiles?.length) {
                const profile = createStatProfile("默认", this.stat, true);
                this.statProfiles = [profile];
                this.activeStatProfileKey = profile.key;
                return;
            }

            if (!this.statProfiles.some((profile) => profile.isDefault)) {
                this.statProfiles[0].isDefault = true;
            }

            const activeProfile = this.statProfiles.find((profile) => profile.key === this.activeStatProfileKey);
            const nextProfile = activeProfile || this.statProfiles[0];
            this.activeStatProfileKey = nextProfile.key;
            this.stat = cloneDeep(nextProfile.stat);
        },
        saveActiveStatProfile() {
            const profile = this.statProfiles.find((profile) => profile.key === this.activeStatProfileKey);
            if (!profile) return;
            profile.stat = cloneDeep(this.stat);
        },
        switchStatProfile(key: string) {
            const profile = this.statProfiles.find((profile) => profile.key === key);
            if (!profile || profile.key === this.activeStatProfileKey) return;
            this.saveActiveStatProfile();
            this.activeStatProfileKey = profile.key;
            this.stat = cloneDeep(profile.stat);
        },
        renameStatProfile(key: string, name: string) {
            const profile = this.statProfiles.find((profile) => profile.key === key);
            if (!profile) return;
            profile.name = name;
        },
        duplicateStatProfile(key: string) {
            const source = this.statProfiles.find((profile) => profile.key === key);
            if (!source) return;
            this.saveActiveStatProfile();
            const profile = createStatProfile(`${source.name || "未命名方案"} 副本`, source.stat);
            this.statProfiles.push(profile);
            this.switchStatProfile(profile.key);
        },
        deleteStatProfile(key: string) {
            const profile = this.statProfiles.find((profile) => profile.key === key);
            if (!profile || profile.isDefault || this.statProfiles.length <= 1) return;

            const fallback = this.statProfiles.find((item) => item.isDefault) || this.statProfiles[0];
            this.statProfiles = this.statProfiles.filter((item) => item.key !== key);
            if (this.activeStatProfileKey === key) {
                this.activeStatProfileKey = fallback.key;
                this.stat = cloneDeep(fallback.stat);
            }
        },
    },
});
