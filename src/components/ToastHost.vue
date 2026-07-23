<script setup>
import { useToastStore } from "@/stores/toast";

const toastStore = useToastStore();

const variantClasses = {
  default: "bg-card text-gray-900 border-border",
  success: "bg-green-50 text-green-800 border-green-200",
  error: "bg-red-50 text-red-800 border-red-200",
  info: "bg-blue-50 text-blue-800 border-blue-200",
};
</script>

<template>
  <div class="fixed right-4 top-4 z-50 flex w-80 flex-col gap-2">
    <div
      v-for="t in toastStore.toasts"
      :key="t.id"
      :class="[
        'rounded-xl border px-4 py-3 text-sm shadow-lg transition-all',
        variantClasses[t.variant] || variantClasses.default,
      ]"
    >
      {{ t.message }}
    </div>
  </div>
</template>
