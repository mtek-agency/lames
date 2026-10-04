# Cahier des Charges Techniques & Fonctionnelles (CDCF)
## Projet : Vitrine & Inventaire Numérique de Collection de Couteaux
**Version 5** — Refonte de la vitrine publique d'après la maquette `../design/design_site_collection_couteau.pen` (hors dépôt) : accueil en « rouleau » / liste, fiche éditoriale, nouveaux champs publics ; suppression de la carte interactive.

*Version 4 — Révision durcissant l'exposition publique de PocketBase (Cloudflare Access exhaustif + protection de l'IP d'origine), clarifiant le comportement réel de `@nuxt/image`, imposant un tagging d'images immuable pour le rollback, et formalisant la gestion des secrets.*

---

### 1. Contexte & Vision du Projet

Le projet consiste à concevoir une application web moderne servant à la fois :
1. **D'inventaire personnel et sécurisé** : Permettre au collectionneur de recenser ses pièces, gérer ses fiches d'acquisition (prix d'achat, valeur estimée, lieu de trouvaille) et administrer son catalogue directement depuis un smartphone (bourses, ateliers, brocantes).
2. **De vitrine publique / portfolio** : Exposer la collection aux passionnés et amateurs de coutellerie à travers une interface soignée, des fiches techniques détaillées, et des galeries photos haute résolution.

---

### 2. Spécifications Fonctionnelles

#### 2.1. Module Vitrine Publique (Front-End)
Référence visuelle : maquette `../design/design_site_collection_couteau.pen` (hors dépôt) (écrans desktop 1440 px et mobile 390 px, design system). Fond nuit « acier damassé » pour l'accueil, fond papier pour les fiches. Polices Instrument Serif, Inter Tight et Cormorant Garamond, auto-hébergées via `@nuxt/fonts`.

* **Accueil — Vue « Rouleau » (par défaut) :**
  * Carrousel horizontal des pièces, triées par N° d'inventaire : glisser (souris, tactile, trackpad) ou flèches du clavier ; les cartes latérales rétrécissent, s'inclinent et s'effacent.
  * Ouverture sur la dernière entrée ; légende de la carte centrale (nom, matériaux, longueur de lame, année) et progression (N° / total).
* **Accueil — Vue « Liste » (bascule Rouleau / Liste, mémorisée dans l'URL `?vue=liste`) :**
  * Tableau modèle / acier / manche / année avec vignette ; aperçu de la pièce survolée (photo, specs, lien vers la fiche) sur desktop.
  * Filtres par catégorie (Classique, Montagne, Urbain) et « Édition limitée » ; tri par N° ou par année.
  * Navigation clavier ↑ ↓ / ↵ sur desktop ; badges « Nouveau » (entrée de moins de 90 jours) et « Édition limitée » sur mobile.
  * Miniatures optimisées WebP (§8.3).
* **Fiche Détaillée d'une Pièce :**
  * Gabarit identique pour toutes les pièces.
  * En-tête : visuel détouré de la pièce, specs clés, N° d'inventaire, pièces voisines, note du collectionneur (si renseignée).
  * Deux photos légendées au maximum (visionneuse plein écran) : une grande, puis une seconde à côté de la fiche technique ; les photos suivantes ne sont pas affichées.
  * Fiche technique complète (type, lame, longueurs, épaisseur, manche, mitres, poids, forgeron, année, état), précédée de l'encart éditorial s'il est renseigné.
  * Pas de section Histoire (retirée pour garder des fiches courtes).
  * Navigation pièce précédente / suivante (circulaire).
  * URL basée sur un slug lisible et unique (§8.2).
* ~~**Carte Interactive Globale**~~ : supprimée lors de la refonte (absente de la maquette). Les champs `lat` / `lng` restent en base mais ne sont plus exposés.
* **Confidentialité & Sécurité Publique :**
  * Masquage strict des données financières (prix d'achat, valeur estimée).
  * Localisation publique restreinte à la ville/région d'origine (aucun lieu de stockage personnel).
  * Aucune métadonnée technique des photos (EXIF, y compris géolocalisation GPS de prise de vue) ne doit subsister dans les fichiers servis publiquement (§7.1).

#### 2.2. Module Administration & Gestion (Back-Office)
* Authentification à double barrière : Cloudflare Zero Trust (OTP email / Passkey) + authentification native PocketBase.
* Interface mobile-first prête à l'emploi (saisie en direct lors de bourses ou visites d'ateliers).
* Formulaire d'ajout / modification de pièce avec :
  * Upload direct de photos haute résolution.
  * Nettoyage automatique des métadonnées EXIF à l'upload via hooks serveur (§7.1).
  * Coordonnées géographiques (latitude / longitude du lieu d'origine de la pièce).
  * Champs privés étanches (prix d'achat, date d'acquisition, valeur estimée, notes personnelles).
  * Statut de publication (`is_public: boolean`).
  * Génération automatique (et modifiable) du slug public à partir du nom, avec gestion des collisions d'homonymes.

---

### 3. Architecture Technique & Déploiement

```text
                                [ Smartphone Administrateur ]
                                              │
                                              ▼ (HTTPS + Cloudflare Proxy)
                             ┌─────────────────────────────────┐
                             │ Cloudflare Zero Trust (Access)  │ (OTP / Passkey — TOUTES routes,
                             │  policy sur * y compris /api/*) │  y compris l'API REST native)
                             └────────────────┬────────────────┘
                                              │ (uniquement via IP Cloudflare,
                                              │  Authenticated Origin Pulls)
  [ Visiteurs Web Publics ]                   │
             │                                │
             ▼ (HTTPS / Cloudflare CDN)       ▼
┌────────────────────────────────────────────────────────────────────────┐
│ VPS Host (Dokploy / Reverse Proxy Traefik)                             │
│ Pare-feu : n'accepte les connexions 80/443 que depuis les plages IP    │
│ Cloudflare — toute connexion directe à l'IP du VPS est rejetée         │
│                                                                        │
│   ┌─────────────────────┐               ┌──────────────────────────┐   │
│   │   Conteneur Nuxt 3  │               │   Conteneur PocketBase   │   │
│   │   (Front-End & BFF) │               │   (+ Litestream + Hooks) │   │
│   └──────────┬──────────┘               └─────────────▲────────────┘   │
│              │                                        │                │
│              └────[ Réseau Docker Interne Dokploy ]───┘                │
│                   http://knife-pocketbase:8090                         │
│                   (Aucun accès direct depuis l'extérieur du réseau     │
│                    Docker ; seul Traefik + Nuxt y accèdent)            │
└──────────────────────────────────────┬─────────────────────────────────┘
                                       │ (S3 API / Egress gratuit)
                                       ▼
                       ┌───────────────────────────────┐
                       │        Cloudflare R2          │
                       │ ├─ knives-collection (Photos) │
                       │ └─ knives-db-backup (SQLite)  │
                       └───────────────────────────────┘
```

#### 3.1. Pipeline CI/CD (GitHub Actions & Dokploy)
* **Dépôt Git & GitHub Packages (GHCR) :**
  * À chaque push ou tag sur `main`, une GitHub Action compile et publie deux images Docker, **taguées avec le SHA court du commit et, sur tag Git, avec le numéro de version semver** (jamais uniquement `latest`, qui empêche tout rollback fiable) :
    * `ghcr.io/<username>/knife-pocketbase:<sha|vX.Y.Z>` : Embarque l'exécutable PocketBase, le binaire Litestream et les scripts `pb_hooks/` (stripping EXIF).
    * `ghcr.io/<username>/knife-front:<sha|vX.Y.Z>` : Application Nuxt 3 packagée en conteneur autonome (Node/Nitro).
  * Un tag flottant `latest` peut être publié en plus pour le déploiement continu standard, mais chaque déploiement effectif dans Dokploy référence le tag immuable correspondant, afin de pouvoir revenir en une action à la version précédente en cas de régression.
* **Déploiement Dokploy :**
  * Dokploy est configuré avec un accès de lecture à GHCR (Personal Access Token GitHub, scope `read:packages` uniquement).
  * Déclenchement automatique des déploiements par Webhook GitHub à la fin des builds.

#### 3.2. Isolement Réseau & Sécurisation des Accès

1. **PocketBase Backend (Réseau privé) :**
   * PocketBase n'écoute sur aucune IP publique du VPS.
   * Il est connecté au réseau bridge interne Dokploy sous l'alias de service `knife-pocketbase`.
   * Le conteneur Nuxt 3 communique avec lui via la variable d'environnement privée `POCKETBASE_INTERNAL_URL=http://knife-pocketbase:8090`.

2. **Accès Admin Mobile (Cloudflare Zero Trust) — durci :**
   * Traefik route le sous-domaine `admin-knives.mondomaine.fr` vers le conteneur PocketBase.
   * Le DNS de ce sous-domaine passe obligatoirement par Cloudflare (Proxy activé / nuage orange).
   * Une application **Cloudflare Access** verrouille ce sous-domaine, avec une policy explicitement définie sur le chemin racine `*` — **y compris les endpoints d'API REST natifs** (`/api/collections/*`, `/api/admins/*`, etc.) et pas seulement l'interface HTML `/_/`. Un oubli de scope sur `/api/*` rendrait tous les champs privés accessibles sans authentification.
   * Accès restreint uniquement à l'adresse e-mail de l'administrateur via One-Time PIN (OTP) ou Passkey.
   * **Protection de l'IP d'origine du VPS** : le pare-feu du VPS (`ufw`/security group) n'autorise le trafic entrant sur les ports 80/443 que depuis les [plages IP publiées par Cloudflare](https://www.cloudflare.com/ips/). En complément, activer les **Authenticated Origin Pulls** (mTLS Cloudflare ↔ Traefik) pour garantir cryptographiquement que seules les requêtes passées par le proxy Cloudflare atteignent le serveur — une connexion directe à l'IP du VPS (trouvée via historique DNS, scan Shodan, etc.) est ainsi rejetée même si l'IP venait à fuiter.
   * Cette double barrière (Access + isolation réseau d'origine) est non négociable : Cloudflare Access seul ne protège pas contre un accès direct à l'IP du serveur qui contournerait le proxy.

3. **Application Publique Nuxt 3 :**
   * Exposée publiquement sur `couteaux.mondomaine.fr` via Traefik et Cloudflare, avec le même pare-feu restreint aux IP Cloudflare.
   * La couche BFF filtre systématiquement les attributs privés avant tout envoi au navigateur (défense en profondeur, indépendante de l'isolation réseau ci-dessus).

#### 3.3. Gestion des Secrets
Aucun secret n'est commité dans le dépôt Git ni codé en dur dans les Dockerfiles. L'ensemble des identifiants sensibles est injecté exclusivement via les variables d'environnement chiffrées de Dokploy, avec accès restreint à l'administrateur :
* Clés d'accès S3 Cloudflare R2 (Access Key ID / Secret Access Key), distinctes pour le bucket `knives-collection` et le bucket `knives-db-backup`.
* Personal Access Token GitHub (scope `read:packages` uniquement) utilisé par Dokploy pour tirer les images depuis GHCR.
* Secret d'application PocketBase (`PB_ENCRYPTION_KEY` si le chiffrement des paramètres est activé).
* Identifiants Cloudflare API (Zone ID, API Token) si l'automatisation DNS/Access est scriptée.
* Un fichier `.env.example` documenté (sans valeurs réelles) est versionné à titre de référence pour les variables attendues par chaque conteneur.

---

### 4. Modèle de Données (Schéma PocketBase)

#### Collection : `knives`
| Champ | Type PocketBase | Requis | Règle de visibilité | Description |
| :--- | :--- | :---: | :---: | :--- |
| `id` | String (Record ID) | Oui | Interne | Identifiant unique généré |
| `slug` | Text (unique) | Oui | Public | Identifiant lisible URL (ex: `laguiole-plein-manche-1892`) |
| `name` | Text | Oui | Public | Nom usuel de la pièce |
| `maker` | Text | Oui | Public | Artisan coutelier ou manufacture |
| `type` | Select | Oui | Public | `folding`, `fixed`, `kitchen`, `outdoor` |
| `mechanism` | Select | Non | Public | `slipjoint`, `linerlock`, `framelock`, `axislock`, `friction`... |
| `blade_steel` | Text | Oui | Public | Nuance d'acier (ex: *14C28N*, *RWL34*, *XC75*, *Damas*) |
| `blade_finish` | Text | Non | Public | Brut de forge, satiné, poli miroir, stonewash... |
| `handle_material` | Text | Oui | Public | Bois d'amourette, ivoire de mammouth, G10, corne... |
| `overall_length` | Number | Non | Public | Longueur totale ouverte (mm) |
| `blade_length` | Number | Non | Public | Longueur de la lame (mm) |
| `weight` | Number | Non | Public | Poids net (g) |
| `origin_city` | Text | Oui | Public | Ville / région de fabrication |
| `lat` | Number | Non | Interne | Latitude du lieu d'origine — plus exposée depuis la suppression de la carte |
| `lng` | Number | Non | Interne | Longitude du lieu d'origine — plus exposée depuis la suppression de la carte |
| `story` | Text (Rich/MD) | Non | Interne | Histoire de la pièce — plus affichée ni exposée depuis la refonte (section Histoire retirée) |
| `photos` | File (Multiple) | Non | Public | Fichiers photos stockés sur R2 (dépourvus d'EXIF) ; la première sert de couverture |
| `inventory_number` | Number | Non | Public | N° d'inventaire (« N° 03 ») ; à défaut, rang de création |
| `year` | Number | Non | Public | Année de fabrication |
| `entry_year` | Number | Non | Public | Année d'entrée dans la collection (« Entrée en 2026 ») |
| `category` | Select | Non | Public | `classique`, `montagne`, `urbain` (filtres de la liste) |
| `limited_edition` | Bool | Non | Public | Édition limitée (filtre + badge) |
| `bolster` | Text | Non | Public | Mitre(s) : « Laiton massif » |
| `closed_length` | Number | Non | Public | Longueur fermé (mm) |
| `blade_thickness` | Number | Non | Public | Épaisseur de lame (mm, décimales autorisées) |
| `condition` | Text | Non | Public | État : « Neuf, jamais affûté » |
| `collector_note` | Text | Non | Public | Citation courte affichée sous le visuel de la fiche |
| `detail_heading` / `detail_text` | Text | Non | Public | Encart éditorial au milieu de la galerie |
| `hero_image` | File (Single) | Non | Public | Visuel détouré (PNG transparent) de la fiche et des vignettes, dépourvu d'EXIF |
| `photo_captions` | Text | Non | Public | Légendes des photos, une par ligne, dans l'ordre des photos |
| `photos_note` | Text | Non | Public | Complément de la galerie : « photographiées à Lyon, 2026 » |
| `purchase_price` | Number | Non | **PRIVÉ (Admin)** | Prix d'achat réel (€) |
| `estimated_value` | Number | Non | **PRIVÉ (Admin)** | Estimation marchande (€) |
| `acquisition_date`| Date | Non | **PRIVÉ (Admin)** | Date d'achat ou d'acquisition |
| `private_notes` | Text | Non | **PRIVÉ (Admin)** | Notes privées, état de restauration, factures |
| `is_public` | Bool | Oui | Admin / BFF | Statut de publication (brouillon vs public) |

---

### 5. Conception de l'Étanchéité BFF (Backend-For-Frontend)

Le serveur Nuxt 3 (Nitro) sert de passerelle d'assainissement entre le visiteur et PocketBase. Cette étanchéité applicative reste une protection complémentaire — elle ne dispense pas de l'isolation réseau et du verrouillage Cloudflare Access décrits au §3.2, qui protègent PocketBase lui-même.

#### Routes serveur : `server/api/knives/index.get.ts` et `server/api/knives/[slug].get.ts`

* PocketBase est interrogé sur le réseau interne avec une liste explicite de champs (`fields`, cf. `PUBLIC_RECORD_FIELDS` dans `server/utils/sanitizeKnife.ts`) : les champs privés ne quittent jamais PocketBase.
* La whitelist de `sanitizeKnife` / `summarizeKnife` reste la barrière de référence : seuls les champs publics du §4 sont recopiés, les valeurs vides de PocketBase (`0`, `''`) sont ramenées à `undefined`.
* `/api/knives` renvoie la liste résumée (rouleau, liste) triée par N° d'inventaire, plus le slug de la dernière entrée.
* `/api/knives/[slug]` renvoie la fiche complète, les pièces voisines (navigation circulaire) et le nombre total de pièces publiées.
* Les médias pointent vers le domaine R2 : `${mediaBaseUrl}/${collectionId}/${recordId}/${fichier}`.

> **Test d'étanchéité (Jalon 3) :** test automatisé vérifiant que `Object.keys()` de chaque objet retourné ne contient jamais `purchase_price`, `estimated_value`, `acquisition_date` ou `private_notes`.

---

### 6. Intégration Cloudflare R2, PocketBase & Médias

1. **Buckets Cloudflare R2 :**
   * `knives-collection` : Stockage des photos de couteaux.
   * `knives-db-backup` : Bucket privé dédié à la réplication continue Litestream.
2. **Domaine Média & Nuxt Image — comportement réel :**
   * Associer un sous-domaine Cloudflare au bucket `knives-collection` (ex: `media.mondomaine.fr`).
   * Intégrer le module `@nuxt/image` côté Nuxt pour la génération des vignettes responsive (`<NuxtImg>` / `<NuxtPicture>`, formats WebP, tailles adaptatives).
   * **Point d'attention technique :** par défaut, `@nuxt/image` utilise le provider intégré **IPX**, qui redimensionne et ré-encode les images **sur le serveur Nuxt lui-même** (donc sur le CPU du VPS) — cela ne décharge pas le VPS, contrairement à une lecture rapide de la stack. Deux options pour un déchargement réel :
     * Configurer le provider `cloudflare` de `@nuxt/image` pour s'appuyer sur **Cloudflare Image Resizing** (fonctionnalité payante, distincte du simple proxy CDN gratuit, à activer sur le plan Cloudflare) ;
     * Ou assumer explicitement qu'IPX tourne sur le VPS et dimensionner les ressources du conteneur Nuxt (CPU/RAM) en conséquence, avec mise en cache agressive des variantes déjà générées.
   * Le choix retenu doit être documenté avant le Jalon 4 pour éviter une surprise de charge CPU en production.
3. **Paramétrage S3 dans PocketBase :**
   * **Files Storage** activé sur S3.
   * **Endpoint** : `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`
   * **Bucket** : `knives-collection`
   * **Region** : `auto`

---

### 7. Points de Vigilance Techniques

#### 7.1. Nettoyage des métadonnées EXIF au niveau PocketBase
L'administrateur pouvant ajouter des photos directement depuis son smartphone via l'interface d'administration PocketBase (en court-circuitant le BFF Nuxt), le nettoyage des métadonnées GPS/EXIF doit obligatoirement avoir lieu **au cœur de PocketBase** :
* Utiliser un hook PocketBase dans le dossier `pb_hooks/` (intercepteur sur `onRecordBeforeCreateRequest` et `onRecordBeforeUpdateRequest`).
* Ré-encoder systématiquement les fichiers images entrants pour éliminer tous les segments EXIF/TIFF avant enregistrement définitif sur Cloudflare R2.
* Ce traitement s'applique même si l'accès admin est désormais protégé par Cloudflare Access (§3.2) : il s'agit d'une protection de la donnée elle-même, indépendante du canal d'accès, en cas de changement futur de statut `is_public` ou d'export.

#### 7.2. Unicité et Résolution des Slugs
* Génération automatique du slug à la saisie du nom.
* Règle de déduplication : vérification préalable en base et ajout systématique d'un suffixe incrémental ou temporel en cas d'homonyme (ex: `opinel-n8`, `opinel-n8-1970`).
* La route BFF `/api/knives/[slug]` interroge la base via `getFirstListItem('slug="<slug>"')`.

#### 7.3. Sauvegarde en Continu SQLite via Litestream
* Le binaire Litestream s'exécute en parallèle du processus PocketBase au sein du conteneur Docker.
* Litestream réplique les écritures du fichier WAL SQLite en continu vers le bucket R2 `knives-db-backup`.
* RPO (Recovery Point Objective) inférieur à 1 seconde, garantissant l'intégrité de la base même en cas de destruction complète du VPS.
* La procédure de restauration (`litestream restore`) est documentée et testée à blanc avant mise en production (Jalon 5).

---

### 8. Feuille de Route & Jalons de Développement

* [ ] **Jalon 1 - Infra, Conteneurs & Sécurité Réseau :**
  * Configuration Dokploy sur VPS avec Traefik.
  * Pare-feu VPS restreint aux plages IP Cloudflare + Authenticated Origin Pulls (mTLS).
  * Création des buckets Cloudflare R2 (`knives-collection` & `knives-db-backup`).
  * Mise en place de Cloudflare Zero Trust pour protéger `admin-knives.mondomaine.fr`, avec policy explicitement étendue à `/api/*` (pas seulement `/_/`).
  * Configuration de l'image Docker PocketBase avec Litestream et hook de stripping EXIF.
  * Mise en place des variables d'environnement Dokploy pour l'ensemble des secrets (§3.3), et rédaction du `.env.example`.
* [ ] **Jalon 2 - CI/CD & Pipeline GHCR :**
  * Création des GitHub Actions pour build et push des images conteneurs vers GHCR, avec tagging SHA/semver immuable (pas de déploiement sur `latest` seul).
  * Connexion des webhooks de déploiement dans Dokploy.
* [ ] **Jalon 3 - Nuxt 3 BFF & Tests d'Étanchéité :**
  * Mise en place du socle Nuxt 3 avec Nitro.
  * Développement des routes serveur `/api/knives` et `/api/knives/[slug]`.
  * Écriture d'un test automatisé validant qu'aucun champ financier/privé n'est exposé.
* [ ] **Jalon 4 - Vitrine Publique & Médias :**
  * Décision documentée sur le provider `@nuxt/image` (IPX local vs Cloudflare Image Resizing) et dimensionnement en conséquence.
  * Accueil « Rouleau » / « Liste » avec filtres et tri, d'après la maquette.
  * Fiches détaillées au gabarit unique (visuel détouré, grande photo, photo + fiche technique) et métadonnées OpenGraph / SEO.
* [ ] **Jalon 5 - Recette Finale :**
  * Validation terrain de l'administration mobile via smartphone (test réel derrière Cloudflare Access).
  * Test complet de restauration de sauvegarde SQLite à blanc depuis le bucket R2.
  * Audit final : vérification qu'aucune connexion directe à l'IP du VPS n'est possible, que la policy Access couvre bien tous les endpoints PocketBase, et qu'aucune photo publiée ne contient d'EXIF résiduel.
