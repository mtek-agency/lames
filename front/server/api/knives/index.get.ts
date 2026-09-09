import PocketBase from 'pocketbase'
import { sanitizeKnife, type KnifeRecord } from '../../utils/sanitizeKnife'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const pb = new PocketBase(config.pocketbaseInternalUrl)

  const records = await pb.collection('knives').getFullList<KnifeRecord>({
    filter: 'is_public = true',
    sort: '-created'
  })

  return {
    success: true,
    data: records.map(record => sanitizeKnife(record, config.public.mediaBaseUrl))
  }
})
