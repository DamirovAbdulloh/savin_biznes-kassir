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
        class="mt-4 flex items-center gap-3 rounded-lg border border-red-400 bg-red-50 px-4 py-3">
        <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white bg-red-500">
          <svg xmlns="http://www.w3.org/2000/svg" width="2em" height="2em" viewBox="0 0 24 24">
            <path d="M0 0h24v24H0z" fill="none" />
            <path fill="currentColor"
              d="M12.434 16.28q.182-.182.182-.434t-.182-.433T12 15.23t-.434.182t-.182.433t.182.434t.434.181t.434-.181m-.077-3.27q.143-.144.143-.356v-5q0-.213-.144-.356t-.357-.144t-.356.144t-.143.356v5q0 .212.144.356t.357.144t.356-.144M12.003 21q-1.866 0-3.51-.708q-1.643-.709-2.859-1.924t-1.925-2.856T3 12.003t.709-3.51Q4.417 6.85 5.63 5.634t2.857-1.925T11.997 3t3.51.709q1.643.708 2.859 1.922t1.925 2.857t.709 3.509t-.708 3.51t-1.924 2.859t-2.856 1.925t-3.509.709M12 20q3.35 0 5.675-2.325T20 12t-2.325-5.675T12 4T6.325 6.325T4 12t2.325 5.675T12 20m0-8" />
          </svg>

        </div>
        <p class="text-[12px] font-medium text-red-700">{{ errorMessage }}</p>
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
      <div class="relative w-50% overflow-hidden rounded-3xl bg-white shadow-2xl">
        <!-- Close button X -->
        <button
          class="absolute right-4 top-4 z-10 flex h-6 w-6 items-center justify-center rounded-full text-gray-400 hover:text-gray-600"
          @click="helpOpen = false">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
            class="h-5 w-5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <!-- Content -->
        <div class="space-y-4 p-8 text-center pt-8">
          <div class="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl text-white"
            style="background: #89EA5C;">
            <img class="h-8 w-8" src="../images/Vector.svg?url" alt="Savin" />
          </div>
          <h2 class="text-2xl font-bold text-gray-900">Qo'llab-quvvatlash</h2>
          <p class="text-sm text-gray-600">
            Agar sizga texnik yordam kerak bo'lsa, qo'llab-quvvatlash jamoamizga murojaat qiling.
          </p>
          <button
            class="mx-auto mt-6 flex items-center gap-3 rounded-full bg-white px-6 py-3 shadow-md hover:shadow-lg transition"
            @click="copyPhone">
            <span class="flex h-8 w-8 items-center justify-center rounded-full text-white"
              style="background: #25D366;">
              <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371 0-.57 0-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a9.87 9.87 0 00-4.869 1.23c-2.868 1.515-4.75 4.486-4.75 7.661 0 3.29 1.923 6.362 5.269 7.905 2.054.959 4.381.959 6.437 0 3.333-1.55 5.269-4.62 5.269-7.905 0-3.206-1.9-6.145-4.75-7.66-.788-.409-1.636-.615-2.522-.615m10.84-10.85c0-1.105-.896-2-2-2s-2 .895-2 2 .896 2 2 2 2-.895 2-2Z" />
              </svg>
            </span>
            <span class="text-base font-semibold text-gray-900">+998 93 242 59 99</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
              class="h-4 w-4 text-gray-400">
              <path d="M8 16H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2m-6 12h8a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2z" />
            </svg>
          </button>
        </div>

        <!-- Green gradient bottom -->
        <div class="h-24 w-full"
          style="background: linear-gradient(to top, rgb(64%, 85%, 75%), transparent);"></div>
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