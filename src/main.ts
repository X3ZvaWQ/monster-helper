import { createApp } from "vue";
import App from "./App.vue";
import "tailwindcss/index.css";
import { createRouter } from "./router";
import { createPinia } from 'pinia'
import storage from "./store/plugins/storage.ts";

const app = createApp(App);

const router = createRouter();
app.use(router);

const pinia = createPinia()
pinia.use(storage);
app.use(pinia);

app.mount("#app");
