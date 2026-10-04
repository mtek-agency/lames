<script setup lang="ts">
import { onKeyStroke } from '@vueuse/core'
import { KNIFE_CATEGORY_LABELS } from '#shared/types/knife'
import type { KnifeSummary } from '#shared/types/knife'

const props = defineProps<{
  knives: KnifeSummary[]
  latest: string | null
}>()

type Filter = 'all' | 'limited' | string
type Sort = 'number' | 'year-desc' | 'year-asc'

// Filtre et tri survivent à un aller-retour vers une fiche.
const filter = useState<Filter>('liste-filter', () => 'all')
const sort = useState<Sort>('liste-sort', () => 'number')
const activeSlug = useState<string | null>('liste-active', () => props.latest)

const filters = computed(() => {
  const categories = Object.keys(KNIFE_CATEGORY_LABELS)
    .filter(category => props.knives.some(knife => knife.category === category))
    .map(category => ({ value: category, label: KNIFE_CATEGORY_LABELS[category]! }))

  return [
    { value: 'all', label: 'Tous' },
    ...categories,
    ...(props.knives.some(knife => knife.limited_edition) ? [{ value: 'limited', label: 'Édition limitée' }] : [])
  ]
})

const SORTS: { value: Sort, label: string }[] = [
  { value: 'number', label: 'N°' },
  { value: 'year-desc', label: 'Année ↓' },
  { value: 'year-asc', label: 'Année ↑' }
]

const sortLabel = computed(() => SORTS.find(option => option.value === sort.value)!.label)

function cycleSort() {
  const index = SORTS.findIndex(option => option.value === sort.value)
  sort.value = SORTS[(index + 1) % SORTS.length]!.value
}

const visibleKnives = computed(() => {
  const filtered = props.knives.filter((knife) => {
    if (filter.value === 'all') return true
    if (filter.value === 'limited') return knife.limited_edition
    return knife.category === filter.value
  })

  if (sort.value === 'number') return filtered

  // Pièces sans année en fin de liste, quel que soit le sens.
  const direction = sort.value === 'year-desc' ? -1 : 1
  return [...filtered].sort((a, b) => {
    if (!a.year || !b.year) return (a.year ? -1 : 0) + (b.year ? 1 : 0)
    return (a.year - b.year) * direction
  })
})

const active = computed(() =>
  visibleKnives.value.find(knife => knife.slug === activeSlug.value) ?? visibleKnives.value[0]
)

// --- Navigation clavier (desktop) : ↑ ↓ parcourir, ↵ ouvrir ---------------
const rowsContainer = useTemplateRef<HTMLElement>('rows')

function move(delta: number) {
  const list = visibleKnives.value
  if (!list.length) return

  const index = active.value ? list.indexOf(active.value) : -1
  const next = list[Math.min(Math.max(index + delta, 0), list.length - 1)]!
  activeSlug.value = next.slug

  nextTick(() => {
    rowsContainer.value
      ?.querySelector(`[data-slug="${next.slug}"]`)
      ?.scrollIntoView({ block: 'nearest' })
  })
}

onKeyStroke(['ArrowUp', 'ArrowDown', 'Enter'], (event) => {
  const target = event.target as HTMLElement | null
  if (target?.closest('a, button, input, textarea, select')) return
  // Sur mobile la liste est en flux : les flèches doivent continuer à faire
  // défiler la page.
  if (!window.matchMedia('(min-width: 1024px)').matches) return

  event.preventDefault()
  if (event.key === 'ArrowUp') move(-1)
  if (event.key === 'ArrowDown') move(1)
  if (event.key === 'Enter' && active.value) navigateTo(`/couteaux/${active.value.slug}`)
})

function previewSpecs(knife: KnifeSummary) {
  return [
    { label: 'Lame', value: bladeLabel(knife) },
    { label: 'Manche', value: knife.handle_material },
    { label: 'Mitre', value: knife.bolster },
    { label: 'Poids', value: formatGrams(knife.weight) },
    { label: 'Origine', value: knife.origin_city }
  ]
}
</script>

<template>
  <div class="relative flex flex-1 flex-col lg:min-h-0">
    <!-- Desktop : liste + aperçu de la pièce active -->
    <div class="absolute inset-x-[72px] bottom-[100px] top-[124px] hidden gap-12 lg:flex xl:gap-[72px]">
      <div class="flex min-w-0 flex-1 flex-col">
        <div class="flex flex-wrap items-end justify-between gap-x-6 gap-y-4 pb-5">
          <h1 class="flex items-start gap-2.5 whitespace-nowrap font-display text-[clamp(44px,3.9vw,56px)]/none tracking-[-1.5px] text-paper">
            La collection
            <span class="font-sans text-[13px] font-semibold tracking-normal text-paper/50">{{ knives.length }}</span>
          </h1>

          <ListFilters
            v-model="filter"
            :filters="filters"
          />
        </div>

        <!-- Colonnes réduites à l'essentiel pour des lignes lisibles de loin ;
             manche, mitre, poids et origine sont dans l'aperçu à droite. -->
        <div class="flex gap-4 border-b border-white/15 px-4 py-3 xl:gap-6 text-[11px] font-semibold uppercase tracking-[0.8px] text-white/40">
          <span class="w-[72px] shrink-0" />
          <span class="flex-1">Modèle</span>
          <span class="w-[120px] shrink-0 xl:w-[140px]">Acier</span>
          <span class="w-20 shrink-0 text-right">Année</span>
          <span class="w-5 shrink-0" />
        </div>

        <div class="relative min-h-0 flex-1">
          <ul
            ref="rows"
            class="scrollbar-none h-full overflow-y-auto pb-28"
          >
            <li
              v-for="knife in visibleKnives"
              :key="knife.id"
              :data-slug="knife.slug"
            >
              <NuxtLink
                :to="`/couteaux/${knife.slug}`"
                class="flex items-center gap-4 rounded-xl px-4 py-3 transition-colors duration-200 xl:gap-6"
                :class="active?.id === knife.id ? 'bg-white/7' : 'rounded-none border-b border-white/8'"
                @mouseenter="activeSlug = knife.slug"
                @focus="activeSlug = knife.slug"
              >
                <KnifeThumb
                  :cover="knife.cover"
                  :cutout="knife.cutout"
                  :size="72"
                  class="size-[72px] rounded-lg"
                />
                <span
                  class="flex-1 truncate font-display text-[clamp(34px,3.1vw,44px)]/[1.1] tracking-[-0.5px] text-paper"
                  :class="active?.id === knife.id && 'italic'"
                >
                  {{ knife.name }}
                </span>
                <span
                  class="w-[120px] shrink-0 truncate text-base transition-colors xl:w-[140px]"
                  :class="active?.id === knife.id ? 'text-paper' : 'text-paper/60'"
                >
                  {{ knife.blade_steel }}
                </span>
                <span
                  class="w-20 shrink-0 text-right text-base tabular-nums transition-colors"
                  :class="active?.id === knife.id ? 'text-paper' : 'text-paper/60'"
                >
                  {{ knife.year ?? '—' }}
                </span>
                <Icon
                  name="lucide:arrow-right"
                  class="size-5 shrink-0 text-paper transition-opacity"
                  :class="active?.id === knife.id ? 'opacity-100' : 'opacity-0'"
                />
              </NuxtLink>
            </li>
          </ul>
          <div class="pointer-events-none absolute inset-x-0 bottom-0 h-[120px] bg-linear-to-b from-night/0 to-night" />
        </div>
      </div>

      <aside
        v-if="active"
        class="w-[clamp(320px,31vw,440px)] shrink-0"
        aria-live="polite"
      >
        <Transition
          mode="out-in"
          enter-active-class="transition duration-300 ease-out"
          enter-from-class="opacity-0"
          leave-active-class="transition duration-150 ease-in"
          leave-to-class="opacity-0"
        >
          <div
            :key="active.id"
            class="flex flex-col gap-5"
          >
            <div class="relative h-[clamp(220px,calc(100dvh-560px),360px)] overflow-hidden rounded-[14px] bg-smoke">
              <NuxtImg
                v-if="active.cover"
                :src="active.cover"
                :alt="active.name"
                sizes="440px"
                densities="x1 x2"
                class="size-full object-cover"
              />
              <span class="absolute left-3.5 top-3.5 rounded-full bg-paper px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.8px] text-ink">
                N° {{ pad(active.number) }}<template v-if="active.slug === latest"> — Dernière entrée</template>
              </span>
            </div>

            <div class="flex items-end justify-between gap-4">
              <p class="truncate font-display text-[44px]/[44px] uppercase tracking-[-1px] text-paper">
                {{ active.name }}
              </p>
              <p
                v-if="active.year"
                class="shrink-0 text-base text-paper"
              >
                {{ active.year }}
              </p>
            </div>

            <SpecList
              :rows="previewSpecs(active)"
              tone="night"
            />

            <NuxtLink
              :to="`/couteaux/${active.slug}`"
              class="group flex items-center justify-between rounded-full bg-paper px-[18px] py-[13px] text-[13px] font-medium text-ink"
            >
              Découvrir la pièce
              <Icon
                name="lucide:arrow-up-right"
                class="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              />
            </NuxtLink>
          </div>
        </Transition>
      </aside>
    </div>

    <div class="absolute bottom-[38px] left-[72px] hidden items-center gap-5 text-[11px] font-semibold uppercase tracking-[0.8px] text-white/40 lg:flex">
      <span>↑ ↓ &nbsp;Parcourir</span>
      <span>↵ &nbsp;Ouvrir</span>
    </div>

    <button
      type="button"
      class="absolute bottom-[38px] right-[72px] hidden text-[11px] font-semibold uppercase tracking-[0.8px] text-white/70 transition-colors hover:text-white lg:block"
      @click="cycleSort"
    >
      Trier : {{ sortLabel }}
    </button>

    <!-- Mobile : liste en flux, la page défile -->
    <div class="flex flex-col pb-36 lg:hidden">
      <h1 class="flex items-start gap-2 px-5 pb-4 pt-3 font-display text-4xl/9 tracking-[-1px] text-paper">
        La collection
        <span class="font-sans text-[11px] font-semibold tracking-normal text-paper/50">{{ knives.length }}</span>
      </h1>

      <ListFilters
        v-model="filter"
        :filters="filters"
        class="scrollbar-none overflow-x-auto px-5 pb-3"
      />

      <ul class="mx-5 border-t border-white/15">
        <li
          v-for="knife in visibleKnives"
          :key="knife.id"
        >
          <NuxtLink
            :to="`/couteaux/${knife.slug}`"
            class="flex items-center gap-3.5 border-b border-white/8 py-3"
          >
            <KnifeThumb
              :cover="knife.cover"
              :cutout="knife.cutout"
              :size="64"
              class="size-16 rounded-lg"
            />
            <span class="flex min-w-0 flex-1 flex-col gap-[5px]">
              <span class="flex items-center gap-2">
                <span class="truncate font-display text-2xl/6 text-paper">{{ knife.name }}</span>
                <KnifeBadge
                  v-if="knife.limited_edition"
                  variant="limited"
                />
                <KnifeBadge
                  v-else-if="knife.is_new"
                  variant="new"
                />
              </span>
              <span class="truncate text-xs text-paper/50">
                {{ [knife.blade_steel, knife.handle_material].join(' · ') }}
              </span>
            </span>
            <span
              v-if="knife.year"
              class="shrink-0 text-[13px] font-medium tabular-nums text-paper"
            >
              {{ knife.year }}
            </span>
          </NuxtLink>
        </li>
      </ul>

      <button
        type="button"
        class="mt-6 self-center text-[11px] font-semibold uppercase tracking-[0.8px] text-white/60"
        @click="cycleSort"
      >
        Trier : {{ sortLabel }}
      </button>
    </div>

    <div class="pointer-events-none fixed inset-x-0 bottom-0 z-10 h-[180px] bg-linear-to-b from-night/0 via-night/95 via-55% to-night lg:hidden" />
  </div>
</template>
