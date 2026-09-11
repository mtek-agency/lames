import { fileURLToPath } from 'node:url'
import { viteStaticCopy } from 'vite-plugin-static-copy'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@nuxt/image'
  ],

  devtools: {
    enabled: true
  },

  css: [
    '~/assets/css/main.css',
    'maplibre-gl/dist/maplibre-gl.css'
  ],

  // Direction artistique "atelier papier" : fond crème, encre chaude, le
  // mode sombre reste accessible via le bouton du header.
  colorMode: {
    preference: 'light',
    fallback: 'light'
  },

  runtimeConfig: {
    // Réseau interne Docker uniquement (§3.2 CDCF) : jamais exposé au client.
    pocketbaseInternalUrl: 'http://knife-pocketbase:8090',
    public: {
      mediaBaseUrl: '',
      // Fond de carte MapTiler (§8 Jalon 5) : compte gratuit sur maptiler.com,
      // style personnalisable visuellement dans MapTiler Cloud. Sans clé, la
      // carte affiche son propre message d'erreur au lieu de planter.
      // streets-v2 : vraies couches colorées (eau/routes/parcs/bâtiments) —
      // contrairement aux styles "dataviz-*", volontairement en niveaux de
      // gris quoi qu'on fasse (pensés comme fond neutre pour data viz).
      maptilerKey: '',
      maptilerStyle: 'streets-v2'
    }
  },

  // Pas de prerender sur '/' : le catalogue est piloté par PocketBase (contenu
  // mis à jour par l'admin), pas un contenu statique figé au build.

  // Contenu piloté par PocketBase, pas de cache HTTP agressif du document —
  // évite qu'un rechargement "normal" (par opposition à un hard-reload qui
  // vide le cache) resserve une page/bundle obsolète.
  routeRules: {
    '/carte': { headers: { 'cache-control': 'no-store' } }
  },

  // Anime la navigation entre le catalogue et une fiche : la photo cliquée
  // morphe jusqu'à sa position sur la page suivante (View Transitions API).
  // Dégrade proprement (navigation instantanée) sur les navigateurs sans
  // support et respecte prefers-reduced-motion automatiquement.
  experimental: {
    viewTransition: true
  },

  compatibilityDate: '2026-06-30',

  // MapLibre GL, chargé via `await import('maplibre-gl')` (dynamique, cf.
  // KnifeMap.client.vue), n'est pas inliné par Rollup en build de prod : ses
  // fichiers dist gardent leurs imports relatifs internes tels quels
  // (`maplibre-gl.mjs` → `./maplibre-gl-shared.mjs`, et le worker interne de
  // décodage des tuiles vectorielles → `./maplibre-gl-worker.mjs`, qui
  // importe lui aussi `./maplibre-gl-shared.mjs`). Rollup n'émet donc aucun
  // de ces deux fichiers dans `_nuxt/` : ils 404 silencieusement au runtime.
  // Les tuiles arrivent (200) mais ne sont jamais décodées/dessinées, sans
  // la moindre erreur JS exploitable (échec de chargement de module/Worker,
  // pas une exception classique). En dev, `optimizeDeps.exclude` suffit car
  // Vite sert alors le module tel quel depuis node_modules, où ces fichiers
  // existent réellement côte à côte. `viteStaticCopy` reproduit ça en prod
  // en copiant les deux fichiers vers `_nuxt/`.
  vite: {
    optimizeDeps: {
      exclude: ['maplibre-gl']
    },
    plugins: [
      viteStaticCopy({
        targets: [
          {
            src: fileURLToPath(new URL('./node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs', import.meta.url)),
            dest: '_nuxt',
            rename: { stripBase: true }
          },
          {
            src: fileURLToPath(new URL('./node_modules/maplibre-gl/dist/maplibre-gl-shared.mjs', import.meta.url)),
            dest: '_nuxt',
            rename: { stripBase: true }
          }
        ]
      })
    ]
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  image: {
    // IPX (par défaut) tourne sur le conteneur Nuxt — décision documentée au §6.2
    // CDCF ; à basculer vers le provider `cloudflare` si le CPU du VPS en souffre.
    format: ['webp'],
    // Autorise IPX (qui s'exécute côté serveur, dans le conteneur) à aller
    // chercher/optimiser les photos sur le domaine média public (R2 en prod).
    // Exclu en dev local : `localhost` désigne l'hôte pour le navigateur mais
    // pas pour le conteneur, IPX ne pourrait pas résoudre l'URL lui-même ;
    // NuxtImg sert alors l'original brut, sans optimisation WebP.
    domains: mediaBaseDomains()
  }
})

function mediaBaseDomains(): string[] {
  try {
    const url = new URL(process.env.NUXT_PUBLIC_MEDIA_BASE_URL || 'http://localhost:8090')
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return []
    return [url.host]
  } catch {
    return []
  }
}
