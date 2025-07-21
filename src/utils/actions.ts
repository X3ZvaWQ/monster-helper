import { openUrl as tauriOpenUrl } from "@tauri-apps/plugin-opener";
import { isTauri } from "@tauri-apps/api/core";

export const openUrl = (url: string) => {
    if (isTauri()) {
        return tauriOpenUrl(url);
    }
    return window.open(url, "_blank");
};
