import PocketBase, { ClientResponseError } from 'pocketbase'
import { sanitizeKnife, type KnifeRecord } from '../../utils/sanitizeKnife'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'Missing slug' })
  }

  const config = useRuntimeConfig(event)
  const pb = new PocketBase(config.pocketbaseInternalUrl)

  try {
    const record = await pb.collection('knives').getFirstListItem<KnifeRecord>(
      pb.filter('slug = {:slug} && is_public = true', { slug })
    )

    return {
      success: true,
      data: sanitizeKnife(record, config.public.mediaBaseUrl)
    }
  } catch (error) {
    if (error instanceof ClientResponseError && error.status === 404) {
      throw createError({ statusCode: 404, statusMessage: 'Knife not found' })
    }
    throw error
  }
})
