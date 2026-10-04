import type { KnifeNeighbour, KnifePhoto, KnifeSummary, PublicKnife } from '#shared/types/knife'

// Enregistrement brut PocketBase (§4 CDCF) : inclut les champs privés.
export interface KnifeRecord {
  id: string
  // Renvoyé automatiquement par PocketBase sur chaque record. Le fichier est
  // stocké sur R2 sous `<collectionId>/<recordId>/<filename>` (Collection.BaseFilesPath()
  // utilise l'ID de la collection, jamais son nom) — utiliser `knives` en dur ici
  // pointerait vers une clé S3 qui n'existe pas.
  collectionId: string
  created: string
  slug: string
  name: string
  maker: string
  type: string
  mechanism?: string
  category?: string
  limited_edition?: boolean
  inventory_number?: number
  year?: number
  entry_year?: number
  blade_steel: string
  blade_finish?: string
  handle_material: string
  bolster?: string
  overall_length?: number
  blade_length?: number
  closed_length?: number
  blade_thickness?: number
  weight?: number
  condition?: string
  origin_city: string
  lat?: number
  lng?: number
  collector_note?: string
  detail_heading?: string
  detail_text?: string
  hero_image?: string
  photos: string[]
  photo_captions?: string
  photos_note?: string
  is_public: boolean
  purchase_price?: number
  estimated_value?: number
  acquisition_date?: string
  private_notes?: string
}

// Champs demandés à PocketBase (`fields`) : les champs privés ne quittent
// jamais PocketBase, même sur le réseau interne. La whitelist de
// `sanitizeKnife` reste la barrière de référence (§5 CDCF).
export const PUBLIC_RECORD_FIELDS = [
  'id', 'collectionId', 'created', 'slug', 'name', 'maker', 'type', 'mechanism',
  'category', 'limited_edition', 'inventory_number', 'year', 'entry_year',
  'blade_steel', 'blade_finish', 'handle_material', 'bolster', 'overall_length',
  'blade_length', 'closed_length', 'blade_thickness', 'weight', 'condition',
  'origin_city', 'collector_note', 'detail_heading', 'detail_text', 'hero_image',
  'photos', 'photo_captions', 'photos_note'
].join(',')

// Durée pendant laquelle une pièce porte le badge "Nouveau".
const NEW_FOR_DAYS = 90

export interface NumberedRecord {
  record: KnifeRecord
  number: number
}

// PocketBase renvoie 0 pour un champ Number non renseigné et '' pour un champ
// Text vide : on les ramène à `undefined` pour que le front n'affiche jamais
// "0 g" ou une ligne vide.
function positive(value: number | undefined): number | undefined {
  return value && value > 0 ? value : undefined
}

function text(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function fileUrl(record: KnifeRecord, file: string, mediaBaseUrl: string) {
  return `${mediaBaseUrl}/${record.collectionId}/${record.id}/${file}`
}

// Format PocketBase : "2026-05-12 09:30:00.000Z".
function parseDate(value: string): number {
  return Date.parse(value.replace(' ', 'T'))
}

// Tri par N° d'inventaire. Une pièce sans N° saisi reçoit son rang dans
// l'ordre de création : la numérotation reste stable tant que l'admin n'en
// saisit pas.
export function numberKnives(records: KnifeRecord[]): NumberedRecord[] {
  return [...records]
    .sort((a, b) => parseDate(a.created) - parseDate(b.created))
    .map((record, index) => ({ record, number: positive(record.inventory_number) ?? index + 1 }))
    .sort((a, b) => a.number - b.number)
}

export function summarizeKnife(
  { record, number }: NumberedRecord,
  mediaBaseUrl: string,
  now: number = Date.now()
): KnifeSummary {
  const created = parseDate(record.created)

  return {
    id: record.id,
    slug: record.slug,
    number,
    name: record.name,
    maker: record.maker,
    year: positive(record.year),
    category: text(record.category),
    limited_edition: !!record.limited_edition,
    is_new: Number.isFinite(created) && now - created < NEW_FOR_DAYS * 24 * 60 * 60 * 1000,
    blade_steel: record.blade_steel,
    blade_length: positive(record.blade_length),
    handle_material: record.handle_material,
    bolster: text(record.bolster),
    weight: positive(record.weight),
    origin_city: record.origin_city,
    cover: record.photos?.[0] ? fileUrl(record, record.photos[0], mediaBaseUrl) : null,
    cutout: record.hero_image ? fileUrl(record, record.hero_image, mediaBaseUrl) : null
  }
}

export function sanitizeKnife(
  numbered: NumberedRecord,
  mediaBaseUrl: string,
  now: number = Date.now()
): PublicKnife {
  const { record } = numbered
  const captions = (record.photo_captions ?? '').split('\n').map(line => line.trim())

  return {
    ...summarizeKnife(numbered, mediaBaseUrl, now),
    type: record.type,
    mechanism: text(record.mechanism),
    blade_finish: text(record.blade_finish),
    overall_length: positive(record.overall_length),
    closed_length: positive(record.closed_length),
    blade_thickness: positive(record.blade_thickness),
    condition: text(record.condition),
    entry_year: positive(record.entry_year),
    collector_note: text(record.collector_note),
    detail_heading: text(record.detail_heading),
    detail_text: text(record.detail_text),
    photos: (record.photos ?? []).map((file, index): KnifePhoto => ({
      url: fileUrl(record, file, mediaBaseUrl),
      caption: captions[index] || undefined
    })),
    photos_note: text(record.photos_note)
  }
}

export function toNeighbour(numbered: NumberedRecord, mediaBaseUrl: string): KnifeNeighbour {
  const { slug, number, name, cover, cutout } = summarizeKnife(numbered, mediaBaseUrl)
  return { slug, number, name, cover, cutout }
}
