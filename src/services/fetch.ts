declare global {
    interface Window {
        __TAURI_INTERNALS__?: boolean;
    }
}

export const fetch = window.__TAURI_INTERNALS__ ? await import('@tauri-apps/plugin-http').then(m => m.fetch) : window.fetch;