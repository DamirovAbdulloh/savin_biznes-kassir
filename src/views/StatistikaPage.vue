<script setup>
import { ref, computed, onMounted, watch, nextTick } from "vue";
import DashboardLayout from "@/layouts/DashboardLayout.vue";
import PageHeader from "@/components/PageHeader.vue";
import AppCard from "@/components/AppCard.vue";
import { historyApi } from "@/api";
import { groupByDay, topCashiers, topClients, summarize } from "@/utils/stats";

function fmt(n) {
  // Barcha qiymatlar so'm (butun valyuta) — o'rtacha chek kasr bilan chiqmasligi
  // uchun butun songa yaxlitlanadi (masalan 43 833,333 emas, 43 833).
  return Math.round(Number(n || 0)).toLocaleString("ru-RU");
}
function initials(name) {
  return (name || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// MUHIM: backend'da alohida "statistika" endpointi umumiy jami/kunlik/top
// ma'lumotlarni bermaydi (faqat davr bo'yicha yig'indi qaytaradi). Shuning uchun
// tanlangan davrdagi to'liq chegirma tarixini yuklab, kerakli ko'rsatkichlarni
// shu yerda hisoblaymiz.
const ranges = [
  { label: "Hafta", days: 7 },
  { label: "Oy", days: 30 },
  { label: "Yil", days: 365 },
];
const range = ref(ranges[0]);
const rangeIndex = computed(() =>
  ranges.findIndex((r) => r.label === range.value.label),
);

const totals = ref({
  totalVisits: 0,
  avgCheck: 0,
  totalIncome: 0,
  discountsGiven: 0,
});
const weekdayVisits = ref([]);
const topServices = ref([]); // amalda: top kassirlar
const activeClients = ref([]);

const maxVisits = computed(() =>
  Math.max(1, ...weekdayVisits.value.map((x) => x.visits)),
);
const yTicks = computed(() => {
  const top = Math.ceil(maxVisits.value / 20) * 20 || 100;
  return [
    top,
    Math.round(top * 0.7),
    Math.round(top * 0.5),
    Math.round(top * 0.2),
    0,
  ];
});

const barsGrown = ref(false);
const fillsGrown = ref(false);
const hoveredDay = ref(null);
const loaded = ref(false);

async function load() {
  loaded.value = false;
  barsGrown.value = false;
  fillsGrown.value = false;

  const since = new Date();
  since.setDate(since.getDate() - (range.value.days - 1));
  const dateFrom = since.toISOString().slice(0, 10);

  const rows = await historyApi.list({
    date_from: dateFrom,
    ordering: "-used_at",
  });

  totals.value = summarize(rows);
  // Grafik doim oxirgi 7 kunlik kesimni ko'rsatadi (uzun davrlarda kunlik
  // taqsimot ma'noli bo'lmay qoladi).
  weekdayVisits.value = groupByDay(rows, 7);
  topServices.value = topCashiers(rows, 5);
  activeClients.value = topClients(rows, 5);

  loaded.value = true;
  await nextTick();
  requestAnimationFrame(() => {
    barsGrown.value = true;
    fillsGrown.value = true;
  });
}

onMounted(load);
watch(range, load);
</script>

<template>
  <DashboardLayout>
    <div class="space-y-4">
      <!-- Sarlavha satri teppaga va yonlarga yopishib turadi -->
      <PageHeader title="Statistika">
        <div
          class="relative flex gap-1 rounded-xl bg-secondary p-1 text-sm font-medium"
        >
          <span
            class="absolute inset-y-1 rounded-lg bg-[#89EA5C] shadow-md transition-transform duration-300 ease-[cubic-bezier(.34,1.56,.64,1)]"
            :style="{
              width: `calc((100% - 8px - ${(ranges.length - 1) * 4}px) / ${ranges.length})`,
              transform: `translateX(calc(${rangeIndex} * (100% + 4px)))`,
            }"
          ></span>
          <!-- Tugmalar TENG kenglikda (w-16) — aks holda yashil "pill" (teng
               uchdan bir) tugma matni bilan mos kelmasdi. -->
          <button
            v-for="r in ranges"
            :key="r.label"
            class="relative z-10 w-16 rounded-lg py-1.5 text-center text-sm font-medium transition-colors duration-300"
            :class="
              range.label === r.label
                ? 'text-gray-900'
                : 'text-muted hover:text-gray-900'
            "
            @click="range = r"
          >
            {{ r.label }}
          </button>
        </div>
      </PageHeader>

      <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
        <AppCard
          class="reveal border border-border p-4 text-center transition-transform duration-300 hover:-translate-y-1 hover:shadow-md"
          style="--d: 80ms"
        >
          <p class="text-xs font-medium text-gray-700">Jami tashrif</p>
          <p class="mt-1 text-2xl font-bold tabular-nums">
            {{ totals.totalVisits }}
          </p>
        </AppCard>
        <AppCard
          class="reveal border border-border p-4 text-center transition-transform duration-300 hover:-translate-y-1 hover:shadow-md"
          style="--d: 140ms"
        >
          <p class="text-xs font-medium text-gray-700">O'rtacha xaridlar cheki</p>
          <p class="mt-1 text-2xl font-bold tabular-nums">
            {{ fmt(totals.avgCheck) }} so'm
          </p>
        </AppCard>
        <AppCard
          class="reveal border border-border p-4 text-center transition-transform duration-300 hover:-translate-y-1 hover:shadow-md"
          style="--d: 200ms"
        >
          <p class="text-xs font-medium text-gray-700">Jami daromad</p>
          <p class="mt-1 text-2xl font-bold tabular-nums">
            {{ fmt(totals.totalIncome) }} so'm
          </p>
        </AppCard>
        <AppCard
          class="reveal border border-border p-4 text-center transition-transform duration-300 hover:-translate-y-1 hover:shadow-md"
          style="--d: 260ms"
        >
          <p class="text-xs font-medium text-gray-700">Berilgan chegirma summasi</p>
          <p class="mt-1 text-2xl font-bold tabular-nums">
            {{ fmt(totals.discountsGiven) }} so'm
          </p>
        </AppCard>
      </div>

      <div class="grid gap-4 lg:grid-cols-3">
        <AppCard class="reveal border border-border p-5 lg:col-span-2" style="--d: 340ms">
          <h2 class="mb-4 font-semibold">Oxirgi 7 kunlik tashriflar</h2>

          <div v-if="weekdayVisits.length" class="flex h-64 gap-3">
            <div
              class="flex flex-col justify-between py-0.5 text-xs text-muted"
            >
              <span v-for="t in yTicks" :key="t">{{ t }}</span>
            </div>

            <div
              class="relative flex flex-1 items-end justify-between gap-2 border-l border-border pl-3"
            >
              <div
                class="pointer-events-none absolute inset-0 left-3 flex flex-col justify-between py-0.5"
              >
                <span
                  v-for="t in yTicks"
                  :key="'g' + t"
                  class="border-t border-dashed border-border/60"
                ></span>
              </div>

              <div
                v-for="(w, i) in weekdayVisits"
                :key="w.day"
                class="relative z-10 flex flex-1 flex-col items-center gap-1"
                @mouseenter="hoveredDay = i"
                @mouseleave="hoveredDay = null"
              >
                <Transition name="tip">
                  <div
                    v-if="hoveredDay === i"
                    class="absolute bottom-full z-20 mb-2 whitespace-nowrap rounded-lg bg-[#1c1c1c] px-3 py-2 text-white shadow-lg"
                  >
                    <p class="text-xs font-semibold">{{ w.fullDay }}</p>
                    <p class="text-[11px] text-white/60">
                      Tashrif
                      <span class="font-semibold text-white">{{
                        w.visits
                      }}</span>
                    </p>
                    <span
                      class="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-[#1c1c1c]"
                    ></span>
                  </div>
                </Transition>

                <div
                  class="bar w-full cursor-pointer rounded-t-lg bg-primary transition-[height] duration-700 ease-out"
                  :class="
                    hoveredDay === i
                      ? 'brightness-110'
                      : hoveredDay !== null
                        ? 'opacity-60'
                        : ''
                  "
                  :style="{
                    height: barsGrown
                      ? `${(w.visits / maxVisits) * 200}px`
                      : '0px',
                    transitionDelay: `${400 + i * 70}ms`,
                  }"
                ></div>
                <span class="text-xs text-muted">{{ w.day }}</span>
              </div>
            </div>
          </div>
          <p
            v-else-if="loaded"
            class="flex h-64 items-center justify-center text-sm text-muted"
          >
            Ma'lumot yo'q
          </p>
        </AppCard>

        <AppCard class="reveal border border-border p-5" style="--d: 420ms">
          <h2 class="mb-4 font-semibold">Top kassirlar</h2>
          <ul class="space-y-3">
            <li
              v-for="(s, i) in topServices"
              :key="s.name"
              class="reveal-side group"
              :style="{ '--d': `${560 + i * 90}ms` }"
            >
              <div class="mb-1 flex justify-between text-sm">
                <span class="transition-colors group-hover:text-gray-900">{{
                  s.name
                }}</span>
                <span class="text-muted"
                  >{{ s.count }} ta ({{ s.percent }}%)</span
                >
              </div>
              <div
                class="h-1.5 w-full overflow-hidden rounded-full bg-secondary"
              >
                <div
                  class="stat-fill h-full rounded-full bg-primary transition-[width] duration-[900ms] ease-out"
                  :style="{
                    width: fillsGrown ? `${s.percent}%` : '0%',
                    transitionDelay: `${600 + i * 90}ms`,
                  }"
                ></div>
              </div>
            </li>
            <li v-if="!topServices.length" class="text-sm text-muted">
              Ma'lumot yo'q
            </li>
          </ul>
        </AppCard>
      </div>

      <AppCard class="reveal border border-border p-5" style="--d: 500ms">
        <h2 class="mb-4 font-semibold">Eng faol mijozlar</h2>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b text-left text-muted">
                <th class="pb-2 font-normal">Mijoz</th>
                <th class="pb-2 font-normal">Tashrif</th>
                <th class="pb-2 font-normal">Chegirma oldi</th>
                <th class="pb-2 font-normal">Jami daromad</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(c, i) in activeClients"
                :key="c.name"
                class="reveal-row border-b transition-colors last:border-none hover:bg-secondary/60"
                :style="{ '--d': `${620 + i * 60}ms` }"
              >
                <td class="py-3">
                  <div class="flex items-center gap-2">
                    <span
                      class="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground"
                    >
                      {{ initials(c.name) }}
                    </span>
                    {{ c.name }}
                  </div>
                </td>
                <td>{{ c.visits }}</td>
                <td>{{ fmt(c.totalDiscount) }} so'm</td>
                <td class="font-semibold">{{ fmt(c.totalIncome) }} so'm</td>
              </tr>
              <tr v-if="!activeClients.length">
                <td colspan="4" class="py-4 text-center text-muted">
                  Ma'lumot yo'q
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </AppCard>
    </div>
  </DashboardLayout>
</template>

<style scoped>
.reveal {
  animation: reveal-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: var(--d, 0ms);
}

@keyframes reveal-up {
  from {
    opacity: 0;
    transform: translateY(14px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.reveal-side {
  animation: reveal-side 0.5s ease both;
  animation-delay: var(--d, 0ms);
}

@keyframes reveal-side {
  from {
    opacity: 0;
    transform: translateX(10px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.reveal-row {
  animation: reveal-row 0.45s ease both;
  animation-delay: var(--d, 0ms);
}

@keyframes reveal-row {
  from {
    opacity: 0;
    transform: translateY(6px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.tip-enter-active,
.tip-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}

.tip-enter-from,
.tip-leave-to {
  opacity: 0;
  transform: translateY(4px) scale(0.96);
}

@media (prefers-reduced-motion: reduce) {
  .reveal,
  .reveal-side,
  .reveal-row,
  .bar,
  .stat-fill,
  .tip-enter-active,
  .tip-leave-active {
    animation: none !important;
    transition: none !important;
  }
}
</style>
