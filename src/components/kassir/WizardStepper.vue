<script setup>
defineProps({
  steps: { type: Array, required: true }, // [{ label }]
  current: { type: Number, required: true }, // 1-based
});
</script>

<template>
  <div class="flex items-center gap-2 overflow-x-auto">
    <template v-for="(s, i) in steps" :key="s.label">
      <div class="flex shrink-0 items-center gap-1.5">
        <span class="flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold transition-colors"
          :class="i + 1 < current ? 'bg-primary text-primary-foreground' : i + 1 === current ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted'">
          <svg v-if="i + 1 < current" viewBox="0 0 24 24" class="h-3 w-3" fill="none" stroke="currentColor"
            stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span v-else>{{ i + 1 }}</span>
        </span>
        <span class="whitespace-nowrap text-xs font-medium" :class="i + 1 <= current ? 'text-gray-900' : 'text-muted'">
          {{ s.label }}
        </span>
      </div>
      <span v-if="i < steps.length - 1" class="h-px w-6 shrink-0" :class="i + 1 < current ? 'bg-primary' : 'bg-border'"></span>
    </template>
  </div>
</template>
