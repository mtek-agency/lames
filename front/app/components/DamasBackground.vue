<script setup lang="ts">
// Fond "acier damassé" des écrans nuit : lignes ondulées, halo chaud au
// centre, vignettage sur les bords. Fixe, derrière tout le contenu : la page
// parente doit créer un contexte d'empilement (`isolate`), sinon le fond du
// <body> est peint par-dessus ce calque en z-index négatif.
withDefaults(defineProps<{
  // La liste atténue les lignes pour ne pas gêner la lecture des lignes.
  linesOpacity?: number
}>(), {
  linesOpacity: 1
})
</script>

<template>
  <div
    aria-hidden="true"
    class="pointer-events-none fixed inset-0 -z-10 bg-night"
  >
    <div
      class="absolute inset-0 bg-[url('/damas.svg')] bg-no-repeat bg-[length:max(100%,1440px)_max(100%,900px)]"
      :style="{ opacity: linesOpacity }"
    />
    <div class="glow absolute inset-0" />
    <div class="vignette absolute inset-0" />
  </div>
</template>

<style scoped>
/* Hors classes Tailwind volontairement : lightningcss réécrit
   `ellipse 75% 75% at 50% 50%` en `75% 75%`, que cssnano (build de prod)
   prend pour l'ancienne syntaxe et dont il remet l'arrêt à 40 % à 0. */
.glow {
  background-image: radial-gradient(ellipse 45% 40% at 50% 42%, #C9A27A2E 0%, #C9A27A00 100%);
}

.vignette {
  background-image: radial-gradient(ellipse 75% 75% at 50% 50%, #05050500 40%, #050505F2 100%);
}
</style>
