// Enregistre une vue de la pièce. Appelée par le navigateur à l'ouverture de la fiche ; l'API ignore
// les robots et limite par IP (l'IP et le User-Agent du visiteur lui sont relayés).
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'Missing slug' })
  }

  await studioFetch(event, `/knives/${encodeURIComponent(slug)}/views`, { method: 'POST' })
  setResponseStatus(event, 204)
  return null
})
