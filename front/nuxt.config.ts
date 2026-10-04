import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/fonts',
    '@nuxt/icon',
    '@nuxt/image'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    // Réseau interne Docker uniquement (§3.2 CDCF) : jamais exposé au client.
    pocketbaseInternalUrl: 'http://knife-pocketbase:8090',
    public: {
      mediaBaseUrl: ''
    }
  },

  // Pas de prerender sur '/' : le catalogue est piloté par PocketBase (contenu
  // mis à jour par l'admin), pas un contenu statique figé au build.

  // Fondu entre les pages (rouleau/liste → fiche) via la View Transitions API.
  // Dégrade proprement (navigation instantanée) sur les navigateurs sans
  // support et respecte prefers-reduced-motion automatiquement.
  experimental: {
    viewTransition: true
  },

  compatibilityDate: '2026-06-30',

  vite: {
    plugins: [tailwindcss()]
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  // Polices de la maquette, auto-hébergées par @nuxt/fonts (téléchargées au
  // build) : aucun appel à Google Fonts depuis le navigateur du visiteur.
  fonts: {
    families: [
      { name: 'Instrument Serif', weights: [400], styles: ['normal', 'italic'] },
      { name: 'Inter Tight', weights: [400, 500, 600, 700], styles: ['normal'] },
      { name: 'Cormorant Garamond', weights: [600], styles: ['normal'] }
    ]
  },

  icon: {
    // Icônes lucide embarquées dans le bundle client : pas d'appel à l'API
    // Iconify au runtime.
    serverBundle: 'local',
    clientBundle: {
      scan: true
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
