<script setup>
import { RouterLink } from "vue-router";
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-background px-4">
    <div class="max-w-md text-center">
      <h1 class="text-7xl font-bold">404</h1>
      <h2 class="mt-4 text-xl font-semibold">Sahifa topilmadi</h2>
      <p class="mt-2 text-sm text-muted">Siz izlagan sahifa mavjud emas yoki ko'chirilgan.</p>
      <RouterLink
        to="/asosiy"
        class="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Bosh sahifaga qaytish
      </RouterLink>
    </div>
  </div>
</template>
