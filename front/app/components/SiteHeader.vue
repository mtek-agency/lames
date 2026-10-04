<script setup lang="ts">
// Header commun : clair sur fond nuit (rouleau, liste), encre sur fond papier
// (fiche). Le positionnement (absolu sur les écrans plein cadre) est laissé
// à la page.
const props = withDefaults(defineProps<{
  tone?: 'night' | 'paper'
}>(), {
  tone: 'night'
})

const linkClass = computed(() =>
  props.tone === 'night' ? 'text-paper/80 hover:text-paper' : 'text-ink/80 hover:text-ink'
)

const OWNER_URL = 'https://matteo-bonneval.fr'
</script>

<template>
  <header class="flex h-14 items-center justify-between px-5 lg:h-16 lg:px-[72px]">
    <NuxtLink
      to="/"
      class="eyebrow transition-colors"
      :class="linkClass"
    >
      Collection couteaux
    </NuxtLink>

    <a
      :href="OWNER_URL"
      target="_blank"
      rel="noopener"
      class="eyebrow hidden transition-colors lg:block"
      :class="linkClass"
    >
      Mattéo Bonneval
    </a>

    <a
      :href="OWNER_URL"
      target="_blank"
      rel="noopener"
      aria-label="Mattéo Bonneval — site personnel"
      class="flex size-9 items-center justify-center rounded-full outline -outline-offset-[0.5px] backdrop-blur-sm lg:hidden"
      :class="tone === 'night'
        ? 'bg-white/6 outline-white/20 text-paper'
        : 'bg-ink/3 outline-ink/15 text-ink'"
    >
      <Icon
        name="lucide:user-round"
        class="size-4"
      />
    </a>
  </header>
</template>
