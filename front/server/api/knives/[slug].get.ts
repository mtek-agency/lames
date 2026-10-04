export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'Missing slug' })
  }

  // L'API renvoie la pièce, son rang dans la collection et ses voisines (navigation circulaire :
  // la dernière pièce mène à la première).
  const { data, meta } = await fetchKnife(event, slug)

  return {
    success: true,
    data: toKnife(data),
    prev: toNeighbour(meta.prev),
    next: toNeighbour(meta.next),
    total: meta.total
  }
})
