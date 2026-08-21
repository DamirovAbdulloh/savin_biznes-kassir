<script setup>
import { ref, computed, onBeforeUnmount, watch } from "vue";
import { useRouter } from "vue-router";
import KassirLayout from "@/layouts/KassirLayout.vue";
import PageHeader from "@/components/PageHeader.vue";
import AppCard from "@/components/AppCard.vue";
import WizardStepper from "@/components/kassir/WizardStepper.vue";
import NumericKeypad from "@/components/kassir/NumericKeypad.vue";
import { cashierApi } from "@/api";
import { useToastStore } from "@/stores/toast";
import { useAuthStore } from "@/stores/auth";

const authStore = useAuthStore();

const router = useRouter();
const toast = useToastStore();

function fmt(n) {
  return Number(n || 0).toLocaleString("ru-RU");
}

const STEPS = [
  { label: "Skanerlash" },
  { label: "Mijoz" },
  { label: "Summa" },
  { label: "Tasdiqlash" },
];
const step = ref(1); // 1..4, muvaffaqiyat ekrani step===5

// ---------------- 1-qadam: QR skanerlash ----------------
const videoEl = ref(null);
const scanning = ref(false);
const cameraError = ref("");
const manualCode = ref("");
let stream = null;
let rafId = null;
let detector = null;

async function startCamera() {
  cameraError.value = "";
  if (!("BarcodeDetector" in window)) {
    cameraError.value =
      "Bu brauzer kamera orqali QR o'qishni qo'llab-quvvatlamaydi. QR kodni qo'lda kiriting.";
    return;
  }
  try {
    detector = new window.BarcodeDetector({ formats: ["qr_code"] });
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
    });
    videoEl.value.srcObject = stream;
    await videoEl.value.play();
    scanning.value = true;
    tick();
  } catch (e) {
    cameraError.value = "Kameraga ruxsat berilmadi. QR kodni qo'lda kiriting.";
  }
}

async function tick() {
  if (!scanning.value || !videoEl.value) return;
  try {
    const codes = await detector.detect(videoEl.value);
    if (codes.length) {
      await onQrDetected(codes[0].rawValue);
      return;
    }
  } catch {
    /* keyingi kadrda qayta urinamiz */
  }
  rafId = requestAnimationFrame(tick);
}

function stopCamera() {
  scanning.value = false;
  if (rafId) cancelAnimationFrame(rafId);
  if (stream) {
    stream.getTracks().forEach((t) => t.stop());
    stream = null;
  }
}

const loadingCustomer = ref(false);
// Bir xil QR ketma-ket o'qilganda xabar takrorlanib ketmasligi uchun
let lastFailedCode = null;

async function onQrDetected(code) {
  stopCamera();
  loadingCustomer.value = true;
  try {
    customer.value = await cashierApi.verifyQr(code);
    lastFailedCode = null;
    step.value = 2;
  } catch (e) {
    // Backend aniq sababni yuboradi (muddati tugagan, bloklangan, topilmadi)
    const detail = e.response?.data?.detail;
    if (code !== lastFailedCode) {
      toast.error(detail || "QR kod tekshirilmadi. Qayta urinib ko'ring.");
      lastFailedCode = code;
    }
    startCamera();
  } finally {
    loadingCustomer.value = false;
  }
}

// Faqat 4 xonali kod: mijozning ilovasida har 5 daqiqada yangilanadi.
// Telefon raqami QABUL QILINMAYDI (raqam o'zgarmaydi — xavfsiz emas).
function onManualInput(e) {
  const digits = (e.target.value || "").replace(/\D/g, "").slice(0, 4);
  manualCode.value = digits;
  // 4 ta raqam kiritilishi bilan avtomatik tekshiramiz
  if (digits.length === 4) submitManualCode();
}

async function submitManualCode() {
  const code = manualCode.value.trim();
  if (code.length !== 4) {
    toast.info("Kod 4 xonali bo'lishi kerak");
    return;
  }
  await onQrDetected(code);
  manualCode.value = "";
}

onBeforeUnmount(stopCamera);
watch(step, (v) => {
  if (v !== 1) stopCamera();
});

// ---------------- 2-qadam: Mijoz ----------------
const customer = ref(null);

// ---------------- 3-qadam: Summa ----------------
const amount = ref(0);
const discountAmount = computed(() =>
  Math.round((amount.value * (customer.value?.discount_percent || 0)) / 100),
);
const finalAmount = computed(() =>
  Math.max(0, amount.value - discountAmount.value),
);

// ---------------- 4-qadam: Tasdiqlash ----------------
const services = ref([]);
const serviceId = ref("");
const comment = ref("");
const validationError = ref("");
async function loadServices() {
  services.value = await cashierApi.services();
}

const selectedServiceName = computed(
  () => services.value.find((s) => s.id === serviceId.value)?.name || "",
);

const submitting = ref(false);
const result = ref(null);

async function confirmTransaction() {
  if (!serviceId.value) {
    validationError.value = "Belgi maydoni to'ldirilishi shart";
    setTimeout(() => (validationError.value = ""), 3000);
    return;
  }
  submitting.value = true;
  try {
    const data = await cashierApi.applyDiscount({
      purchase_amount: amount.value,
      discount_percent: customer.value?.discount_percent,
      service_name: selectedServiceName.value,
      comment: comment.value,
      customer_name: customer.value?.full_name,
      // Mijoz ilovasida "tejagan summa" ko'rinishi uchun tranzaksiya
      // mijozning hisobiga bog'lanadi (id + telefon zaxira sifatida).
      customer_id: customer.value?.id,
      customer_phone: customer.value?.phone_number,
    });
    result.value = {
      ...data,
      customer_name: customer.value?.full_name,
      membership_type: customer.value?.membership_type,
      service_name: selectedServiceName.value,
      purchase_amount: amount.value,
      discount_amount: discountAmount.value,
      discount_percent: customer.value?.discount_percent,
      final_amount: finalAmount.value,
      time: new Date(),
    };
    step.value = 5;
  } catch {
    toast.error("Tranzaksiyani saqlashda xatolik yuz berdi");
  } finally {
    submitting.value = false;
  }
}

// ---------------- Chek ma'lumotlari ----------------
// Chekda biznes va kassir nomi ko'rinishi kerak (dizayndagidek)
const businessName = computed(
  () => authStore.business?.name || authStore.user?.business_name || "Savin",
);
const businessAddress = computed(
  () => authStore.business?.address || authStore.business?.full_address || "",
);
const cashierName = computed(
  () =>
    authStore.user?.full_name ||
    [authStore.user?.first_name, authStore.user?.last_name].filter(Boolean).join(" ") ||
    authStore.user?.email ||
    "—",
);

/** Chekni chop etish — faqat chek qismi bosiladi (boshqa hamma narsa yashiriladi) */
function printReceipt() {
  document.body.classList.add("printing-receipt");
  const cleanup = () => {
    document.body.classList.remove("printing-receipt");
    window.removeEventListener("afterprint", cleanup);
  };
  window.addEventListener("afterprint", cleanup);
  window.print();
  // Ba'zi brauzerlarda afterprint ishlamaydi — zaxira sifatida
  setTimeout(cleanup, 1500);
}

// ---------------- Navigatsiya ----------------
function goBack() {
  if (step.value === 2) {
    customer.value = null;
    step.value = 1;
    startCamera();
  } else if (step.value === 3) {
    step.value = 2;
  } else if (step.value === 4) {
    step.value = 3;
  }
}

function goToStep2() {
  step.value = 2;
}
function goToStep3() {
  step.value = 3;
  loadServices();
}
function goToStep4() {
  if (amount.value <= 0) {
    toast.info("Summani kiriting");
    return;
  }
  step.value = 4;
}

function restart() {
  step.value = 1;
  customer.value = null;
  amount.value = 0;
  serviceId.value = "";
  comment.value = "";
  result.value = null;
  startCamera();
}

// Sahifa ochilganda kamerani ishga tushiramiz
startCamera();
</script>

<template>
  <KassirLayout>
    <div class="space-y-4">
      <!-- Sarlavha teppaga va yonlarga yopishib turadi -->
      <PageHeader title="QR Skanerlash">
        <WizardStepper v-if="step <= 4" :steps="STEPS" :current="step" />
        <WizardStepper v-else :steps="STEPS" :current="5" />
      </PageHeader>

      <!-- 1-QADAM: Skanerlash -->
      <div v-if="step === 1" class="grid gap-4 md:grid-cols-3">
        <AppCard class="overflow-hidden p-0 md:col-span-2">
          <div class="relative aspect-video w-full bg-black">
            <video
              v-if="!cameraError"
              ref="videoEl"
              class="h-full w-full object-cover"
              muted
              playsinline
            ></video>
            <div
              v-else
              class="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-white/70"
            >
              <svg
                viewBox="0 0 24 24"
                class="h-10 w-10"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
              >
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
              </svg>
              <p class="text-sm">{{ cameraError }}</p>
            </div>
            <div
              v-if="!cameraError"
              class="pointer-events-none absolute inset-0 flex items-center justify-center"
            >
              <div class="h-40 w-40 rounded-2xl border-2 border-white/70"></div>
            </div>
          </div>
          <p class="p-4 text-center text-sm text-muted">
            Mijozning telefonidagi QR ni kameraga tutib turing.<br />QR
            avtomatik taniladi.
          </p>
        </AppCard>

        <AppCard class="space-y-3 p-5">
          <div
            class="rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800"
          >
            <p class="font-semibold">Eslatma</p>
            <p class="mt-0.5 text-xs">
              QR har 5 daqiqada yangilanadi. Eski QR ishlamaydi.
            </p>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-medium text-gray-700"
              >QR kod ishlamasa, 4 xonali kodni kiriting</label
            >
            <div class="flex gap-2">
              <input
                :value="manualCode"
                inputmode="numeric"
                autocomplete="off"
                maxlength="4"
                placeholder="0000"
                class="h-11 w-full rounded-lg border border-transparent bg-input px-3 text-center text-lg font-bold tracking-[0.5em] tabular-nums outline-none focus:ring-2 focus:ring-primary/30"
                @input="onManualInput"
                @keyup.enter="submitManualCode"
              />
              <button
                @click="submitManualCode"
                class="shrink-0 rounded-lg bg-primary px-3 text-sm font-medium text-white hover:bg-primary/90"
              >
                OK
              </button>
            </div>
            <p class="text-[11px] text-muted">
              Kodni mijoz ilovadagi QR ekranidan o'qiydi. Telefon raqami
              qabul qilinmaydi.
            </p>
          </div>
        </AppCard>
      </div>

      <!-- 2-QADAM: Mijoz -->
      <div v-else-if="step === 2 && customer" class="grid gap-4 md:grid-cols-2">
        <AppCard class="flex flex-col justify-between p-5">
          <div>
            <div class="flex items-center gap-3">
              <span
                class="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground"
              >
                {{
                  (customer.full_name || "?")
                    .split(" ")
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()
                }}
              </span>
              <div>
                <p class="font-semibold">{{ customer.full_name }}</p>
                <p class="text-xs text-black">{{ customer.membership_type }}</p>
              </div>
            </div>

            <div class="mt-4 flex items-center gap-6 text-sm">
              <div>
                <p class="text-xs text-muted">Jami tashriflar</p>
                <p class="font-semibold">{{ customer.visits_count }} ta</p>
              </div>
              <div>
                <p class="text-xs text-muted">Oxirgi tashrif</p>
                <p class="font-semibold">
                  {{ customer.last_visit_days_ago }} kun oldin
                </p>
              </div>
            </div>
          </div>
        </AppCard>

        <AppCard class="flex flex-col justify-between p-5">
          <div>
            <p class="mb-2 text-sm font-semibold">A'zolik ma'lumotlari</p>
            <div class="space-y-2 rounded-xl bg-secondary p-3 text-sm">
              <div class="flex justify-between">
                <span class="text-muted">Turi</span
                ><span class="font-medium">{{ customer.membership_type }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted">Holati</span
                ><span class="font-medium text-primary">{{
                  customer.membership_status
                }}</span>
              </div>
            </div>
          </div>

          <div class="mt-4 flex flex-col gap-2">
            <button
              @click="goToStep3"
              class="h-11 rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Davom etish
            </button>
            <button
              @click="goBack"
              class="h-11 rounded-xl border border-border text-sm font-medium hover:bg-secondary"
            >
              Orqaga
            </button>
          </div>
        </AppCard>
      </div>

      <!-- 3-QADAM: Summa -->
      <div v-else-if="step === 3" class="grid gap-4 md:grid-cols-2">
        <AppCard class="space-y-4 p-5">
          <div class="rounded-xl bg-secondary py-6 text-center">
            <p class="text-3xl font-bold tabular-nums">{{ fmt(amount) }}</p>
            <p class="text-xs text-muted">so'm</p>
          </div>
          <NumericKeypad v-model="amount" />
        </AppCard>

        <AppCard class="flex flex-col justify-between p-5">
          <div>
            <div class="flex items-center gap-3 border-b border-border pb-4">
              <span
                class="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground"
              >
                {{
                  (customer.full_name || "?")
                    .split(" ")
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()
                }}
              </span>
              <div>
                <p class="text-sm font-semibold">{{ customer.full_name }}</p>
                <p class="text-xs font-medium text-gray-900">
                  {{ customer.membership_type }}
                </p>
              </div>
            </div>

            <p class="mb-2 mt-4 text-sm font-semibold">Hisob</p>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-muted">Asl narx</span
                ><span>{{ amount ? fmt(amount) + " so'm" : "-" }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted"
                  >Chegirma ({{ customer.discount_percent }}%)</span
                ><span>{{ amount ? fmt(discountAmount) + " so'm" : "-" }}</span>
              </div>
              <div class="flex justify-between font-semibold">
                <span>Mijoz to'laydi</span
                ><span class="text-primary">{{
                  amount ? fmt(finalAmount) + " so'm" : "-"
                }}</span>
              </div>
            </div>
          </div>

          <div class="mt-4 flex flex-col gap-2">
            <button
              @click="goToStep4"
              class="h-11 rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              :disabled="amount <= 0"
            >
              Hisoblash va davom etish
            </button>
            <button
              @click="goBack"
              class="h-11 rounded-xl border border-border text-sm font-medium hover:bg-secondary"
            >
              Orqaga
            </button>
          </div>
        </AppCard>
      </div>

      <!-- 4-QADAM: Tasdiqlash -->
      <div v-else-if="step === 4" class="relative grid gap-4 md:grid-cols-2">
        <Transition name="fade">
          <div
            v-if="validationError"
            class="absolute -top-2 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm text-white shadow-lg"
          >
            {{ validationError }}
          </div>
        </Transition>

        <AppCard class="p-5">
          <div class="flex items-center gap-3">
            <span
              class="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground"
            >
              {{
                (customer.full_name || "?")
                  .split(" ")
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()
              }}
            </span>
              <div>
                <p class="text-sm font-semibold">{{ customer.full_name }}</p>
                <p class="text-xs text-black">
                  {{ customer.membership_type }}
                  <span class="text-muted">{{ customer.code }}</span>
                </p>
              </div>
          </div>
          <div class="mt-4 space-y-2 border-t border-border pt-4 text-sm">
            <div class="flex justify-between">
              <span class="text-muted">Asl narx</span
              ><span>{{ fmt(amount) }} so'm</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted"
                >Chegirma ({{ customer.discount_percent }}%)</span
              ><span class="text-destructive"
                >- {{ fmt(discountAmount) }} so'm</span
              >
            </div>
            <div class="flex justify-between text-base font-bold">
              <span>Mijoz to'laydi</span
              ><span class="text-primary">{{ fmt(finalAmount) }} so'm</span>
            </div>
          </div>
        </AppCard>

        <AppCard class="p-5">
          <div class="flex items-center gap-3 border-b border-border pb-4">
            <span
              class="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground"
            >
              {{
                (customer.full_name || "?")
                  .split(" ")
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()
              }}
            </span>
            <div>
              <p class="text-sm font-semibold">{{ customer.full_name }}</p>
              <p class="text-xs font-medium text-gray-900">{{ customer.membership_type }}</p>
            </div>
          </div>

          <div class="mt-4 space-y-1.5">
            <label class="text-xs font-medium text-gray-700"
              >Xizmat turi <span class="text-destructive">*</span></label
            >
            <select
              v-model="serviceId"
              class="h-10 w-full rounded-lg border border-border bg-input px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              :class="validationError ? 'border-destructive' : ''"
            >
              <option value="" disabled>
                {{ services.length ? "Tanlang" : "Xizmat qo'shilmagan" }}
              </option>
              <option v-for="s in services" :key="s.id" :value="s.id">
                {{ s.name }}
              </option>
            </select>
            <p v-if="!services.length" class="mt-1 text-xs text-muted">
              Biznes egasi hali xizmat qo'shmagan — biznes panelidagi
              "Xizmatlar" bo'limidan qo'shilishi kerak.
            </p>
          </div>

          <div class="mt-3 space-y-1.5">
            <label class="text-xs font-medium text-gray-700">Izoh</label>
            <textarea
              v-model="comment"
              rows="3"
              placeholder="Qo'shimcha izoh"
              class="w-full resize-none rounded-lg border border-border bg-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            ></textarea>
          </div>

          <div class="mt-4 flex flex-col gap-2">
            <button
              @click="confirmTransaction"
              :disabled="submitting"
              :class="[
                'h-11 rounded-xl text-sm font-semibold transition-colors',
                serviceId
                  ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                  : 'bg-white text-black border border-border hover:bg-secondary',
                submitting ? 'opacity-60 pointer-events-none' : ''
              ]"
            >
              {{ submitting ? "Yuborilmoqda..." : "Tasdiqlash" }}
            </button>
            <button
              @click="goBack"
              class="h-11 rounded-xl border border-border text-sm font-medium hover:bg-secondary"
            >
              Orqaga
            </button>
          </div>
        </AppCard>
      </div>

      <!-- 5-QADAM: Muvaffaqiyat -->
      <div v-else-if="step === 5 && result" class="grid gap-4 md:grid-cols-[1fr_280px]">
        <AppCard class="flex flex-col items-center p-6 text-center">
          <span
            class="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground"
          >
            <svg
              viewBox="0 0 24 24"
              class="h-7 w-7"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
          <h2 class="mt-3 text-xl font-bold">Muvaffaqiyatli!</h2>
          <p class="text-sm text-muted">Chegirma qo'llanildi</p>

          <div
            class="mt-4 w-full space-y-2 border-t border-border pt-4 text-left text-sm"
          >
            <div class="flex justify-between">
              <span class="text-muted">Mijoz</span
              ><span class="font-medium">{{ result.customer_name }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted">Xizmat</span
              ><span class="font-medium">{{ result.service_name }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted">A'zolik</span
              ><span class="font-medium">{{ result.membership_type }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted">Asl narx</span
              ><span class="text-muted line-through">{{
                fmt(result.purchase_amount)
              }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted">Chegirma</span
              ><span>- {{ fmt(result.discount_amount) }}</span>
            </div>
          </div>
          <div class="mt-3 w-full rounded-xl bg-accent p-3">
            <p class="text-xs text-accent-foreground">Kassaga tushdi</p>
            <p class="text-2xl font-bold text-primary">
              {{ fmt(result.final_amount) }} so'm
            </p>
          </div>

          <div class="mt-4 flex w-full gap-2">
            <RouterLink
              to="/kassir/dashboard"
              class="flex h-11 flex-1 items-center justify-center rounded-xl border border-border text-sm font-medium hover:bg-secondary"
            >
              Dashboardga qaytish
            </RouterLink>
            <button
              @click="restart"
              class="h-11 flex-1 rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              QR Skanerlash
            </button>
          </div>
        </AppCard>

        <AppCard id="savin-chek" class="p-5 text-sm rounded-2xl border border-border">
          <p class="text-center font-semibold">Savin</p>
          <p class="text-center text-xs text-muted">{{ businessName }}</p>
          <p v-if="businessAddress" class="text-center text-xs text-muted">
            {{ businessAddress }}
          </p>
          <div
            class="mt-4 space-y-1.5 border-t border-dashed border-border pt-4"
          >
            <div class="flex justify-between">
              <span class="text-muted">Sana</span
              ><span>{{ result.time.toLocaleDateString("uz-UZ") }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted">Vaqt</span
              ><span>{{
                result.time.toLocaleTimeString("uz-UZ", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted">Kassir</span
              ><span>{{ cashierName }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted">Mijoz</span
              ><span>{{ result.customer_name }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted">A'zolik</span
              ><span>{{ result.membership_type }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted">{{ result.service_name }}</span
              ><span>{{ fmt(result.purchase_amount) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted"
                >Chegirma ({{ result.discount_percent }}%)</span
              ><span>- {{ fmt(result.discount_amount) }}</span>
            </div>
          </div>
          <div
            class="mt-3 flex items-center justify-between border-t border-dashed border-border pt-3 text-base font-bold"
          >
            <span>Jami</span
            ><span class="text-success">{{ fmt(result.final_amount) }} so'm</span>
          </div>
          <p class="mt-1 text-right text-xs text-muted">To'lov: naqd</p>
          <div class="mt-4 flex justify-center">
            <img
              :src="`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=savin-receipt-${encodeURIComponent(result.id || Date.now())}`"
              alt="Chek QR"
              class="h-28 w-28"
            />
          </div>
          <p class="mt-2 text-center text-xs text-muted">
            Savin orqali<br />Rahmat! Qaytib keling
          </p>
          <button
            class="no-print mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-white transition-all hover:bg-primary/90 active:scale-[0.98]"
            @click="printReceipt"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 9V2h12v7" />
              <rect x="6" y="13" width="12" height="9" rx="2" />
              <path d="M6 18h12" />
            </svg>
            Chekni chiqarish
          </button>
        </AppCard>
      </div>
    </div>
  </KassirLayout>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

<!-- Chop etish uslubi global bo'lishi kerak (scoped emas): chek chiqarilganda
     sahifadagi qolgan hamma narsa yashiriladi. -->
<style>
@media print {
  body.printing-receipt * {
    visibility: hidden;
  }

  body.printing-receipt #savin-chek,
  body.printing-receipt #savin-chek * {
    visibility: visible;
  }

  body.printing-receipt #savin-chek {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    border: none;
    box-shadow: none;
  }

  body.printing-receipt .no-print {
    display: none !important;
  }
}
</style>
