<script setup>
const props = defineProps({
  modelValue: { type: Number, default: 0 },
});
const emit = defineEmits(["update:modelValue"]);

const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "000", "0", "back"];

function press(key) {
  const current = String(props.modelValue || 0);
  if (key === "back") {
    const next = current.slice(0, -1);
    emit("update:modelValue", Number(next || 0));
    return;
  }
  const base = current === "0" ? "" : current;
  const next = base + key;
  // 9 xonagacha (~999 mln so'm) — real bo'lmagan qiymatlarning oldini olish
  if (next.replace(/\D/g, "").length > 9) return;
  emit("update:modelValue", Number(next));
}
</script>

<template>
  <div class="grid grid-cols-3 gap-2">
    <button v-for="k in keys" :key="k" type="button" @click="press(k)"
      class="flex h-14 items-center justify-center rounded-xl bg-secondary text-lg font-medium text-gray-900 transition-all hover:bg-primary/15 active:scale-95">
      <svg v-if="k === 'back'" viewBox="0 0 24 24" class="h-5 w-5 text-destructive" fill="none"
        stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" /><line x1="18" y1="9" x2="12" y2="15" />
        <line x1="12" y1="9" x2="18" y2="15" />
      </svg>
      <span v-else>{{ k }}</span>
    </button>
  </div>
</template>
