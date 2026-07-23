<script setup>
defineProps({
  businessName: { type: String, required: true },
  businessAddress: { type: String, default: "" },
  date: { type: String, required: true },
  time: { type: String, required: true },
  cashierName: { type: String, required: true },
  customerName: { type: String, required: true },
  membershipType: { type: String, default: "" },
  serviceName: { type: String, required: true },
  price: { type: Number, required: true },
  percent: { type: Number, required: true },
  discountAmount: { type: Number, required: true },
  total: { type: Number, required: true },
});

function fmt(n) {
  return Number(n || 0).toLocaleString("ru-RU");
}

// Chekdagi QR — dekorativ, pseudo-tasodifiy panjara (haqiqiy backend integratsiyasida
// mijozning chek/tasdiqlash linki shu joyga chiqadi).
const cells = Array.from({ length: 49 }, (_, i) => (i * 17 + 3) % 5 === 0 || (i * 11) % 7 === 0);
</script>

<template>
  <div class="rounded-2xl bg-card p-5 shadow-sm">
    <div class="mb-4 text-center">
      <h3 class="text-lg font-bold">Savin</h3>
      <p class="text-xs text-muted">{{ businessName }}</p>
      <p v-if="businessAddress" class="text-xs text-muted">{{ businessAddress }}</p>
    </div>

    <div class="space-y-1.5 border-b border-dashed border-border pb-3 text-sm">
      <div class="flex justify-between"><span class="text-muted">Sana</span><span>{{ date }}</span></div>
      <div class="flex justify-between"><span class="text-muted">Vaqt</span><span>{{ time }}</span></div>
      <div class="flex justify-between"><span class="text-muted">Kassir</span><span>{{ cashierName }}</span></div>
      <div class="flex justify-between"><span class="text-muted">Mijoz</span><span>{{ customerName }}</span></div>
      <div v-if="membershipType" class="flex justify-between">
        <span class="text-muted">A'zolik</span><span>{{ membershipType }}</span>
      </div>
    </div>

    <div class="space-y-1.5 border-b border-dashed border-border py-3 text-sm">
      <div class="flex justify-between">
        <span>{{ serviceName }}</span><span>{{ fmt(price) }}</span>
      </div>
      <div class="flex justify-between text-destructive">
        <span>Chegirma ({{ percent }}%)</span><span>-{{ fmt(discountAmount) }}</span>
      </div>
    </div>

    <div class="flex items-center justify-between py-3">
      <span class="font-semibold">Jami</span>
      <div class="text-right">
        <p class="text-lg font-bold text-success">{{ fmt(total) }} so'm</p>
        <p class="text-xs text-muted">To'lov: naqd</p>
      </div>
    </div>

    <div class="flex flex-col items-center gap-2 py-2">
      <div class="grid grid-cols-7 grid-rows-7 gap-[1px] rounded-lg bg-white p-2 ring-1 ring-border">
        <span v-for="(on, i) in cells" :key="i" class="h-2 w-2" :class="on ? 'bg-gray-900' : 'bg-white'"></span>
      </div>
      <p class="text-center text-xs text-muted">Savin orqali<br />Rahmat! Qaytib keling</p>
    </div>

    <button
      class="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-150 hover:bg-primary/90 active:scale-95"
      @click="$emit('print')">
      <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round">
        <path d="M6 9V3h12v6" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
        <rect x="6" y="14" width="12" height="8" />
      </svg>
      Chekni chiqarish
    </button>
  </div>
</template>
