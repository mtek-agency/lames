<script setup lang="ts">
export type CollectionView = 'rouleau' | 'liste'

const view = defineModel<CollectionView>({ required: true })

const options = [
  { value: 'rouleau', label: 'Rouleau', icon: 'lucide:gallery-horizontal-end' },
  { value: 'liste', label: 'Liste', icon: 'lucide:list' }
] as const
</script>

<template>
  <div
    role="radiogroup"
    aria-label="Affichage de la collection"
    class="flex items-center gap-0.5 rounded-full bg-smoke/80 p-1 outline -outline-offset-[0.5px] outline-white/12 backdrop-blur-[10px]"
  >
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      role="radio"
      :aria-checked="view === option.value"
      class="flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-medium transition-colors duration-300"
      :class="view === option.value ? 'bg-paper text-ink' : 'text-paper/70 hover:text-paper'"
      @click="view = option.value"
    >
      <Icon
        :name="option.icon"
        class="size-[15px]"
      />
      {{ option.label }}
    </button>
  </div>
</template>
