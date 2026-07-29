<script setup>
import { ref, computed } from "vue";

/**
 * Ikki oylik kalendar — sanadan sanagacha tanlash.
 * Admin panelidagi DateRangePicker bilan bir xil ishlaydi, faqat yorug'
 * mavzuga moslashtirilgan.
 */

const props = defineProps({
  start: { type: String, default: "" },
  end: { type: String, default: "" },
});
const emit = defineEmits(["apply", "cancel", "clear"]);

const MONTHS = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
  "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr",
];
const MONTHS_SHORT = [
  "Yan", "Fev", "Mar", "Apr", "May", "Iyn",
  "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek",
];
const WEEKDAYS = ["DU", "SE", "CH", "PA", "JU", "SH", "YA"];

function parseISO(s) {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

const selStart = ref(parseISO(props.start));
const selEnd = ref(parseISO(props.end));

const today = new Date();
const anchor = ref(
  selStart.value
    ? new Date(selStart.value.getFullYear(), selStart.value.getMonth(), 1)
    : new Date(today.getFullYear(), today.getMonth() - 1, 1),
);
const rightAnchor = computed(
  () => new Date(anchor.value.getFullYear(), anchor.value.getMonth() + 1, 1),
);

function monthCells(y, m) {
  const first = new Date(y, m, 1);
  const startIdx = (first.getDay() + 6) % 7; // Dushanba = 0
  const cells = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(y, m, 1 - startIdx + i);
    cells.push({ date: d, other: d.getMonth() !== m });
  }
  return cells;
}
const leftCells = computed(() => monthCells(anchor.value.getFullYear(), anchor.value.getMonth()));
const rightCells = computed(() =>
  monthCells(rightAnchor.value.getFullYear(), rightAnchor.value.getMonth()),
);

function sameDay(a, b) {
  return (
    !!a && !!b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
function isEdge(d) {
  return sameDay(d, selStart.value) || sameDay(d, selEnd.value);
}
function inRange(d) {
  return !!selStart.value && !!selEnd.value && d > selStart.value && d < selEnd.value;
}

function pick(d) {
  if (!selStart.value || (selStart.value && selEnd.value)) {
    selStart.value = d;
    selEnd.value = null;
  } else if (d < selStart.value) {
    selEnd.value = selStart.value;
    selStart.value = d;
  } else {
    selEnd.value = d;
  }
}

function iso(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

const rangeText = computed(() => {
  if (!selStart.value) return "Tanlanmagan";
  const f = (d) =>
    `${MONTHS_SHORT[d.getMonth()]} ${String(d.getDate()).padStart(2, "0")}, ${d.getFullYear()}`;
  return selEnd.value ? `${f(selStart.value)} – ${f(selEnd.value)}` : f(selStart.value);
});

function apply() {
  if (selStart.value && selEnd.value) emit("apply", iso(selStart.value), iso(selEnd.value));
}
function clearAll() {
  selStart.value = null;
  selEnd.value = null;
  emit("clear");
}

const CELL =
  "h-8 w-8 mx-auto rounded-lg text-xs flex items-center justify-center transition-colors";
</script>

<template>
  <div class="w-[540px] max-w-[92vw] rounded-2xl border border-border bg-card p-4 shadow-xl">
    <div class="mb-2 flex items-center justify-end">
      <button class="text-xs text-muted transition-colors hover:text-gray-900" @click="clearAll">
        Filtrni tozalash
      </button>
    </div>

    <div class="grid gap-6 sm:grid-cols-2">
      <!-- Chap oy -->
      <div>
        <div class="mb-3 flex items-center justify-between">
          <button
            class="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary transition-colors hover:bg-accent"
            @click="anchor = new Date(anchor.getFullYear(), anchor.getMonth() - 1, 1)"
          >
            <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <span class="text-sm font-medium">
            {{ MONTHS[anchor.getMonth()] }} {{ anchor.getFullYear() }}
          </span>
          <span class="w-7" />
        </div>
        <div class="grid grid-cols-7 gap-y-1 text-center">
          <span v-for="w in WEEKDAYS" :key="w" class="py-1 text-[10px] text-muted">{{ w }}</span>
          <button
            v-for="(c, i) in leftCells"
            :key="i"
            :class="[
              CELL,
              c.other ? 'text-muted/50' : 'text-gray-900',
              isEdge(c.date)
                ? '!bg-primary !text-primary-foreground font-semibold'
                : inRange(c.date)
                  ? 'bg-accent text-accent-foreground'
                  : 'hover:bg-secondary',
            ]"
            @click="pick(c.date)"
          >
            {{ c.date.getDate() }}
          </button>
        </div>
      </div>

      <!-- O'ng oy -->
      <div>
        <div class="mb-3 flex items-center justify-between">
          <span class="w-7" />
          <span class="text-sm font-medium">
            {{ MONTHS[rightAnchor.getMonth()] }} {{ rightAnchor.getFullYear() }}
          </span>
          <button
            class="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary transition-colors hover:bg-accent"
            @click="anchor = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1)"
          >
            <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>
        <div class="grid grid-cols-7 gap-y-1 text-center">
          <span v-for="w in WEEKDAYS" :key="w" class="py-1 text-[10px] text-muted">{{ w }}</span>
          <button
            v-for="(c, i) in rightCells"
            :key="i"
            :class="[
              CELL,
              c.other ? 'text-muted/50' : 'text-gray-900',
              isEdge(c.date)
                ? '!bg-primary !text-primary-foreground font-semibold'
                : inRange(c.date)
                  ? 'bg-accent text-accent-foreground'
                  : 'hover:bg-secondary',
            ]"
            @click="pick(c.date)"
          >
            {{ c.date.getDate() }}
          </button>
        </div>
      </div>
    </div>

    <div class="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
      <span class="text-xs text-muted">
        Sana oralig'i: <span class="font-medium text-gray-900">{{ rangeText }}</span>
      </span>
      <div class="flex items-center gap-2">
        <button
          class="rounded-lg bg-secondary px-4 py-2 text-xs font-medium transition-colors hover:bg-accent"
          @click="emit('cancel')"
        >
          Orqaga
        </button>
        <button
          :disabled="!selStart || !selEnd"
          class="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          @click="apply"
        >
          Qo'llash
        </button>
      </div>
    </div>
  </div>
</template>
