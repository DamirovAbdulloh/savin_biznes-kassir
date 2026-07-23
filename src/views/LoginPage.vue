<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useToastStore } from "@/stores/toast";
import AnimatedBackground from "@/components/AnimatedBackground.vue";
const router = useRouter();
const authStore = useAuthStore();
const toast = useToastStore();

const login = ref("");
const password = ref("");
const showPassword = ref(false);
const loading = ref(false);
const helpOpen = ref(false);
const errorMessage = ref("");

async function handleSubmit() {
  errorMessage.value = ""; // eski xatoni tozalash
  loading.value = true;
  try {
    const user = await authStore.login(login.value, password.value);
    router.push(user.role === "cashier" ? "/kassir/dashboard" : "/asosiy");
  } catch (e) {
    if (!e.response) {
      // Backend javob bermadi — server ishga tushmagan yoki manzil noto'g'ri.
      // Avval bu holat ham "parol noto'g'ri" deb ko'rsatilardi va chalg'itardi.
      errorMessage.value =
        "Serverga ulanib bo'lmadi. Internet aloqasini yoki backend ishlab turganini tekshiring.";
    } else if (e.response.status === 400 || e.response.status === 401) {
      errorMessage.value =
        e.response.data?.detail ||
        e.response.data?.non_field_errors?.[0] ||
        "Email yoki parol noto'g'ri. Iltimos qayta tekshiring.";
    } else {
      errorMessage.value = "Kutilmagan xatolik yuz berdi. Qayta urinib ko'ring.";
    }
  } finally {
    loading.value = false;
  }
}

function copyPhone() {
  navigator.clipboard.writeText("+998 93 242 59 99");
  toast.success("Nusxa olindi");
}
</script>
<template>
  <div class="login-bg relative flex min-h-screen items-center justify-center overflow-hidden p-4">
    <AnimatedBackground />

    <div class="relative z-10 w-full max-w-md rounded-3xl bg-white/90 p-8 shadow-2xl backdrop-blur-sm">
      <!-- Logo -->
      <div class="mb-6 flex h-24 w-24 items-center justify-center rounded-2xl text-white"
        style="background: linear-gradient(135deg, #6fd94a, #3fae2a);">
        <img src="../images/Vector.svg?url" alt="Vector" />
      </div>

      <h1 class="text-3xl font-bold leading-tight text-gray-900">
        Savin Biznes<br />paneli
      </h1>

      <!-- Xato banneri -->
      <div v-if="errorMessage"
        class="mt-4 flex items-center gap-2 rounded-xl border border-red-300 bg-red-100 px-3 py-2.5">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
          class="h-4 w-4 shrink-0 text-red-500">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p class="text-xs font-medium text-red-600">{{ errorMessage }}</p>
      </div>

      <form class="mt-6 space-y-4" @submit.prevent="handleSubmit">
        <div class="space-y-1.5">
          <label for="login" class="text-sm font-medium text-gray-800">Email</label>
          <input id="login" v-model="login" placeholder="example@biznes.uz" :class="[
            'h-11 w-full rounded-lg border px-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2',
            errorMessage
              ? 'border-red-400 bg-red-50 focus:ring-red-300'
              : 'border-transparent bg-gray-100 focus:ring-green-500'
          ]" />
        </div>

        <div class="space-y-1.5">
          <label for="password" class="text-sm font-medium text-gray-800">Parol</label>
          <div class="relative">
            <input id="password" v-model="password" :type="showPassword ? 'text' : 'password'" placeholder="••••••••••"
              :class="[
                'h-11 w-full rounded-lg border px-3 pr-10 text-sm text-gray-900 outline-none focus:ring-2',
                errorMessage
                  ? 'border-red-400 bg-red-50 focus:ring-red-300'
                  : 'border-transparent bg-gray-100 focus:ring-green-500'
              ]" />
            <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              @click="showPassword = !showPassword">
              <svg v-if="!showPassword" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" class="h-4 w-4">
                <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="2" class="h-4 w-4">
                <path
                  d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a21.6 21.6 0 0 1 5.06-6.06M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 7 11 7a21.6 21.6 0 0 1-2.94 3.94M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            </button>
          </div>
          <div class="flex justify-end">
            <button type="button" class="text-xs font-medium text-green-600 hover:text-green-700"
              @click="toast.info('Parolni tiklash uchun qo\'llab-quvvatlashga murojaat qiling')">
              Parolni unutdingizmi?
            </button>
          </div>
        </div>

        <button type="submit"
          class="h-11 w-full rounded-full text-sm font-semibold text-white shadow-md transition hover:opacity-90 disabled:opacity-60"
          style="background: linear-gradient(135deg, #6fd94a, #3fae2a);" :disabled="loading">
          {{ loading ? "Yuklanmoqda..." : "Kirish" }}
        </button>

        <div class="text-center text-xs">
          <span class="text-gray-500">Muammo bormi? </span>
          <button type="button" class="font-medium text-green-600 hover:text-green-700" @click="helpOpen = true">
            Yordam
          </button>
        </div>
      </form>
    </div>

    <div v-if="helpOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      @click.self="helpOpen = false">
      <div class="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl">
        <div class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl text-white text-2xl"
          style="background: linear-gradient(135deg, #6fd94a, #3fae2a);">
          <img class="w-8 h-8" src="../images/Vector.svg?url" alt="Vector" />
        </div>
        <h2 class="text-2xl font-semibold text-gray-900">Qo'llab-quvvatlash</h2>
        <p class="mt-2 text-sm text-gray-500">
          Agar sizga texnik yordam kerak bo'lsa, qo'llab-quvvatlash jamoamizga murojaat qiling.
        </p>
        <button
          class="mx-auto mt-4 flex items-center gap-2 rounded-full bg-gray-100 px-4 py-3 shadow-sm hover:bg-gray-200"
          @click="copyPhone">
          <span class="flex h-8 w-8 items-center justify-center rounded-full text-white"
            style="background: linear-gradient(135deg, #6fd94a, #3fae2a);">
            ☎
          </span>
          <span class="text-base font-semibold text-gray-900">+998 93 242 59 99</span>
        </button>
        <button class="mt-4 text-xs text-gray-400 hover:text-gray-600" @click="helpOpen = false">Yopish</button>
      </div>
    </div>
  </div>
</template>
<style scoped>
.login-bg {
  background-color: #c6f7a9;
  background-image:
    radial-gradient(circle at 20% 30%, rgba(207, 249, 203, 0.9) 0%, transparent 40%),
    radial-gradient(circle at 80% 20%, rgba(180, 240, 140, 0.9) 0%, transparent 45%),
    radial-gradient(circle at 30% 80%, rgba(60, 170, 40, 0.85) 0%, transparent 45%),
    radial-gradient(circle at 85% 75%, rgba(20, 130, 20, 0.8) 0%, transparent 50%),
    linear-gradient(135deg, #c8fbab 0%, #8de06a 55%, #30b416 100%);
  background-size: 200% 200%, 200% 200%, 200% 200%, 200% 200%, 100% 100%;
  animation: liquidMove 12s ease-in-out infinite;
}

@keyframes liquidMove {
  0% {
    background-position: 20% 30%, 80% 20%, 30% 80%, 85% 75%, 0% 0%;
  }

  25% {
    background-position: 40% 60%, 60% 40%, 50% 60%, 60% 50%, 0% 0%;
  }

  50% {
    background-position: 70% 20%, 30% 70%, 70% 30%, 40% 80%, 0% 0%;
  }

  75% {
    background-position: 30% 50%, 70% 60%, 40% 40%, 70% 30%, 0% 0%;
  }

  100% {
    background-position: 20% 30%, 80% 20%, 30% 80%, 85% 75%, 0% 0%;
  }
}
</style>