<script setup>
import { RouterLink, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const route = useRoute();
const authStore = useAuthStore();

const navItems = [
  { to: "/kassir/dashboard", label: "Dashboard", icon: "grid" },
  { to: "/kassir/skanerlash", label: "QR Skanerlash", icon: "qr" },
  { to: "/kassir/tashrif-tarixi", label: "Tashrif tarixi", icon: "history" },
  { to: "/kassir/profil", label: "Profil", icon: "user" },
];

const ICONS = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  qr: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><line x1="14" y1="14" x2="14" y2="21"/><line x1="21" y1="14" x2="21" y2="14.01"/><line x1="17.5" y1="17.5" x2="21" y2="17.5"/><line x1="14" y1="21" x2="17.5" y2="21"/>',
  history: '<path d="M3 12a9 9 0 1 0 2.6-6.3L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.5-7 8-7s8 3 8 7"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
};
</script>

<template>
  <div class="flex min-h-screen bg-background">
    <aside class="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-sidebar text-white/90 md:flex">
      <div class="flex items-center gap-2 px-5 py-5">
        <img src="../images/Vector.png" alt="savin" class="h-7 w-7" />
        <span class="text-2xl font-semibold text-[rgba(137,234,92,1)]">savin</span>
      </div>

      <nav class="mt-2 flex-1 space-y-0.5 overflow-y-auto px-3">
        <RouterLink v-for="item in navItems" :key="item.to" :to="item.to"
          class="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors duration-150"
          :class="route.path === item.to
            ? 'bg-sidebar-accent text-white shadow-sm'
            : 'text-white/70 hover:bg-white/5 hover:text-white'">
          <svg viewBox="0 0 24 24" class="h-4 w-4 shrink-0" fill="none" stroke="currentColor" stroke-width="1.8"
            stroke-linecap="round" stroke-linejoin="round" v-html="ICONS[item.icon]"></svg>
          {{ item.label }}
        </RouterLink>
      </nav>

      <button @click="authStore.logout(); $router.push('/login')"
        class="mx-3 mb-4 flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-white/60 transition-colors hover:bg-white/5 hover:text-white">
        <svg viewBox="0 0 24 24" class="h-4 w-4 shrink-0" fill="none" stroke="currentColor" stroke-width="1.8"
          stroke-linecap="round" stroke-linejoin="round" v-html="ICONS.logout"></svg>
        Chiqish
      </button>
    </aside>

    <!-- Mobile top bar -->
    <div class="fixed inset-x-0 top-0 z-30 flex items-center justify-between bg-sidebar px-4 py-3 text-white md:hidden">
      <span class="text-lg font-semibold text-[rgba(137,234,92,1)]">savin</span>
      <RouterLink to="/kassir/profil"
        class="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
        {{ authStore.initials }}
      </RouterLink>
    </div>
    <nav class="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t bg-white py-2 md:hidden">
      <RouterLink v-for="item in navItems" :key="item.to" :to="item.to"
        class="flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] transition-colors"
        :class="route.path === item.to ? 'text-primary font-semibold' : 'text-muted'">
        <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8"
          stroke-linecap="round" stroke-linejoin="round" v-html="ICONS[item.icon]"></svg>
        {{ item.label }}
      </RouterLink>
    </nav>

    <main class="flex-1 pb-20 pt-16 md:ml-64 md:pb-0 md:pt-0">
      <div class="mx-auto max-w-6xl p-4 md:p-6">
        <slot />
      </div>
    </main>
  </div>
</template>
