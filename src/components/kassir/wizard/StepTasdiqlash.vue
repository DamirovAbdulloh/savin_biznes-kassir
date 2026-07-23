<script setup>
import { computed, ref } from "vue";

const props = defineProps({
  customer: { type: Object, required: true },
  amount: { type: Number, required: true },
  percent: { type: Number, required: true },
  xizmatTuri: { type: String, default: "" },
  izoh: { type: String, default: "" },
  submitting: { type: Boolean, default: false },
});
const emit = defineEmits(["update:xizmatTuri", "update:izoh", "confirm", "back"]);

const XIZMATLAR = ["Soch olish", "Soqol", "Bola soch", "Soqol + Soch olish"];

function initials(name) {
  return (name || "?").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}
function fmt(n) {
  return Number(n || 0).toLocaleString("ru-RU");
}

const discountAmount = computed(() => Math.round((props.amount * props.percent) / 100));
const finalAmount = computed(() => props.amount - discountAmount.value);

const xizmatError = ref(false);

function handleConfirm() {
  if (!props.xizmatTuri) {
    xizmatError.value = true;
    emit("confirm", false);
    return;
  }
  xizmatError.value = false;
  emit("confirm", true);
}
</script>

<template>
  <div class="grid gap-4 md:grid-cols-2">
    <div class="rounded-2xl border border-border bg-card p-5">
      <div class="mb-5 flex items-center gap-3">
        <div class="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground">
          {{ initials(customer.full_name) }}
        </div>
        <div>
          <p class="font-semibold">{{ customer.full_name }}</p>
          <p class="text-xs text-muted">{{ customer.membership_type }} A'zo · {{ customer.member_id }}</p>
        </div>
      </div>
      <div class="space-y-2 text-sm">
        <div class="flex justify-between">
          <span class="text-muted">Asl narx</span><span class="font-medium">{{ fmt(amount) }} so'm</span>
        </div>
        <div class="flex justify-between">
          <span class="text-muted">Chegirma ({{ percent }}%)</span>
          <span class="font-medium text-destructive">-{{ fmt(discountAmount) }} so'm</span>
        </div>
        <div class="flex justify-between border-t border-border pt-2">
          <span class="font-semibold">Mijoz to'laydi</span>
          <span class="text-lg font-bold text-success">{{ fmt(finalAmount) }} so'm</span>
        </div>
      </div>
    </div>

    <div class="rounded-2xl border border-border bg-card p-5">
      <div class="mb-4 flex items-center gap-3">
        <div class="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground">
          {{ initials(customer.full_name) }}
        </div>
        <div>
          <p class="font-semibold">{{ customer.full_name }}</p>
          <p class="text-xs font-medium text-success">{{ customer.membership_type }} A'zo</p>
        </div>
      </div>

      <label class="mb-1 block text-xs font-medium text-muted">Xizmat turi *</label>
      <select :value="xizmatTuri" @change="emit('update:xizmatTuri', $event.target.value); xizmatError = false" :class="[
        'mb-3 h-10 w-full rounded-lg border bg-input px-2.5 text-sm outline-none transition-colors',
        xizmatError ? 'border-destructive ring-2 ring-destructive/20' : 'border-transparent focus:border-primary/50',
      ]">
        <option value="" disabled>Tanlang</option>
        <option v-for="x in XIZMATLAR" :key="x" :value="x">{{ x }}</option>
      </select>

      <label class="mb-1 block text-xs font-medium text-muted">Izoh</label>
      <textarea :value="izoh" @input="emit('update:izoh', $event.target.value)" rows="3"
        placeholder="Qo'shimcha izoh"
        class="mb-4 w-full resize-none rounded-lg border border-transparent bg-input px-2.5 py-2 text-sm outline-none transition-colors focus:border-primary/50"></textarea>

      <button
        class="h-11 w-full rounded-full text-sm font-semibold shadow-sm transition-all duration-150 active:scale-95 disabled:cursor-not-allowed"
        :class="xizmatTuri ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-secondary text-muted'"
        :disabled="submitting" @click="handleConfirm">
        <span v-if="submitting" class="inline-flex items-center justify-center gap-2">
          <span class="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"></span>
          Yuborilmoqda...
        </span>
        <span v-else>Tasdiqlash</span>
      </button>
      <button class="mt-2 h-9 w-full rounded-full text-sm text-muted transition-colors hover:text-gray-900"
        :disabled="submitting" @click="$emit('back')">
        Orqaga
      </button>
    </div>
  </div>
</template>
