import { defineConfig } from "vite";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { NaiveUiResolver } from "unplugin-vue-components/resolvers";
import Icons from "unplugin-icons/vite";
import IconsResolver from "unplugin-icons/resolver";
import tailwindcss from "@tailwindcss/vite";

import vue from "@vitejs/plugin-vue";
import path from "path";

const host = process.env.TAURI_DEV_HOST;

// https://vitejs.dev/config/
export default defineConfig(async () => ({
    assetsInclude: ["**/*.onnx"],
    optimizeDeps: {
        exclude: ["onnxruntime-web"],
    },
    css: {
        preprocessorOptions: {
            less: {
                javascriptEnabled: true,
                additionalData: `@import "src/assets/style/common.less";`,
            },
        },
    },
    plugins: [
        vue(),
        AutoImport({
            imports: [
                "vue",
                "vue-router",
                "pinia",
                {
                    "naive-ui": [
                        "useDialog",
                        "useMessage",
                        "useNotification",
                        "useLoadingBar",
                    ],
                },
            ],
            resolvers: [
                IconsResolver({
                    prefix: "i",
                }),
            ],
            dts: "types/auto-imports.d.ts",
        }),
        Components({
            resolvers: [IconsResolver(), NaiveUiResolver()],
            dts: "types/components.d.ts",
        }),
        Icons({
            autoInstall: true,
        }),
        tailwindcss(),
    ],

    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
            "@tauri": path.resolve(__dirname, "./src-tauri"),
        },
    },

    // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
    //
    // 1. prevent vite from obscuring rust errors
    clearScreen: false,
    // 2. tauri expects a fixed port, fail if that port is not available
    server: {
        port: 1420,
        strictPort: true,
        host: host || false,
        hmr: host
            ? {
                  protocol: "ws",
                  host,
                  port: 1421,
              }
            : undefined,
        watch: {
            // 3. tell vite to ignore watching `src-tauri`
            ignored: ["**/src-tauri/**"],
        },
    },
}));
