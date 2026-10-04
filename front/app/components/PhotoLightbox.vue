<script setup lang="ts">
import { onKeyStroke } from '@vueuse/core'
import type { KnifePhoto } from '#shared/types/knife'

// Visionneuse plein écran, sur <dialog> natif : focus piégé, Échap et
// arrière-plan inerte gérés par le navigateur.
const props = defineProps<{
  photos: KnifePhoto[]
  alt: string
}>()

// Index de la photo affichée, null quand la visionneuse est fermée.
const index = defineModel<number | null>({ required: true })

const dialog = useTemplateRef<HTMLDialogElement>('dialog')
const photo = computed(() => index.value === null ? null : props.photos[index.value])

watch(index, (value) => {
  if (value === null) dialog.value?.close()
  else if (!dialog.value?.open) dialog.value?.showModal()
})

function go(delta: number) {
  if (index.value === null) return
  index.value = (index.value + delta + props.photos.length) % props.photos.length
}

onKeyStroke(['ArrowLeft', 'ArrowRight'], (event) => {
  if (index.value === null) return
  go(event.key === 'ArrowLeft' ? -1 : 1)
})
</script>

<template>
  <dialog
    ref="dialog"
    class="m-0 size-full max-h-none max-w-none bg-night/95 p-0 text-paper backdrop:bg-night/80"
    aria-label="Photos de la pièce"
    @close="index = null"
    @click.self="index = null"
  >
    <div
      v-if="photo"
      class="flex size-full flex-col"
    >
      <div class="flex items-center justify-between px-5 py-4 lg:px-[72px]">
        <span class="text-xs tabular-nums text-paper/60">{{ pad(index! + 1) }} / {{ pad(photos.length) }}</span>
        <button
          type="button"
          class="flex size-9 items-center justify-center rounded-full outline -outline-offset-[0.5px] outline-white/20 transition-colors hover:outline-white/50"
          aria-label="Fermer"
          @click="index = null"
        >
          <Icon
            name="lucide:x"
            class="size-4"
          />
        </button>
      </div>

      <div
        class="relative flex min-h-0 flex-1 items-center justify-center px-5 lg:px-[120px]"
        @click.self="index = null"
      >
        <NuxtImg
          :key="photo.url"
          :src="photo.url"
          :alt="photo.caption ?? alt"
          sizes="100vw lg:1600px"
          class="max-h-full max-w-full object-contain"
        />

        <template v-if="photos.length > 1">
          <button
            type="button"
            class="absolute left-5 top-1/2 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-smoke/80 outline -outline-offset-[0.5px] outline-white/12 transition-colors hover:bg-smoke lg:flex lg:left-[40px]"
            aria-label="Photo précédente"
            @click="go(-1)"
          >
            <Icon
              name="lucide:arrow-left"
              class="size-4"
            />
          </button>
          <button
            type="button"
            class="absolute right-5 top-1/2 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-smoke/80 outline -outline-offset-[0.5px] outline-white/12 transition-colors hover:bg-smoke lg:flex lg:right-[40px]"
            aria-label="Photo suivante"
            @click="go(1)"
          >
            <Icon
              name="lucide:arrow-right"
              class="size-4"
            />
          </button>
        </template>
      </div>

      <div class="flex items-center justify-between gap-4 px-5 py-5 lg:px-[72px]">
        <p class="text-[13px] text-paper/80">
          {{ photo.caption }}
        </p>
        <div
          v-if="photos.length > 1"
          class="flex gap-2 lg:hidden"
        >
          <button
            type="button"
            class="flex size-10 items-center justify-center rounded-full outline -outline-offset-[0.5px] outline-white/20"
            aria-label="Photo précédente"
            @click="go(-1)"
          >
            <Icon
              name="lucide:arrow-left"
              class="size-4"
            />
          </button>
          <button
            type="button"
            class="flex size-10 items-center justify-center rounded-full outline -outline-offset-[0.5px] outline-white/20"
            aria-label="Photo suivante"
            @click="go(1)"
          >
            <Icon
              name="lucide:arrow-right"
              class="size-4"
            />
          </button>
        </div>
      </div>
    </div>
  </dialog>
</template>
