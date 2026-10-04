<script setup lang="ts">
// Vignette carrée : le visuel détouré posé en diagonale sur une tuile sombre
// (comme sur la maquette), sinon la première photo recadrée.
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
      fit="inside"
      loading="lazy"
      class="absolute inset-0 size-full scale-[1.35] -rotate-[35deg] object-contain"
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
