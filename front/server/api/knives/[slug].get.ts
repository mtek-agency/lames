import { fetchNumberedKnives } from '../../utils/knives'
import { sanitizeKnife, toNeighbour } from '../../utils/sanitizeKnife'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'Missing slug' })
  }

  const config = useRuntimeConfig(event)
  const knives = await fetchNumberedKnives(event)
  const index = knives.findIndex(knife => knife.record.slug === slug)

  if (index === -1) {
    throw createError({ statusCode: 404, statusMessage: 'Knife not found' })
  }

  // Navigation circulaire : la dernière pièce mène à la première, pour
  // parcourir toute la collection depuis n'importe quelle fiche.
  const total = knives.length
  const prev = total > 1 ? knives[(index - 1 + total) % total]! : null
  const next = total > 1 ? knives[(index + 1) % total]! : null

  return {
    success: true,
    data: sanitizeKnife(knives[index]!, config.public.mediaBaseUrl),
    prev: prev && toNeighbour(prev, config.public.mediaBaseUrl),
    next: next && toNeighbour(next, config.public.mediaBaseUrl),
    total
  }
})
