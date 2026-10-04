import { describe, expect, it } from 'vitest'
import { latestSlug, toKnife, toNeighbour, toSummary, type StudioKnife } from './knives'

const FORBIDDEN_FIELDS = ['purchase_price', 'estimated_value', 'acquisition_date', 'private_notes', 'hero_media_id', 'site_id']

const studio: StudioKnife = {
  id: 7,
  slug: 'le-capucin',
  number: 3,
  name: 'Le Capucin',
  maker: 'Atelier L. Vidal',
  year: 2026,
  category: 'classique',
  limited_edition: false,
  is_new: true,
  blade_steel: '14C28N',
  blade_length: 92,
  handle_material: 'Noyer du Périgord',
  bolster: null,
  weight: null,
  origin_city: 'Thiers, Puy-de-Dôme',
  cover: 'https://media.example.com/a.jpg',
  cutout: null,
  type: 'folding',
  mechanism: 'slipjoint',
  blade_finish: null,
  overall_length: null,
  closed_length: 114,
  blade_thickness: 2.5,
  condition: 'Neuf',
  entry_year: 2026,
  collector_note: null,
  detail_heading: null,
  detail_text: null,
  photos: [
    { url: 'https://media.example.com/a.jpg', caption: 'Ouvert, en main' },
    { url: 'https://media.example.com/b.jpg', caption: null }
  ],
  photos_note: null
}

describe('toSummary', () => {
  it('turns the API nulls into undefined, so the front never shows an empty line', () => {
    const summary = toSummary(studio)
    expect(summary.bolster).toBeUndefined()
    expect(summary.weight).toBeUndefined()
    expect(summary.year).toBe(2026)
    expect(summary.blade_length).toBe(92)
  })

  it('keeps the cover and the cut-out as they are (null when absent)', () => {
    expect(toSummary(studio).cover).toBe('https://media.example.com/a.jpg')
    expect(toSummary(studio).cutout).toBeNull()
  })

  it('does not forward fields the front does not declare', () => {
    const leaky = { ...studio, purchase_price: 120, private_notes: 'secret', site_id: 2 }
    const keys = Object.keys(toKnife(leaky as StudioKnife))
    for (const field of FORBIDDEN_FIELDS) expect(keys).not.toContain(field)
  })
})

describe('toKnife', () => {
  it('maps photos and drops empty captions', () => {
    const knife = toKnife(studio)
    expect(knife.photos).toEqual([
      { url: 'https://media.example.com/a.jpg', caption: 'Ouvert, en main' },
      { url: 'https://media.example.com/b.jpg', caption: undefined }
    ])
  })

  it('maps optional detail fields', () => {
    const knife = toKnife(studio)
    expect(knife.closed_length).toBe(114)
    expect(knife.overall_length).toBeUndefined()
    expect(knife.detail_text).toBeUndefined()
    expect(knife.type).toBe('folding')
  })
})

describe('toNeighbour', () => {
  it('passes null through (a one-piece collection has no neighbour)', () => {
    expect(toNeighbour(null)).toBeNull()
  })

  it('keeps only what the navigation shows', () => {
    const n = toNeighbour({ slug: 'a', number: 1, name: 'A', cover: null, cutout: null, extra: 1 } as never)
    expect(n).toEqual({ slug: 'a', number: 1, name: 'A', cover: null, cutout: null })
  })
})

describe('latestSlug', () => {
  it('is the most recently created piece', () => {
    expect(latestSlug([{ id: 2, slug: 'b' }, { id: 9, slug: 'z' }, { id: 4, slug: 'c' }])).toBe('z')
  })

  it('is null for an empty collection', () => {
    expect(latestSlug([])).toBeNull()
  })
})
