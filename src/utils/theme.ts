import { useSettingStore } from "@/store/setting";
import { lightTheme, darkTheme, useOsTheme } from "naive-ui";

const osThemeRef = useOsTheme();
export const currentTheme = computed<typeof lightTheme | typeof darkTheme>(() => {
    let theme = useSettingStore().theme;
    // 如果主题是 os，则使用系统主题
    if (theme === "os") {
        theme = osThemeRef.value;
    }
    if (theme === "dark") return darkTheme;
    else return lightTheme;
});