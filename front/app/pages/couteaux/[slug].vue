<script setup lang="ts">
import { KNIFE_TYPE_LABELS, KNIFE_MECHANISM_LABELS } from '#shared/types/knife'

const route = useRoute()
const slug = route.params.slug as string

const { data, error } = await useFetch(`/api/knives/${slug}`)

if (error.value) {
  throw createError({
    statusCode: error.value.statusCode || 404,
    statusMessage: 'Couteau introuvable',
    fatal: true
  })
}

const knife = computed(() => data.value!.data)

const specs = computed(() => [
  { label: 'Type', value: KNIFE_TYPE_LABELS[knife.value.type] ?? knife.value.type },
  { label: 'Mécanisme', value: knife.value.mechanism ? (KNIFE_MECHANISM_LABELS[knife.value.mechanism] ?? knife.value.mechanism) : null },
  { label: 'Acier de lame', value: knife.value.blade_steel },
  { label: 'Finition de lame', value: knife.value.blade_finish },
  { label: 'Matière du manche', value: knife.value.handle_material },
  { label: 'Longueur totale', value: knife.value.overall_length ? `${knife.value.overall_length} mm` : null },
  { label: 'Longueur de lame', value: knife.value.blade_length ? `${knife.value.blade_length} mm` : null },
  { label: 'Poids', value: knife.value.weight ? `${knife.value.weight} g` : null }
].filter(spec => spec.value))

const lightboxOpen = ref(false)
const lightboxIndex = ref(0)
const activeLightboxIndex = ref(0)
const lightboxCarousel = useTemplateRef('lightboxCarousel')

function openLightbox(index: number) {
  lightboxIndex.value = index
  activeLightboxIndex.value = index
  lightboxOpen.value = true
}

function goToLightboxSlide(index: number) {
  lightboxCarousel.value?.emblaApi?.scrollTo(index)
}

const knifeLocation = computed(() => {
  const coordinates = knife.value.coordinates
  return coordinates ? [{ ...knife.value, coordinates }] : []
})

// Retour contextuel : si on vient de la carte (bouton "Voir la fiche
// complète" du slideover), le retour rouvre le point sur la carte plutôt
// que de renvoyer au catalogue.
const backTo = computed(() =>
  route.query.from === 'carte' ? `/carte#knife-${knife.value.id}` : `/#knife-${knife.value.id}`
)

useSeoMeta({
  title: knife.value.name,
  description: `${knife.value.name} — ${knife.value.maker}, ${knife.value.origin_city}`,
  ogTitle: knife.value.name,
  ogDescription: `${knife.value.maker} — ${knife.value.blade_steel}`,
  ogImage: knife.value.photos[0]
})
</script>

<template>
  <UPageSection>
    <NuxtLink
      :to="backTo"
      class="inline-flex items-center gap-2 text-sm text-muted hover:text-primary transition-colors mb-8"
    >
      <UIcon
        name="i-lucide-arrow-left"
        class="size-3.5"
      />
      {{ route.query.from === 'carte' ? 'Carte' : 'Catalogue' }}
    </NuxtLink>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-10">
      <div
        class="relative"
        :style="{ viewTransitionName: `knife-photo-${knife.id}` }"
      >
        <template v-if="knife.photos.length">
          <button
            type="button"
            class="block w-full border border-default/50 overflow-hidden cursor-zoom-in"
            @click="openLightbox(0)"
          >
            <NuxtImg
              :src="knife.photos[0]"
              :alt="knife.name"
              class="w-full aspect-4/3 object-cover"
              width="800"
              height="600"
            />
          </button>

          <div
            v-if="knife.photos.length > 1"
            class="flex gap-2 mt-3 overflow-x-auto"
          >
            <button
              v-for="(photo, index) in knife.photos"
              :key="photo"
              type="button"
              class="shrink-0 w-20 aspect-4/3 border border-default/50 overflow-hidden hover:opacity-80 transition-opacity cursor-zoom-in"
              @click="openLightbox(index)"
            >
              <NuxtImg
                :src="photo"
                :alt="`${knife.name} — photo ${index + 1}`"
                class="w-full h-full object-cover"
                width="160"
                height="120"
              />
            </button>
          </div>
        </template>
        <div
          v-else
          class="aspect-4/3 bg-elevated border border-default/50 flex items-center justify-center text-muted"
        >
          <UIcon
            name="i-lucide-image-off"
            class="size-12"
          />
        </div>
      </div>

      <div class="flex flex-col gap-8">
        <div>
          <p class="text-sm text-primary mb-2">
            {{ knife.maker }} · {{ knife.origin_city }}
          </p>
          <h1 class="font-serif text-4xl sm:text-5xl italic leading-tight">
            {{ knife.name }}
          </h1>
        </div>

        <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 border-t border-default/50 pt-6">
          <div
            v-for="spec in specs"
            :key="spec.label"
          >
            <dt class="font-mono text-[0.7rem] uppercase text-muted tracking-[0.15em] mb-1">
              {{ spec.label }}
            </dt>
            <dd class="font-medium">
              {{ spec.value }}
            </dd>
          </div>
        </dl>

        <div
          v-if="knife.story"
          class="border-t border-default/50 pt-6"
        >
          <h2 class="font-mono text-[0.7rem] uppercase tracking-[0.15em] text-muted mb-3">
            Histoire
          </h2>
          <!-- eslint-disable vue/no-v-html -->
          <div
            class="prose prose-sm dark:prose-invert max-w-none"
            v-html="knife.story"
          />
          <!-- eslint-enable vue/no-v-html -->
        </div>

        <div
          v-if="knifeLocation.length"
          class="border-t border-default/50 pt-6"
        >
          <h2 class="font-mono text-[0.7rem] uppercase tracking-[0.15em] text-muted mb-3">
            Origine
          </h2>
          <KnifeMap
            :knives="knifeLocation"
            :cluster="false"
            :interactive="false"
            height-class="h-64"
          />
        </div>
      </div>
    </div>

    <UModal
      v-if="knife.photos.length"
      v-model:open="lightboxOpen"
      fullscreen
      :close="{ color: 'neutral', variant: 'solid', class: 'bg-white text-black hover:bg-white/90 z-10' }"
      :ui="{ content: 'bg-black/70 divide-y-0', body: 'flex flex-col items-center justify-center gap-4 p-0 sm:p-0' }"
    >
      <template #body>
        <UCarousel
          :key="lightboxIndex"
          ref="lightboxCarousel"
          v-slot="{ item }"
          :items="knife.photos"
          :start-index="lightboxIndex"
          arrows
          loop
          :prev="{ color: 'neutral', variant: 'solid', class: 'bg-white text-black hover:bg-white/90' }"
          :next="{ color: 'neutral', variant: 'solid', class: 'bg-white text-black hover:bg-white/90' }"
          :ui="{ prev: 'sm:start-4', next: 'sm:end-4' }"
          class="w-full"
          @select="activeLightboxIndex = $event"
        >
          <NuxtImg
            :src="item"
            :alt="knife.name"
            class="w-full h-[70vh] object-contain"
            width="1600"
            height="1200"
          />
        </UCarousel>

        <div
          v-if="knife.photos.length > 1"
          class="flex gap-2 overflow-x-auto px-4 pb-4"
        >
          <button
            v-for="(photo, index) in knife.photos"
            :key="photo"
            type="button"
            class="shrink-0 w-16 aspect-4/3 border overflow-hidden transition-opacity"
            :class="index === activeLightboxIndex ? 'border-white opacity-100' : 'border-white/30 opacity-50 hover:opacity-80'"
            @click="goToLightboxSlide(index)"
          >
            <NuxtImg
              :src="photo"
              :alt="`${knife.name} — photo ${index + 1}`"
              class="w-full h-full object-cover"
              width="128"
              height="96"
            />
          </button>
        </div>
      </template>
    </UModal>
  </UPageSection>
</template>
