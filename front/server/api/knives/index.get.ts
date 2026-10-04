export default defineEventHandler(async (event) => {
  const knives = await fetchKnives(event)

  return {
    success: true,
    data: knives.map(toSummary),
    latest: latestSlug(knives)
  }
})
