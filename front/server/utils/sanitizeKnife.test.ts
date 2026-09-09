import { describe, expect, it } from 'vitest'
import { sanitizeKnife, type KnifeRecord } from './sanitizeKnife'

const FORBIDDEN_FIELDS = ['purchase_price', 'estimated_value', 'acquisition_date', 'private_notes']

const fullRecord: KnifeRecord = {
  id: 'rec123',
  slug: 'laguiole-plein-manche-1892',
  name: 'Laguiole plein manche',
  maker: 'Forge de Laguiole',
  type: 'folding',
  mechanism: 'slipjoint',
  blade_steel: '14C28N',
  blade_finish: 'satiné',
  handle_material: 'Bois d\'amourette',
  overall_length: 230,
  blade_length: 100,
  weight: 85,
  origin_city: 'Laguiole',
  lat: 44.6872,
  lng: 2.8394,
  story: 'Trouvé dans une brocante.',
  photos: ['front.jpg', 'back.jpg'],
  is_public: true,
  // Champs privés (§4 CDCF) : ne doivent jamais atteindre le client.
  purchase_price: 120,
  estimated_value: 300,
  acquisition_date: '2024-05-01',
  private_notes: 'Restauration du manche prévue.'
}

describe('sanitizeKnife', () => {
  it('never exposes private/financial fields', () => {
    const result = sanitizeKnife(fullRecord, 'https://media.example.com')

    for (const field of FORBIDDEN_FIELDS) {
      expect(Object.keys(result)).not.toContain(field)
    }
  })

  it('keeps the public fields intact', () => {
    const result = sanitizeKnife(fullRecord, 'https://media.example.com')

    expect(result).toMatchObject({
      id: 'rec123',
      slug: 'laguiole-plein-manche-1892',
      name: 'Laguiole plein manche',
      maker: 'Forge de Laguiole',
      type: 'folding',
      blade_steel: '14C28N',
      origin_city: 'Laguiole',
      coordinates: { lat: 44.6872, lng: 2.8394 }
    })
  })

  it('builds public photo URLs from the media base URL', () => {
    const result = sanitizeKnife(fullRecord, 'https://media.example.com')

    expect(result.photos).toEqual([
      'https://media.example.com/knives/rec123/front.jpg',
      'https://media.example.com/knives/rec123/back.jpg'
    ])
  })

  it('returns null coordinates when lat/lng are missing', () => {
    const { lat, lng, ...withoutCoords } = fullRecord
    const result = sanitizeKnife(withoutCoords as KnifeRecord, 'https://media.example.com')

    expect(result.coordinates).toBeNull()
  })

  it('returns null coordinates when lat/lng are 0 (PocketBase default for an unset Number field, not a real origin)', () => {
    const result = sanitizeKnife({ ...fullRecord, lat: 0, lng: 0 }, 'https://media.example.com')

    expect(result.coordinates).toBeNull()
  })
})
