import client, { clearTokens, setTokens } from "./client";

// ---------------- AUTH ----------------
// Backend: users/urls.py -> POST auth/login/  { email, password } -> { tokens: {access, refresh}, user }
export const authApi = {
  async login(email, password) {
    const { data } = await client.post("auth/login/", { email, password });
    setTokens({ access: data.tokens.access, refresh: data.tokens.refresh });
    return data.user;
  },
  logout() {
    clearTokens();
  },
  isAuthenticated() {
    return !!localStorage.getItem("savin_access");
  },
};

// ---------------- BIZNES PROFILI ----------------
// Backend: businesses/urls.py -> GET/PATCH my-business/
export const businessApi = {
  async me() {
    const { data } = await client.get("my-business/");
    return data;
  },
  async update(payload) {
    const { data } = await client.patch("my-business/", payload);
    return data;
  },
};

// ---------------- DASHBOARD ----------------
// Backend: businesses/urls.py -> GET my-business/dashboard/
export const dashboardApi = {
  async stats() {
    const { data } = await client.get("my-business/dashboard/");
    return data;
  },
};

// ---------------- CHEGIRMA ----------------
// MUHIM: backend'da chegirma CRUD ro'yxat emas — har bir biznesga BITTA joriy
// foiz biriktirilgan. Uni o'zgartirish faqat "so'rov yuborish -> admin tasdiqlaydi"
// jarayoni orqali bo'ladi (discounts/urls.py).
export const discountApi = {
  async me() {
    // { current_percent, pending_request }
    const { data } = await client.get("my-business/discount/");
    return data;
  },
  async requestChange(newPercent, reason = "") {
    const { data } = await client.post("my-business/discount/change-request/", {
      new_percent: newPercent,
      reason,
    });
    return data;
  },
};

// ---------------- STATISTIKA ----------------
// Backend "period" sifatida faqat "week" yoki "month" qabul qiladi (kunlar soni emas).
export const statistikaApi = {
  async summary(period = "week") {
    const { data } = await client.get("my-business/discount/statistics/", {
      params: { period },
    });
    return data;
  },
};

// ---------------- KASSIRLAR ----------------
// Backend: businesses/urls.py -> my-business/cashiers/ , my-business/cashiers/<id>/
export const cashiersApi = {
  async list() {
    const { data } = await client.get("my-business/cashiers/");
    return data.results ?? data;
  },
  // payload: { email, password, full_name }
  async create(payload) {
    const { data } = await client.post("my-business/cashiers/", payload);
    return data;
  },
  // payload: { full_name, is_active } — backend'da alohida toggle endpoint yo'q,
  // shu sabab holatni ham shu PATCH orqali o'zgartiramiz.
  async update(id, payload) {
    const { data } = await client.patch(`my-business/cashiers/${id}/`, payload);
    return data;
  },
  async remove(id) {
    await client.delete(`my-business/cashiers/${id}/`);
  },
};

// ---------------- CHEGIRMA TARIXI ----------------
// Backend: discounts/urls.py -> GET my-business/discount/history/
export const historyApi = {
  async list(params = {}) {
    const { data } = await client.get("my-business/discount/history/", {
      params,
    });
    return data.results ?? data;
  },
  // Backend tayyor CSV export beradi (my-business/discount/history/export/),
  // shuning uchun jadvalni qayta CSV'ga aylantirish shart emas.
  async exportCsv(params = {}) {
    const { data } = await client.get("my-business/discount/history/export/", {
      params,
      responseType: "blob",
    });
    return data;
  },
};

// ---------------- BILDIRISHNOMALAR ----------------
// Backend: notifications/urls.py
export const notificationsApi = {
  async list() {
    const { data } = await client.get("notifications/");
    return data.results ?? data;
  },
  async markRead(id) {
    const { data } = await client.post(`notifications/${id}/read/`);
    return data;
  },
  async markAllRead() {
    await client.post("notifications/read-all/");
  },
};

// ---------------- MEN (umumiy profil) ----------------
// Backend: users/urls.py -> GET/PATCH me/  — REAL, biznes egasi va kassir uchun umumiy.
export const meApi = {
  async get() {
    const { data } = await client.get("me/");
    return data;
  },
  async update(payload) {
    const { data } = await client.patch("me/", payload);
    return data;
  },
};

// ==================== KASSIR PANELI ====================
// 2026-07-14 YANGILANDI: backend sherik "transactions" ilovasini ulab qo'ydi
// (config/urls.py -> transactions.urls, prefiks: api/v1/transactions/).
// Bu quyidagilarni REAL qildi: tranzaksiya yaratish, kassirning o'z tarixini
// ko'rish, va dashboard uchun kunlik xulosa (summary/today). Shu sabab
// pastdagi 3 ta funksiya endi MOCKsiz, to'g'ridan-to'g'ri shu endpointlarga
// ulanadi (sinovdan o'tkazilgan: POST/GET real serverga ishlab ko'rilgan).
//
// 2026-07-17 YANGILANDI: avvalgi "HALI HAM YO'Q" ro'yxatidagi hamma narsa
// backend'da REAL bo'ldi:
//   1) POST cashier/scan-qr/ — QR (mijoz ID yoki email) bo'yicha mijozni topib,
//      to'liq ma'lumot qaytaradi (full_name, membership_type, visits_count,
//      last_visit_label, discount_percent va h.k.) — MOCK olib tashlandi.
//   2) GET cashier/services/ — biznesning xizmatlar katalogi (biznes egasi
//      my-business/services/ orqali boshqaradi). Katalog bo'sh bo'lsa,
//      standart ro'yxat ko'rsatiladi (UI ishlashda davom etsin deb).
//   3) cashier_name bagi backend'da tuzatildi (Cashier.full_name'dan olinadi).

const DEFAULT_SERVICES = [
  { id: "soch-olish", name: "Soch olish", price: 50000 },
  { id: "soqol-qirish", name: "Soqol qirish", price: 28000 },
  { id: "soch-soqol", name: "Soch + Soqol", price: 72000 },
  { id: "bola-soch", name: "Bola soch", price: 35000 },
];

// Backend Transaction maydonlarini frontend'da ishlatiladigan eski nomlarga
// moslaymiz (applied_percent, purchase_amount, used_at) — shu bilan
// TashrifTarixiPage.vue va KassirDashboardPage.vue'ni o'zgartirish shart
// bo'lmadi.
function mapTransaction(t) {
  return {
    id: t.id,
    customer_name: t.customer_name,
    service_name: t.service_name,
    applied_percent: t.discount_percent,
    purchase_amount: Number(t.base_price),
    discount_amount: Number(t.discount_amount),
    used_at: t.created_at,
  };
}

export const cashierApi = {
  // ✅ REAL backend: transactions/urls.py -> POST transactions/
  // Kutilgan payload: { customer_name, customer_phone?, service_name,
  // service_category?, purchase_amount, discount_percent, comment? }
  async applyDiscount(payload) {
    const { data } = await client.post("transactions/", {
      customer_name: payload.customer_name || "",
      customer_phone: payload.customer_phone || "",
      service_name: payload.service_name || "",
      service_category: payload.service_category || "",
      base_price: payload.purchase_amount,
      discount_percent: payload.discount_percent ?? 0,
      notes: payload.comment || "",
    });
    return data;
  },

  // ✅ REAL backend: transactions/urls.py -> GET transactions/today/
  // (kassirning o'z biznesiga tegishli, "bugun" bilan filtrlangan).
  async dashboard() {
    const { data } = await client.get("transactions/today/", {
      params: { page_size: 1000 },
    });
    const rows = data.results ?? data;
    const today_visits = rows.length;
    const today_discount_amount = rows.reduce(
      (s, r) => s + Number(r.discount_amount || 0),
      0,
    );
    const today_revenue = rows.reduce(
      (s, r) => s + Number(r.final_price || 0),
      0,
    );
    const last = rows[0]; // ordering=-created_at bo'yicha eng oxirgisi birinchi
    const last_visit_time = last
      ? new Date(last.created_at).toLocaleTimeString("uz-UZ", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "-";
    return {
      today_visits,
      today_discount_amount,
      today_revenue,
      last_visit_time,
    };
  },

  // ✅ REAL backend: discounts/urls.py -> POST cashier/scan-qr/ { qr_code }
  // QR qiymati: mijoz ID (UUID) yoki email. Mijoz topilmasa 404 qaytadi —
  // sahifa buni ushlab "QR kod tekshirilmadi" deb ko'rsatadi (soxta mijoz
  // ko'rsatilmaydi).
  async verifyQr(qrCode) {
    const { data } = await client.post("cashier/scan-qr/", {
      qr_code: qrCode,
    });
    return data;
  },

  // ✅ REAL backend: transactions/urls.py -> GET transactions/
  // (qidiruv: customer_name/service_name/customer_phone; ordering; pagination).
  async history(params = {}) {
    const { data } = await client.get("transactions/", {
      params: {
        ordering: "-created_at",
        page_size: 100,
        search: params.search,
        ...params,
      },
    });
    const rows = data.results ?? data;
    return rows.map(mapTransaction);
  },

  // ✅ REAL backend: businesses/urls.py -> GET cashier/services/
  // Biznes egasi katalogni my-business/services/ orqali to'ldiradi.
  // Katalog hali bo'sh bo'lsa (yoki xato bo'lsa) standart ro'yxat qaytadi —
  // kassir ish jarayoni to'xtab qolmasligi uchun.
  async services() {
    try {
      const { data } = await client.get("cashier/services/");
      const rows = data.results ?? data;
      if (Array.isArray(rows) && rows.length) {
        return rows.map((s) => ({
          id: s.id,
          name: s.name,
          price: Number(s.price),
        }));
      }
      return DEFAULT_SERVICES;
    } catch {
      return DEFAULT_SERVICES;
    }
  },
};
