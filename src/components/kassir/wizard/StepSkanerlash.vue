<script setup>
import { ref } from "vue";
import { kassirVisitApi } from "@/api/kassir";

const emit = defineEmits(["success", "error"]);

// status: "idle" | "scanning" | "membership-inactive" | "qr-expired"
const status = ref("idle");

async function simulateScan(scenario = "success") {
    status.value = "scanning";
    try {
        // Haqiqiy integratsiyada bu yerda kamera/QR-reader kutubxonasi orqali o'qilgan
        // token backendga yuboriladi. Hozircha demo stsenariylar orqali sinaymiz.
        let result;
        try {
            result = await kassirVisitApi.lookupQr(`demo-${scenario}`);
        } catch (e) {
            result = demoQrLookup(scenario);
        }

        await new Promise((r) => setTimeout(r, 550)); // skanerlash animatsiyasi uchun kichik kechikish

        if (result.ok) {
            status.value = "idle";
            emit("success", result);
        } else {
            status.value = result.reason;
        }
    } catch (e) {
        status.value = "qr-expired";
    }
}

function retry() {
    status.value = "idle";
}
</script>

<template>
    <div class="grid gap-4 md:grid-cols-[1fr_280px]">
        <div>
            <div class="relative flex aspect-video items-center justify-center overflow-hidden rounded-2xl bg-gray-950">
                <div class="absolute inset-6 rounded-lg border border-white/20"></div>
                <span class="absolute left-6 top-6 h-5 w-5 border-l-2 border-t-2 border-white/70"></span>
                <span class="absolute right-6 top-6 h-5 w-5 border-r-2 border-t-2 border-white/70"></span>
                <span class="absolute bottom-6 left-6 h-5 w-5 border-b-2 border-l-2 border-white/70"></span>
                <span class="absolute bottom-6 right-6 h-5 w-5 border-b-2 border-r-2 border-white/70"></span>
                <div v-if="status === 'scanning'"
                    class="scan-line absolute inset-x-10 h-0.5 rounded-full bg-primary shadow-[0_0_12px_2px_rgba(34,197,94,0.7)]">
                </div>
                <div v-else class="h-px w-2/3 bg-white/40"></div>
            </div>
            <p class="mt-3 text-center text-sm text-muted">
                Mijozning telefonidagi QR ni kameraga tutib turing.<br />QR avtomatik taniladi.
            </p>

            <!-- Demo boshqaruvi: backend hali ulanmagani uchun turli holatlarni shu yerdan sinab ko'rish mumkin -->
            <div class="mt-4 flex flex-wrap items-center justify-center gap-2 rounded-xl bg-secondary/60 p-3">
                <span class="mr-1 text-xs font-medium text-muted">Demo:</span>
                <button type="button"
                    class="rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition hover:bg-primary/90"
                    :disabled="status === 'scanning'" @click="simulateScan('success')">
                    Muvaffaqiyatli skanerlash
                </button>
                <button type="button"
                    class="rounded-full border border-border px-3 py-1.5 text-xs font-medium transition hover:bg-secondary"
                    :disabled="status === 'scanning'" @click="simulateScan('membership-inactive')">
                    A'zolik faol emas
                </button>
                <button type="button"
                    class="rounded-full border border-border px-3 py-1.5 text-xs font-medium transition hover:bg-secondary"
                    :disabled="status === 'scanning'" @click="simulateScan('qr-expired')">
                    QR muddati o'tgan
                </button>
            </div>
        </div>

        <div>
            <div v-if="status === 'membership-inactive'"
                class="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-5 text-center">
                <div class="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
                    <svg viewBox="0 0 24 24" class="h-6 w-6 text-destructive" fill="none" stroke="currentColor"
                        stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path
                            d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                </div>
                <h3 class="text-sm font-semibold">A'zolik faol emas</h3>
                <p class="text-xs text-muted">Bu foydalanuvchining obunasi tugagan. Chegirma qo'llanilmaydi.</p>
                <button
                    class="w-full rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                    @click="retry">
                    Qayta urinish
                </button>
            </div>

            <div v-else-if="status === 'qr-expired'"
                class="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-5 text-center">
                <div class="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
                    <svg viewBox="0 0 24 24" class="h-6 w-6 text-destructive" fill="none" stroke="currentColor"
                        stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="m15 9-6 6M9 9l6 6" />
                    </svg>
                </div>
                <h3 class="text-sm font-semibold">QR muddati o'tgan</h3>
                <p class="text-xs text-muted">Mijozdan ilovani yangilashni so'rang. QR har 5 daqiqada yangilanadi.</p>
                <button
                    class="w-full rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                    @click="retry">
                    Qayta urinish
                </button>
            </div>

            <div v-else class="rounded-2xl border border-orange-200 bg-orange-50 p-4">
                <p class="mb-1 flex items-center gap-1.5 text-sm font-semibold text-orange-700">
                    <span>⚠</span> Eslatma
                </p>
                <p class="text-xs text-orange-700/80">QR har 5 daqiqada yangilanadi. Eski QR ishlamaydi.</p>
            </div>
        </div>
    </div>
</template>

<style scoped>
.scan-line {
    animation: scan-move 1.6s ease-in-out infinite;
}

@keyframes scan-move {

    0%,
    100% {
        top: 20%;
    }

    50% {
        top: 75%;
    }
}
</style>
