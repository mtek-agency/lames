<script setup lang="ts">
import { KNIFE_TYPE_LABELS, KNIFE_MECHANISM_LABELS } from '#shared/types/knife'
import type { PublicKnife } from '#shared/types/knife'

useSeoMeta({
  title: 'Carte',
  description: 'Carte interactive des origines et lieux de fabrication des pièces de la collection.'
})

const { data, status, error } = await useFetch('/api/knives')

const geolocated = computed(() =>
  (data.value?.data ?? []).filter(
    (knife): knife is typeof knife & { coordinates: { lat: number, lng: number } } => knife.coordinates !== null
  )
)

const selectedKnife = ref<PublicKnife | null>(null)
const slideoverOpen = ref(false)

function onMarkerClick(knife: PublicKnife) {
  selectedKnife.value = knife
  slideoverOpen.value = true
}

// Retour depuis une fiche ouverte via le slideover (?from=carte) : on
// rouvre directement le panneau du couteau consulté plutôt que de revenir
// sur une carte "vide".
const route = useRoute()

onMounted(() => {
  const hash = route.hash
  if (!hash.startsWith('#knife-')) return

  const id = hash.slice('#knife-'.length)
  const knife = geolocated.value.find(k => k.id === id)
  if (knife) onMarkerClick(knife)
})
</script>

<template>
  <div>
    <div class="border-b border-default/50 px-4 py-12">
      <div class="max-w-[80rem] mx-auto">
        <p class="text-sm text-primary mb-4">
          Carte des origines
        </p>
        <h1 class="font-serif text-4xl sm:text-5xl leading-[0.95]">
          D'où viennent <em class="not-italic text-primary">les lames</em>
        </h1>
        <KnifeSilhouette
          class="pointer-events-none select-none w-56 text-primary/50 mt-6"
          aria-hidden="true"
        />
      </div>
    </div>

    <USkeleton
      v-if="status === 'pending'"
      class="w-full h-[80vh] rounded-none"
    />

    <div
      v-else-if="error"
      class="px-4 py-12"
    >
      <UAlert
        color="error"
        title="Impossible de charger la carte"
        :description="error.message"
        class="rounded-none"
      />
    </div>

    <!-- Carte en plein bord, hors du conteneur centré du site : un cadre
         "photo" comme les couteaux n'a pas de sens ici, et la contraindre
         dans la largeur de lecture du texte la faisait ressembler à un
         widget posé au milieu de la page plutôt qu'à un module à part
         entière. -->
    <KnifeMap
      v-else
      :knives="geolocated"
      :framed="false"
      height-class="h-[80vh]"
      @marker-click="onMarkerClick"
    />

    <USlideover
      v-model:open="slideoverOpen"
      inset
      :title="selectedKnife?.name"
    >
      <template #body>
        <div
          v-if="selectedKnife"
          class="flex flex-col gap-4"
        >
          <div class="aspect-4/3 bg-elevated overflow-hidden border-[6px] border-white shadow-md">
            <NuxtImg
              v-if="selectedKnife.photos[0]"
              :src="selectedKnife.photos[0]"
              :alt="selectedKnife.name"
              class="w-full h-full object-cover"
              width="400"
              height="300"
            />
            <div
              v-else
              class="w-full h-full flex items-center justify-center text-muted"
            >
              <UIcon
                name="i-lucide-image-off"
                class="size-8"
              />
            </div>
          </div>

          <p class="text-sm text-primary">
            {{ selectedKnife.maker }} · {{ selectedKnife.origin_city }}
          </p>

          <div class="flex flex-wrap gap-1.5">
            <UBadge
              :label="KNIFE_TYPE_LABELS[selectedKnife.type] ?? selectedKnife.type"
              variant="subtle"
              size="sm"
              class="rounded-none"
            />
            <UBadge
              v-if="selectedKnife.mechanism"
              :label="KNIFE_MECHANISM_LABELS[selectedKnife.mechanism] ?? selectedKnife.mechanism"
              variant="subtle"
              color="neutral"
              size="sm"
              class="rounded-none"
            />
            <UBadge
              :label="selectedKnife.blade_steel"
              variant="subtle"
              color="neutral"
              size="sm"
              class="rounded-none"
            />
          </div>

          <UButton
            :to="{ path: `/couteaux/${selectedKnife.slug}`, query: { from: 'carte' } }"
            label="Voir la fiche complète"
            trailing-icon="i-lucide-arrow-right"
            block
            class="rounded-none"
          />
        </div>
      </template>
    </USlideover>
  </div>
</template>
