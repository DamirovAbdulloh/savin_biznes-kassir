import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import { vClickOutside } from "./directives/clickOutside";
import "./main.css";

const app = createApp(App);

app.use(createPinia());
app.use(router);
// Ochiladigan menyular tashqariga bosilganda yopilishi uchun
app.directive("click-outside", vClickOutside);

app.mount("#app");
