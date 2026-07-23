import { defineStore } from "pinia";
import { authApi, businessApi, meApi } from "@/api";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null, // { id, username, email, role, ... } — users/serializers.py::UserSerializer
    business: null, // faqat business_owner uchun to'ldiriladi
    // ✅ FIX: token endi REAKTIV holatda. Ilgari isAuthenticated getter'i
    // to'g'ridan-to'g'ri localStorage'ni o'qirdi — Pinia getter (computed)
    // reaktiv bog'liqliksiz bir marta hisoblanib keshlanadi, natijada
    // login'dan keyin ham `false` bo'lib qolar va router foydalanuvchini
    // yana /login'ga qaytarardi ("faqat refresh qilganda kiradi" xatosi).
    hasToken: authApi.isAuthenticated(),
  }),
  getters: {
    isAuthenticated: (state) => state.hasToken,
    isCashier: (state) => state.user?.role === "cashier",
    isBusinessOwner: (state) => state.user?.role === "business_owner",
    initials: (state) => {
      if (state.business?.name)
        return state.business.name.charAt(0).toUpperCase();
      if (state.user?.username)
        return state.user.username.charAt(0).toUpperCase();
      return "S";
    },
    displayName: (state) =>
      state.business?.name || state.user?.username || "Foydalanuvchi",
  },
  actions: {
    async login(email, password) {
      // 1) login qilib token olamiz + backend darhol user obyektini ham qaytaradi
      const user = await authApi.login(email, password);
      this.user = user;
      this.hasToken = true; // reaktiv holatni yangilaymiz — router darhol ko'radi

      // 2) rolga qarab tegishli profilni yuklaymiz
      if (user.role === "business_owner") {
        await this.fetchProfile();
      }
      // kassir uchun biznes profili yo'q — Kassir Dashboard o'zi kerakli
      // ma'lumotni cashierApi orqali yuklaydi.
      return user;
    },
    async fetchProfile() {
      this.business = await businessApi.me();
      return this.business;
    },
    // Sahifa yangilanganda (F5) Pinia state tozalanadi, lekin token localStorage'da
    // qoladi — shu holatda /me/ orqali foydalanuvchini qayta aniqlaymiz.
    async ensureUser() {
      if (this.user) return this.user;
      if (!authApi.isAuthenticated()) return null;
      this.user = await meApi.get();
      if (this.user.role === "business_owner" && !this.business) {
        await this.fetchProfile();
      }
      return this.user;
    },
    logout() {
      authApi.logout();
      this.user = null;
      this.business = null;
      this.hasToken = false;
    },
  },
});
