<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core'
import type { KnifeSummary } from '#shared/types/knife'

// Desktop : tambour WebGL en boucle infinie. Mobile, ou navigateur sans
// WebGL : carrousel HTML (Embla).
defineProps<{
  knives: KnifeSummary[]
}>()

const selected = defineModel<number>('index', { required: true })

const isDesktop = useMediaQuery('(min-width: 1024px)')
// Le choix se fait après hydratation : le serveur ne connaît pas la largeur
// de l'écran, et le rendu serveur doit rester identique au premier rendu client.
const mounted = ref(false)
const webglFailed = ref(false)

onMounted(() => {
  mounted.value = true
})

const useCylinder = computed(() => mounted.value && isDesktop.value && !webglFailed.value)
</script>

<template>
  <div class="relative flex flex-1 flex-col">
    <!-- Chargé à la demande : OGL n'est jamais téléchargé sur mobile. -->
    <LazyRouleauCylinder
      v-if="useCylinder"
      v-model:index="selected"
      :knives="knives"
      @unsupported="webglFailed = true"
    />
    <!-- Masqué sur desktop avant hydratation pour éviter un flash du
         carrousel HTML avant l'arrivée du tambour WebGL. -->
    <RouleauSwipe
      v-else
      v-model:index="selected"
      :knives="knives"
      :class="!mounted && 'lg:invisible'"
    />
  </div>
</template>
