<script setup lang="ts">
// Vignette carrée : le visuel détouré (ou, à défaut, la première photo)
// recadré pour remplir toute la tuile sombre.
defineProps<{
  cover: string | null
  cutout: string | null
  // Taille d'affichage en px, pour dimensionner l'image servie par IPX.
  size: number
}>()
</script>

<template>
  <div class="relative shrink-0 overflow-hidden bg-[radial-gradient(circle_at_30%_25%,#2A2A2A_0%,#111111_75%)]">
    <NuxtImg
      v-if="cutout"
      :src="cutout"
      alt=""
      :width="size * 2"
      :height="size * 2"
      fit="cover"
      loading="lazy"
      class="absolute inset-0 size-full object-cover"
    />
    <NuxtImg
      v-else-if="cover"
      :src="cover"
      alt=""
      :width="size * 2"
      :height="size * 2"
      fit="cover"
      loading="lazy"
      class="size-full object-cover"
    />
  </div>
</template>
