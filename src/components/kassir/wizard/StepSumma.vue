<script setup>
import { computed } from "vue";
import NumericKeypad from "@/components/kassir/NumericKeypad.vue";

const props = defineProps({
  modelValue: { type: Number, required: true }, // asl narx
  customer: { type: Object, required: true },
  percent: { type: Number, required: true },
});
const emit = defineEmits(["update:modelValue", "continue", "back"]);

function initials(name) {
  return (name || "?").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

function fmt(n) {
  return Number(n || 0).toLocaleString("ru-RU");
}

const discountAmount = computed(() => Math.round((props.modelValue * props.percent) / 100));
const finalAmount = computed(() => props.modelValue - discountAmount.value);
</script>

<template>
  <div class="grid gap-4 md:grid-cols-2">
    <div class="rounded-2xl border border-border bg-card p-5">
      <NumericKeypad :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)" />
    </div>

    <div class="rounded-2xl border border-border bg-card p-5">
      <div class="mb-5 flex items-center gap-3">
        <div class="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground">
          {{ initials(customer.full_name) }}
        </div>
        <div>
          <p class="font-semibold">{{ customer.full_name }}</p>
          <p class="text-xs font-medium text-success">{{ customer.membership_type }} A'zo</p>
        </div>
      </div>

      <h3 class="mb-2 text-sm font-semibold">Hisob</h3>
      <div class="space-y-2 text-sm">
        <div class="flex justify-between">
          <span class="text-muted">Asl narx</span>
          <span class="font-medium">{{ modelValue ? fmt(modelValue) + " so'm" : "-" }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-muted">Chegirma ({{ percent }}%)</span>
          <span class="font-medium text-destructive">{{ modelValue ? "-" + fmt(discountAmount) + " so'm" : "-" }}</span>
        </div>
        <div class="flex justify-between border-t border-border pt-2">
          <span class="text-muted">Mijoz to'laydi</span>
          <span class="font-semibold text-success">{{ modelValue ? fmt(finalAmount) + " so'm" : "-" }}</span>
        </div>
      </div>

      <button
        class="mt-5 h-11 w-full rounded-full text-sm font-semibold shadow-sm transition-all duration-150 active:scale-95"
        :class="modelValue > 0
          ? 'bg-primary text-primary-foreground hover:bg-primary/90'
          : 'cursor-not-allowed bg-secondary text-muted'"
        :disabled="!modelValue" @click="$emit('continue')">
        Hisoblash va davom etish
      </button>
      <button class="mt-2 h-9 w-full rounded-full text-sm text-muted transition-colors hover:text-gray-900"
        @click="$emit('back')">
        Orqaga
      </button>
    </div>
  </div>
</template>
