<script setup>
import ReceiptCard from "@/components/kassir/ReceiptCard.vue";
import { useToastStore } from "@/stores/toast";

const props = defineProps({
  businessName: { type: String, required: true },
  businessAddress: { type: String, default: "" },
  cashierName: { type: String, required: true },
  customer: { type: Object, required: true },
  xizmatTuri: { type: String, required: true },
  amount: { type: Number, required: true },
  percent: { type: Number, required: true },
});
defineEmits(["dashboard", "new-scan"]);

const toast = useToastStore();

function fmt(n) {
  return Number(n || 0).toLocaleString("ru-RU");
}

const discountAmount = Math.round((props.amount * props.percent) / 100);
const finalAmount = props.amount - discountAmount;

const now = new Date();
const dateLabel = now.toLocaleDateString("uz-UZ", { day: "2-digit", month: "2-digit", year: "numeric" });
const timeLabel = now.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" });

function print() {
  toast.success("Chek chiqarishga yuborildi");
}
</script>

<template>
  <div class="grid gap-4 md:grid-cols-2">
    <div class="rounded-2xl border border-border bg-card p-5">
      <div class="mb-4 flex flex-col items-center gap-2 text-center">
        <div class="flex h-14 w-14 items-center justify-center rounded-full bg-success text-white">
          <svg viewBox="0 0 24 24" class="h-7 w-7" fill="none" stroke="currentColor" stroke-width="3"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <h2 class="text-lg font-bold">Muvaffaqiyatli!</h2>
        <p class="text-xs text-muted">Chegirma qo'llanildi</p>
      </div>

      <div class="space-y-2 text-sm">
        <div class="flex justify-between"><span class="text-muted">Mijoz</span><span class="font-medium">{{ customer.full_name }}</span></div>
        <div class="flex justify-between"><span class="text-muted">Xizmat</span><span class="font-medium">{{ xizmatTuri }}</span></div>
        <div class="flex justify-between"><span class="text-muted">A'zolik</span><span class="font-medium">{{ customer.membership_type }}</span></div>
        <div class="flex justify-between"><span class="text-muted">Asl narx</span><span class="font-medium">{{ fmt(amount) }} so'm</span></div>
        <div class="flex justify-between"><span class="text-muted">Chegirma</span><span class="font-medium text-destructive">-{{ fmt(discountAmount) }} so'm</span></div>
      </div>

      <div class="mt-3 flex items-center justify-between border-t border-border pt-3">
        <span class="font-semibold">Kassaga tushdi</span>
        <span class="text-xl font-bold text-success">{{ fmt(finalAmount) }} so'm</span>
      </div>

      <div class="mt-5 grid grid-cols-2 gap-2">
        <button
          class="h-11 rounded-full border border-border text-sm font-medium transition-colors hover:bg-secondary"
          @click="$emit('dashboard')">
          Dashboardga qaytish
        </button>
        <button
          class="h-11 rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-95"
          @click="$emit('new-scan')">
          QR Skanerlash
        </button>
      </div>
    </div>

    <ReceiptCard :business-name="businessName" :business-address="businessAddress" :date="dateLabel" :time="timeLabel"
      :cashier-name="cashierName" :customer-name="customer.full_name" :membership-type="customer.membership_type"
      :service-name="xizmatTuri" :price="amount" :percent="percent" :discount-amount="discountAmount"
      :total="finalAmount" @print="print" />
  </div>
</template>
