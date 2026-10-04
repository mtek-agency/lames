<script setup lang="ts">
import type { KnifePhoto } from '#shared/types/knife'

// Photo de la galerie avec sa légende ("Fermé — 11,4 cm" ... "03 / 06").
// Un clic l'ouvre en plein écran.
defineProps<{
  photo: KnifePhoto
  index: number
  total: number
  alt: string
  sizes: string
  // Ratio du cadre, propre à chaque emplacement de la galerie.
  frameClass: string
}>()

defineEmits<{
  open: [index: number]
}>()
</script>

<template>
  <figure class="flex flex-col gap-2.5">
    <button
      type="button"
      class="group block w-full cursor-zoom-in overflow-hidden bg-stone/40"
      :class="frameClass"
      :aria-label="`Agrandir la photo ${index + 1} : ${photo.caption ?? alt}`"
      @click="$emit('open', index)"
    >
      <NuxtImg
        :src="photo.url"
        :alt="photo.caption ?? `${alt} — photo ${index + 1}`"
        :sizes="sizes"
        densities="x1 x2"
        loading="lazy"
        class="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.015]"
      />
    </button>
    <figcaption class="flex justify-between gap-4 text-[11px] lg:text-xs">
      <span class="truncate text-ink">{{ photo.caption }}</span>
      <span class="shrink-0 tabular-nums text-muted">{{ pad(index + 1) }} / {{ pad(total) }}</span>
    </figcaption>
  </figure>
</template>
