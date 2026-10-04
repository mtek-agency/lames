<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{
  error: NuxtError
}>()

const notFound = computed(() => props.error.statusCode === 404)

useSeoMeta({
  title: notFound.value ? 'Pièce introuvable' : 'Erreur'
})

useHead({
  bodyAttrs: { class: 'bg-night text-paper' }
})
</script>

<template>
  <div class="relative isolate flex min-h-dvh flex-col">
    <DamasBackground />
    <SiteHeader class="relative z-10 lg:mt-5" />

    <main class="flex flex-1 flex-col items-center justify-center gap-6 px-5 pb-24 text-center">
      <p class="eyebrow text-white/40">
        {{ error.statusCode }}
      </p>
      <h1 class="font-display text-5xl/none tracking-[-1px] lg:text-7xl/none">
        {{ notFound ? 'Pièce introuvable' : 'Une erreur est survenue' }}
      </h1>
      <p class="max-w-sm text-sm text-paper/60">
        {{ notFound
          ? 'Cette pièce n\'existe pas ou n\'est plus exposée.'
          : 'La collection n\'a pas pu être chargée. Réessayez dans un instant.' }}
      </p>
      <button
        type="button"
        class="mt-2 flex items-center gap-2 rounded-full bg-paper px-[18px] py-[13px] text-[13px] font-medium text-ink"
        @click="clearError({ redirect: '/' })"
      >
        <Icon
          name="lucide:arrow-left"
          class="size-4"
        />
        Retour à la collection
      </button>
    </main>
  </div>
</template>
