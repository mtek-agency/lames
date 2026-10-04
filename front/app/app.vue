<script setup lang="ts">
useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
    { name: 'theme-color', content: '#050505' }
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
  titleTemplate: title => title ? `${title} · Collection couteaux` : 'Collection couteaux — Mattéo Bonneval',
  description: 'Collection de couteaux de Mattéo Bonneval : fiches techniques et photos de chaque pièce.',
  ogType: 'website',
  twitterCard: 'summary_large_image'
})
</script>

<template>
  <NuxtPage />
</template>
