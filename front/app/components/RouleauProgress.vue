<script setup lang="ts">
defineProps<{
  index: number
  total: number
  width: string
}>()
</script>

<template>
  <div
    class="flex items-center gap-3 text-[11px] font-semibold"
    role="progressbar"
    :aria-valuenow="index + 1"
    :aria-valuemin="1"
    :aria-valuemax="total"
    :aria-valuetext="`Pièce ${index + 1} sur ${total}`"
  >
    <span class="tabular-nums text-white">{{ pad(index + 1) }}</span>
    <span class="relative h-px flex-1 bg-white/20">
      <span
        class="absolute inset-y-0 left-0 bg-white transition-[width] duration-500 ease-out"
        :style="{ width }"
      />
    </span>
    <span class="tabular-nums text-white/40">{{ pad(total) }}</span>
  </div>
</template>
