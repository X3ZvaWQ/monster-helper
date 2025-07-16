export const useStateStore = defineStore("state", {
    state: () => ({
        lastCheckUpdate: 0, // 上次检查更新的时间
    }),
});
