// Backend'da "haftalik tashrif", "top xizmatlar", "faol mijozlar" kabi tayyor
// statistika endpointlari yo'q — faqat xom chegirma tarixi (DiscountUsage) bor.
// Shu sabab kerakli ko'rsatkichlarni frontend'da shu tarix ma'lumotidan hisoblaymiz.

const DAY_SHORT = ["Yak", "Dush", "Sesh", "Chor", "Pay", "Jum", "Shan"];
const DAY_FULL = [
  "Yakshanba",
  "Dushanba",
  "Seshanba",
  "Chorshanba",
  "Payshanba",
  "Juma",
  "Shanba",
];

/** Oxirgi N kun bo'yicha kunlik tashriflar sonini hisoblaydi (grafik uchun). */
export function groupByDay(rows, days = 7) {
  const now = new Date();
  const buckets = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    buckets.push({
      date: d,
      day: DAY_SHORT[d.getDay()],
      fullDay: DAY_FULL[d.getDay()],
      visits: 0,
    });
  }
  rows.forEach((r) => {
    const t = new Date(r.used_at);
    t.setHours(0, 0, 0, 0);
    const bucket = buckets.find((b) => b.date.getTime() === t.getTime());
    if (bucket) bucket.visits++;
  });
  return buckets;
}

/** Kassirlar bo'yicha eng ko'p ishlatilgan chegirmalar (top xizmatlar o'rniga). */
export function topCashiers(rows, limit = 5) {
  const map = new Map();
  rows.forEach((r) => {
    const key = r.cashier_name || "Noma'lum kassir";
    if (!map.has(key)) map.set(key, { name: key, count: 0 });
    map.get(key).count++;
  });
  const total = rows.length || 1;
  return [...map.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map((x) => ({ ...x, percent: Math.round((x.count / total) * 100) }));
}

/** Eng faol mijozlar (tashrif soni bo'yicha). */
export function topClients(rows, limit = 5) {
  const map = new Map();
  rows.forEach((r) => {
    const key = r.customer_email || "Noma'lum mijoz";
    if (!map.has(key))
      map.set(key, { name: key, visits: 0, totalDiscount: 0, totalIncome: 0 });
    const c = map.get(key);
    c.visits++;
    c.totalDiscount += Number(r.discount_amount || 0);
    c.totalIncome +=
      Number(r.purchase_amount || 0) - Number(r.discount_amount || 0);
  });
  return [...map.values()].sort((a, b) => b.visits - a.visits).slice(0, limit);
}

/** Eng so'nggi tranzaksiyalar (sana bo'yicha kamayish tartibida). */
export function recentEntries(rows, limit = 6) {
  return [...rows]
    .sort((a, b) => new Date(b.used_at) - new Date(a.used_at))
    .slice(0, limit);
}

/** Berilgan davr uchun umumiy ko'rsatkichlar. */
export function summarize(rows) {
  const totalVisits = rows.length;
  const totalPurchase = rows.reduce(
    (s, r) => s + Number(r.purchase_amount || 0),
    0,
  );
  const totalDiscount = rows.reduce(
    (s, r) => s + Number(r.discount_amount || 0),
    0,
  );
  return {
    totalVisits,
    avgCheck: totalVisits ? totalPurchase / totalVisits : 0,
    totalIncome: totalPurchase - totalDiscount,
    discountsGiven: totalDiscount,
  };
}
