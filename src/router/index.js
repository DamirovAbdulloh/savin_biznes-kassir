import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const routes = [
  {
    path: "/login",
    name: "login",
    component: () => import("@/views/LoginPage.vue"),
    meta: { public: true },
  },
  {
    path: "/",
    redirect: "/asosiy",
  },

  // ---------------- Biznes egasi ----------------
  {
    path: "/asosiy",
    name: "asosiy",
    component: () => import("@/views/AsosiyPage.vue"),
    meta: { roles: ["business_owner"] },
  },
  {
    path: "/statistika",
    name: "statistika",
    component: () => import("@/views/StatistikaPage.vue"),
    meta: { roles: ["business_owner"] },
  },
  {
    path: "/chegirmalar",
    name: "chegirmalar",
    component: () => import("@/views/ChegirmalarPage.vue"),
    meta: { roles: ["business_owner"] },
  },
  {
    path: "/chegirma-tarixi",
    name: "chegirma-tarixi",
    component: () => import("@/views/ChegirmaTarixiPage.vue"),
    meta: { roles: ["business_owner"] },
  },
  {
    path: "/kassirlar",
    name: "kassirlar",
    component: () => import("@/views/KassirlarPage.vue"),
    meta: { roles: ["business_owner"] },
  },
  {
    path: "/bildirishnomalar",
    name: "bildirishnomalar",
    component: () => import("@/views/BildirishnomalarPage.vue"),
    meta: { roles: ["business_owner"] },
  },
  {
    path: "/profil",
    name: "profil",
    component: () => import("@/views/ProfilPage.vue"),
    meta: { roles: ["business_owner"] },
  },

  // ---------------- Kassir paneli ----------------
  // Flowchart eslatmasi: "Kassir FAQAT shu jarayonga kiradi. Boshqa bo'limlarga
  // kirish imkoni yo'q" — shu sabab meta.roles orqali qattiq cheklandi.
  {
    path: "/kassir/dashboard",
    name: "kassir-dashboard",
    component: () => import("@/views/kassir/KassirDashboardPage.vue"),
    meta: { roles: ["cashier"] },
  },
  {
    path: "/kassir/skanerlash",
    name: "kassir-skanerlash",
    component: () => import("@/views/kassir/QrSkanerlashPage.vue"),
    meta: { roles: ["cashier"] },
  },
  {
    path: "/kassir/tashrif-tarixi",
    name: "kassir-tashrif-tarixi",
    component: () => import("@/views/kassir/TashrifTarixiPage.vue"),
    meta: { roles: ["cashier"] },
  },
  {
    path: "/kassir/profil",
    name: "kassir-profil",
    component: () => import("@/views/kassir/KassirProfilPage.vue"),
    meta: { roles: ["cashier"] },
  },

  {
    path: "/:pathMatch(.*)*",
    name: "not-found",
    component: () => import("@/views/NotFoundPage.vue"),
    meta: { public: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

function homeFor(role) {
  return role === "cashier" ? "/kassir/dashboard" : "/asosiy";
}

router.beforeEach(async (to) => {
  const authStore = useAuthStore();
  const isAuthenticated = authStore.isAuthenticated;

  // Token bor, lekin sahifa yangilangani uchun user hali aniqlanmagan bo'lishi mumkin.
  if (isAuthenticated && !authStore.user) {
    try {
      await authStore.ensureUser();
    } catch {
      authStore.logout();
      return { path: "/login" };
    }
  }

  const role = authStore.user?.role;

  if (to.path === "/") {
    return { path: isAuthenticated ? homeFor(role) : "/login" };
  }

  if (!to.meta.public && !isAuthenticated) {
    return { path: "/login" };
  }

  if (to.path === "/login" && isAuthenticated) {
    return { path: homeFor(role) };
  }

  // Rol bo'yicha himoya: biznes egasi kassir sahifalariga, kassir esa biznes
  // egasi sahifalariga kira olmaydi.
  if (
    to.meta.roles &&
    isAuthenticated &&
    role &&
    !to.meta.roles.includes(role)
  ) {
    return { path: homeFor(role) };
  }

  return true;
});

export default router;
