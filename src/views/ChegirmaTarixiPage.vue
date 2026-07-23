<script setup>
import { ref, onMounted, computed } from "vue";
import DashboardLayout from "@/layouts/DashboardLayout.vue";
import AppCard from "@/components/AppCard.vue";
import { historyApi } from "@/api";
import { useToastStore } from "@/stores/toast";

const toast = useToastStore();

function fmt(n) {
  return Number(n || 0).toLocaleString("ru-RU");
}
function fmtDate(d) {
  return new Date(d).toLocaleString("uz-UZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
// Backend'da mijoz uchun "to'langan summa" alohida saqlanmaydi — asl narx (purchase_amount)
// va chegirma summasi (discount_amount) orqali hisoblanadi.
function finalPrice(r) {
  return Number(r.purchase_amount || 0) - Number(r.discount_amount || 0);
}

const q = ref("");
const all = ref([]);
const loading = ref(true);
const exporting = ref(false);
const filterOpen = ref(false);
const page = ref(1);
const pageSize = 10;

const dateFrom = ref("");
const dateTo = ref("");
const selectedCashiers = ref([]);
const percentFilter = ref(null);

async function load() {
  loading.value = true;
  try {
    // Backend: DiscountUsageSerializer -> id, customer, customer_email, cashier,
    // cashier_name, applied_percent, purchase_amount, discount_amount, used_at
    all.value = await historyApi.list({ ordering: "-used_at" });
  } finally {
    loading.value = false;
  }
}
onMounted(load);

const cashierOptions = computed(() => [
  ...new Set(all.value.map((r) => r.cashier_name).filter(Boolean)),
]);

const activeFilterCount = computed(() => {
  let n = 0;
  if (dateFrom.value || dateTo.value) n++;
  if (selectedCashiers.value.length) n++;
  if (percentFilter.value) n++;
  return n;
});

function toggleCashier(name) {
  const i = selectedCashiers.value.indexOf(name);
  if (i === -1) selectedCashiers.value.push(name);
  else selectedCashiers.value.splice(i, 1);
}

function clearFilters() {
  dateFrom.value = "";
  dateTo.value = "";
  selectedCashiers.value = [];
  percentFilter.value = null;
}

function applyFilters() {
  page.value = 1;
  filterOpen.value = false;
}

const filtered = computed(() => {
  let rows = all.value;
  if (q.value) {
    const s = q.value.toLowerCase();
    rows = rows.filter(
      (r) =>
        (r.customer_email || "").toLowerCase().includes(s) ||
        (r.cashier_name || "").toLowerCase().includes(s),
    );
  }
  if (dateFrom.value)
    rows = rows.filter((r) => new Date(r.used_at) >= new Date(dateFrom.value));
  if (dateTo.value)
    rows = rows.filter((r) => new Date(r.used_at) <= new Date(dateTo.value));
  if (selectedCashiers.value.length)
    rows = rows.filter((r) => selectedCashiers.value.includes(r.cashier_name));
  if (percentFilter.value)
    rows = rows.filter((r) => r.applied_percent === percentFilter.value);
  return rows;
});

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filtered.value.length / pageSize)),
);
const paged = computed(() =>
  filtered.value.slice((page.value - 1) * pageSize, page.value * pageSize),
);

function nextPage() {
  if (page.value < totalPages.value) page.value++;
}
function prevPage() {
  if (page.value > 1) page.value--;
}

async function exportCsv() {
  if (!filtered.value.length) {
    toast.info("Yuklash uchun ma'lumot yo'q");
    return;
  }
  exporting.value = true;
  try {
    // Backend'dagi tayyor CSV export endpointi (sana filtri bilan)
    const blob = await historyApi.exportCsv({
      date_from: dateFrom.value || undefined,
      date_to: dateTo.value || undefined,
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "chegirma-tarixi.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Fayl yuklandi");
  } catch (e) {
    toast.error("Yuklab olishda xatolik yuz berdi");
  } finally {
    exporting.value = false;
  }
}
</script>

<template>
  <DashboardLayout>
    <div class="space-y-4 page-enter">
      <AppCard class="p-5">
        <h1 class="text-xl font-bold tracking-tight">Chegirmalar tarixi</h1>
      </AppCard>

      <AppCard class="p-5 overflow-visible">
        <div class="mb-4 flex flex-wrap items-center gap-2">
          <div class="relative min-w-[200px] flex-1 group">
            <svg
              viewBox="0 0 24 24"
              class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted transition-transform duration-200 group-focus-within:scale-110"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              v-model="q"
              placeholder="Mijoz yoki kassir bo'yicha qidirish"
              class="h-10 w-full rounded-full border border-transparent bg-input pl-9 pr-3 text-sm outline-none transition-all duration-200 focus:border-primary/40 focus:ring-4 focus:ring-primary/15"
            />
          </div>

          <div class="relative">
            <button
              class="relative flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium transition-all duration-200 hover:border-primary/40 hover:bg-secondary active:scale-95"
              :class="filterOpen ? 'border-primary/50 bg-secondary' : ''"
              @click="filterOpen = !filterOpen"
            >
              Filtr
              <svg
                viewBox="0 0 24 24"
                class="h-3.5 w-3.5 transition-transform duration-300"
                :class="filterOpen ? 'rotate-180' : 'rotate-0'"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
              <span
                v-if="activeFilterCount"
                class="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground animate-pop"
              >
                {{ activeFilterCount }}
              </span>
            </button>

            <Transition name="dropdown">
              <div
                v-if="filterOpen"
                class="absolute right-0 z-25 mt-2 w-72 origin-top-right rounded-2xl border border-border bg-card p-4 shadow-xl"
              >
                <div class="mb-3 flex items-center justify-between">
                  <p class="text-sm font-semibold">Filtr</p>
                  <button
                    type="button"
                    class="text-xs text-muted transition-colors duration-150 hover:text-gray-900"
                    @click="clearFilters"
                  >
                    Filtrni tozalash
                  </button>
                </div>

                <label class="mb-1 block text-xs text-muted"
                  >Sana oralig'i</label
                >
                <div class="mb-5 flex items-center gap-2">
                  <input
                    v-model="dateFrom"
                    type="date"
                    class="h-9 w-full rounded-lg border border-border bg-input px-2 text-xs transition-colors duration-150 focus:border-primary/50 focus:outline-none"
                  />
                  <span class="text-muted">—</span>
                  <input
                    v-model="dateTo"
                    type="date"
                    class="h-9 w-full rounded-lg border border-border bg-input text-xs transition-colors duration-150 focus:border-primary/50 focus:outline-none"
                  />
                </div>

                <label class="mb-1 block text-xs text-muted">Kassir</label>
                <div class="mb-3 space-y-1 max-h-32 overflow-y-auto pr-1">
                  <label
                    v-for="c in cashierOptions"
                    :key="c"
                    class="flex cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1 text-sm transition-colors duration-150 hover:bg-secondary"
                  >
                    <input
                      type="checkbox"
                      class="h-4 w-4 accent-primary transition-transform duration-150 checked:scale-110"
                      :checked="selectedCashiers.includes(c)"
                      @change="toggleCashier(c)"
                    />
                    {{ c }}
                  </label>
                  <p v-if="!cashierOptions.length" class="text-xs text-muted">
                    Kassirlar topilmadi
                  </p>
                </div>

                <label class="mb-1 block text-xs text-muted"
                  >Chegirma foizi</label
                >
                <div class="mb-4 flex gap-2">
                  <button
                    v-for="p in [5, 10, 15]"
                    :key="p"
                    type="button"
                    class="flex-1 rounded-lg border px-2 py-1.5 text-sm font-medium transition-all duration-150 active:scale-95"
                    :class="
                      percentFilter === p
                        ? 'border-primary bg-accent text-accent-foreground'
                        : 'border-border hover:bg-secondary'
                    "
                    @click="percentFilter = percentFilter === p ? null : p"
                  >
                    {{ p }}%
                  </button>
                </div>

                <button
                  class="h-10 w-full rounded-full bg-primary text-sm font-semibold text-primary-foreground transition-all duration-150 hover:bg-primary/90 hover:shadow-md active:scale-[0.98]"
                  @click="applyFilters"
                >
                  Qo'llash
                </button>
              </div>
            </Transition>
          </div>

          <button
            :disabled="exporting"
            class="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium !text-white shadow-sm transition-all duration-200 hover:bg-primary/90 hover:shadow-md active:scale-95 disabled:opacity-60"
            @click="exportCsv"
          >
            <svg
              viewBox="0 0 24 24"
              class="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:-translate-y-0.5"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M12 15V3" />
              <path d="m7 10 5 5 5-5" />
              <path d="M20 21H4" />
            </svg>
            <span class="!text-white">{{
              exporting ? "Yuklanmoqda..." : "Yuklash"
            }}</span>
          </button>

          <span class="text-xs text-muted transition-opacity duration-300"
            >{{ filtered.length }} ta natija</span
          >
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b text-left text-muted">
                <th class="pb-2 font-normal">Sana</th>
                <th class="pb-2 font-normal">Mijoz</th>
                <th class="pb-2 font-normal">Kassir</th>
                <th class="pb-2 font-normal">Chegirma</th>
                <th class="pb-2 font-normal">Asl narx</th>
                <th class="pb-2 font-normal">To'langan</th>
              </tr>
            </thead>

            <!-- Loading skeleton -->
            <tbody v-if="loading">
              <tr
                v-for="i in 6"
                :key="'sk' + i"
                class="border-b last:border-none"
              >
                <td class="py-3" colspan="6">
                  <div
                    class="h-4 w-full animate-pulse rounded bg-secondary"
                    :style="{ animationDelay: i * 60 + 'ms' }"
                  ></div>
                </td>
              </tr>
            </tbody>

            <TransitionGroup v-else tag="tbody" name="row" appear>
              <tr
                v-for="(r, i) in paged"
                :key="r.id"
                class="group border-b transition-colors duration-150 last:border-none hover:bg-secondary/60"
                :style="{ transitionDelay: i * 25 + 'ms' }"
              >
                <td class="py-3 text-muted">{{ fmtDate(r.used_at) }}</td>
                <td class="font-medium">{{ r.customer_email || "—" }}</td>
                <td class="text-muted">{{ r.cashier_name || "—" }}</td>
                <td>
                  <span
                    class="inline-block rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground transition-transform duration-150 group-hover:scale-105"
                  >
                    {{ r.applied_percent }}%
                  </span>
                </td>
                <td class="text-muted line-through">
                  {{ fmt(r.purchase_amount) }}
                </td>
                <td class="font-semibold">{{ fmt(finalPrice(r)) }} so'm</td>
              </tr>
            </TransitionGroup>

            <tbody v-if="!loading && !filtered.length">
              <tr>
                <td colspan="6" class="py-14 text-center">
                  <div class="flex flex-col items-center gap-2 fade-in-up">
                    <svg
                      viewBox="0 0 24 24"
                      class="h-8 w-8 text-muted"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.6"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <circle cx="11" cy="11" r="7" />
                      <path d="m21 21-4.3-4.3" />
                      <path d="m8.5 8.5 5 5" />
                      <path d="m13.5 8.5-5 5" />
                    </svg>
                    <span class="text-muted">Natija topilmadi</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div
          v-if="filtered.length"
          class="mt-4 flex items-center justify-between text-sm"
        >
          <span class="text-muted">Natija {{ filtered.length }} dan</span>
          <div class="flex items-center gap-3">
            <button
              class="flex h-8 w-8 items-center justify-center rounded-full border border-border transition-all duration-150 hover:bg-secondary active:scale-90 disabled:opacity-40 disabled:hover:bg-transparent"
              :disabled="page === 1"
              @click="prevPage"
            >
              <svg
                viewBox="0 0 24 24"
                class="h-4 w-4"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <button
              class="flex items-center gap-1 rounded-full bg-primary px-4 py-1.5 font-medium !text-white shadow-sm transition-all duration-150 hover:bg-primary/90 hover:shadow-md active:scale-95 disabled:opacity-60 disabled:hover:shadow-none"
              :disabled="page === totalPages"
              @click="nextPage"
            >
              Keyingi
              <svg
                viewBox="0 0 24 24"
                class="h-4 w-4"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
            <span class="text-muted transition-all duration-200"
              >Sahifa {{ page }} / {{ totalPages }}</span
            >
          </div>
        </div>
      </AppCard>
    </div>
  </DashboardLayout>
</template>

<style scoped>
.page-enter {
  animation: pageFadeIn 0.4s ease-out;
}

@keyframes pageFadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dropdown-enter-active {
  transition:
    opacity 0.18s ease-out,
    transform 0.18s ease-out;
}

.dropdown-leave-active {
  transition:
    opacity 0.12s ease-in,
    transform 0.12s ease-in;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: scale(0.96) translateY(-4px);
}

.row-enter-active {
  transition:
    opacity 0.3s ease-out,
    transform 0.3s ease-out;
}

.row-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.row-move {
  transition: transform 0.25s ease;
}

.animate-pop {
  animation: pop 0.25s ease-out;
}

@keyframes pop {
  0% {
    transform: scale(0);
  }

  70% {
    transform: scale(1.15);
  }

  100% {
    transform: scale(1);
  }
}

.fade-in-up {
  animation: fadeInUp 0.35s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .page-enter,
  .animate-pop,
  .fade-in-up,
  .row-enter-active,
  .dropdown-enter-active,
  .dropdown-leave-active {
    animation: none !important;
    transition: none !important;
  }
}
</style>
