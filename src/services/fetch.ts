declare global {
    interface Window {
        __TAURI_INTERNALS__?: boolean;
    }
}

import { fetch as tauriFetch } from '@tauri-apps/plugin-http';

export const fetch = window.__TAURI_INTERNALS__ ? tauriFetch : window.fetch;