<script setup>
import { ref, onMounted, reactive } from "vue";
import DashboardLayout from "@/layouts/DashboardLayout.vue";
import AppCard from "@/components/AppCard.vue";
import AppModal from "@/components/AppModal.vue";
import { discountApi } from "@/api";
import { useToastStore } from "@/stores/toast";

const toast = useToastStore();

// Backend'da chegirma CRUD ro'yxat emas: bitta biznesga bitta joriy foiz
// biriktirilgan (Application.discount_percent). Uni o'zgartirish uchun
// "so'rov yuborish -> admin ko'rib chiqadi" jarayoni ishlaydi.
const currentPercent = ref(null);
const pendingRequest = ref(null);
const loading = ref(true);
const requestOpen = ref(false);
const submitting = ref(false);

const form = reactive({ new_percent: 5, reason: "" });

async function load() {
  loading.value = true;
  try {
    const data = await discountApi.me();
    currentPercent.value = data.current_percent;
    pendingRequest.value = data.pending_request;
  } finally {
    loading.value = false;
  }
}
onMounted(load);

function openRequest() {
  form.new_percent = currentPercent.value ?? 5;
  form.reason = "";
  requestOpen.value = true;
}

async function submitRequest() {
  submitting.value = true;
  try {
    await discountApi.requestChange(form.new_percent, form.reason);
    toast.success("So'rov yuborildi, admin ko'rib chiqadi");
    requestOpen.value = false;
    await load();
  } catch (e) {
    toast.error(e.response?.data?.new_percent?.[0] || "Xatolik yuz berdi");
  } finally {
    submitting.value = false;
  }
}

// Backend statuslarni kichik harfda qaytaradi (pending/approved/rejected)
const STATUS_LABEL = {
  pending: "Ko'rib chiqilmoqda",
  approved: "Tasdiqlangan",
  rejected: "Rad etilgan",
};
</script>

<template>
  <DashboardLayout>
    <div class="space-y-4">
      <AppCard class="reveal p-5" style="--d: 0ms">
        <h1 class="text-xl font-bold">Chegirma</h1>
        <p class="mt-1 text-xs text-muted">
          Biznesingizga biriktirilgan joriy chegirma foizi. Foizni o'zgartirish
          uchun so'rov yuboring — admin ko'rib chiqib tasdiqlaydi.
        </p>
      </AppCard>

      <div v-if="loading" class="grid gap-3 md:grid-cols-2">
        <AppCard class="skeleton-card p-5">
          <div class="skeleton h-8 w-24 rounded"></div>
          <div class="skeleton mt-3 h-3 w-32 rounded"></div>
        </AppCard>
      </div>

      <div v-else class="grid gap-3 md:grid-cols-2">
        <AppCard class="reveal p-5" style="--d: 60ms">
          <p class="text-xs text-muted">Joriy chegirma foizi</p>
          <p class="percent-pop mt-1 text-4xl font-bold text-success">
            {{ currentPercent !== null ? `${currentPercent}%` : "—" }}
          </p>
          <button
            class="mt-4 rounded-full bg-primary px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-primary/90 hover:shadow-md active:scale-95 disabled:opacity-50"
            :disabled="!!pendingRequest"
            @click="openRequest"
          >
            Foizni o'zgartirish
          </button>
          <p v-if="pendingRequest" class="mt-2 text-xs text-muted">
            Yangi so'rov yuborish uchun joriy so'rov ko'rib chiqilishini kuting.
          </p>
        </AppCard>

        <AppCard v-if="pendingRequest" class="reveal p-5" style="--d: 120ms">
          <p class="text-xs text-muted">So'rov holati</p>
          <p class="mt-1 text-sm font-semibold">
            {{ pendingRequest.old_percent }}% →
            {{ pendingRequest.new_percent }}%
          </p>
          <p
            class="mt-2 inline-block rounded-full bg-secondary px-3 py-1 text-xs font-medium"
          >
            {{ STATUS_LABEL[pendingRequest.status] || pendingRequest.status }}
          </p>
          <p v-if="pendingRequest.reason" class="mt-2 text-xs text-muted">
            Sabab: {{ pendingRequest.reason }}
          </p>
        </AppCard>
        <p v-else class="col-span-full text-xs text-muted">
          Hozircha ko'rib chiqilayotgan so'rov yo'q
        </p>
      </div>
    </div>

    <AppModal
      :open="requestOpen"
      title="Chegirma foizini o'zgartirish"
      @close="requestOpen = false"
    >
      <form class="space-y-3" @submit.prevent="submitRequest">
        <div class="field-in" style="--d: 0ms">
          <label class="text-sm font-medium">Yangi foiz (%)</label>
          <input
            v-model.number="form.new_percent"
            type="number"
            min="1"
            max="100"
            required
            class="mt-1 h-11 w-full rounded-lg border border-border bg-input px-3 text-sm transition-shadow focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div class="field-in" style="--d: 60ms">
          <label class="text-sm font-medium">Sabab (ixtiyoriy)</label>
          <textarea
            v-model="form.reason"
            rows="3"
            class="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm transition-shadow focus:ring-2 focus:ring-primary/40"
          ></textarea>
        </div>
        <button
          type="submit"
          :disabled="submitting"
          class="field-in h-11 w-full rounded-full bg-primary text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-md active:scale-[0.98] disabled:opacity-60"
          style="--d: 120ms"
        >
          {{ submitting ? "Yuborilmoqda..." : "So'rovni yuborish" }}
        </button>
      </form>
    </AppModal>
  </DashboardLayout>
</template>

<style scoped>
.reveal {
  animation: reveal-up 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
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

.percent-pop {
  animation: percent-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s both;
}

@keyframes percent-pop {
  from {
    opacity: 0;
    transform: scale(0.7);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

.field-in {
  animation: field-in 0.35s ease both;
  animation-delay: var(--d, 0ms);
}

@keyframes field-in {
  from {
    opacity: 0;
    transform: translateY(6px);
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
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.6),
    transparent
  );
  animation: shimmer 1.4s infinite;
}

@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}

.skeleton-card {
  animation: reveal-up 0.4s ease both;
}

@media (prefers-reduced-motion: reduce) {
  .reveal,
  .percent-pop,
  .field-in,
  .skeleton::after,
  .skeleton-card {
    animation: none !important;
  }
}
</style>
