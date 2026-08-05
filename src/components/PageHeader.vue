<script setup>
// Barcha bo'limlar uchun yagona sarlavha paneli.
//
// Sarlavha `main` ning paddingidan chiqib, tepaga va ikkala yonga to'liq
// yopishib turadi — Asosiy sahifadagi sarlavha bilan bir xil. Ilgari har
// bir sahifa o'z sarlavhasini "AppCard" ichida chizardi va u yumaloq karta
// bo'lib, chetlarda bo'shliq qoldirardi.
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: "" },
});
</script>

<template>
  <div
    class="-mx-4 -mt-4 mb-1 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-5 py-4 md:-mx-6 md:-mt-6"
  >
    <div>
      <h1 class="text-xl font-bold tracking-tight">{{ title }}</h1>
      <p v-if="subtitle" class="text-sm capitalize text-muted">{{ subtitle }}</p>
      <!-- Sarlavha ostidagi izoh (matn o'rniga komponent kerak bo'lganda) -->
      <slot name="subtitle" />
    </div>
    <!-- O'ng tomondagi qo'shimcha elementlar (tugma, stepper, filtr…) -->
    <slot />
  </div>
</template>
