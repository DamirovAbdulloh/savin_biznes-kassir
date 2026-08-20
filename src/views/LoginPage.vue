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
      errorMessage.value =
        "Serverga ulanib bo'lmadi. Internet aloqasini yoki backend ishlab turganini tekshiring.";
    } else if (e.response.status === 400 || e.response.status === 401) {
      // Login xatosi — har doim bir xil xabar ko'rsatamiz
      errorMessage.value = "Email yoki parol noto'g'ri. Iltimos qayta tekshiring.";
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

    <div class="relative z-10 w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
      <!-- Logo — dizayndagidek yorqin yashil yumaloq kvadrat + qora belgi -->
      <div class="mb-6 flex h-24 w-24 items-center justify-center rounded-2xl" style="background: #89EA5C;">
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" class="h-12 w-12">
          <path
            d="M32.0494 0C41.5095 8.4305e-06 49.8393 1.5731 55.7064 6.98065C61.6576 12.4659 64 20.8754 64 31.8672C64 38.5895 63.0506 44.4877 59.7844 48.6988C56.2695 53.2307 50.9828 54.7332 45.0504 54.7332C39.1149 54.7332 33.9502 53.2171 30.7554 48.4281C28.2288 44.6409 27.5084 39.5175 27.3885 33.8123L22.0315 38.1122L16.1697 30.8193L32.0436 18.0778L47.974 30.8135L42.1265 38.118L36.7537 33.8225C36.8868 39.0419 37.5692 41.7782 38.5438 43.2393C39.2492 44.2967 40.585 45.379 45.0504 45.379C49.5181 45.379 51.3662 44.2828 52.3858 42.9684C53.6543 41.3331 54.6394 38.137 54.6394 31.8674C54.6394 21.9161 52.4782 16.7307 49.3601 13.8566C46.1574 10.9049 40.8522 9.35431 32.0494 9.35431C23.6233 9.35431 18.1798 11.4296 14.8123 14.7678C11.4518 18.0991 9.36049 23.48 9.36047 31.8336C9.36047 40.1793 11.4639 45.6678 14.8629 49.0933C18.2547 52.5117 23.7013 54.646 32.0494 54.646V64C22.1963 64 13.9583 61.4673 8.21589 55.6798C2.48058 49.8995 -3.72892e-06 41.643 0 31.8336C1.31865e-05 22.0322 2.46181 13.8348 8.22007 8.12667C13.9713 2.42546 22.2126 -3.16066e-06 32.0494 0Z"
            fill="#052400" />
        </svg>
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
          <input id="login" v-model="login" placeholder="Login" :class="[
            'h-11 w-full rounded-lg border px-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2',
            errorMessage
              ? 'border-red-400 bg-red-50 focus:ring-red-300'
              : 'border-transparent bg-gray-100 focus:ring-[#89EA5C]'
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
                  : 'border-transparent bg-gray-100 focus:ring-[#89EA5C]'
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
            <button type="button" class="text-xs font-medium text-[#659057] cursor-pointer"
              @click="toast.info('Parolni tiklash uchun qo\'llab-quvvatlashga murojaat qiling')">
              Parolni unutdingizmi?
            </button>
          </div>
        </div>

        <button type="submit"
          class="h-11 w-full rounded-xl text-sm font-semibold text-black shadow-md transition hover:opacity-90 disabled:opacity-60"
          style="background: #89EA5C;" :disabled="loading">
          {{ loading ? "Yuklanmoqda..." : "Kirish" }}
        </button>

        <div class="text-center text-xs">
          <span class="text-gray-500">Muammo bormi? </span>
          <button type="button" class="font-medium text-[#659057] cursor-pointer" @click="helpOpen = true">
            Yordam
          </button>
        </div>
      </form>
    </div>

    <div v-if="helpOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      @click.self="helpOpen = false">
      <div class="w-50% rounded-3xl bg-white p-6 text-center shadow-2xl">
        <div class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl text-white text-2xl"
          style="background: linear-gradient(135deg, #89EA5C, #89EA5C);">
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
            style="background: linear-gradient(135deg, #89EA5C, #89EA5C);">
            <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
              <path d="M0 0h24v24H0z" fill="none" />
              <path fill="currentColor"
                d="m19.23 15.26l-2.54-.29a1.99 1.99 0 0 0-1.64.57l-1.84 1.84a15.05 15.05 0 0 1-6.59-6.59l1.85-1.85c.43-.43.64-1.03.57-1.64l-.29-2.52a2 2 0 0 0-1.99-1.77H5.03c-1.13 0-2.07.94-2 2.07c.53 8.54 7.36 15.36 15.89 15.89c1.13.07 2.07-.87 2.07-2v-1.73c.01-1.01-.75-1.86-1.76-1.98" />
            </svg>
          </span>
          <span class="text-base font-semibold text-gray-900">+998 93 242 59 99</span>
        </button>
        <button class="mt-4 text-xs text-gray-400 hover:text-gray-600" @click="helpOpen = false">Yopish</button>
      </div>
    </div>
  </div>
</template>
<style scoped>
/* Dizayndagidek VERTIKAL: teppada oq/yorug', pastda yorqin yashil.
   - pastki porloq: yashilni sahifa tubidan yuqoriga ko'taradi
   - yuqori porloq: teppani oqartiradi
   - asosiy linear: 180deg (teppa och -> past yashil)
   Statik (animatsiya yo'q) — aks holda yashil pastdan siljib ketardi. */
.login-bg {
  background:
    radial-gradient(ellipse 140% 72% at 50% 116%, rgba(137, 234, 92, 0.9) 0%, rgba(137, 234, 92, 0.4) 34%, transparent 62%),
    radial-gradient(ellipse 120% 60% at 50% -12%, rgba(255, 255, 255, 0.95) 0%, transparent 55%),
    linear-gradient(180deg, #f4fdea 0%, #ddf7c8 40%, #a7ea7b 72%, #89EA5C 100%);
}
</style>