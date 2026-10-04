<script setup lang="ts">
import { onKeyStroke } from '@vueuse/core'
import emblaCarouselVue from 'embla-carousel-vue'
import { WheelGesturesPlugin } from 'embla-carousel-wheel-gestures'
import type { KnifeSummary } from '#shared/types/knife'

const props = defineProps<{
  knives: KnifeSummary[]
}>()

// Index de la carte centrale, conservé par la page (retour depuis une fiche).
const selected = defineModel<number>('index', { required: true })

const [emblaRef, emblaApi] = emblaCarouselVue(
  {
    align: 'center',
    // Sans ça, la première et la dernière carte ne peuvent pas venir au centre.
    containScroll: false,
    startIndex: selected.value,
    duration: 32
  },
  // Défilement horizontal au trackpad / à la molette (shift) sur desktop.
  [WheelGesturesPlugin()]
)

const current = computed(() => props.knives[selected.value] ?? props.knives[0])

// Profondeur du rouleau : plus une carte s'éloigne du centre, plus elle
// rétrécit, s'incline et s'efface (valeurs relevées sur la maquette :
// ±2° / 80 % à une carte du centre, ±4° / 55 % à deux cartes).
function applyDepth() {
  const api = emblaApi.value
  if (!api) return

  const snaps = api.scrollSnapList()
  const progress = api.scrollProgress()
  const step = snaps.length > 1 ? snaps[1]! - snaps[0]! : 1

  api.slideNodes().forEach((slide, index) => {
    const card = slide.firstElementChild as HTMLElement | null
    if (!card) return

    const offset = (snaps[index]! - progress) / step
    const distance = Math.min(Math.abs(offset), 3)
    const scale = 1 - 0.08 * Math.min(distance, 2)
    const opacity = distance <= 1 ? 1 - 0.2 * distance : Math.max(0.8 - 0.25 * (distance - 1), 0.25)
    const rotate = -Math.sign(offset) * 2 * Math.min(distance, 2)

    card.style.transform = `scale(${scale}) rotate(${rotate}deg)`
    card.style.opacity = String(opacity)
  })
}

watch(emblaApi, (api) => {
  if (!api) return

  applyDepth()
  api
    .on('scroll', applyDepth)
    .on('reInit', applyDepth)
    .on('select', () => {
      selected.value = api.selectedScrollSnap()
    })
})

function onCardClick(event: MouseEvent, index: number) {
  // Une carte latérale se ramène d'abord au centre ; seule la carte centrale
  // ouvre la fiche.
  if (index === selected.value) return
  event.preventDefault()
  emblaApi.value?.scrollTo(index)
}

onKeyStroke(['ArrowLeft', 'ArrowRight', 'Enter'], (event) => {
  const target = event.target as HTMLElement | null
  if (target?.closest('a, button, input, textarea, select')) return

  if (event.key === 'ArrowLeft') emblaApi.value?.scrollPrev()
  if (event.key === 'ArrowRight') emblaApi.value?.scrollNext()
  if (event.key === 'Enter' && current.value) navigateTo(`/couteaux/${current.value.slug}`)
})

const yearsRange = computed(() => {
  const years = props.knives.map(knife => knife.year).filter((year): year is number => !!year)
  return years.length ? `${Math.min(...years)} / ${Math.max(...years)}` : null
})

const progressWidth = computed(() => `${((selected.value + 1) / Math.max(props.knives.length, 1)) * 100}%`)
</script>

<template>
  <div class="rouleau relative flex flex-1 flex-col">
    <p class="eyebrow px-5 pt-3 text-[10px] text-white/50 lg:hidden">
      {{ knives.length }} pièce{{ knives.length > 1 ? 's' : '' }}<template v-if="yearsRange">
        — {{ yearsRange }}
      </template>
    </p>

    <div class="flex flex-1 flex-col justify-center pb-40 pt-8 lg:pb-6 lg:pt-10">
      <div
        ref="emblaRef"
        class="overflow-hidden"
        aria-roledescription="carrousel"
        aria-label="Collection"
      >
        <div class="flex touch-pan-y items-center">
          <div
            v-for="(knife, index) in knives"
            :key="knife.id"
            class="slide flex-none"
            role="group"
            aria-roledescription="diapositive"
            :aria-label="`${pad(knife.number)} — ${knife.name}`"
          >
            <NuxtLink
              :to="`/couteaux/${knife.slug}`"
              class="card block overflow-hidden rounded-2xl bg-smoke will-change-transform select-none"
              :tabindex="index === selected ? 0 : -1"
              draggable="false"
              @click="onCardClick($event, index)"
            >
              <NuxtImg
                v-if="knife.cover"
                :src="knife.cover"
                :alt="knife.name"
                sizes="290px lg:420px"
                densities="x1 x2"
                :loading="Math.abs(index - selected) <= 2 ? 'eager' : 'lazy'"
                :fetchpriority="index === selected ? 'high' : 'auto'"
                draggable="false"
                class="pointer-events-none size-full object-cover"
              />
            </NuxtLink>
          </div>
        </div>
      </div>

      <div
        v-if="current"
        class="caption mx-auto mt-4"
        aria-live="polite"
      >
        <Transition
          mode="out-in"
          enter-active-class="transition duration-300 ease-out"
          enter-from-class="opacity-0 translate-y-1"
          leave-active-class="transition duration-150 ease-in"
          leave-to-class="opacity-0"
        >
          <div
            :key="current.id"
            class="flex items-end justify-between gap-4"
          >
            <div class="flex min-w-0 flex-col gap-1">
              <p class="truncate text-xl font-medium tracking-[-0.5px] text-white lg:text-2xl">
                {{ current.name }}
              </p>
              <p class="truncate text-xs text-white/50 lg:hidden">
                {{ materialsShort(current) }}
              </p>
              <p class="hidden truncate text-[13px] text-white/50 lg:block">
                {{ materialsLine(current) }}
              </p>
            </div>
            <p
              v-if="current.year"
              class="shrink-0 text-[13px] text-white lg:text-sm"
            >
              {{ current.year }}
            </p>
          </div>
        </Transition>

        <RouleauProgress
          class="mt-10 lg:hidden"
          :index="selected"
          :total="knives.length"
          :width="progressWidth"
        />

        <p class="eyebrow mt-6 text-center text-[10px] text-white/40 lg:hidden">
          ← Glisser →
        </p>
      </div>
    </div>

    <p class="eyebrow absolute bottom-[38px] left-[72px] hidden text-white/40 lg:block">
      Glisser pour explorer
    </p>

    <RouleauProgress
      class="absolute bottom-[40px] right-[72px] hidden w-[188px] lg:flex"
      :index="selected"
      :total="knives.length"
      :width="progressWidth"
    />
  </div>
</template>

<style scoped>
/* Taille des cartes : celle de la maquette (290×380 mobile, 420×460
   desktop), réduite sur les écrans peu hauts pour que la légende et la barre
   du bas restent visibles. La largeur suit la hauteur pour garder le ratio. */
.rouleau {
  --card-h: clamp(220px, calc(100dvh - 400px), 380px);
  --card-w: calc(var(--card-h) * 290 / 380);
  --card-gap: 0px;
}

@media (min-width: 1024px) {
  .rouleau {
    --card-h: clamp(300px, calc(100dvh - 330px), 460px);
    --card-w: calc(var(--card-h) * 420 / 460);
    --card-gap: 10px;
  }
}

.slide {
  width: calc(var(--card-w) + var(--card-gap));
  padding-inline: calc(var(--card-gap) / 2);
}

.card {
  height: var(--card-h);
  transform-origin: center;
}

.caption {
  width: var(--card-w);
}
</style>
