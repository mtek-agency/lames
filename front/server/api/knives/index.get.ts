import { fetchNumberedKnives } from '../../utils/knives'
import { summarizeKnife } from '../../utils/sanitizeKnife'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const knives = await fetchNumberedKnives(event)

  // Dernière pièce ajoutée : mise en avant à l'ouverture du rouleau et
  // étiquetée "Dernière entrée" dans l'aperçu de la liste.
  const latest = knives.reduce<(typeof knives)[number] | null>(
    (newest, knife) => !newest || knife.record.created > newest.record.created ? knife : newest,
    null
  )

  return {
    success: true,
    data: knives.map(knife => summarizeKnife(knife, config.public.mediaBaseUrl)),
    latest: latest?.record.slug ?? null
  }
})
