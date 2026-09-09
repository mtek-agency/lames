<script setup lang="ts">
useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ],
  htmlAttrs: {
    lang: 'fr'
  }
})

useSeoMeta({
  titleTemplate: '%s · Collection de couteaux',
  title: 'Collection de couteaux',
  description: 'Vitrine et inventaire d\'une collection de couteaux : fiches techniques, origines et histoires des pièces.',
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

const route = useRoute()
// "Couteaux" reste actif sur les fiches détaillées : ça fait partie de la
// même section (le catalogue), pas juste la page d'accueil au sens strict.
const isCouteauxActive = computed(() => route.path === '/' || route.path.startsWith('/couteaux/'))
const isCarteActive = computed(() => route.path.startsWith('/carte'))
</script>

<template>
  <UApp>
    <div
      class="fixed inset-0 z-[100] pointer-events-none opacity-[0.05] mix-blend-multiply dark:opacity-[0.035] dark:mix-blend-overlay"
      style="background-image: url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%222%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E')"
    />

    <UHeader :ui="{ root: 'border-default/50' }">
      <template #left>
        <NuxtLink
          to="/"
          class="focus-visible:outline-3 outline-primary/25 rounded-md py-1 font-serif text-lg tracking-wide"
        >
          Collection de couteaux
        </NuxtLink>
      </template>

      <template #right>
        <div class="flex items-center gap-10">
          <NuxtLink
            to="/"
            class="font-mono text-xs uppercase tracking-[0.2em] pb-1 border-b transition-colors"
            :class="isCouteauxActive ? 'text-primary border-primary' : 'text-muted border-transparent hover:text-primary'"
          >
            Couteaux
          </NuxtLink>
          <NuxtLink
            to="/carte"
            class="font-mono text-xs uppercase tracking-[0.2em] pb-1 border-b transition-colors"
            :class="isCarteActive ? 'text-primary border-primary' : 'text-muted border-transparent hover:text-primary'"
          >
            Carte
          </NuxtLink>
          <UColorModeButton class="ml-2" />
        </div>
      </template>
    </UHeader>

    <UMain>
      <NuxtPage />
    </UMain>

    <USeparator />

    <UFooter>
      <template #left>
        <p class="text-sm text-muted">
          © {{ new Date().getFullYear() }} — Collection privée, à but non commercial.
        </p>
      </template>

      <template #right>
        <a
          href="https://matteo-bonneval.fr"
          target="_blank"
          rel="noopener"
          class="font-mono text-xs uppercase tracking-[0.2em] text-muted hover:text-primary transition-colors"
        >
          matteo-bonneval.fr
        </a>
      </template>
    </UFooter>
  </UApp>
</template>
