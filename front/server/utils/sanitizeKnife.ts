import type { PublicKnife } from '#shared/types/knife'

// Enregistrement brut PocketBase (§4 CDCF) : inclut les champs privés.
export interface KnifeRecord {
  id: string
  // Renvoyé automatiquement par PocketBase sur chaque record. Le fichier est
  // stocké sur R2 sous `<collectionId>/<recordId>/<filename>` (Collection.BaseFilesPath()
  // utilise l'ID de la collection, jamais son nom) — utiliser `knives` en dur ici
  // pointerait vers une clé S3 qui n'existe pas.
  collectionId: string
  slug: string
  name: string
  maker: string
  type: string
  mechanism?: string
  blade_steel: string
  blade_finish?: string
  handle_material: string
  overall_length?: number
  blade_length?: number
  weight?: number
  origin_city: string
  lat?: number
  lng?: number
  story?: string
  photos: string[]
  is_public: boolean
  purchase_price?: number
  estimated_value?: number
  acquisition_date?: string
  private_notes?: string
}

export function sanitizeKnife(record: KnifeRecord, mediaBaseUrl: string): PublicKnife {
  return {
    id: record.id,
    slug: record.slug,
    name: record.name,
    maker: record.maker,
    type: record.type,
    mechanism: record.mechanism,
    blade_steel: record.blade_steel,
    blade_finish: record.blade_finish,
    handle_material: record.handle_material,
    overall_length: record.overall_length,
    blade_length: record.blade_length,
    weight: record.weight,
    origin_city: record.origin_city,
    // Les champs Number non requis de PocketBase valent 0 par défaut (jamais
    // null) : un couteau sans coordonnées saisies remonte lat=0, lng=0, pas
    // lat=null. (0, 0) n'étant pas une origine plausible, on le traite comme
    // "non renseigné" plutôt que de le planter au milieu du golfe de Guinée.
    coordinates: record.lat && record.lng
      ? { lat: record.lat, lng: record.lng }
      : null,
    story: record.story,
    photos: (record.photos ?? []).map(
      file => `${mediaBaseUrl}/${record.collectionId}/${record.id}/${file}`
    )
  }
}
