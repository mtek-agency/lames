<script setup lang="ts">
useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
    { rel: 'shortcut icon', href: '/favicon.ico' }
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
    <UHeader :ui="{ root: 'border-default/50' }">
      <template #left>
        <NuxtLink
          to="/"
          class="focus-visible:outline-3 outline-primary/25 rounded-md py-1 font-serif text-lg tracking-wide"
        >
          Collection de couteaux
        </NuxtLink>
      </template>

      <template #default>
        <div class="flex items-center gap-10">
          <NuxtLink
            to="/"
            class="text-sm font-medium pb-1 border-b transition-colors"
            :class="isCouteauxActive ? 'text-primary border-primary' : 'text-muted border-transparent hover:text-primary'"
          >
            Couteaux
          </NuxtLink>
          <NuxtLink
            to="/carte"
            class="text-sm font-medium pb-1 border-b transition-colors"
            :class="isCarteActive ? 'text-primary border-primary' : 'text-muted border-transparent hover:text-primary'"
          >
            Carte
          </NuxtLink>
        </div>
      </template>

      <template #right>
        <UColorModeButton />
      </template>

      <template #body>
        <div class="flex flex-col gap-4">
          <NuxtLink
            to="/"
            class="text-base font-medium"
            :class="isCouteauxActive ? 'text-primary' : 'text-muted'"
          >
            Couteaux
          </NuxtLink>
          <NuxtLink
            to="/carte"
            class="text-base font-medium"
            :class="isCarteActive ? 'text-primary' : 'text-muted'"
          >
            Carte
          </NuxtLink>
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
          class="text-sm text-muted hover:text-primary transition-colors"
        >
          matteo-bonneval.fr
        </a>
      </template>
    </UFooter>
  </UApp>
</template>
