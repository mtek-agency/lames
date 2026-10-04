import PocketBase from 'pocketbase'
import type { H3Event } from 'h3'
import { numberKnives, PUBLIC_RECORD_FIELDS, type KnifeRecord } from './sanitizeKnife'

// Toutes les pièces publiées, numérotées et triées par N°. La collection se
// compte en dizaines de pièces : la fiche relit la liste complète pour
// calculer son rang, le total et ses voisines plutôt que de multiplier les
// requêtes.
export async function fetchNumberedKnives(event: H3Event) {
  const config = useRuntimeConfig(event)
  const pb = new PocketBase(config.pocketbaseInternalUrl)

  const records = await pb.collection('knives').getFullList<KnifeRecord>({
    filter: 'is_public = true',
    fields: PUBLIC_RECORD_FIELDS
  })

  return numberKnives(records)
}
