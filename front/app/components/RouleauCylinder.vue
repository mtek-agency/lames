<script setup lang="ts">
import { onKeyStroke } from '@vueuse/core'
import type { KnifeSummary } from '#shared/types/knife'
import { CylinderGallery, type CylinderLayout } from '~/lib/cylinder-gallery'

// Rouleau desktop en WebGL (cf. lib/cylinder-gallery.ts). La légende, la
// progression et les liens restent en HTML, par-dessus le canvas.
// Monté uniquement côté client, après hydratation (cf. KnifeRouleau).
const props = defineProps<{
  knives: KnifeSummary[]
}>()

const selected = defineModel<number>('index', { required: true })

const emit = defineEmits<{
  // WebGL indisponible : le parent bascule sur le carrousel HTML.
  unsupported: []
}>()

const stage = useTemplateRef<HTMLElement>('stage')
const layout = ref<CylinderLayout>({ cardWidth: 420, cardHeight: 460, lift: 20 })
const image = useImage()

let gallery: CylinderGallery | null = null

function open(index: number) {
  const knife = props.knives[index]
  if (knife) navigateTo(`/couteaux/${knife.slug}`)
}

onMounted(() => {
  try {
    gallery = new CylinderGallery({
      container: stage.value!,
      // Servies par IPX (même origine en prod) : une texture WebGL exige des
      // images chargeables en CORS.
      images: props.knives.map(knife => knife.cover ? image(knife.cover, { width: 1600, format: 'webp' }) : null),
      startIndex: selected.value,
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      onSelect: (index) => {
        selected.value = index
      },
      onOpen: open,
      onLayout: (value) => {
        layout.value = value
      }
    })
  } catch (error) {
    console.warn('[rouleau] WebGL indisponible, repli sur le carrousel HTML', error)
    emit('unsupported')
  }
})

onBeforeUnmount(() => {
  gallery?.destroy()
  gallery = null
})

onKeyStroke(['ArrowLeft', 'ArrowRight', 'Enter'], (event) => {
  const target = event.target as HTMLElement | null
  if (target?.closest('a, button, input, textarea, select')) return

  if (event.key === 'ArrowLeft') gallery?.prev()
  if (event.key === 'ArrowRight') gallery?.next()
  if (event.key === 'Enter') open(selected.value)
})

const current = computed(() => props.knives[selected.value] ?? props.knives[0])
const progressWidth = computed(() => `${((selected.value + 1) / Math.max(props.knives.length, 1)) * 100}%`)

const captionStyle = computed(() => ({
  width: `${layout.value.cardWidth}px`,
  top: `calc(50% - ${layout.value.lift}px + ${layout.value.cardHeight / 2 + 16}px)`
}))
</script>

<template>
  <div class="absolute inset-0">
    <div
      ref="stage"
      class="absolute inset-0 touch-none select-none"
      aria-hidden="true"
    />

    <div
      v-if="current"
      class="pointer-events-none absolute left-1/2 -translate-x-1/2"
      :style="captionStyle"
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
            <NuxtLink
              :to="`/couteaux/${current.slug}`"
              class="pointer-events-auto truncate text-2xl font-medium tracking-[-0.5px] text-white"
            >
              {{ current.name }}
            </NuxtLink>
            <p class="truncate text-[13px] text-white/50">
              {{ materialsLine(current) }}
            </p>
          </div>
          <p
            v-if="current.year"
            class="shrink-0 text-sm text-white"
          >
            {{ current.year }}
          </p>
        </div>
      </Transition>
    </div>

    <p class="eyebrow pointer-events-none absolute bottom-[38px] left-[72px] text-white/40">
      Glisser pour explorer
    </p>

    <RouleauProgress
      class="pointer-events-none absolute bottom-[40px] right-[72px] w-[188px]"
      :index="selected"
      :total="knives.length"
      :width="progressWidth"
    />

    <!-- Le canvas est décoratif : les pièces restent accessibles au clavier
         et aux lecteurs d'écran. -->
    <nav
      class="sr-only"
      aria-label="Pièces de la collection"
    >
      <ul>
        <li
          v-for="knife in knives"
          :key="knife.id"
        >
          <NuxtLink :to="`/couteaux/${knife.slug}`">
            {{ pad(knife.number) }} — {{ knife.name }}
          </NuxtLink>
        </li>
      </ul>
    </nav>
  </div>
</template>
