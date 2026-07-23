<script setup>
import { ref, onMounted, reactive, computed } from "vue";
import DashboardLayout from "@/layouts/DashboardLayout.vue";
import AppCard from "@/components/AppCard.vue";
import AppModal from "@/components/AppModal.vue";
import { cashiersApi } from "@/api";
import { useToastStore } from "@/stores/toast";

const toast = useToastStore();

const items = ref([]);
const loading = ref(true);
const addOpen = ref(false);
const editItem = ref(null);
const deleteItem = ref(null);
const savingAdd = ref(false);
const savingEdit = ref(false);
const deleting = ref(false);

// MUHIM: backend Cashier modelida faqat full_name, is_active, added_at bor.
// "phone", "login ko'rsatish/parolni ko'rsatish" va "scans" kabi maydonlar
// backend'da yo'q, shu sabab olib tashlandi. Kassir yaratishda email+password
// bilan alohida foydalanuvchi hisobi ochiladi (buni keyin o'zgartirib bo'lmaydi).
const addForm = reactive({ full_name: "", email: "", password: "" });
const editForm = reactive({ full_name: "", is_active: true });

function resetAddForm() {
  addForm.full_name = "";
  addForm.email = "";
  addForm.password = "";
}

function initials(name) {
  return (name || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const activeCount = computed(
  () => items.value.filter((c) => c.is_active).length,
);

async function load() {
  loading.value = true;
  try {
    items.value = await cashiersApi.list();
  } finally {
    loading.value = false;
  }
}
onMounted(load);

function openEdit(c) {
  editItem.value = c;
  editForm.full_name = c.full_name;
  editForm.is_active = c.is_active;
}

async function submitAdd() {
  savingAdd.value = true;
  try {
    await cashiersApi.create({ ...addForm });
    toast.success("Kassir qo'shildi");
    addOpen.value = false;
    resetAddForm();
    await load();
  } catch (e) {
    toast.error(e.response?.data?.email?.[0] || "Xatolik yuz berdi");
  } finally {
    savingAdd.value = false;
  }
}

async function submitEdit() {
  savingEdit.value = true;
  try {
    await cashiersApi.update(editItem.value.id, { ...editForm });
    toast.success("Kassir yangilandi");
    editItem.value = null;
    await load();
  } catch (e) {
    toast.error("Xatolik yuz berdi");
  } finally {
    savingEdit.value = false;
  }
}

async function confirmDelete() {
  deleting.value = true;
  try {
    await cashiersApi.remove(deleteItem.value.id);
    toast.success("Kassir o'chirildi");
    deleteItem.value = null;
    await load();
  } catch (e) {
    toast.error("Xatolik yuz berdi");
  } finally {
    deleting.value = false;
  }
}

async function toggleActive(c) {
  try {
    await cashiersApi.update(c.id, { is_active: !c.is_active });
    await load();
  } catch (e) {
    toast.error("Xatolik yuz berdi");
  }
}

function fmtDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("uz-UZ");
}
</script>

<template>
  <DashboardLayout>
    <div class="space-y-4 page-enter">
      <AppCard class="flex items-center justify-between p-5">
        <div>
          <h1 class="text-xl font-bold tracking-tight">Kassirlar</h1>
          <p class="text-xs text-muted">
            Jami: {{ items.length }} ta kassir /
            <span class="font-medium text-success"
              >{{ activeCount }} ta Faol</span
            >
          </p>
        </div>
        <button
          class="flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-primary/90 hover:shadow-md active:scale-95"
          @click="
            resetAddForm();
            addOpen = true;
          "
        >
          <span class="text-base leading-none">+</span> Qo'shish
        </button>
      </AppCard>

      <!-- Loading skeleton -->
      <div v-if="loading" class="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <AppCard v-for="i in 6" :key="'sk' + i" class="p-4">
          <div class="animate-pulse space-y-3">
            <div class="flex items-center gap-2">
              <div class="h-9 w-9 rounded-full bg-secondary"></div>
              <div class="flex-1 space-y-1.5">
                <div class="h-3 w-2/3 rounded bg-secondary"></div>
                <div class="h-2.5 w-1/3 rounded bg-secondary"></div>
              </div>
            </div>
            <div class="h-14 rounded-lg bg-secondary"></div>
          </div>
        </AppCard>
      </div>

      <TransitionGroup
        v-else
        tag="div"
        name="card"
        class="grid gap-3 md:grid-cols-2 lg:grid-cols-3"
      >
        <AppCard
          v-for="(c, i) in items"
          :key="c.id"
          class="group p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
          :style="{ transitionDelay: (i % 6) * 20 + 'ms' }"
        >
          <div class="mb-3 flex items-start justify-between">
            <div class="flex items-center gap-2">
              <span
                class="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground transition-transform duration-200 group-hover:scale-105"
              >
                {{ initials(c.full_name) }}
              </span>
              <div>
                <p class="font-semibold leading-tight">{{ c.full_name }}</p>
                <p class="text-xs text-muted">
                  Qo'shilgan: {{ fmtDate(c.added_at) }}
                </p>
              </div>
            </div>
            <span class="flex items-center text-xs font-medium">
              <span
                class="mr-1 inline-block h-2 w-2 rounded-full"
                :class="
                  c.is_active ? 'bg-success animate-pulse-dot' : 'bg-muted'
                "
              ></span>
              {{ c.is_active ? "Faol" : "Nofaol" }}
            </span>
          </div>

          <div
            class="mb-3 flex items-center justify-between rounded-lg bg-secondary/60 px-3 py-2 text-xs"
          >
            <span class="text-muted">Holati</span>
            <label class="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                class="peer sr-only"
                :checked="c.is_active"
                @change="toggleActive(c)"
              />
              <div
                class="h-5 w-9 rounded-full bg-muted/40 transition-colors duration-200 peer-checked:bg-success"
              ></div>
              <div
                class="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 peer-checked:translate-x-4"
              ></div>
            </label>
          </div>

          <div class="flex gap-2">
            <button
              class="flex flex-1 items-center justify-center gap-1 rounded-full border border-border py-2 text-sm font-medium transition-all duration-150 hover:bg-secondary active:scale-95"
              @click="openEdit(c)"
            >
              ✎ Tahrirlash
            </button>
            <button
              class="flex flex-1 items-center justify-center gap-1 rounded-full border border-destructive/30 py-2 text-sm font-medium text-destructive transition-all duration-150 hover:bg-red-50 active:scale-95"
              @click="deleteItem = c"
            >
              🗑 O'chirish
            </button>
          </div>
        </AppCard>
      </TransitionGroup>

      <p
        v-if="!loading && !items.length"
        class="col-span-full py-12 text-center text-muted fade-in-up"
      >
        Hozircha kassir yo'q
      </p>
    </div>

    <AppModal
      :open="addOpen"
      title="Yangi kassir qo'shish"
      @close="addOpen = false"
    >
      <form class="space-y-3" @submit.prevent="submitAdd">
        <div>
          <label class="text-sm font-medium">Ism familiya</label>
          <input
            v-model="addForm.full_name"
            required
            placeholder="Ism familiya"
            class="mt-1 h-11 w-full rounded-lg border border-border bg-input px-3 text-sm outline-none transition-all duration-150 focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
          />
        </div>
        <div>
          <label class="text-sm font-medium"
            >Email (login sifatida ishlatiladi)</label
          >
          <input
            v-model="addForm.email"
            type="email"
            required
            placeholder="kassir@biznes.uz"
            class="mt-1 h-11 w-full rounded-lg border border-border bg-input px-3 text-sm outline-none transition-all duration-150 focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
          />
        </div>
        <div>
          <label class="text-sm font-medium">Parol</label>
          <input
            v-model="addForm.password"
            type="password"
            required
            placeholder="Parol"
            class="mt-1 h-11 w-full rounded-lg border border-border bg-input px-3 text-sm outline-none transition-all duration-150 focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
          />
        </div>
        <p class="text-xs text-muted">
          Parolni keyinchalik bu paneldan ko'rish yoki o'zgartirish mumkin emas
          — uni kassirga xabar qiling.
        </p>
        <div class="flex gap-2 pt-1">
          <button
            type="button"
            class="h-11 flex-1 rounded-full border border-border text-sm font-medium transition-colors duration-150 hover:bg-secondary"
            @click="addOpen = false"
          >
            Bekor qilish
          </button>
          <button
            type="submit"
            :disabled="savingAdd"
            class="h-11 flex-1 rounded-full bg-primary text-sm font-semibold text-primary-foreground transition-all duration-150 hover:bg-primary/90 active:scale-95 disabled:opacity-60"
          >
            <span
              v-if="savingAdd"
              class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground align-middle"
            ></span>
            <span v-else>Qo'shish</span>
          </button>
        </div>
      </form>
    </AppModal>

    <AppModal
      :open="!!editItem"
      title="Kassirni tahrirlash"
      @close="editItem = null"
    >
      <form class="space-y-3" @submit.prevent="submitEdit">
        <div>
          <label class="text-sm font-medium">Ism familiya</label>
          <input
            v-model="editForm.full_name"
            required
            class="mt-1 h-11 w-full rounded-lg border border-border bg-input px-3 text-sm outline-none transition-all duration-150 focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
          />
        </div>
        <label class="flex items-center gap-2 text-sm">
          <input
            v-model="editForm.is_active"
            type="checkbox"
            class="h-4 w-4 accent-primary"
          />
          Faol
        </label>
        <div class="flex gap-2 pt-1">
          <button
            type="button"
            class="h-11 flex-1 rounded-full border border-border text-sm font-medium transition-colors duration-150 hover:bg-secondary"
            @click="editItem = null"
          >
            Bekor qilish
          </button>
          <button
            type="submit"
            :disabled="savingEdit"
            class="h-11 flex-1 rounded-full bg-primary text-sm font-semibold text-primary-foreground transition-all duration-150 hover:bg-primary/90 active:scale-95 disabled:opacity-60"
          >
            <span
              v-if="savingEdit"
              class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground align-middle"
            ></span>
            <span v-else>Yangilash</span>
          </button>
        </div>
      </form>
    </AppModal>

    <AppModal
      :open="!!deleteItem"
      title="O'chirishni tasdiqlang"
      @close="deleteItem = null"
    >
      <p class="text-sm text-muted">
        "<span class="font-medium text-gray-900">{{
          deleteItem?.full_name
        }}</span
        >" kassirini o'chirmoqchimisiz?
      </p>
      <div class="mt-4 flex justify-end gap-2">
        <button
          class="rounded-full border border-border px-4 py-2 text-sm transition-colors duration-150 hover:bg-secondary"
          @click="deleteItem = null"
        >
          Bekor qilish
        </button>
        <button
          :disabled="deleting"
          class="rounded-full bg-destructive px-4 py-2 text-sm text-white transition-all duration-150 hover:bg-destructive/90 active:scale-95 disabled:opacity-60"
          @click="confirmDelete"
        >
          <span
            v-if="deleting"
            class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white align-middle"
          ></span>
          <span v-else>O'chirish</span>
        </button>
      </div>
    </AppModal>
  </DashboardLayout>
</template>

<style scoped>
.page-enter {
  animation: pageFadeIn 0.4s ease-out;
}

@keyframes pageFadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card-enter-active {
  transition:
    opacity 0.3s ease-out,
    transform 0.3s ease-out;
}

.card-leave-active {
  transition:
    opacity 0.2s ease-in,
    transform 0.2s ease-in;
  position: absolute;
}

.card-enter-from {
  opacity: 0;
  transform: translateY(10px) scale(0.98);
}

.card-leave-to {
  opacity: 0;
  transform: scale(0.96);
}

.card-move {
  transition: transform 0.3s ease;
}

.animate-pulse-dot {
  position: relative;
}

.animate-pulse-dot::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 9999px;
  background: currentColor;
  opacity: 0.6;
  animation: dotPulse 1.8s ease-out infinite;
}

@keyframes dotPulse {
  0% {
    transform: scale(1);
    opacity: 0.5;
  }

  100% {
    transform: scale(2.4);
    opacity: 0;
  }
}

.fade-in-up {
  animation: fadeInUp 0.35s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .page-enter,
  .fade-in-up,
  .card-enter-active,
  .card-leave-active,
  .card-move,
  .animate-pulse-dot::after {
    animation: none !important;
    transition: none !important;
  }
}
</style>
