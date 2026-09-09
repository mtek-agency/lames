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
      class="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-muted hover:text-primary transition-colors mb-8"
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
        <UCarousel
          v-if="knife.photos.length"
          v-slot="{ item }"
          :items="knife.photos"
          arrows
          dots
          class="border border-default/50 overflow-hidden"
        >
          <NuxtImg
            :src="item"
            :alt="knife.name"
            class="w-full aspect-4/3 object-cover"
            width="800"
            height="600"
          />
        </UCarousel>
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
          <p class="font-mono text-xs uppercase tracking-[0.2em] text-primary mb-2">
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
  </UPageSection>
</template>
