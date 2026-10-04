import { describe, expect, it } from 'vitest'
import { numberKnives, PUBLIC_RECORD_FIELDS, sanitizeKnife, summarizeKnife, type KnifeRecord } from './sanitizeKnife'

const FORBIDDEN_FIELDS = ['purchase_price', 'estimated_value', 'acquisition_date', 'private_notes']
const MEDIA = 'https://media.example.com'
const NOW = Date.parse('2026-09-30T12:00:00Z')

const fullRecord: KnifeRecord = {
  id: 'rec123',
  collectionId: 'col456',
  created: '2026-08-01 10:00:00.000Z',
  slug: 'le-capucin',
  name: 'Le Capucin',
  maker: 'Atelier L. Vidal',
  type: 'folding',
  mechanism: 'slipjoint',
  category: 'classique',
  limited_edition: false,
  inventory_number: 3,
  year: 2026,
  entry_year: 2026,
  blade_steel: '14C28N',
  blade_finish: 'satiné',
  handle_material: 'Noyer du Périgord',
  bolster: 'Laiton massif',
  overall_length: 0,
  blade_length: 92,
  closed_length: 114,
  blade_thickness: 2.5,
  weight: 64,
  condition: 'Neuf',
  origin_city: 'Thiers, Puy-de-Dôme',
  lat: 45.85,
  lng: 3.54,
  collector_note: 'Le premier couteau forgé pour la collection',
  detail_heading: '',
  hero_image: 'detoure.png',
  photos: ['front.jpg', 'back.jpg'],
  photo_captions: 'Ouvert, en main\n',
  is_public: true,
  // Champs privés (§4 CDCF) : ne doivent jamais atteindre le client.
  purchase_price: 120,
  estimated_value: 300,
  acquisition_date: '2026-05-01',
  private_notes: 'Restauration du manche prévue.'
}

const numbered = { record: fullRecord, number: 3 }

describe('sanitizeKnife', () => {
  it('never exposes private/financial fields', () => {
    const detail = sanitizeKnife(numbered, MEDIA, NOW)
    const summary = summarizeKnife(numbered, MEDIA, NOW)

    for (const field of FORBIDDEN_FIELDS) {
      expect(Object.keys(detail)).not.toContain(field)
      expect(Object.keys(summary)).not.toContain(field)
      expect(PUBLIC_RECORD_FIELDS.split(',')).not.toContain(field)
    }
  })

  it('no longer exposes removed sections (map, story)', () => {
    const detail = sanitizeKnife(numbered, MEDIA, NOW)

    for (const field of ['lat', 'lng', 'coordinates', 'story', 'story_lead', 'provenance']) {
      expect(Object.keys(detail)).not.toContain(field)
    }
  })

  it('keeps the public fields intact', () => {
    expect(sanitizeKnife(numbered, MEDIA, NOW)).toMatchObject({
      id: 'rec123',
      slug: 'le-capucin',
      number: 3,
      name: 'Le Capucin',
      year: 2026,
      bolster: 'Laiton massif',
      blade_thickness: 2.5,
      origin_city: 'Thiers, Puy-de-Dôme'
    })
  })

  it('maps PocketBase empty values (0, "") to undefined', () => {
    const detail = sanitizeKnife(numbered, MEDIA, NOW)

    expect(detail.overall_length).toBeUndefined()
    expect(detail.detail_heading).toBeUndefined()
  })

  it('builds public media URLs and pairs captions with photos', () => {
    const detail = sanitizeKnife(numbered, MEDIA, NOW)

    expect(detail.cover).toBe('https://media.example.com/col456/rec123/front.jpg')
    expect(detail.cutout).toBe('https://media.example.com/col456/rec123/detoure.png')
    expect(detail.photos).toEqual([
      { url: 'https://media.example.com/col456/rec123/front.jpg', caption: 'Ouvert, en main' },
      { url: 'https://media.example.com/col456/rec123/back.jpg', caption: undefined }
    ])
  })

  it('flags recent entries as new', () => {
    expect(summarizeKnife(numbered, MEDIA, NOW).is_new).toBe(true)

    const old = { record: { ...fullRecord, created: '2025-01-01 10:00:00.000Z' }, number: 3 }
    expect(summarizeKnife(old, MEDIA, NOW).is_new).toBe(false)
  })
})

describe('numberKnives', () => {
  const record = (slug: string, created: string, inventory_number = 0) =>
    ({ ...fullRecord, slug, created, inventory_number })

  it('uses the inventory number when set, creation rank otherwise, sorted by number', () => {
    const result = numberKnives([
      record('c', '2026-03-01 00:00:00.000Z'),
      record('a', '2026-01-01 00:00:00.000Z'),
      record('z', '2026-02-01 00:00:00.000Z', 12)
    ])

    expect(result.map(({ record, number }) => [record.slug, number])).toEqual([
      ['a', 1],
      ['c', 3],
      ['z', 12]
    ])
  })
})
