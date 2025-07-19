import { openUrl as tauriOpenUrl } from "@tauri-apps/plugin-opener";

export const openUrl = (url: string) => {
    const isTauri = window.__TAURI_INTERNALS__;
    if (isTauri) {
        return tauriOpenUrl(url);
    }
    return window.open(url, "_blank");
};
