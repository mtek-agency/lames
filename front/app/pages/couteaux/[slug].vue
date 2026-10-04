<script setup lang="ts">
const route = useRoute()
const slug = route.params.slug as string

const { data, error } = await useFetch(`/api/knives/${slug}`)

if (error.value || !data.value) {
  throw createError({
    statusCode: error.value?.statusCode || 404,
    statusMessage: 'Pièce introuvable',
    fatal: true
  })
}

const knife = computed(() => data.value!.data)
const prev = computed(() => data.value!.prev)
const next = computed(() => data.value!.next)
const total = computed(() => data.value!.total)

// Une vue par ouverture de fiche, comptée côté navigateur (le rendu serveur et les robots n'en comptent pas).
onMounted(() => {
  $fetch(`/api/knives/${slug}/views`, { method: 'POST' }).catch(() => {})
})

useHead({
  bodyAttrs: { class: 'bg-paper text-ink' },
  meta: [{ name: 'theme-color', content: '#F2F2F2' }]
})

useSeoMeta({
  title: knife.value.name,
  description: [knife.value.name, knife.value.maker, knife.value.origin_city].join(' — '),
  ogTitle: knife.value.name,
  ogDescription: materialsLine(knife.value),
  ogImage: knife.value.cover ?? undefined
})

const number = computed(() => pad(knife.value.number))
const hasDetailBlock = computed(() => !!(knife.value.detail_heading || knife.value.detail_text))

// Sections numérotées dans l'ordre où elles existent : une pièce sans photo
// garde une numérotation continue.
const sections = computed(() => {
  const list: { id: string, label: string }[] = []
  if (knife.value.photos.length) list.push({ id: 'photos', label: 'Photos' })
  list.push({ id: 'fiche', label: 'Fiche technique' })
  return list.map((section, index) => ({ ...section, heading: `(${pad(index + 1)}) ${section.label}` }))
})

const sectionHeading = (id: string) => sections.value.find(section => section.id === id)?.heading

const series = computed(() =>
  knife.value.entry_year ? `Entrée en ${knife.value.entry_year} — N° ${number.value}` : `N° ${number.value}`
)

const heroSpecs = computed(() => [
  { label: 'Lame', value: bladeLabel(knife.value) },
  { label: 'Manche', value: knife.value.handle_material },
  { label: 'Mitre', value: knife.value.bolster },
  { label: 'Poids', value: formatGrams(knife.value.weight) },
  { label: 'Série', value: series.value }
])

const heroSpecsMobile = computed(() => [
  { label: 'Lame', value: bladeLabel(knife.value, '') },
  { label: 'Manche', value: knife.value.handle_material },
  { label: 'Mitre', value: knife.value.bolster },
  { label: 'Entrée', value: knife.value.entry_year ? `${knife.value.entry_year} — N° ${number.value}` : `N° ${number.value}` }
])

const technicalSpecs = computed(() => [
  { label: 'Type', value: typeLabel(knife.value) },
  { label: 'Lame', value: [`Acier ${knife.value.blade_steel}`, knife.value.blade_finish].filter(Boolean).join(', ') },
  { label: 'Longueur lame', value: formatCm(knife.value.blade_length) },
  { label: 'Longueur fermé', value: formatCm(knife.value.closed_length) },
  { label: 'Longueur totale', value: formatCm(knife.value.overall_length) },
  { label: 'Épaisseur', value: formatMm(knife.value.blade_thickness) },
  { label: 'Manche', value: knife.value.handle_material },
  { label: 'Mitres', value: knife.value.bolster },
  { label: 'Poids', value: formatGrams(knife.value.weight) },
  { label: 'Forgeron', value: knife.value.maker },
  { label: 'Année', value: knife.value.year ? String(knife.value.year) : undefined },
  { label: 'État', value: knife.value.condition }
])

// Même mise en page pour toutes les fiches : une grande photo, puis une
// seconde à gauche de la fiche technique. Au-delà de deux photos, les
// suivantes ne sont pas affichées.
const MAX_PHOTOS = 2
const photos = computed(() => knife.value.photos.slice(0, MAX_PHOTOS))
// Avec une seule photo, elle va directement à côté de la fiche.
const widePhoto = computed(() => photos.value.length > 1 ? photos.value[0] : undefined)
const sidePhoto = computed(() => photos.value.at(-1))
const plural = (count: number, word: string) => `${count} ${word}${count > 1 ? 's' : ''}`
const photosCount = computed(() => plural(photos.value.length, 'vue'))

const lightboxIndex = ref<number | null>(null)

const heroVisual = computed(() => knife.value.cutout ?? knife.value.cover)

function backToTop() {
  window.scrollTo({ top: 0 })
}
</script>

<template>
  <div class="min-h-dvh bg-paper text-ink">
    <!-- Haut de fiche : le couteau détouré au centre, ses specs à gauche -->
    <section class="relative lg:h-[max(780px,100dvh)] lg:overflow-hidden">
      <SiteHeader
        tone="paper"
        class="relative z-10 lg:absolute lg:inset-x-0 lg:top-5"
      />

      <div class="relative z-10 flex items-center justify-between px-5 py-1 lg:absolute lg:left-[72px] lg:top-[92px] lg:p-0">
        <NuxtLink
          to="/"
          class="group flex items-center gap-2 text-[13px]"
        >
          <Icon
            name="lucide:arrow-left"
            class="size-4 transition-transform group-hover:-translate-x-0.5"
          />
          <span class="lg:hidden">Collection</span>
          <span class="hidden lg:inline">Retour à la collection</span>
        </NuxtLink>
        <span class="text-[13px] tabular-nums text-muted lg:hidden">{{ number }} / {{ pad(total) }}</span>
      </div>

      <div
        class="relative h-[300px] lg:absolute lg:inset-x-[120px] lg:bottom-[120px] lg:top-[100px] lg:h-auto"
        :class="!knife.cutout && 'px-5 py-4 lg:px-[240px] lg:py-[60px]'"
      >
        <div
          v-if="knife.cutout"
          aria-hidden="true"
          class="absolute left-[21%] top-[77%] hidden h-11 w-[53%] rounded-full bg-ink/12 blur-[14px] lg:block"
        />
        <NuxtImg
          v-if="heroVisual"
          :src="heroVisual"
          :alt="knife.name"
          sizes="100vw lg:1200px"
          densities="x1 x2"
          fetchpriority="high"
          class="relative size-full"
          :class="knife.cutout ? 'object-contain' : 'rounded-2xl object-cover'"
        />
      </div>

      <div class="relative z-10 flex flex-col gap-3.5 px-5 pb-8 pt-2 lg:absolute lg:left-[72px] lg:top-[128px] lg:w-[320px] lg:gap-0 lg:p-0">
        <h1 class="font-display text-5xl/[48px] uppercase tracking-[-1.5px] lg:text-[52px]/[52px]">
          {{ knife.name }}
        </h1>
        <SpecList
          :rows="heroSpecs"
          class="hidden lg:flex lg:pt-3.5"
        />
        <SpecList
          :rows="heroSpecsMobile"
          class="lg:hidden"
        />
      </div>

      <div class="absolute right-[72px] top-[112px] hidden flex-col items-end lg:flex">
        <p class="font-display text-[120px]/[108px] tracking-[-4px]">
          {{ number }}
        </p>
        <p class="text-[13px] text-muted">
          sur {{ total }} pièce{{ total > 1 ? 's' : '' }}
        </p>
      </div>

      <nav
        v-if="prev && next"
        aria-label="Pièces voisines"
        class="absolute right-[72px] top-[420px] hidden flex-col items-end gap-2.5 text-xs lg:flex"
      >
        <NuxtLink
          :to="`/couteaux/${prev.slug}`"
          class="text-faint transition-colors hover:text-ink"
        >
          {{ pad(prev.number) }} {{ prev.name }}
        </NuxtLink>
        <span aria-current="page">{{ number }} {{ knife.name }}</span>
        <NuxtLink
          v-if="next.slug !== prev.slug"
          :to="`/couteaux/${next.slug}`"
          class="text-faint transition-colors hover:text-ink"
        >
          {{ pad(next.number) }} {{ next.name }}
        </NuxtLink>
      </nav>

      <figure
        v-if="knife.collector_note"
        class="relative z-10 flex flex-col items-center gap-2.5 px-5 pb-10 pt-2 lg:absolute lg:inset-x-0 lg:bottom-[84px] lg:p-0"
      >
        <figcaption class="label-caps">
          Note du collectionneur
        </figcaption>
        <blockquote class="max-w-[640px] text-balance text-center font-display text-2xl/[23px] uppercase lg:text-[28px]/[27px]">
          « {{ knife.collector_note }} »
        </blockquote>
      </figure>

      <div class="absolute inset-x-[72px] bottom-[34px] hidden items-center justify-between text-[13px] lg:flex">
        <a
          v-if="photos.length"
          href="#photos"
          class="text-muted transition-colors hover:text-ink"
        >
          Faire défiler — {{ plural(photos.length, 'photo') }} ↓
        </a>
        <span v-else />
        <nav
          aria-label="Sections de la fiche"
          class="flex gap-3.5"
        >
          <a
            v-for="(section, index) in sections"
            :key="section.id"
            :href="`#${section.id}`"
            class="transition-colors hover:text-ink"
            :class="index === 0 ? 'text-ink' : 'text-muted'"
          >
            {{ section.id === 'fiche' ? 'Fiche' : section.label }}
          </a>
        </nav>
      </div>
    </section>

    <!-- (01) Photos -->
    <section
      v-if="photos.length"
      id="photos"
      class="flex scroll-mt-6 flex-col gap-4 px-5 pb-12 lg:gap-6 lg:px-[72px] lg:pb-6 lg:pt-10"
    >
      <div class="flex items-start justify-between gap-4 border-b border-ink pb-3">
        <h2 class="label-caps text-[11px]">
          {{ sectionHeading('photos') }}
        </h2>
        <p class="text-xs text-muted lg:text-[13px]">
          {{ photosCount }}<span
            v-if="knife.photos_note"
            class="hidden lg:inline"
          > — {{ knife.photos_note }}</span>
        </p>
      </div>

      <!-- Desktop : la grande photo ; la seconde est à côté de la fiche. -->
      <div
        v-if="widePhoto"
        class="hidden lg:block"
      >
        <GalleryPhoto
          :photo="widePhoto"
          :index="0"
          :total="photos.length"
          :alt="knife.name"
          frame-class="aspect-[1296/760]"
          sizes="lg:1296px"
          @open="lightboxIndex = $event"
        />
      </div>

      <!-- Mobile : les photos l'une sous l'autre, puis l'encart. -->
      <div class="flex flex-col gap-4 lg:hidden">
        <GalleryPhoto
          v-for="(photo, index) in photos"
          :key="photo.url"
          :photo="photo"
          :index="index"
          :total="photos.length"
          :alt="knife.name"
          frame-class="aspect-[350/420]"
          sizes="100vw"
          @open="lightboxIndex = $event"
        />

        <DetailBlock
          v-if="hasDetailBlock"
          :heading="knife.detail_heading"
          :text="knife.detail_text"
          class="py-2"
        />
      </div>
    </section>

    <!-- (02) Fiche technique. Desktop : à droite de la seconde photo, sous
         l'encart éditorial. -->
    <div
      class="flex flex-col lg:flex-row lg:items-start lg:gap-[72px] lg:px-[72px] lg:pb-[120px]"
      :class="!photos.length && 'lg:pt-10'"
    >
      <div
        v-if="sidePhoto"
        class="hidden flex-1 lg:block"
      >
        <GalleryPhoto
          :photo="sidePhoto"
          :index="photos.length - 1"
          :total="photos.length"
          :alt="knife.name"
          frame-class="aspect-[5/4]"
          sizes="lg:704px"
          @open="lightboxIndex = $event"
        />
      </div>

      <div
        class="flex flex-col lg:w-[520px] lg:shrink-0 lg:gap-10"
        :class="!sidePhoto && 'lg:ml-auto'"
      >
        <div
          v-if="hasDetailBlock"
          class="hidden lg:block"
        >
          <DetailBlock
            :heading="knife.detail_heading"
            :text="knife.detail_text"
          />
        </div>

        <section
          id="fiche"
          class="flex scroll-mt-6 flex-col gap-2.5 border-t border-ink px-5 pb-12 pt-4 lg:gap-3 lg:p-0 lg:pt-4"
        >
          <h2 class="label-caps lg:text-[11px]">
            {{ sectionHeading('fiche') }}
          </h2>
          <SpecList
            :rows="technicalSpecs"
            tone="stone"
            class="lg:pt-3"
          />
        </section>
      </div>
    </div>

    <!-- Pièce suivante -->
    <div class="flex flex-col lg:px-[72px] lg:pb-8">
      <div
        v-if="next"
        class="flex items-center gap-4 border-y border-ink px-5 py-6 lg:gap-10 lg:px-0 lg:py-10"
      >
        <NuxtLink
          v-if="prev"
          :to="`/couteaux/${prev.slug}`"
          class="group hidden w-[280px] shrink-0 flex-col gap-2 text-muted transition-colors hover:text-ink lg:flex"
        >
          <span class="label-caps">← Pièce précédente</span>
          <span class="truncate font-display text-[28px]">{{ prev.name }}</span>
        </NuxtLink>

        <NuxtLink
          :to="`/couteaux/${next.slug}`"
          class="group flex min-w-0 flex-1 items-center gap-4 lg:justify-end lg:gap-8"
        >
          <span class="flex min-w-0 flex-1 flex-col gap-1.5 lg:flex-none lg:items-end lg:gap-2">
            <span class="label-caps">
              Pièce suivante<span class="hidden lg:inline"> — N° {{ pad(next.number) }}</span> →
            </span>
            <span class="max-w-full truncate font-display text-[44px]/[40px] uppercase tracking-[-1.5px] lg:text-[clamp(64px,8.3vw,120px)] lg:leading-[0.85] lg:tracking-[-4px]">
              {{ next.name }}
            </span>
          </span>
          <KnifeThumb
            :cover="next.cover"
            :cutout="next.cutout"
            :size="180"
            class="size-[88px] rounded-lg transition-transform duration-500 group-hover:scale-[1.03] lg:size-[180px] lg:rounded-[10px]"
          />
        </NuxtLink>
      </div>

      <footer class="flex justify-between px-5 pb-10 pt-5 text-xs text-muted lg:px-0 lg:pb-0 lg:pt-6">
        <span class="lg:hidden">Mattéo Bonneval</span>
        <span class="hidden lg:inline">Collection couteaux — Mattéo Bonneval</span>
        <button
          type="button"
          class="transition-colors hover:text-ink"
          @click="backToTop"
        >
          <span class="lg:hidden">Haut ↑</span>
          <span class="hidden lg:inline">Retour en haut ↑</span>
        </button>
      </footer>
    </div>

    <PhotoLightbox
      v-if="photos.length"
      v-model="lightboxIndex"
      :photos="photos"
      :alt="knife.name"
    />
  </div>
</template>
