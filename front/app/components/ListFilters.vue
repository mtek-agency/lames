<script setup lang="ts">
defineProps<{
  filters: { value: string, label: string }[]
}>()

const model = defineModel<string>({ required: true })
</script>

<template>
  <div
    role="radiogroup"
    aria-label="Filtrer la collection"
    class="flex gap-1.5"
  >
    <button
      v-for="option in filters"
      :key="option.value"
      type="button"
      role="radio"
      :aria-checked="model === option.value"
      class="shrink-0 whitespace-nowrap rounded-full px-3.5 py-2 text-[13px] font-medium outline -outline-offset-[0.5px] transition-colors"
      :class="model === option.value
        ? 'bg-paper text-ink outline-transparent'
        : 'text-paper/80 outline-white/20 hover:text-paper hover:outline-white/40'"
      @click="model = option.value"
    >
      {{ option.label }}
    </button>
  </div>
</template>
