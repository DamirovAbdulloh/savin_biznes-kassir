<script setup>
defineProps({
  customer: { type: Object, required: true }, // { full_name, member_id, membership_type, status, total_visits, last_visit_label }
});
defineEmits(["continue", "back"]);

function initials(name) {
  return (name || "?").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}
</script>

<template>
  <div class="grid gap-4 md:grid-cols-2">
    <div class="rounded-2xl border border-border bg-card p-5">
      <div class="mb-5 flex items-center gap-3">
        <div class="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground">
          {{ initials(customer.full_name) }}
        </div>
        <div>
          <p class="font-semibold">{{ customer.full_name }}</p>
          <p class="text-xs font-medium text-success">{{ customer.membership_type }} A'zo</p>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <p class="text-xs text-muted">Jami tashriflar</p>
          <p class="mt-0.5 font-semibold">{{ customer.total_visits }} ta</p>
        </div>
        <div>
          <p class="text-xs text-muted">Oxirgi tashrif</p>
          <p class="mt-0.5 font-semibold">{{ customer.last_visit_label }}</p>
        </div>
      </div>
    </div>

    <div class="rounded-2xl border border-border bg-card p-5">
      <h3 class="mb-3 text-sm font-semibold">A'zolik ma'lumotlari</h3>
      <div class="space-y-2.5 text-sm">
        <div class="flex justify-between">
          <span class="text-muted">Turi</span>
          <span class="font-medium">{{ customer.membership_type }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-muted">Holati</span>
          <span class="font-medium text-success">{{ customer.status }}</span>
        </div>
      </div>

      <button
        class="mt-5 h-11 w-full rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-150 hover:bg-primary/90 active:scale-95"
        @click="$emit('continue')">
        Davom etish
      </button>
      <button class="mt-2 h-9 w-full rounded-full text-sm text-muted transition-colors hover:text-gray-900"
        @click="$emit('back')">
        Orqaga
      </button>
    </div>
  </div>
</template>
