<script setup>
import { ref, onMounted, reactive, computed } from "vue";
import DashboardLayout from "@/layouts/DashboardLayout.vue";
import AppCard from "@/components/AppCard.vue";
import AppModal from "@/components/AppModal.vue";
import { discountApi } from "@/api";
import { useToastStore } from "@/stores/toast";

const toast = useToastStore();

// Dizaynda biznesning bir nechta chegirma turi bo'ladi (Standart, Premium,
// VIP...). Har biri alohida karta: foiz, minimal xarid, faollik va necha
// marta ishlatilgani.
const CATEGORIES = ["Standart", "Premium", "Maxsus taklif", "VIP"];

const items = ref([]);
const loading = ref(true);

// ---- Qo'shish / tahrirlash modali ----
const formOpen = ref(false);
const editing = ref(null); // null => yangi qo'shish
const saving = ref(false);
const form = reactive({
  category: "",
  description: "",
  percent: null,
  min_purchase: null,
  is_active: true,
});
const formErrors = reactive({});

// ---- O'chirish tasdiqlash modali ----
const deleteTarget = ref(null);
const deleting = ref(false);

// Tanlangan kategoriya band bo'lsa ro'yxatdan chiqarib tashlaymiz.
// Tahrirlashda joriy kategoriya ro'yxatda QOLADI (lekin faqat bir marta —
// ilgari u alohida <option> bilan ham qo'shilib, "Premium" ikki marta
// ko'rinardi).
const availableCategories = computed(() => {
  const used = new Set(items.value.map((d) => d.category));
  if (editing.value) used.delete(editing.value.category);
  const list = CATEGORIES.filter((c) => !used.has(c));
  // Eski ma'lumotdagi kategoriya (masalan endi olib tashlangan "Tug'ilgan
  // kun") tahrirlashda baribir ko'rinib tursin, aks holda maydon bo'sh qoladi.
  if (editing.value && editing.value.category && !list.includes(editing.value.category)) {
    list.unshift(editing.value.category);
  }
  return list;
});

async function load() {
  loading.value = true;
  try {
    items.value = await discountApi.list();
  } catch {
    toast.error("Chegirmalarni yuklab bo'lmadi");
  } finally {
    loading.value = false;
  }
}
onMounted(load);

function openCreate() {
  editing.value = null;
  Object.assign(form, {
    category: "",
    description: "",
    percent: null,
    min_purchase: null,
    is_active: true,
  });
  Object.keys(formErrors).forEach((k) => delete formErrors[k]);
  formOpen.value = true;
}

function openEdit(d) {
  editing.value = d;
  Object.assign(form, {
    category: d.category,
    description: d.description,
    percent: d.percent,
    min_purchase: Number(d.min_purchase) || null,
    is_active: d.is_active,
  });
  Object.keys(formErrors).forEach((k) => delete formErrors[k]);
  formOpen.value = true;
}

function validate() {
  Object.keys(formErrors).forEach((k) => delete formErrors[k]);
  if (!form.category) formErrors.category = "Kategoriyani tanlang.";
  const p = Number(form.percent);
  if (!p) formErrors.percent = "Chegirma foizini kiriting.";
  else if (p < 1 || p > 100) formErrors.percent = "Foiz 1 dan 100 gacha bo'lishi kerak.";
  if (form.min_purchase !== null && form.min_purchase !== "" && Number(form.min_purchase) < 0)
    formErrors.min_purchase = "Manfiy bo'lishi mumkin emas.";
  return Object.keys(formErrors).length === 0;
}

async function save() {
  if (!validate()) return;
  saving.value = true;
  try {
    const payload = {
      category: form.category,
      description: form.description || "",
      percent: Number(form.percent),
      min_purchase: Number(form.min_purchase) || 0,
      is_active: form.is_active,
    };
    // MUHIM: chegirma qo'shish/tahrirlash endi to'g'ridan saqlanmaydi — admin
    // tasdiqlashi kerak. Backend 202 + { pending: true } qaytaradi.
    if (editing.value) {
      await discountApi.update(editing.value.id, payload);
      toast.success("Tahrirlash so'rovi adminga yuborildi — tasdiqlanishini kuting.");
    } else {
      await discountApi.create(payload);
      toast.success("So'rov adminga yuborildi — tasdiqlangach chegirma qo'shiladi.");
    }
    formOpen.value = false;
    await load();
  } catch (e) {
    const d = e.response?.data || {};
    if (d.category) formErrors.category = [].concat(d.category)[0];
    if (d.percent) formErrors.percent = [].concat(d.percent)[0];
    if (d.detail) toast.error(d.detail);
    else if (!d.category && !d.percent) toast.error("Xatolik yuz berdi");
  } finally {
    saving.value = false;
  }
}

async function confirmDelete() {
  deleting.value = true;
  try {
    const name = deleteTarget.value.category;
    await discountApi.remove(deleteTarget.value.id);
    toast.success(`"${name}" chegirmasi muvaffaqiyatli o'chirildi`);
    deleteTarget.value = null;
    await load();
  } catch {
    toast.error("O'chirib bo'lmadi");
  } finally {
    deleting.value = false;
  }
}

async function toggle(d) {
  const prev = d.is_active;
  d.is_active = !prev; // darhol ko'rinsin
  try {
    await discountApi.toggle(d.id);
  } catch {
    d.is_active = prev; // xato bo'lsa qaytaramiz
    toast.error("Holatni o'zgartirib bo'lmadi");
  }
}

function fmtSom(v) {
  const n = Number(v) || 0;
  return n.toLocaleString("en-US").replace(/,/g, " ");
}
</script>

<template>
  <DashboardLayout>
    <div class="space-y-4">
      <!-- Sarlavha + Qo'shish -->
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-xl font-bold">Chegirmalar</h1>
          <p class="mt-0.5 text-xs text-muted">
            Biznesingizdagi chegirma turlari — mijozlarga shu foizlar qo'llaniladi.
          </p>
        </div>
        <button
          class="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-md active:scale-95"
          @click="openCreate"
        >
          <span class="text-base leading-none">+</span> Qo'shish
        </button>
      </div>

      <!-- Yuklanmoqda -->
      <div v-if="loading" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <AppCard v-for="n in 3" :key="n" class="p-5">
          <div class="skeleton h-5 w-28 rounded"></div>
          <div class="skeleton mt-3 h-3 w-40 rounded"></div>
          <div class="skeleton mt-6 h-6 w-20 rounded"></div>
        </AppCard>
      </div>

      <!-- Bo'sh holat -->
      <AppCard v-else-if="!items.length" class="p-10 text-center">
        <p class="text-sm font-medium">Hozircha chegirma qo'shilmagan</p>
        <p class="mt-1 text-xs text-muted">
          "Qo'shish" tugmasi orqali birinchi chegirmangizni yarating.
        </p>
      </AppCard>

      <!-- Chegirma kartalari -->
      <div v-else class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <AppCard
          v-for="(d, i) in items"
          :key="d.id"
          class="reveal flex flex-col p-5"
          :style="{ '--d': i * 60 + 'ms' }"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <h3 class="truncate text-base font-bold">{{ d.category }}</h3>
              <p class="mt-0.5 truncate text-xs text-muted">
                {{ d.description || "—" }}
              </p>
            </div>
            <span class="shrink-0 text-2xl font-bold text-success">{{ d.percent }}%</span>
          </div>

          <p v-if="Number(d.min_purchase) > 0" class="mt-3 text-xs text-muted">
            Minimal xarid: {{ fmtSom(d.min_purchase) }} so'm
          </p>
          <p class="mt-1 text-xs text-muted">{{ d.usage_count }} marta ishlatilgan</p>

          <div class="mt-auto flex items-center justify-between pt-4">
            <!-- Faol / Nofaol -->
            <button
              type="button"
              class="flex items-center gap-2"
              :aria-pressed="d.is_active"
              @click="toggle(d)"
            >
              <span
                :class="[
                  'relative h-6 w-11 rounded-full transition-colors',
                  d.is_active ? 'bg-primary' : 'bg-gray-300',
                ]"
              >
                <span
                  :class="[
                    'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all',
                    d.is_active ? 'left-[1.375rem]' : 'left-0.5',
                  ]"
                />
              </span>
              <span class="text-sm font-medium" :class="d.is_active ? 'text-success' : 'text-muted'">
                {{ d.is_active ? "Faol" : "No Faol" }}
              </span>
            </button>

            <div class="flex items-center gap-2">
              <button
                class="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-gray-700 transition-colors hover:bg-gray-200"
                title="Tahrirlash"
                @click="openEdit(d)"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
                  <path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
              </button>
              <button
                class="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-destructive transition-colors hover:bg-red-100"
                title="O'chirish"
                @click="deleteTarget = d"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
                  <path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              </button>
            </div>
          </div>
        </AppCard>
      </div>
    </div>

    <!-- ===== Qo'shish / Tahrirlash modali ===== -->
    <AppModal
      :open="formOpen"
      :title="editing ? 'Chegirmani tahrirlash' : `Yangi chegirma qo'shish`"
      @close="formOpen = false"
    >
      <form class="space-y-3" @submit.prevent="save">
        <p class="text-[11px] text-muted">
          * belgisi bilan belgilangan maydonlar to'ldirilishi shart
        </p>
        <div class="flex items-start gap-2 rounded-lg bg-accent px-3 py-2 text-[11px] text-accent-foreground">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="mt-0.5 h-3.5 w-3.5 shrink-0">
            <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
          </svg>
          <span>Chegirma to'g'ridan-to'g'ri qo'shilmaydi — avval adminга so'rov boradi, tasdiqlangach kuchga kiradi.</span>
        </div>

        <div>
          <label class="text-sm font-medium">Kategoriya *</label>
          <select
            v-model="form.category"
            :class="[
              'mt-1 h-11 w-full rounded-lg border bg-input px-3 text-sm transition-shadow focus:ring-2 focus:ring-primary/40',
              formErrors.category ? 'border-destructive' : 'border-border',
            ]"
          >
            <option value="">Tanlang</option>
            <option v-for="c in availableCategories" :key="c" :value="c">{{ c }}</option>
          </select>
          <p v-if="formErrors.category" class="mt-1 text-xs text-destructive">
            {{ formErrors.category }}
          </p>
        </div>

        <div>
          <label class="text-sm font-medium">Tavsif</label>
          <input
            v-model="form.description"
            placeholder="Barcha a'zolar uchun"
            class="mt-1 h-11 w-full rounded-lg border border-border bg-input px-3 text-sm transition-shadow focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-sm font-medium">Chegirma (%) *</label>
            <input
              v-model.number="form.percent"
              type="number"
              min="1"
              max="100"
              placeholder="0"
              :class="[
                'mt-1 h-11 w-full rounded-lg border bg-input px-3 text-sm transition-shadow focus:ring-2 focus:ring-primary/40',
                formErrors.percent ? 'border-destructive' : 'border-border',
              ]"
            />
            <p v-if="formErrors.percent" class="mt-1 text-xs text-destructive">
              {{ formErrors.percent }}
            </p>
          </div>
          <div>
            <label class="text-sm font-medium">Min.xarid (so'm)</label>
            <input
              v-model.number="form.min_purchase"
              type="number"
              min="0"
              placeholder="0"
              :class="[
                'mt-1 h-11 w-full rounded-lg border bg-input px-3 text-sm transition-shadow focus:ring-2 focus:ring-primary/40',
                formErrors.min_purchase ? 'border-destructive' : 'border-border',
              ]"
            />
            <p v-if="formErrors.min_purchase" class="mt-1 text-xs text-destructive">
              {{ formErrors.min_purchase }}
            </p>
          </div>
        </div>

        <label class="flex items-center gap-2 text-sm">
          <input v-model="form.is_active" type="checkbox" class="h-4 w-4 accent-primary" />
          Faol
        </label>

        <div class="flex items-center gap-3 pt-1">
          <button
            type="button"
            class="h-11 flex-1 rounded-lg border border-border text-sm font-medium transition-colors hover:bg-secondary"
            @click="formOpen = false"
          >
            Bekor qilish
          </button>
          <button
            type="submit"
            :disabled="saving"
            class="h-11 flex-1 rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-60"
          >
            {{ saving ? "Yuborilmoqda..." : "So'rov yuborish" }}
          </button>
        </div>
      </form>
    </AppModal>

    <!-- ===== O'chirishni tasdiqlash ===== -->
    <AppModal :open="!!deleteTarget" title="" @close="deleteTarget = null">
      <div v-if="deleteTarget" class="text-center">
        <div
          class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-destructive"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-7 w-7">
            <path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" />
          </svg>
        </div>
        <h2 class="text-lg font-bold">Rostan ham o'chirmoqchimisiz?</h2>
        <p class="mt-1 text-xs text-muted">
          Quyidagi chegirma butunlay o'chiriladi<br />va bu amalni qaytarib bo'lmaydi.
        </p>

        <div class="mt-4 rounded-xl bg-secondary p-4 text-left">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="truncate font-bold">{{ deleteTarget.category }}</p>
              <p class="truncate text-xs text-muted">{{ deleteTarget.description || "—" }}</p>
            </div>
            <span class="shrink-0 text-xl font-bold text-success">{{ deleteTarget.percent }}%</span>
          </div>
          <p class="mt-2 text-xs text-muted">{{ deleteTarget.usage_count }} marta ishlatilgan</p>
        </div>

        <div class="mt-5 flex items-center gap-3">
          <button
            class="h-11 flex-1 rounded-lg border border-border text-sm font-medium transition-colors hover:bg-secondary"
            @click="deleteTarget = null"
          >
            Bekor qilish
          </button>
          <button
            :disabled="deleting"
            class="h-11 flex-1 rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-60"
            @click="confirmDelete"
          >
            {{ deleting ? "O'chirilmoqda..." : "O'chirish" }}
          </button>
        </div>
      </div>
    </AppModal>
  </DashboardLayout>
</template>

<style scoped>
.reveal {
  animation: reveal-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
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

.skeleton {
  position: relative;
  overflow: hidden;
  background: #e5e7eb;
}

.skeleton::after {
  content: "";
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent);
  animation: shimmer 1.4s infinite;
}

@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .reveal,
  .skeleton::after {
    animation: none !important;
  }
}
</style>
