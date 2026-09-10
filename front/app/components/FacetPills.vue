<script setup lang="ts">
defineProps<{
  label: string
  options: { label: string, value: string }[]
}>()

const model = defineModel<string | undefined>()

function toggle(value: string) {
  model.value = model.value === value ? undefined : value
}
</script>

<template>
  <div
    v-if="options.length"
    class="flex flex-wrap items-center gap-2"
  >
    <span class="text-xs text-muted mr-1">
      {{ label }}
    </span>
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="px-3 py-1 text-sm border transition-colors cursor-pointer"
      :class="model === option.value
        ? 'bg-primary text-inverted border-primary'
        : 'border-default/70 hover:border-primary/60'"
      @click="toggle(option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>
