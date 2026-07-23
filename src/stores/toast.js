import { defineStore } from "pinia";

let nextId = 1;

export const useToastStore = defineStore("toast", {
  state: () => ({
    toasts: [],
  }),
  actions: {
    push(message, variant = "default") {
      const id = nextId++;
      this.toasts.push({ id, message, variant });
      setTimeout(() => this.dismiss(id), 3500);
    },
    success(message) {
      this.push(message, "success");
    },
    error(message) {
      this.push(message, "error");
    },
    info(message) {
      this.push(message, "info");
    },
    dismiss(id) {
      this.toasts = this.toasts.filter((t) => t.id !== id);
    },
  },
});
