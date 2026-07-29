<script setup>
import { reactive, ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import KassirLayout from "@/layouts/KassirLayout.vue";
import AppCard from "@/components/AppCard.vue";
import AppModal from "@/components/AppModal.vue";
import { useToastStore } from "@/stores/toast";
import { useAuthStore } from "@/stores/auth";
import { meApi, cashierProfileApi } from "@/api";

const toast = useToastStore();
const router = useRouter();
const authStore = useAuthStore();

const loading = ref(true);

// Backend UserSerializer (users/serializers.py) hozircha "biznes nomi" va
// "inson o'qiy oladigan kassir ID" (masalan #KSR-041) qaytarmaydi — Cashier
// modelida business/full_name bor, lekin /me/ javobiga ulanmagan. Backend
// tayyor bo'lguncha shu ikkitasi (business, cashierCode) fallback bilan
// ko'rsatiladi; qolganlari (login, telefon) — REAL, /me/ dan keladi.
const profile = reactive({
  username: "",
  phone_number: "",
});
const business = ref("");
const cashierCode = ref("");

const initials = computed(() =>
  (profile.username || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase(),
);

async function load() {
  loading.value = true;
  try {
    // Barcha ma'lumot backend'dan — `cashier/me/` kassirning o'zi va
    // biriktirilgan biznes haqidagi haqiqiy ma'lumotni qaytaradi.
    const me = await cashierProfileApi.get();
    profile.full_name = me.full_name || "";
    profile.username = me.login || me.email || "";
    profile.phone_number = me.phone || "";
    business.value = me.business?.name || "—";
    cashierCode.value = me.cashier_code || "—";
  } catch (e) {
    toast.error("Ma'lumotni yuklashda xatolik");
  } finally {
    loading.value = false;
  }
}
onMounted(load);

// ---- Profilni tahrirlash ----
// Kassir o'z ismi, telefoni va parolini o'zgartira oladi. Login, biznes va
// kassir ID tizim tomonidan biriktiriladi — ular o'zgarmaydi.
const editing = ref(false);
const saving = ref(false);
const showNewPassword = ref(false);
const draft = reactive({ full_name: "", phone_digits: "", password: "" });
const editErrors = reactive({});

const PHONE_PREFIX = "+998";
function formatPhone(digits) {
  const d = (digits || "").slice(0, 9);
  return [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(" ");
}
const draftPhoneDisplay = computed(() => formatPhone(draft.phone_digits));
function onDraftPhoneInput(e) {
  let d = e.target.value.replace(/\D/g, "");
  if (d.length > 9 && d.startsWith("998")) d = d.slice(3);
  draft.phone_digits = d.slice(0, 9);
  e.target.value = formatPhone(draft.phone_digits);
}

function startEdit() {
  draft.full_name = profile.full_name || "";
  draft.phone_digits = (profile.phone_number || "").replace(/\D/g, "").slice(-9);
  draft.password = "";
  Object.keys(editErrors).forEach((k) => delete editErrors[k]);
  showNewPassword.value = false;
  editing.value = true;
}
function cancelEdit() {
  editing.value = false;
}

async function saveProfile() {
  Object.keys(editErrors).forEach((k) => delete editErrors[k]);
  if (!draft.full_name.trim()) editErrors.full_name = "Ismni kiriting.";
  if (draft.phone_digits && draft.phone_digits.length !== 9)
    editErrors.phone = "Telefon raqamini to'liq kiriting (9 ta raqam).";
  if (draft.password && draft.password.length < 6)
    editErrors.password = "Parol kamida 6 ta belgidan iborat bo'lsin.";
  if (Object.keys(editErrors).length) return;

  saving.value = true;
  try {
    const payload = {
      full_name: draft.full_name.trim(),
      phone: draft.phone_digits ? `${PHONE_PREFIX}${draft.phone_digits}` : "",
    };
    if (draft.password) payload.password = draft.password;

    const data = await cashierProfileApi.update(payload);
    profile.full_name = data.full_name;
    profile.phone_number = data.phone || "";
    editing.value = false;
    toast.success(
      draft.password ? "Ma'lumotlar va parol yangilandi" : "Ma'lumotlar yangilandi",
    );
  } catch (e) {
    const d = e.response?.data || {};
    if (d.full_name) editErrors.full_name = [].concat(d.full_name)[0];
    else if (d.password) editErrors.password = [].concat(d.password)[0];
    else toast.error("Saqlashda xatolik yuz berdi");
  } finally {
    saving.value = false;
  }
}

const showLogoutModal = ref(false);
const loggingOut = ref(false);

function confirmLogout() {
  loggingOut.value = true;
  authStore.logout();
  setTimeout(() => {
    loggingOut.value = false;
    showLogoutModal.value = false;
    router.push("/login").catch(() => {});
  }, 300);
}
</script>

<template>
  <KassirLayout>
    <div class="space-y-4 page-enter">
      <AppCard class="p-5">
        <h1 class="text-xl font-bold tracking-tight">Profil</h1>
      </AppCard>

      <AppCard
        class="mx-auto max-w-xl p-6 transition-all duration-200 hover:shadow-lg rise"
      >
        <!-- Header -->
        <div class="mb-6 flex items-center gap-4">
          <div class="relative h-14 w-14 shrink-0">
            <div class="absolute inset-0 rounded-full ring-glow"></div>
            <div
              class="absolute inset-[3px] flex items-center justify-center rounded-full bg-accent text-base font-bold text-accent-foreground"
            >
              {{ initials }}
            </div>
          </div>
          <div>
            <h2 class="text-lg font-semibold leading-tight">
              {{ profile.username || "—" }}
            </h2>
            <p class="mt-0.5 flex items-center gap-1.5 text-sm text-muted">
              <span
                class="relative inline-flex h-2 w-2 rounded-full bg-success"
              >
                <span
                  class="absolute inset-0 rounded-full bg-success animate-pulse-dot"
                ></span>
              </span>
              <span class="font-medium text-success">Faol</span>
              <span class="text-border">·</span>
              <span
                >Kassir ID:
                <span class="font-medium text-foreground">{{
                  cashierCode
                }}</span></span
              >
            </p>
          </div>
        </div>

        <div class="mb-3 flex items-center justify-between">
          <h3 class="text-sm font-semibold">Ma'lumotlar</h3>
          <button
            v-if="!editing"
            type="button"
            class="flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium transition-colors hover:bg-secondary"
            :disabled="loading"
            @click="startEdit"
          >
            ✎ Tahrirlash
          </button>
        </div>

        <div class="space-y-4">
          <!-- Ism (tahrirlanadi) -->
          <div>
            <label class="mb-1 block text-xs font-medium text-muted">Ism Familiya</label>
            <input
              v-if="editing"
              v-model="draft.full_name"
              type="text"
              :class="[
                'h-11 w-full rounded-lg border bg-input px-3 text-sm outline-none transition-all focus:ring-4 focus:ring-primary/10',
                editErrors.full_name ? 'border-destructive' : 'border-transparent focus:border-primary/50',
              ]"
            />
            <input
              v-else
              :value="profile.full_name || '—'"
              type="text"
              disabled
              class="h-11 w-full cursor-not-allowed rounded-lg border border-transparent bg-input px-3 text-sm text-muted outline-none"
            />
            <p v-if="editErrors.full_name" class="mt-1 text-xs text-destructive">
              {{ editErrors.full_name }}
            </p>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1 block text-xs font-medium text-muted">Login</label>
              <input
                :value="profile.username"
                type="text"
                disabled
                class="h-11 w-full cursor-not-allowed rounded-lg border border-transparent bg-input px-3 text-sm text-muted outline-none"
              />
              <p class="mt-1 text-[11px] text-muted">Login kirish uchun — o'zgarmaydi.</p>
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-muted">
                {{ editing ? "Yangi parol" : "Parol" }}
              </label>
              <div class="relative">
                <input
                  v-if="editing"
                  v-model="draft.password"
                  :type="showNewPassword ? 'text' : 'password'"
                  placeholder="O'zgartirmasangiz bo'sh qoldiring"
                  :class="[
                    'h-11 w-full rounded-lg border bg-input px-3 pr-10 text-sm outline-none transition-all focus:ring-4 focus:ring-primary/10',
                    editErrors.password ? 'border-destructive' : 'border-transparent focus:border-primary/50',
                  ]"
                />
                <input
                  v-else
                  value="••••••••••••"
                  type="text"
                  disabled
                  class="h-11 w-full cursor-not-allowed rounded-lg border border-transparent bg-input px-3 pr-10 text-sm text-muted outline-none"
                />
                <button
                  v-if="editing"
                  type="button"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-muted transition-colors hover:text-gray-700"
                  @click="showNewPassword = !showNewPassword"
                >
                  {{ showNewPassword ? "🙈" : "👁" }}
                </button>
              </div>
              <p v-if="editErrors.password" class="mt-1 text-xs text-destructive">
                {{ editErrors.password }}
              </p>
            </div>
          </div>

          <div>
            <label class="mb-1 block text-xs font-medium text-muted"
              >Biznes</label
            >
            <input
              :value="business"
              type="text"
              disabled
              class="h-11 w-full cursor-not-allowed rounded-lg border border-transparent bg-input px-3 text-sm text-muted outline-none"
            />
          </div>

          <div>
            <label class="mb-1 block text-xs font-medium text-muted"
              >Kassir ID</label
            >
            <input
              :value="cashierCode"
              type="text"
              disabled
              class="h-11 w-full cursor-not-allowed rounded-lg border border-transparent bg-input px-3 text-sm text-muted outline-none"
            />
          </div>

          <div>
            <label class="mb-1 block text-xs font-medium text-muted">Telefon raqami</label>
            <div
              v-if="editing"
              :class="[
                'flex h-11 w-full items-center overflow-hidden rounded-lg border bg-input focus-within:ring-4 focus-within:ring-primary/10',
                editErrors.phone ? 'border-destructive' : 'border-transparent focus-within:border-primary/50',
              ]"
            >
              <span class="border-r border-border px-3 text-sm text-muted">{{ PHONE_PREFIX }}</span>
              <input
                :value="draftPhoneDisplay"
                inputmode="numeric"
                maxlength="12"
                placeholder="90 123 45 67"
                class="h-full flex-1 bg-transparent px-3 text-sm outline-none"
                @input="onDraftPhoneInput"
              />
            </div>
            <input
              v-else
              :value="profile.phone_number || '—'"
              type="text"
              disabled
              class="h-11 w-full cursor-not-allowed rounded-lg border border-transparent bg-input px-3 text-sm text-muted outline-none"
            />
            <p v-if="editErrors.phone" class="mt-1 text-xs text-destructive">
              {{ editErrors.phone }}
            </p>
          </div>

          <!-- Saqlash / bekor qilish -->
          <div v-if="editing" class="flex items-center gap-3 pt-1">
            <button
              type="button"
              :disabled="saving"
              class="h-11 flex-1 rounded-lg border border-border text-sm font-medium transition-colors hover:bg-secondary disabled:opacity-60"
              @click="cancelEdit"
            >
              Bekor qilish
            </button>
            <button
              type="button"
              :disabled="saving"
              class="h-11 flex-1 rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-60"
              @click="saveProfile"
            >
              {{ saving ? "Saqlanmoqda..." : "Saqlash" }}
            </button>
          </div>
        </div>
      </AppCard>

      <AppCard
        class="mx-auto max-w-xl p-5 transition-all duration-200 hover:shadow-lg rise"
        style="animation-delay: 0.1s"
      >
        <button
          class="flex h-11 w-full items-center justify-center gap-2 rounded-full text-sm font-medium text-destructive transition-all duration-150 hover:bg-red-50 active:scale-95"
          @click="showLogoutModal = true"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="1.3em"
            height="1.3em"
            viewBox="0 0 20 20"
          >
            <path d="M0 0h20v20H0z" fill="none" />
            <g fill="currentColor" fill-rule="evenodd" clip-rule="evenodd">
              <path
                d="M15.347 7.116a.5.5 0 0 1 .704.064l2.083 2.5a.5.5 0 0 1-.768.64l-2.083-2.5a.5.5 0 0 1 .064-.704"
              />
              <path
                d="M15.347 12.884a.5.5 0 0 1-.064-.704l2.083-2.5a.5.5 0 1 1 .768.64l-2.083 2.5a.5.5 0 0 1-.704.064"
              />
              <path
                d="M17.5 10a.5.5 0 0 1-.5.5H9.5a.5.5 0 0 1 0-1H17a.5.5 0 0 1 .5.5m-14-7a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1H4a.5.5 0 0 1-.5-.5m0 14a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1H4a.5.5 0 0 1-.5-.5"
              />
              <path
                d="M13 2.5a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0V3a.5.5 0 0 1 .5-.5m0 10a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 1 .5-.5m-9-10a.5.5 0 0 1 .5.5v14a.5.5 0 0 1-1 0V3a.5.5 0 0 1 .5-.5"
              />
            </g>
          </svg>
          Chiqish
        </button>
      </AppCard>
    </div>

    <!-- Chiqish ruxsat modali (rasmga mos) -->
    <AppModal :open="showLogoutModal" title="" @close="showLogoutModal = false">
      <div class="flex flex-col items-center gap-3 py-2 text-center">
        <div
          class="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-2xl text-red-600"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="1.3em"
            height="1.3em"
            viewBox="0 0 20 20"
          >
            <path d="M0 0h20v20H0z" fill="none" />
            <g fill="currentColor" fill-rule="evenodd" clip-rule="evenodd">
              <path
                d="M15.347 7.116a.5.5 0 0 1 .704.064l2.083 2.5a.5.5 0 0 1-.768.64l-2.083-2.5a.5.5 0 0 1 .064-.704"
              />
              <path
                d="M15.347 12.884a.5.5 0 0 1-.064-.704l2.083-2.5a.5.5 0 1 1 .768.64l-2.083 2.5a.5.5 0 0 1-.704.064"
              />
              <path
                d="M17.5 10a.5.5 0 0 1-.5.5H9.5a.5.5 0 0 1 0-1H17a.5.5 0 0 1 .5.5m-14-7a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1H4a.5.5 0 0 1-.5-.5m0 14a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1H4a.5.5 0 0 1-.5-.5"
              />
              <path
                d="M13 2.5a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0V3a.5.5 0 0 1 .5-.5m0 10a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 1 .5-.5m-9-10a.5.5 0 0 1 .5.5v14a.5.5 0 0 1-1 0V3a.5.5 0 0 1 .5-.5"
              />
            </g>
          </svg>
        </div>
        <h3 class="text-base font-semibold">Tizimdan chiqishni xohlaysizmi?</h3>
      </div>
      <div class="mt-5 flex justify-center gap-2">
        <button
          class="flex-1 rounded-full border border-border px-4 py-2.5 text-sm font-medium transition-colors duration-150 hover:bg-secondary"
          :disabled="loggingOut"
          @click="showLogoutModal = false"
        >
          Orqaga
        </button>
        <button
          class="flex-1 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-150 hover:bg-primary/90 active:scale-95 disabled:opacity-60"
          :disabled="loggingOut"
          @click="confirmLogout"
        >
          <span
            v-if="loggingOut"
            class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground align-middle"
          ></span>
          <span v-else>Chiqish</span>
        </button>
      </div>
    </AppModal>
  </KassirLayout>
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

.rise {
  opacity: 0;
  transform: translateY(12px);
  animation: riseIn 0.5s cubic-bezier(0.2, 0.7, 0.2, 1) forwards;
}

@keyframes riseIn {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.ring-glow {
  background: conic-gradient(
    from 0deg,
    var(--primary, #22c55e),
    transparent 65%,
    var(--primary, #22c55e)
  );
  animation: spinSlow 6s linear infinite;
}

@keyframes spinSlow {
  to {
    transform: rotate(360deg);
  }
}

.animate-pulse-dot {
  animation: dotPulse 1.8s ease-out infinite;
}

@keyframes dotPulse {
  0% {
    transform: scale(1);
    opacity: 0.6;
  }

  100% {
    transform: scale(2.4);
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .page-enter,
  .rise,
  .ring-glow,
  .animate-pulse-dot {
    animation: none !important;
  }
}
</style>
