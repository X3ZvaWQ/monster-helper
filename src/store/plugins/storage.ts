import { PiniaPluginContext } from "pinia";

const storage = (context: PiniaPluginContext) => {
    const { store } = context;

    const data = localStorage.getItem(store.$id);
    if (data) {
        store.$patch(JSON.parse(data));
        console.log(`Loaded ${store.$id} from localStorage`);
    }

    store.$subscribe((_mutation, state) => {
        localStorage.setItem(store.$id, JSON.stringify(state));
    });
};

export default storage;
