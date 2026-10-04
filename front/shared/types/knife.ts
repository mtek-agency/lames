// Formes publiques d'une pièce, partagées entre le BFF (server/) et le front (app/).

// Ce qu'affichent le rouleau et la liste : assez pour la légende, la ligne de
// liste et l'aperçu, sans la galerie complète.
export interface KnifeSummary {
  id: string
  slug: string
  // N° d'inventaire ("N° 03") : saisi dans l'admin, sinon rang de création.
  number: number
  name: string
  maker: string
  year?: number
  category?: string
  limited_edition: boolean
  // Entrée récente (badge "Nouveau").
  is_new: boolean
  blade_steel: string
  blade_length?: number
  handle_material: string
  bolster?: string
  weight?: number
  origin_city: string
  // Première photo (cartes du rouleau, aperçu de la liste).
  cover: string | null
  // Visuel détouré (PNG transparent), sinon null.
  cutout: string | null
}

export interface KnifePhoto {
  url: string
  caption?: string
}

export interface PublicKnife extends KnifeSummary {
  type: string
  mechanism?: string
  blade_finish?: string
  overall_length?: number
  closed_length?: number
  blade_thickness?: number
  condition?: string
  entry_year?: number
  collector_note?: string
  detail_heading?: string
  detail_text?: string
  photos: KnifePhoto[]
  photos_note?: string
}

// Pièce voisine (navigation précédente / suivante de la fiche).
export interface KnifeNeighbour {
  slug: string
  number: number
  name: string
  cover: string | null
  cutout: string | null
}

// Valeurs du champ `type` (§4 CDCF).
export const KNIFE_TYPE_LABELS: Record<string, string> = {
  folding: 'Couteau pliant',
  fixed: 'Couteau fixe',
  kitchen: 'Couteau de cuisine',
  outdoor: 'Couteau outdoor'
}

// Valeurs du champ `mechanism` (§4 CDCF).
export const KNIFE_MECHANISM_LABELS: Record<string, string> = {
  slipjoint: 'Cran forcé',
  linerlock: 'Liner lock',
  framelock: 'Frame lock',
  axislock: 'Axis lock',
  friction: 'Friction'
}

// Valeurs du champ `category` : filtres de la vue liste.
export const KNIFE_CATEGORY_LABELS: Record<string, string> = {
  classique: 'Classique',
  montagne: 'Montagne',
  urbain: 'Urbain'
}
