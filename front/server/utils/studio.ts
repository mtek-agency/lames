import type { H3Event } from 'h3'

type StudioRequest = { method?: 'GET' | 'POST' }

// Appelle la partie publique du site dans l'API Studio : /api/v1/sites/<site>/public<path>.
// Le visiteur est relayé (IP, User-Agent) : l'API s'en sert pour limiter les vues et ignorer
// les robots. Les erreurs de l'API sont converties, aucun détail interne n'est renvoyé au navigateur.
export async function studioFetch<T>(event: H3Event, path: string, req: StudioRequest = {}): Promise<T> {
  const { apiUrl, site } = useRuntimeConfig(event).studio
  const headers: Record<string, string> = {}
  const ip = getRequestIP(event, { xForwardedFor: true })
  if (ip) headers['X-Forwarded-For'] = ip
  const ua = getRequestHeader(event, 'user-agent')
  if (ua) headers['User-Agent'] = ua

  try {
    return await $fetch(`${apiUrl}/api/v1/sites/${encodeURIComponent(site)}/public${path}`, {
      method: req.method ?? 'GET',
      headers,
      timeout: 8000,
      retry: 0
    }) as T
  } catch (e) {
    const status = (e as { statusCode?: number }).statusCode
    if (status && [400, 404, 429].includes(status)) {
      throw createError({ statusCode: status, statusMessage: status === 404 ? 'Not found' : 'Request refused' })
    }
    console.error('[studio] API call failed', path, status ?? (e as Error).message)
    throw createError({ statusCode: 502, statusMessage: 'Service unavailable' })
  }
}
