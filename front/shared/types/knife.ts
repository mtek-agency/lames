// Forme publique d'une pièce, partagée entre le BFF (server/) et le front (app/).
export interface PublicKnife {
  id: string
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
  coordinates: { lat: number, lng: number } | null
  story?: string
  photos: string[]
}

// Valeurs du champ `type` (§4 CDCF).
export const KNIFE_TYPES = ['folding', 'fixed', 'kitchen', 'outdoor'] as const

export const KNIFE_TYPE_LABELS: Record<string, string> = {
  folding: 'Pliant',
  fixed: 'Fixe',
  kitchen: 'Cuisine',
  outdoor: 'Outdoor'
}

// Valeurs du champ `mechanism` (§4 CDCF).
export const KNIFE_MECHANISMS = ['slipjoint', 'linerlock', 'framelock', 'axislock', 'friction'] as const

export const KNIFE_MECHANISM_LABELS: Record<string, string> = {
  slipjoint: 'Cran forcé',
  linerlock: 'Liner lock',
  framelock: 'Frame lock',
  axislock: 'Axis lock',
  friction: 'Friction'
}
