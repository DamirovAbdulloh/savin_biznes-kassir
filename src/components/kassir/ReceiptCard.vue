<script setup>
import { computed } from "vue";

const props = defineProps({
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

defineEmits(["print"]);

function fmt(n) {
  return Number(n || 0).toLocaleString("ru-RU");
}

// Chekdagi QR — dizayndagidek ZICH, haqiqiy QR ko'rinishida (3 ta burchak
// "finder" naqshi + ma'lumot modullari). Tashqi kutubxonasiz chiziladi;
// haqiqiy backend integratsiyasida bu joyga mijozning chek/tasdiqlash
// QR-kodi qo'yiladi. Naqsh chek qiymatlaridan (jami+vaqt) kelib chiqadi —
// har chekda biroz farq qiladi, lekin bir chek uchun barqaror.
const QR_SIZE = 25;
const qrCells = computed(() => {
  const size = QR_SIZE;
  const m = Array.from({ length: size }, () => Array(size).fill(false));

  // 7x7 "finder" naqshi: tashqi halqa + markaziy 3x3
  const drawFinder = (r0, c0) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const border = r === 0 || r === 6 || c === 0 || c === 6;
        const center = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        m[r0 + r][c0 + c] = border || center;
      }
    }
  };
  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  const inFinder = (r, c) =>
    (r < 8 && c < 8) || (r < 8 && c >= size - 8) || (r >= size - 8 && c < 8);

  // Barqaror pseudo-tasodifiy ma'lumot modullari
  let seed = (Math.round(props.total) + props.time.replace(/\D/g, "") * 1 || 1) >>> 0 || 1;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (inFinder(r, c)) continue;
      m[r][c] = rnd() > 0.52;
    }
  }
  return m.flat();
});
</script>

<template>
  <div class="rounded-2xl bg-card p-5 shadow-sm">
    <div class="mb-4 text-center">
      <h3 class="text-xl font-bold tracking-tight">Savin</h3>
      <p class="text-xs text-muted">{{ businessName }}</p>
      <p v-if="businessAddress" class="text-xs text-muted">{{ businessAddress }}</p>
    </div>

    <div class="space-y-1.5 border-b border-dashed border-border pb-3 text-sm">
      <div class="flex justify-between"><span class="text-muted">Sana</span><span class="font-medium">{{ date }}</span></div>
      <div class="flex justify-between"><span class="text-muted">Vaqt</span><span class="font-medium">{{ time }}</span></div>
      <div class="flex justify-between"><span class="text-muted">Kassir</span><span class="font-medium">{{ cashierName }}</span></div>
      <div class="flex justify-between"><span class="text-muted">Mijoz</span><span class="font-medium">{{ customerName }}</span></div>
      <div v-if="membershipType" class="flex justify-between">
        <span class="text-muted">A'zolik</span><span class="font-medium">{{ membershipType }}</span>
      </div>
    </div>

    <div class="space-y-1.5 border-b border-dashed border-border py-3 text-sm">
      <div class="flex justify-between">
        <span>{{ serviceName }}</span><span class="font-medium">{{ fmt(price) }}</span>
      </div>
      <div class="flex justify-between text-destructive">
        <span>Chegirma ({{ percent }}%)</span><span>-{{ fmt(discountAmount) }}</span>
      </div>
    </div>

    <div class="flex items-center justify-between py-3">
      <span class="text-lg font-bold">Jami</span>
      <div class="text-right">
        <p class="text-xl font-bold text-success">{{ fmt(total) }} so'm</p>
        <p class="text-xs text-muted">To'lov: naqd</p>
      </div>
    </div>

    <div class="flex flex-col items-center gap-2 py-2">
      <div class="rounded-lg bg-white p-2.5 ring-1 ring-border">
        <div
          class="grid h-[132px] w-[132px]"
          :style="{ gridTemplateColumns: `repeat(${QR_SIZE}, 1fr)` }"
        >
          <span
            v-for="(on, i) in qrCells"
            :key="i"
            :class="on ? 'bg-gray-900' : 'bg-transparent'"
          ></span>
        </div>
      </div>
      <p class="text-center text-xs text-muted">Savin orqali<br />Rahmat! Qaytib keling</p>
    </div>

    <button
      class="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:opacity-90 active:scale-95"
      style="background: #89EA5C"
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
