<script setup>
import { ref, onMounted, reactive, computed } from "vue";
import DashboardLayout from "@/layouts/DashboardLayout.vue";
import AppCard from "@/components/AppCard.vue";
import AppModal from "@/components/AppModal.vue";
import { cashiersApi } from "@/api";
import { useToastStore } from "@/stores/toast";

const toast = useToastStore();

const items = ref([]);
const loading = ref(true);

// Har bir kartadagi parol standart holda yashirin turadi
const revealed = reactive({});

const activeCount = computed(() => items.value.filter((c) => c.is_active).length);

// ---- Qo'shish / tahrirlash ----
const formOpen = ref(false);
const editing = ref(null);
const saving = ref(false);
const form = reactive({
  full_name: "",
  phone_digits: "",
  login: "",
  password: "",
  is_active: true,
});
const errors = reactive({});

// ---- O'chirish ----
const deleteTarget = ref(null);
const deleting = ref(false);

const PHONE_PREFIX = "+998";

function formatPhone(digits) {
  const d = (digits || "").slice(0, 9);
  return [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(" ");
}
const phoneDisplay = computed(() => formatPhone(form.phone_digits));
function onPhoneInput(e) {
  let d = e.target.value.replace(/\D/g, "");
  // To'liq raqam qo'yilsa davlat kodini olib tashlaymiz
  if (d.length > 9 && d.startsWith("998")) d = d.slice(3);
  form.phone_digits = d.slice(0, 9);
  e.target.value = formatPhone(form.phone_digits);
}

async function load() {
  loading.value = true;
  try {
    items.value = await cashiersApi.list();
  } catch {
    toast.error("Kassirlarni yuklab bo'lmadi");
  } finally {
    loading.value = false;
  }
}
onMounted(load);

function openCreate() {
  editing.value = null;
  Object.assign(form, {
    full_name: "",
    phone_digits: "",
    login: "",
    password: "",
    is_active: true,
  });
  Object.keys(errors).forEach((k) => delete errors[k]);
  formOpen.value = true;
}

function openEdit(c) {
  editing.value = c;
  Object.assign(form, {
    full_name: c.full_name,
    phone_digits: (c.phone || "").replace(/\D/g, "").slice(-9),
    login: c.login || "",
    password: "",
    is_active: c.is_active,
  });
  Object.keys(errors).forEach((k) => delete errors[k]);
  formOpen.value = true;
}

function validate() {
  Object.keys(errors).forEach((k) => delete errors[k]);
  if (!form.full_name.trim()) errors.full_name = "Ism familiyani kiriting.";
  if (form.phone_digits && form.phone_digits.length !== 9)
    errors.phone = "Telefon raqamini to'liq kiriting (9 ta raqam).";
  if (!editing.value) {
    if (!form.login.trim()) errors.login = "Loginni kiriting.";
    else if (!/^[A-Za-z0-9._-]{3,}$/.test(form.login.trim()))
      errors.login = "Login kamida 3 ta belgi: harf, raqam va . _ -";
    if (!form.password || form.password.length < 6)
      errors.password = "Parol kamida 6 ta belgidan iborat bo'lsin.";
  }
  return Object.keys(errors).length === 0;
}

async function save() {
  if (!validate()) return;
  saving.value = true;
  try {
    const phone = form.phone_digits ? `${PHONE_PREFIX}${form.phone_digits}` : "";
    if (editing.value) {
      // Login kirish uchun ishlatilgani sabab tahrirlashda o'zgarmaydi
      await cashiersApi.update(editing.value.id, {
        full_name: form.full_name.trim(),
        phone,
        is_active: form.is_active,
      });
      toast.success("Kassir ma'lumotlari yangilandi");
    } else {
      await cashiersApi.create({
        full_name: form.full_name.trim(),
        phone,
        login: form.login.trim(),
        password: form.password,
        is_active: form.is_active,
      });
      toast.success("Yangi kassir qo'shildi");
    }
    formOpen.value = false;
    await load();
  } catch (e) {
    const d = e.response?.data || {};
    if (d.login) errors.login = [].concat(d.login)[0];
    if (d.password) errors.password = [].concat(d.password)[0];
    if (d.full_name) errors.full_name = [].concat(d.full_name)[0];
    if (!d.login && !d.password && !d.full_name) toast.error("Xatolik yuz berdi");
  } finally {
    saving.value = false;
  }
}

async function confirmDelete() {
  deleting.value = true;
  try {
    const name = deleteTarget.value.full_name;
    await cashiersApi.remove(deleteTarget.value.id);
    toast.success(`"${name}" o'chirildi`);
    deleteTarget.value = null;
    await load();
  } catch {
    toast.error("O'chirib bo'lmadi");
  } finally {
    deleting.value = false;
  }
}

async function toggleActive(c) {
  const prev = c.is_active;
  c.is_active = !prev;
  try {
    await cashiersApi.update(c.id, { is_active: c.is_active });
  } catch {
    c.is_active = prev;
    toast.error("Holatni o'zgartirib bo'lmadi");
  }
}

function initials(name) {
  return (name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}
function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}
function fmtPhone(p) {
  const d = (p || "").replace(/\D/g, "").slice(-9);
  return d ? `${PHONE_PREFIX} ${formatPhone(d)}` : "—";
}
</script>

<template>
  <DashboardLayout>
    <div class="space-y-4">
      <!-- Sarlavha -->
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-xl font-bold">Kassirlar</h1>
          <p class="mt-0.5 text-xs text-muted">
            Jami: {{ items.length }} ta kassir /
            <span class="font-semibold text-success">{{ activeCount }} ta Faol</span>
          </p>
        </div>
        <button
          class="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-md active:scale-95"
          @click="openCreate"
        >
          <span class="text-base leading-none">+</span> Qo'shish
        </button>
      </div>

      <div v-if="loading" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <AppCard v-for="n in 3" :key="n" class="p-5">
          <div class="skeleton h-5 w-32 rounded"></div>
          <div class="skeleton mt-3 h-3 w-40 rounded"></div>
          <div class="skeleton mt-6 h-16 w-full rounded"></div>
        </AppCard>
      </div>

      <AppCard v-else-if="!items.length" class="p-10 text-center">
        <p class="text-sm font-medium">Hozircha kassir qo'shilmagan</p>
        <p class="mt-1 text-xs text-muted">"Qo'shish" tugmasi orqali kassir qo'shing.</p>
      </AppCard>

      <!-- Kassir kartalari -->
      <div v-else class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <AppCard
          v-for="(c, i) in items"
          :key="c.id"
          class="reveal flex flex-col p-5"
          :style="{ '--d': i * 60 + 'ms' }"
        >
          <div class="flex items-start gap-3">
            <div
              class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground"
            >
              {{ initials(c.full_name) }}
            </div>
            <div class="min-w-0 flex-1">
              <h3 class="truncate font-bold">{{ c.full_name }}</h3>
              <p class="truncate text-xs text-muted">{{ fmtPhone(c.phone) }}</p>
            </div>
            <button
              class="flex shrink-0 items-center gap-1.5 text-xs font-medium"
              :title="c.is_active ? 'Nofaol qilish' : 'Faol qilish'"
              @click="toggleActive(c)"
            >
              <span :class="['h-2 w-2 rounded-full', c.is_active ? 'bg-success' : 'bg-gray-400']" />
              <span :class="c.is_active ? 'text-success' : 'text-muted'">
                {{ c.is_active ? "Faol" : "Nofaol" }}
              </span>
            </button>
          </div>

          <!-- Statistika -->
          <div class="mt-4 grid grid-cols-2 gap-2">
            <div class="rounded-xl bg-secondary p-3">
              <p class="text-lg font-bold">{{ c.scans_count ?? 0 }}</p>
              <p class="text-[11px] text-muted">Skaner</p>
            </div>
            <div class="rounded-xl bg-secondary p-3">
              <p class="text-sm font-bold">{{ fmtDate(c.added_at) }}</p>
              <p class="text-[11px] text-muted">Qo'shildi</p>
            </div>
          </div>

          <!-- Kirish ma'lumotlari -->
          <div class="mt-2 rounded-xl bg-secondary p-3">
            <p class="text-[11px] text-muted">Login</p>
            <p class="truncate text-sm font-semibold">{{ c.login || c.email || "—" }}</p>
            <p class="mt-2 text-[11px] text-muted">Parol</p>
            <div class="flex items-center justify-between gap-2">
              <span class="truncate font-mono text-sm">
                {{
                  c.password ? (revealed[c.id] ? c.password : "•".repeat(c.password.length)) : "—"
                }}
              </span>
              <button
                v-if="c.password"
                class="shrink-0 text-muted transition-colors hover:text-gray-900"
                :title="revealed[c.id] ? 'Yashirish' : `Ko'rsatish`"
                @click="revealed[c.id] = !revealed[c.id]"
              >
                {{ revealed[c.id] ? "🙈" : "👁" }}
              </button>
            </div>
          </div>

          <div class="mt-auto flex items-center gap-2 pt-4">
            <button
              class="h-10 flex-1 rounded-lg border border-border text-sm font-medium transition-colors hover:bg-secondary"
              @click="openEdit(c)"
            >
              ✎ Tahrirlash
            </button>
            <button
              class="h-10 flex-1 rounded-lg bg-red-50 text-sm font-medium text-destructive transition-colors hover:bg-red-100"
              @click="deleteTarget = c"
            >
              🗑 O'chirish
            </button>
          </div>
        </AppCard>
      </div>
    </div>

    <!-- ===== Qo'shish / Tahrirlash ===== -->
    <AppModal
      :open="formOpen"
      :title="editing ? 'Kassirni tahrirlash' : `Yangi kassir qo'shish`"
      @close="formOpen = false"
    >
      <form class="space-y-3" @submit.prevent="save">
        <p class="text-[11px] text-muted">
          * belgisi bilan belgilangan maydonlar to'ldirilishi shart
        </p>

        <div>
          <label class="text-sm font-medium">Ism Familiya *</label>
          <input
            v-model="form.full_name"
            placeholder="Ism Familiya"
            :class="[
              'mt-1 h-11 w-full rounded-lg border bg-input px-3 text-sm focus:ring-2 focus:ring-primary/40',
              errors.full_name ? 'border-destructive' : 'border-border',
            ]"
          />
          <p v-if="errors.full_name" class="mt-1 text-xs text-destructive">{{ errors.full_name }}</p>
        </div>

        <div>
          <label class="text-sm font-medium">Telefon raqami</label>
          <div
            :class="[
              'mt-1 flex h-11 w-full items-center overflow-hidden rounded-lg border bg-input focus-within:ring-2 focus-within:ring-primary/40',
              errors.phone ? 'border-destructive' : 'border-border',
            ]"
          >
            <span class="border-r border-border px-3 text-sm text-muted">{{ PHONE_PREFIX }}</span>
            <input
              :value="phoneDisplay"
              inputmode="numeric"
              maxlength="12"
              placeholder="90 123 45 67"
              class="h-full flex-1 bg-transparent px-3 text-sm outline-none"
              @input="onPhoneInput"
            />
          </div>
          <p v-if="errors.phone" class="mt-1 text-xs text-destructive">{{ errors.phone }}</p>
        </div>

        <div>
          <label class="text-sm font-medium">Login {{ editing ? "" : "*" }}</label>
          <input
            v-model="form.login"
            :disabled="!!editing"
            placeholder="Login"
            :class="[
              'mt-1 h-11 w-full rounded-lg border bg-input px-3 text-sm focus:ring-2 focus:ring-primary/40 disabled:opacity-60',
              errors.login ? 'border-destructive' : 'border-border',
            ]"
          />
          <p v-if="editing" class="mt-1 text-[11px] text-muted">
            Login kirish uchun ishlatiladi — o'zgartirib bo'lmaydi.
          </p>
          <p v-if="errors.login" class="mt-1 text-xs text-destructive">{{ errors.login }}</p>
        </div>

        <div v-if="!editing">
          <label class="text-sm font-medium">Parol *</label>
          <input
            v-model="form.password"
            type="password"
            placeholder="Parol"
            :class="[
              'mt-1 h-11 w-full rounded-lg border bg-input px-3 text-sm focus:ring-2 focus:ring-primary/40',
              errors.password ? 'border-destructive' : 'border-border',
            ]"
          />
          <p v-if="errors.password" class="mt-1 text-xs text-destructive">{{ errors.password }}</p>
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
            {{ saving ? "Saqlanmoqda..." : editing ? "Saqlash" : "Qo'shish" }}
          </button>
        </div>
      </form>
    </AppModal>

    <!-- ===== O'chirishni tasdiqlash ===== -->
    <AppModal :open="!!deleteTarget" title="" @close="deleteTarget = null">
      <div v-if="deleteTarget" class="text-center">
        <div
          class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-2xl"
        >
          🗑
        </div>
        <h2 class="text-lg font-bold">Rostan ham o'chirmoqchimisiz?</h2>
        <p class="mt-1 text-xs text-muted">
          Kassir o'chiriladi va u boshqa panelga kira olmaydi.<br />Bu amalni qaytarib bo'lmaydi.
        </p>
        <div class="mt-4 rounded-xl bg-secondary p-4 text-left">
          <p class="font-bold">{{ deleteTarget.full_name }}</p>
          <p class="text-xs text-muted">{{ fmtPhone(deleteTarget.phone) }}</p>
          <p class="mt-1 text-xs text-muted">
            {{ deleteTarget.scans_count ?? 0 }} marta skanerlagan
          </p>
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
