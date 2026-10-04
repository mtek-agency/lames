<script setup lang="ts">
defineProps<{
  variant: 'new' | 'limited'
}>()
</script>

<template>
  <span
    class="shrink-0 rounded px-1.5 py-[3px] text-[8px] font-bold uppercase tracking-[0.6px]"
    :class="variant === 'new' ? 'bg-paper text-ink' : 'bg-brand text-paper'"
  >
    {{ variant === 'new' ? 'Nouveau' : 'Édition limitée' }}
  </span>
</template>
