/**
 * v-click-outside — element tashqarisiga bosilganda chaqiriladi.
 *
 * Ochiladigan menyular (filtr, kalendar) uchun: menyuni yopish uchun
 * tugmani qayta bosish shart emas, ekranning boshqa joyiga bosish kifoya.
 *
 * Direktiva menyuni ochadigan TUGMA ham ichida bo'lgan o'ramga qo'yiladi —
 * shunda tugmani bosish "tashqari" deb hisoblanmaydi.
 *
 *   <div class="relative" v-click-outside="() => (filterOpen = false)">
 */
export const vClickOutside = {
  mounted(el, binding) {
    el.__clickOutside__ = (e) => {
      const target = e.target;
      // Element DOM'dan olib tashlangan bo'lsa "tashqari" deb hisoblamaymiz
      if (!target || !document.contains(target)) return;
      if (!el.contains(target)) binding.value?.(e);
    };
    document.addEventListener("click", el.__clickOutside__);
    document.addEventListener("touchstart", el.__clickOutside__, { passive: true });
  },
  unmounted(el) {
    if (!el.__clickOutside__) return;
    document.removeEventListener("click", el.__clickOutside__);
    document.removeEventListener("touchstart", el.__clickOutside__);
    delete el.__clickOutside__;
  },
};

export default vClickOutside;
