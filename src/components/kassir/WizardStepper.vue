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
        <span class="flex h-8 w-8 items-center justify-center rounded-2xl text-[11px] font-bold transition-colors"
          :class="i + 1 < current ? 'bg-[#17b169] text-white' : i + 1 === current ? 'bg-[#17b169] text-white' : 'bg-[#17b169] text-white'">
          <svg v-if="i + 1 < current" viewBox="0 0 24 24" class="h-3 w-3" fill="none" stroke="currentColor"
            stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span v-else>{{ i + 1 }}</span>
        </span>
        <span class="whitespace-nowrap text-xs font-medium" :class="i + 1 <= current ? 'text-[#027947]' : 'text-[#027947]'">
          {{ s.label }}
        </span>
      </div>
      <span v-if="i < steps.length - 1" class="h-0.5 w-6 shrink-0 bg-[#17b169]"></span>
    </template>
  </div>
</template>
