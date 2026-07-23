<script setup>
import { ref, onMounted } from "vue";
import { RouterLink } from "vue-router";
import KassirLayout from "@/layouts/KassirLayout.vue";
import AppCard from "@/components/AppCard.vue";
import { cashierApi } from "@/api";

function fmt(n) {
  return Number(n || 0).toLocaleString("ru-RU");
}
function fmtDate(d) {
  return new Date(d).toLocaleTimeString("uz-UZ", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const loading = ref(true);
const stats = ref({
  today_visits: 0,
  today_discount_amount: 0,
  today_revenue: 0,
  last_visit_time: "-",
});
const recent = ref([]);
const period = ref("bugun");
const periods = [
  { key: "bugun", label: "Bugun" },
  { key: "hafta", label: "Hafta" },
  { key: "oy", label: "Oy" },
  { key: "yil", label: "Yil" },
];

async function load() {
  loading.value = true;
  try {
    const [dash, history] = await Promise.all([
      cashierApi.dashboard(),
      cashierApi.history(),
    ]);
    stats.value = dash;
    recent.value = history.slice(0, 8);
  } finally {
    loading.value = false;
  }
}
onMounted(load);

const statCards = [
  { key: "today_visits", label: "Tashriflar", format: (v) => `${v} ta` },
  {
    key: "today_discount_amount",
    label: "Berilgan chegirma",
    format: (v) => `${fmt(v)} so'm`,
  },
  { key: "today_revenue", label: "Daromad", format: (v) => `${fmt(v)} so'm` },
  { key: "last_visit_time", label: "Oxirgi tashrif", format: (v) => v },
];
</script>

<template>
  <KassirLayout>
    <div class="space-y-4">
      <AppCard class="flex flex-wrap items-center justify-between gap-3 p-5">
        <h1 class="text-xl font-bold">Dashboard</h1>
        <div class="flex gap-1 rounded-full bg-secondary/30 p-1">
          <button
            v-for="p in periods"
            :key="p.key"
            @click="period = p.key"
            class="rounded-full px-3 py-1.5 text-sm font-medium transition-colors"
            :class="
              period === p.key
                ? 'bg-primary text-white shadow-sm'
                : 'text-muted hover:text-gray-900'
            "
          >
            {{ p.label }}
          </button>
        </div>
      </AppCard>

      <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
        <AppCard v-for="s in statCards" :key="s.key" class="p-4">
          <p class="text-xs text-muted">{{ s.label }}</p>
          <p class="mt-1 text-2xl font-bold tabular-nums">
            {{ s.format(stats[s.key]) }}
          </p>
        </AppCard>
      </div>

      <RouterLink
        to="/kassir/skanerlash"
        class="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-base font-semibold text-white shadow-sm transition-all hover:bg-primary/90 hover:shadow-md active:scale-[0.99]"
      >
        <svg
          viewBox="0 0 24 24"
          class="h-5 w-5"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <line x1="14" y1="14" x2="14" y2="21" />
          <line x1="21" y1="14" x2="21" y2="14.01" />
          <line x1="17.5" y1="17.5" x2="21" y2="17.5" />
          <line x1="14" y1="21" x2="17.5" y2="21" />
        </svg>
        QR Skanerlash
      </RouterLink>

      <AppCard class="p-5">
        <h2 class="mb-4 font-semibold">So'nggi tashriflar</h2>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b text-left text-muted">
                <th class="pb-2 pr-3 font-normal">#</th>
                <th class="pb-2 pr-3 font-normal">Mijoz</th>
                <th class="pb-2 pr-3 font-normal">Xizmat</th>
                <th class="pb-2 pr-3 font-normal">Chegirma</th>
                <th class="pb-2 pr-3 font-normal">Asl narx (so'm)</th>
                <th class="pb-2 pr-3 font-normal">To'landi (so'm)</th>
              </tr>
            </thead>
            <tbody v-if="loading">
              <tr
                v-for="i in 5"
                :key="'sk' + i"
                class="border-b last:border-none"
              >
                <td class="py-3" colspan="6">
                  <div
                    class="h-4 w-full animate-pulse rounded bg-secondary"
                  ></div>
                </td>
              </tr>
            </tbody>
            <tbody v-else>
              <tr
                v-for="(r, i) in recent"
                :key="r.id"
                class="border-b last:border-none hover:bg-secondary/60"
              >
                <td class="py-3 pr-3 text-muted">{{ i + 1 }}</td>
                <td class="pr-3 font-medium">
                  <div class="flex items-center gap-2">
                    <span
                      class="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground"
                    >
                      {{ (r.customer_name || "?").slice(0, 2).toUpperCase() }}
                    </span>
                    {{ r.customer_name || "—" }}
                  </div>
                </td>
                <td class="pr-3 text-muted">{{ r.service_name || "—" }}</td>
                <td class="pr-3">
                  <span
                    class="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground"
                    >{{ r.applied_percent }}%</span
                  >
                </td>
                <td class="pr-3 text-muted line-through">
                  {{ fmt(r.purchase_amount) }}
                </td>
                <td class="pr-3 font-semibold">
                  {{ fmt(r.purchase_amount - r.discount_amount) }}
                </td>
              </tr>
              <tr v-if="!recent.length">
                <td colspan="6" class="py-8 text-center text-muted">
                  Hozircha tashrif yo'q
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </AppCard>
    </div>
  </KassirLayout>
</template>
