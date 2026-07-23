<script setup>
defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: "" },
});
const emit = defineEmits(["close"]);
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" @click.self="emit('close')">
    <div class="w-full max-w-md rounded-3xl bg-card p-6 shadow-2xl">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-lg font-semibold">{{ title }}</h2>
        <button class="text-muted hover:text-gray-900" @click="emit('close')">✕</button>
      </div>
      <slot />
    </div>
  </div>
</template>
