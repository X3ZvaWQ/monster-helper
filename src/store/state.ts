// 本地状态，用于保存远程同步配置等~
export const useStateStore = defineStore("state", {
    state: () => ({
        lastCheckUpdate: 0, // 上次检查更新的时间
    }),
});
