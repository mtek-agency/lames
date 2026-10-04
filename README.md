# Lames

Vitrine d'une collection de couteaux (Nuxt 4). Les pièces, leurs photos et leurs vues viennent de l'**API Studio**
(dépôt `studio`, site `couteaux`) ; la gestion des pièces se fait dans l'admin Studio (écran « Couteaux »).
Il n'y a ni base de données ni administration dans ce dépôt.

Le site Nuxt est dans `front/` ; la racine porte ce qui l'entoure (`compose*.yml`, `.env.example`, CI, cahier des charges).

## Développement

```bash
# 1. L'API Studio tourne (dépôt studio : docker compose up -d, puis make run dans api/)
cp .env.example .env     # NUXT_STUDIO_API_URL, NUXT_STUDIO_SITE
cd front
pnpm install
pnpm dev                 # http://localhost:3000   (pnpm lint, typecheck, test)
```

Ou dans Docker, depuis la racine : `docker compose up --build` (http://localhost:3001).

## Comment le site parle à l'API

Le navigateur n'appelle jamais l'API directement : les pages appellent les routes Nitro de `front/server/api/knives/`,
un adaptateur mince (`server/utils/studio.ts`, `server/utils/knives.ts`) vers `/api/v1/sites/couteaux/public/knives…`.
Il convertit les `null` de l'API en `undefined` (le front n'affiche jamais « 0 g » ni une ligne vide) et relaie l'IP
et le User-Agent du visiteur (limitation de débit et filtre des robots de l'API). Une vue est enregistrée à
l'ouverture d'une fiche (`POST /api/knives/<slug>/views`).

En production, l'API doit faire confiance à ce serveur pour `X-Forwarded-For` : mettre son réseau Docker dans
`TRUSTED_PROXIES` côté API.

## Intégration continue et déploiement

- `.github/workflows/ci.yml` : lint, typecheck et tests du front.
- `.github/workflows/build-and-push.yml` : sur `main`, publie `ghcr.io/mtek-agency/knife-front` (étiquettes `latest` et
  `sha-<court>`), puis appelle l'API Dokploy (`compose.deploy`) qui redéploie `compose.prod.yml`.

À configurer dans GitHub (Settings → Secrets and variables → Actions) :

| Nom | Type | Valeur |
|---|---|---|
| `DOKPLOY_URL` | variable | l'adresse de Dokploy |
| `DOKPLOY_API_KEY` | secret | une clé d'API Dokploy |
| `DOKPLOY_COMPOSE_ID` | secret | l'identifiant du service Compose Dokploy |
| `MEDIA_PUBLIC_URL` | variable | le domaine public des photos (celui de l'API Studio), lu à la construction |

Dokploy : un service Compose « Raw » avec `compose.prod.yml`, variables `NUXT_STUDIO_API_URL=http://studio-api:8080`
et `NUXT_STUDIO_SITE=couteaux` (voir `.env.example`), domaine sur le service `front` (port 3000). Retour arrière :
mettre l'ancien `sha-<court>` dans `IMAGE_TAG` et redéployer.
