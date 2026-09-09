<script setup lang="ts">
import { KNIFE_TYPE_LABELS, KNIFE_MECHANISM_LABELS } from '#shared/types/knife'

useSeoMeta({
  title: 'Catalogue',
  description: 'Grille des couteaux de la collection, filtrable par type, mécanisme, acier et matière du manche.'
})

const { data, status, error } = await useFetch('/api/knives')

const knives = computed(() => data.value?.data ?? [])
const featured = computed(() => knives.value.find(knife => knife.photos[0]))

const search = ref('')
const selectedType = ref<string | undefined>(undefined)
const selectedMechanism = ref<string | undefined>(undefined)
const selectedSteel = ref<string | undefined>(undefined)
const selectedHandle = ref<string | undefined>(undefined)

function facetOptions(values: (string | undefined)[], labels?: Record<string, string>) {
  const unique = [...new Set(values.filter((v): v is string => !!v))].sort()
  return unique.map(value => ({ label: labels?.[value] ?? value, value }))
}

const typeOptions = computed(() => facetOptions(knives.value.map(k => k.type), KNIFE_TYPE_LABELS))
const mechanismOptions = computed(() => facetOptions(knives.value.map(k => k.mechanism), KNIFE_MECHANISM_LABELS))
const steelOptions = computed(() => facetOptions(knives.value.map(k => k.blade_steel)))
const handleOptions = computed(() => facetOptions(knives.value.map(k => k.handle_material)))

const filtersOpen = ref(false)

const activeFacetCount = computed(() =>
  [selectedType.value, selectedMechanism.value, selectedSteel.value, selectedHandle.value].filter(Boolean).length
)

const filteredKnives = computed(() => {
  const query = search.value.trim().toLowerCase()

  return knives.value.filter((knife) => {
    if (selectedType.value && knife.type !== selectedType.value) return false
    if (selectedMechanism.value && knife.mechanism !== selectedMechanism.value) return false
    if (selectedSteel.value && knife.blade_steel !== selectedSteel.value) return false
    if (selectedHandle.value && knife.handle_material !== selectedHandle.value) return false

    if (query) {
      const haystack = `${knife.name} ${knife.maker} ${knife.origin_city}`.toLowerCase()
      if (!haystack.includes(query)) return false
    }

    return true
  })
})

function resetFilters() {
  search.value = ''
  selectedType.value = undefined
  selectedMechanism.value = undefined
  selectedSteel.value = undefined
  selectedHandle.value = undefined
}
</script>

<template>
  <div>
    <div class="relative overflow-hidden border-b border-default/50">
      <p
        class="pointer-events-none select-none absolute -top-6 -right-6 sm:-right-16 font-serif italic text-primary/10 text-[9rem] sm:text-[16rem] leading-none"
        aria-hidden="true"
      >
        N°{{ knives.length }}
      </p>

      <div class="relative grid grid-cols-1 lg:grid-cols-12 gap-12 items-center max-w-[80rem] mx-auto px-4 py-16 sm:py-24">
        <div class="lg:col-span-6 relative z-10">
          <p class="font-mono text-xs uppercase tracking-[0.3em] text-primary mb-4">
            Collection privée — {{ knives.length }} pièce{{ knives.length > 1 ? 's' : '' }}
          </p>
          <h1 class="font-serif text-5xl sm:text-7xl leading-[0.95] mb-6 text-highlighted">
            Couteaux, <em class="not-italic text-primary">forge</em><br>
            et histoires de trouvailles
          </h1>
          <p class="text-lg text-muted max-w-md">
            Fiches techniques, origines et histoires de chaque pièce de la collection.
          </p>
          <KnifeSilhouette
            class="pointer-events-none select-none w-56 text-primary/50 mt-6"
            aria-hidden="true"
          />
        </div>

        <div
          v-if="featured"
          class="lg:col-span-6 relative z-10"
        >
          <div class="relative max-w-md mx-auto lg:ml-auto lg:mr-0 rotate-2 border-8 border-white shadow-2xl shadow-neutral-900/20">
            <NuxtImg
              :src="featured.photos[0]"
              :alt="featured.name"
              class="w-full aspect-4/5 object-cover"
              width="600"
              height="750"
            />
            <span class="absolute -bottom-4 -left-4 bg-primary text-inverted font-mono text-xs px-3 py-1.5 tracking-widest -rotate-2">
              N° 01 — {{ featured.name }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <UPageSection>
      <div class="flex flex-col gap-8">
        <div class="flex flex-col gap-4 border-y border-default/50 py-6">
          <div class="flex flex-col sm:flex-row sm:items-center gap-4">
            <UInput
              v-model="search"
              icon="i-lucide-search"
              placeholder="Rechercher (nom, coutelier, ville)"
              variant="none"
              size="lg"
              class="flex-1 border-b border-default/70 focus-within:border-primary transition-colors"
            />

            <button
              type="button"
              class="group inline-flex items-center gap-2.5 cursor-pointer shrink-0"
              @click="filtersOpen = !filtersOpen"
            >
              <span class="inline-flex items-center gap-2 border border-default/70 group-hover:border-primary px-3 py-1.5 font-mono text-xs uppercase tracking-[0.2em] text-muted group-hover:text-primary transition-colors">
                <UIcon
                  name="i-lucide-archive"
                  class="size-3.5"
                />
                Filtres
                <UIcon
                  name="i-lucide-chevron-down"
                  class="size-3.5 transition-transform"
                  :class="filtersOpen && 'rotate-180'"
                />
              </span>
              <span
                v-if="activeFacetCount"
                class="bg-primary text-inverted rounded-full size-5 shrink-0 flex items-center justify-center text-[0.65rem] font-mono"
              >
                {{ activeFacetCount }}
              </span>
            </button>
          </div>

          <UCollapsible :open="filtersOpen">
            <template #content>
              <div class="flex flex-col gap-3 pt-5">
                <FacetPills
                  v-model="selectedType"
                  label="Type"
                  :options="typeOptions"
                />
                <FacetPills
                  v-model="selectedMechanism"
                  label="Mécanisme"
                  :options="mechanismOptions"
                />
                <FacetPills
                  v-model="selectedSteel"
                  label="Acier"
                  :options="steelOptions"
                />
                <FacetPills
                  v-model="selectedHandle"
                  label="Manche"
                  :options="handleOptions"
                />

                <UButton
                  v-if="activeFacetCount"
                  label="Réinitialiser les filtres"
                  variant="link"
                  color="neutral"
                  size="xs"
                  class="self-start p-0"
                  @click="resetFilters"
                />
              </div>
            </template>
          </UCollapsible>
        </div>

        <p
          v-if="status === 'pending'"
          class="text-muted"
        >
          Chargement du catalogue…
        </p>

        <UAlert
          v-else-if="error"
          color="error"
          title="Impossible de charger le catalogue"
          :description="error.message"
        />

        <p
          v-else-if="filteredKnives.length === 0"
          class="text-muted"
        >
          Aucune pièce ne correspond à ces critères.
        </p>

        <div
          v-else
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10"
        >
          <NuxtLink
            v-for="(knife, index) in filteredKnives"
            :id="`knife-${knife.id}`"
            :key="knife.id"
            :to="`/couteaux/${knife.slug}`"
            class="group block pt-3 scroll-mt-24"
          >
            <div
              class="relative transition-transform duration-300 group-hover:rotate-0 group-hover:scale-[1.03]"
              :class="index % 2 === 0 ? 'rotate-[-1.25deg]' : 'rotate-[1.25deg]'"
            >
              <div
                class="aspect-4/3 bg-elevated overflow-hidden border-[6px] border-white shadow-md transition-shadow duration-300 group-hover:shadow-xl"
                :style="{ viewTransitionName: `knife-photo-${knife.id}` }"
              >
                <NuxtImg
                  v-if="knife.photos[0]"
                  :src="knife.photos[0]"
                  :alt="knife.name"
                  class="w-full h-full object-cover"
                  width="400"
                  height="300"
                  loading="lazy"
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
              <span
                class="absolute -top-2 -right-2 z-10 bg-primary text-inverted font-mono text-[0.65rem] px-2 py-1 tracking-widest shadow-sm"
                :class="index % 2 === 0 ? 'rotate-3' : '-rotate-3'"
              >
                N° {{ String(index + 1).padStart(2, '0') }}
              </span>
            </div>

            <div class="flex flex-col gap-1.5 pt-4">
              <h3 class="font-serif text-xl italic truncate">
                {{ knife.name }}
              </h3>
              <p class="font-mono text-xs uppercase tracking-wide text-muted truncate">
                {{ knife.maker }} · {{ knife.origin_city }}
              </p>
              <div class="flex flex-wrap gap-1.5 pt-1">
                <UBadge
                  :label="KNIFE_TYPE_LABELS[knife.type] ?? knife.type"
                  variant="subtle"
                  size="sm"
                />
                <UBadge
                  v-if="knife.mechanism"
                  :label="KNIFE_MECHANISM_LABELS[knife.mechanism] ?? knife.mechanism"
                  variant="subtle"
                  color="neutral"
                  size="sm"
                />
                <UBadge
                  :label="knife.blade_steel"
                  variant="subtle"
                  color="neutral"
                  size="sm"
                />
              </div>
            </div>
          </NuxtLink>
        </div>
      </div>
    </UPageSection>
  </div>
</template>
