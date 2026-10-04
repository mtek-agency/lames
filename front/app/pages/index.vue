<script setup lang="ts">
import type { CollectionView } from '~/components/ViewToggle.vue'

useSeoMeta({
  title: '',
  description: 'La collection de couteaux de Mattéo Bonneval : chaque pièce, son acier, son manche et son année.'
})

useHead({
  // Desktop : le rouleau se pilote à la molette / au trackpad ; sans ça, un
  // geste horizontal déclenche le rebond ou le "retour arrière" du navigateur.
  htmlAttrs: { class: 'lg:overscroll-none' },
  bodyAttrs: { class: 'bg-night text-paper lg:overscroll-none' },
  meta: [{ name: 'theme-color', content: '#050505' }]
})

const { data, error } = await useFetch('/api/knives')

const knives = computed(() => data.value?.data ?? [])
const latest = computed(() => data.value?.latest ?? null)

// La vue est dans l'URL (?vue=liste) : partageable, et le retour depuis une
// fiche rouvre la bonne vue.
const route = useRoute()
const router = useRouter()

const view = computed<CollectionView>({
  get: () => route.query.vue === 'liste' ? 'liste' : 'rouleau',
  set: (value) => {
    router.replace({ query: { ...route.query, vue: value === 'liste' ? 'liste' : undefined } })
  }
})

// À la première visite, le rouleau s'ouvre sur la dernière entrée ; ensuite
// il revient sur la pièce consultée.
const rouleauIndex = useState('rouleau-index', () =>
  Math.max(knives.value.findIndex(knife => knife.slug === latest.value), 0)
)
</script>

<template>
  <main
    class="relative isolate flex flex-col lg:overscroll-none"
    :class="view === 'rouleau' ? 'h-dvh overflow-hidden' : 'min-h-dvh lg:h-dvh lg:overflow-hidden'"
  >
    <DamasBackground :lines-opacity="view === 'liste' ? 0.55 : 1" />

    <SiteHeader class="relative z-20 lg:absolute lg:inset-x-0 lg:top-5" />

    <div
      v-if="error"
      class="flex flex-1 flex-col items-center justify-center gap-2 px-5 text-center"
    >
      <p class="font-display text-4xl text-paper">
        La collection est indisponible
      </p>
      <p class="text-sm text-paper/60">
        Réessayez dans un instant.
      </p>
    </div>

    <div
      v-else-if="!knives.length"
      class="flex flex-1 items-center justify-center px-5"
    >
      <p class="font-display text-4xl text-paper">
        Aucune pièce exposée pour l'instant.
      </p>
    </div>

    <template v-else>
      <KnifeRouleau
        v-if="view === 'rouleau'"
        v-model:index="rouleauIndex"
        :knives="knives"
      />
      <KnifeList
        v-else
        :knives="knives"
        :latest="latest"
      />

      <ViewToggle
        v-model="view"
        class="fixed bottom-12 left-1/2 z-30 -translate-x-1/2 lg:bottom-[26px]"
      />
    </template>
  </main>
</template>
