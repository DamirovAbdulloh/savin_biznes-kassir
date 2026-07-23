import client from "./client";

// ---------------- KASSIR PANELI ----------------
// Backend: discounts/urls.py -> cashier/... yo'llari.
// Bu API kassir sahifalari (KassirDashboardPage, QrSkanerlashPage,
// TashrifTarixiPage, KassirProfilPage) uchun tayyorlangan.
export const kassirApi = {
  // GET cashier/me/ -> { id, full_name, email, is_active, added_at, business: {...} }
  async me() {
    const { data } = await client.get("cashier/me/");
    return data;
  },

  // GET cashier/dashboard/ -> { today_visits, my_today_visits,
  //   today_discount_amount, today_paid_amount, current_percent }
  async dashboard() {
    const { data } = await client.get("cashier/dashboard/");
    return data;
  },

  // GET cashier/visits/ -> DiscountUsage ro'yxati (sahifalanmagan).
  // params: { date_from, date_to, mine: 1, ordering: "-used_at" }
  async visits(params = {}) {
    const { data } = await client.get("cashier/visits/", { params });
    return data.results ?? data;
  },

  // POST cashier/scan-qr/ { qr_data } -> { customer, current_percent }
  // qr_data: mijoz QR kodidan o'qilgan qiymat (mijoz ID yoki email)
  async scanQr(qrData) {
    const { data } = await client.post("cashier/scan-qr/", { qr_data: qrData });
    return data;
  },

  // POST cashier/apply-discount/ -> yangi DiscountUsage yozuvi
  // payload: { customer_id } yoki { customer_email }, va { purchase_amount }
  async applyDiscount(payload) {
    const { data } = await client.post("cashier/apply-discount/", payload);
    return data;
  },
};
