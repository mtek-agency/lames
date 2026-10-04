import type { H3Event } from 'h3'
import type { KnifeNeighbour, KnifePhoto, KnifeSummary, PublicKnife } from '#shared/types/knife'

// Formes renvoyées par l'API Studio (GET /sites/couteaux/public/knives…). Les valeurs absentes
// y sont `null` ; le front attend `undefined` (il n'affiche jamais "0 g" ni une ligne vide).
export interface StudioSummary {
  id: number
  slug: string
  number: number
  name: string
  maker: string
  year: number | null
  category: string | null
  limited_edition: boolean
  is_new: boolean
  blade_steel: string
  blade_length: number | null
  handle_material: string
  bolster: string | null
  weight: number | null
  origin_city: string
  cover: string | null
  cutout: string | null
}

export interface StudioKnife extends StudioSummary {
  type: string
  mechanism: string | null
  blade_finish: string | null
  overall_length: number | null
  closed_length: number | null
  blade_thickness: number | null
  condition: string | null
  entry_year: number | null
  collector_note: string | null
  detail_heading: string | null
  detail_text: string | null
  photos: { url: string, caption: string | null }[]
  photos_note: string | null
}

export interface StudioNeighbour {
  slug: string
  number: number
  name: string
  cover: string | null
  cutout: string | null
}

export interface StudioDetailMeta {
  total: number
  prev: StudioNeighbour | null
  next: StudioNeighbour | null
}

const orUndefined = <T>(value: T | null): T | undefined => value ?? undefined

export function toSummary(k: StudioSummary): KnifeSummary {
  return {
    id: k.id,
    slug: k.slug,
    number: k.number,
    name: k.name,
    maker: k.maker,
    year: orUndefined(k.year),
    category: orUndefined(k.category),
    limited_edition: k.limited_edition,
    is_new: k.is_new,
    blade_steel: k.blade_steel,
    blade_length: orUndefined(k.blade_length),
    handle_material: k.handle_material,
    bolster: orUndefined(k.bolster),
    weight: orUndefined(k.weight),
    origin_city: k.origin_city,
    cover: k.cover,
    cutout: k.cutout
  }
}

export function toKnife(k: StudioKnife): PublicKnife {
  return {
    ...toSummary(k),
    type: k.type,
    mechanism: orUndefined(k.mechanism),
    blade_finish: orUndefined(k.blade_finish),
    overall_length: orUndefined(k.overall_length),
    closed_length: orUndefined(k.closed_length),
    blade_thickness: orUndefined(k.blade_thickness),
    condition: orUndefined(k.condition),
    entry_year: orUndefined(k.entry_year),
    collector_note: orUndefined(k.collector_note),
    detail_heading: orUndefined(k.detail_heading),
    detail_text: orUndefined(k.detail_text),
    photos: k.photos.map((p): KnifePhoto => ({ url: p.url, caption: p.caption || undefined })),
    photos_note: orUndefined(k.photos_note)
  }
}

export function toNeighbour(n: StudioNeighbour | null): KnifeNeighbour | null {
  return n && { slug: n.slug, number: n.number, name: n.name, cover: n.cover, cutout: n.cutout }
}

// La dernière pièce ajoutée : mise en avant à l'ouverture du rouleau et étiquetée "Dernière
// entrée" dans la liste. Les identifiants croissent avec la création.
export function latestSlug(knives: { id: number, slug: string }[]): string | null {
  return knives.reduce<{ id: number, slug: string } | null>((newest, k) => !newest || k.id > newest.id ? k : newest, null)?.slug ?? null
}

export const fetchKnives = (event: H3Event) =>
  studioFetch<{ data: StudioSummary[] }>(event, '/knives').then(r => r.data)

export const fetchKnife = (event: H3Event, slug: string) =>
  studioFetch<{ data: StudioKnife, meta: StudioDetailMeta }>(event, `/knives/${encodeURIComponent(slug)}`)
