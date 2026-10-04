<script setup lang="ts">
import type { SpecRow } from '~/utils/knife'

// Lignes "LAME ........ Acier 14C28N — 9,2 cm" de la maquette, en trois
// variantes : sur fond nuit (aperçu de la liste), filets encre (haut de
// fiche) ou filets pierre (fiche technique).
const props = withDefaults(defineProps<{
  rows: SpecRow[]
  tone?: 'night' | 'ink' | 'stone'
}>(), {
  tone: 'ink'
})

const visibleRows = computed(() => specRows(props.rows))

const toneClasses = {
  night: { row: 'border-white/20 py-[9px]', label: 'text-paper/70', value: 'text-[13px] text-paper' },
  ink: { row: 'border-ink py-2.5', label: 'text-ink', value: 'text-sm text-ink' },
  stone: { row: 'border-stone py-2.5', label: 'text-ink', value: 'text-sm text-ink' }
}
</script>

<template>
  <dl class="flex flex-col">
    <div
      v-for="row in visibleRows"
      :key="row.label"
      class="flex items-center justify-between gap-6 border-t"
      :class="toneClasses[tone].row"
    >
      <dt
        class="label-caps shrink-0"
        :class="toneClasses[tone].label"
      >
        {{ row.label }}
      </dt>
      <dd
        class="truncate text-right"
        :class="toneClasses[tone].value"
      >
        {{ row.value }}
      </dd>
    </div>
  </dl>
</template>
