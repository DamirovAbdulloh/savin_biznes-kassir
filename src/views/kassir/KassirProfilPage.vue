<script setup>
import { reactive, ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import KassirLayout from "@/layouts/KassirLayout.vue";
import AppCard from "@/components/AppCard.vue";
import AppModal from "@/components/AppModal.vue";
import { useToastStore } from "@/stores/toast";
import { useAuthStore } from "@/stores/auth";
import { meApi } from "@/api";

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
    const user = await meApi.get();
    profile.username = user.username || "";
    profile.phone_number = user.phone_number || "";
    // ⚠️ MOCK — backend "biznes nomi" va "kassir kodi"ni qaytargach shu ikkitasini
    // ham to'g'ridan-to'g'ri user obyektidan olamiz.
    business.value =
      user.business_name || authStore.business?.name || "Fresh Cut Barber";
    cashierCode.value =
      user.cashier_code ||
      `#KSR-${String(user.id ?? 0)
        .slice(-3)
        .padStart(3, "0")}`;
  } catch (e) {
    toast.error("Ma'lumotni yuklashda xatolik");
  } finally {
    loading.value = false;
  }
}
onMounted(load);

// ---- Parol maydoni ----
// Xavfsizlik sababli backend parolni hech qachon ochiq matnda qaytarmaydi
// (u faqat hash holida saqlanadi). Shu sabab "ko'z" tugmasi haqiqiy parolni
// ochmaydi — buning o'rniga xavfsizlik tushuntirilishi va (agar kerak bo'lsa)
// parolni yangilash imkoni beriladi.
function togglePassword() {
  toast.info(
    "Xavfsizlik uchun joriy parol ko'rsatilmaydi. Almashtirish uchun biznes egangizga murojaat qiling.",
  );
}

// ---- Telefon raqamini tahrirlash ----
const editingPhone = ref(false);
const savingPhone = ref(false);
const phoneDraft = ref("");

function startEditPhone() {
  phoneDraft.value = profile.phone_number;
  editingPhone.value = true;
}
function cancelEditPhone() {
  editingPhone.value = false;
}
async function savePhone() {
  savingPhone.value = true;
  try {
    await meApi.update({ phone_number: phoneDraft.value });
    profile.phone_number = phoneDraft.value;
    editingPhone.value = false;
    toast.success("Telefon raqami yangilandi");
  } catch (e) {
    toast.error("Saqlashda xatolik yuz berdi");
  } finally {
    savingPhone.value = false;
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

        <h3 class="mb-3 text-sm font-semibold">Ma'lumotlar</h3>

        <div class="space-y-4">
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1 block text-xs font-medium text-muted"
                >Login</label
              >
              <input
                :value="profile.username"
                type="text"
                disabled
                class="h-11 w-full cursor-not-allowed rounded-lg border border-transparent bg-input px-3 text-sm text-muted outline-none"
              />
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-muted"
                >Parol</label
              >
              <div class="relative">
                <input
                  value="••••••••••••"
                  type="text"
                  disabled
                  class="h-11 w-full cursor-not-allowed rounded-lg border border-transparent bg-input px-3 pr-10 text-sm text-muted outline-none"
                />
                <button
                  type="button"
                  @click="togglePassword"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-muted transition-colors duration-150 hover:text-gray-700"
                  title="Parol xavfsizlik uchun ko'rsatilmaydi"
                >
                  👁
                </button>
              </div>
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
            <label class="mb-1 block text-xs font-medium text-muted"
              >Telefon raqami</label
            >

            <div v-if="!editingPhone" class="group flex items-center gap-2">
              <input
                :value="profile.phone_number || '—'"
                type="text"
                disabled
                class="h-11 w-full cursor-not-allowed rounded-lg border border-transparent bg-input px-3 text-sm text-muted outline-none"
              />
              <button
                type="button"
                @click="startEditPhone"
                class="flex h-11 shrink-0 items-center gap-1 rounded-lg border border-border px-3 text-xs font-medium text-green-500 opacity-0 transition-all duration-150 hover:bg-secondary group-hover:opacity-100"
                :disabled="loading"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="1.3em"
                  height="1.3em"
                  viewBox="0 0 24 24"
                >
                  <path d="M0 0h24v24H0z" fill="none" />
                  <path
                    fill="currentColor"
                    d="M5 19h1.425L16.2 9.225L14.775 7.8L5 17.575zm-2 2v-4.25L16.2 3.575q.3-.275.663-.425t.762-.15t.775.15t.65.45L20.425 5q.3.275.438.65T21 6.4q0 .4-.137.763t-.438.662L7.25 21zM19 6.4L17.6 5zm-3.525 2.125l-.7-.725L16.2 9.225z"
                  />
                </svg>
                Tahrirlash
              </button>
            </div>

            <div v-else class="flex items-center gap-2">
              <input
                v-model="phoneDraft"
                type="text"
                placeholder="+998 90 123 45 67"
                autofocus
                class="h-11 w-full rounded-lg border border-transparent bg-input px-3 text-sm outline-none transition-all duration-150 focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
              />
              <button
                type="button"
                @click="savePhone"
                :disabled="savingPhone"
                class="h-11 shrink-0 rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-sm transition-all duration-150 hover:bg-primary/90 active:scale-95 disabled:opacity-60"
              >
                {{ savingPhone ? "..." : "Saqlash" }}
              </button>
              <button
                type="button"
                @click="cancelEditPhone"
                :disabled="savingPhone"
                class="h-11 shrink-0 rounded-lg border border-border px-3 text-xs font-medium transition-colors duration-150 hover:bg-secondary"
              >
                Bekor
              </button>
            </div>
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
