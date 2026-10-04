<script setup lang="ts">
// Encart éditorial de la galerie ("Un manche taillé dans un noyer…").
defineProps<{
  heading?: string
  text?: string
}>()
</script>

<template>
  <div class="flex flex-col gap-3 lg:gap-4">
    <p
      v-if="heading"
      class="font-display text-[28px]/[30px] tracking-[-0.6px] lg:text-[40px]/[42px] lg:tracking-[-1px]"
    >
      {{ heading }}
    </p>
    <p
      v-if="text"
      class="text-sm/[22px] text-muted lg:text-[15px]/[23px]"
    >
      {{ text }}
    </p>
  </div>
</template>
