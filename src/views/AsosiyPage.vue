<template>
  <DashboardLayout>
    <div class="space-y-4">
      <AppCard class="p-5 reveal" style="--d: 0ms">
        <h1 class="text-xl font-bold">Asosiy</h1>
        <p class="text-sm text-muted capitalize">Bugun, {{ today }}</p>
      </AppCard>

      <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
        <AppCard
          v-for="(s, i) in statCards"
          :key="s.label"
          class="reveal p-4 transition-transform duration-300 hover:-translate-y-1 hover:shadow-md"
          :style="{ '--d': `${80 + i * 80}ms` }"
        >
          <p class="text-xs text-muted">{{ s.label }}</p>
          <p class="mt-1 text-2xl font-bold">
            <span class="counter">{{ s.display }}</span>
          </p>
        </AppCard>
      </div>

      <div class="grid gap-4 lg:grid-cols-3">
        <AppCard class="reveal p-5 lg:col-span-2" style="--d: 400ms">
          <h2 class="mb-4 font-semibold">Oxirgi 7 kunlik tashriflar</h2>
          <div class="flex h-64 gap-3">
            <!-- y-axis -->
            <div
              class="flex flex-col justify-between py-0.5 text-xs text-muted"
            >
              <span v-for="tick in yTicks" :key="tick">{{ tick }}</span>
            </div>

            <div
              class="relative flex flex-1 items-end justify-between gap-2 border-l border-border pl-3"
            >
              <!-- gridlines -->
              <div
                class="pointer-events-none absolute inset-0 left-3 flex flex-col justify-between py-0.5"
              >
                <span
                  v-for="tick in yTicks"
                  :key="'g' + tick"
                  class="border-t border-dashed border-border/60"
                ></span>
              </div>

              <div
                v-for="(w, i) in weekdays"
                :key="w.day"
                class="group relative z-10 flex flex-1 flex-col items-center gap-1"
              >
                <div
                  class="bar w-full rounded-t-lg bg-primary transition-[height,opacity] duration-700 ease-out group-hover:brightness-110"
                  :style="{
                    height: barsGrown
                      ? `${(w.visits / maxVisits) * 200}px`
                      : '0px',
                    transitionDelay: `${500 + i * 70}ms`,
                  }"
                  :title="`${w.fullDay}: ${w.visits} tashrif`"
                ></div>
                <span class="text-xs text-muted">{{ w.day }}</span>
              </div>
            </div>
          </div>
        </AppCard>

        <AppCard class="reveal p-5" style="--d: 480ms">
          <h2 class="mb-3 flex items-center gap-2 font-semibold">
            <span class="bell inline-block"
              ><svg
              class="text-[#3F9A1F]"
                xmlns="http://www.w3.org/2000/svg"
                width="1.5em"
                height="1.5em"
                viewBox="0 0 24 24"
              >
                <path d="M0 0h24v24H0z" fill="none" />
                <path
                  fill="currentColor"
                  d="M12 4.5a.5.5 0 0 0-.5-.5a.5.5 0 0 0-.5.5v1.53c-2.25.25-4 2.15-4 4.47v5.91L5.41 18h12.18L16 16.41V10.5c0-2.32-1.75-4.22-4-4.47zM11.5 3A1.5 1.5 0 0 1 13 4.5v.71c2.31.65 4 2.79 4 5.29V16l3 3H3l3-3v-5.5C6 8 7.69 5.86 10 5.21V4.5A1.5 1.5 0 0 1 11.5 3m0 19a2.5 2.5 0 0 1-2.45-2h1.04a1.495 1.495 0 0 0 2.82 0h1.04a2.5 2.5 0 0 1-2.45 2"
                />
              </svg>
            </span>
            Bildirishnomalar
          </h2>
          <ul class="space-y-3">
            <li
              v-for="(n, i) in notifications"
              :key="n.id"
              class="reveal-side flex items-start justify-between gap-2 text-sm"
              :style="{ '--d': `${600 + i * 90}ms` }"
            >
              <div>
                <p class="font-medium">{{ n.title }}</p>
                <p class="text-xs text-muted">{{ n.body }}</p>
              </div>
              <span
                v-if="!n.is_read"
                class="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-success"
                :class="{ 'animate-pulse-dot': !n.is_read }"
              ></span>
            </li>
            <li v-if="!notifications.length" class="text-sm text-muted">
              Bildirishnomalar yo'q
            </li>
          </ul>
          <RouterLink
            to="/bildirishnomalar"
            class="mt-3 flex w-full items-center justify-center rounded-full border border-border px-4 py-2 text-sm transition-colors hover:bg-secondary"
          >
            Barchasini ko'rish ›
          </RouterLink>
        </AppCard>
      </div>

      <AppCard class="reveal p-5" style="--d: 560ms">
        <h2 class="mb-4 font-semibold">Oxirgi mijozlar</h2>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b text-left text-muted">
                <th class="pb-2 font-normal">Mijoz</th>
                <th class="pb-2 font-normal">Kassir</th>
                <th class="pb-2 font-normal">Chegirma</th>
                <th class="pb-2 font-normal">Asl narx (so'm)</th>
                <th class="pb-2 font-normal">To'langan (so'm)</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(r, i) in recent"
                :key="r.id"
                class="reveal-row border-b transition-colors last:border-none hover:bg-secondary/60"
                :style="{ '--d': `${640 + i * 60}ms` }"
              >
                <td class="py-3">
                  <div class="flex items-center gap-2">
                    <span
                      class="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground"
                    >
                      {{ initials(r.customer_email) }}
                    </span>
                    {{ r.customer_email || "—" }}
                  </div>
                </td>
                <td>{{ r.cashier_name || "—" }}</td>
                <td>
                  <span
                    class="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground"
                  >
                    {{ r.applied_percent }}%
                  </span>
                </td>
                <td class="text-muted line-through">
                  {{ fmt(r.purchase_amount) }}
                </td>
                <td class="font-semibold">
                  {{ fmt(r.purchase_amount - r.discount_amount) }}
                </td>
              </tr>
              <tr v-if="!recent.length">
                <td colspan="5" class="py-4 text-center text-muted">
                  Hozircha ma'lumot yo'q
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </AppCard>
    </div>
  </DashboardLayout>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import DashboardLayout from "@/layouts/DashboardLayout.vue";
import AppCard from "@/components/AppCard.vue";
import { RouterLink } from "vue-router";
import { dashboardApi, notificationsApi, historyApi } from "@/api";
import { groupByDay, recentEntries } from "@/utils/stats";

function fmt(n) {
  return Number(n || 0).toLocaleString("ru-RU");
}

const loading = ref(true);
// Backend: BusinessDashboardSerializer -> today_customers, today_discount_amount,
// today_revenue, total_customers, active_discount_percent
const dashStats = ref({
  today_customers: 0,
  today_discount_amount: 0,
  today_revenue: 0,
  active_discount_percent: 0,
});
const weekdays = ref([]);
const recent = ref([]);
const notifications = ref([]);

const today = new Date().toLocaleDateString("uz-UZ", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function initials(name) {
  return (name || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const maxVisits = ref(1);

async function load() {
  loading.value = true;
  try {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 6);
    const dateFrom = weekAgo.toISOString().slice(0, 10);

    const [dash, notifs, history] = await Promise.all([
      dashboardApi.stats(),
      notificationsApi.list(),
      historyApi.list({ date_from: dateFrom, ordering: "-used_at" }),
    ]);

    dashStats.value = dash;
    weekdays.value = groupByDay(history, 7);
    recent.value = recentEntries(history, 6);
    notifications.value = notifs.slice(0, 4);
    maxVisits.value = Math.max(1, ...weekdays.value.map((w) => w.visits));
  } finally {
    loading.value = false;
  }
}

onMounted(load);

const barsGrown = ref(false);
onMounted(() => {
  requestAnimationFrame(() => (barsGrown.value = true));
});

const statCards = computed(() => [
  { label: "Bugungi mijozlar", display: dashStats.value.today_customers },
  {
    label: "Bugungi chegirma summasi",
    display: `${fmt(dashStats.value.today_discount_amount)} so'm`,
  },
  {
    label: "Bugungi daromad",
    display: `${fmt(dashStats.value.today_revenue)} so'm`,
  },
  {
    label: "Joriy chegirma foizi",
    display: `${dashStats.value.active_discount_percent}%`,
  },
]);

const yTicks = [100, 70, 50, 20, 0];
</script>

<style scoped>
/* --- Kirish animatsiyasi (kartalar pastdan yumshoq chiqadi) --- */
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

/* --- Bildirishnoma qatorlari o'ngdan chapga sirg'alib kiradi --- */
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

/* --- Jadval qatorlari birin-ketin paydo bo'ladi --- */
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

/* --- O'qilmagan bildirishnoma nuqtasi uchun yumshoq puls --- */
.animate-pulse-dot {
  animation: pulse-dot 1.8s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.45);
  }

  50% {
    box-shadow: 0 0 0 5px rgba(34, 197, 94, 0);
  }
}

/* --- Qo'ng'iroq belgisi kirishda biroz tebranadi --- */
.bell {
  animation: bell-ring 0.7s ease 0.9s both;
  transform-origin: top center;
}

@keyframes bell-ring {
  0% {
    transform: rotate(0deg);
  }

  20% {
    transform: rotate(-12deg);
  }

  40% {
    transform: rotate(10deg);
  }

  60% {
    transform: rotate(-6deg);
  }

  80% {
    transform: rotate(3deg);
  }

  100% {
    transform: rotate(0deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .reveal,
  .reveal-side,
  .reveal-row,
  .bar,
  .animate-pulse-dot,
  .bell {
    animation: none !important;
    transition: none !important;
  }
}
</style>
