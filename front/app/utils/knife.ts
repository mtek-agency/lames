import { KNIFE_MECHANISM_LABELS, KNIFE_TYPE_LABELS } from '#shared/types/knife'
import type { KnifeSummary, PublicKnife } from '#shared/types/knife'

const decimal = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 })

// "03", "12".
export function pad(value: number) {
  return String(value).padStart(2, '0')
}

// Longueurs saisies en mm, affichées en cm comme sur la maquette ("9,2 cm").
export function formatCm(mm?: number) {
  return mm ? `${decimal.format(mm / 10)} cm` : undefined
}

export function formatMm(mm?: number) {
  return mm ? `${decimal.format(mm)} mm` : undefined
}

export function formatGrams(grams?: number) {
  return grams ? `${decimal.format(grams)} g` : undefined
}

// "Acier 14C28N — 9,2 cm".
export function bladeLabel(knife: KnifeSummary, prefix = 'Acier ') {
  return [`${prefix}${knife.blade_steel}`, formatCm(knife.blade_length)].filter(Boolean).join(' — ')
}

// Légende du rouleau : "Noyer, laiton, 14C28N — 9,2 cm".
export function materialsLine(knife: KnifeSummary) {
  const materials = [knife.handle_material, knife.bolster?.toLowerCase(), knife.blade_steel]
    .filter(Boolean)
    .join(', ')
  const length = formatCm(knife.blade_length)
  return length ? `${materials} — ${length}` : materials
}

// Version courte (mobile, liste) : "Noyer · Laiton · 14C28N".
export function materialsShort(knife: KnifeSummary) {
  return [knife.handle_material, knife.bolster, knife.blade_steel].filter(Boolean).join(' · ')
}

// "Couteau pliant, cran forcé".
export function typeLabel(knife: PublicKnife) {
  const type = KNIFE_TYPE_LABELS[knife.type] ?? knife.type
  const mechanism = knife.mechanism ? (KNIFE_MECHANISM_LABELS[knife.mechanism] ?? knife.mechanism) : undefined
  return mechanism ? `${type}, ${mechanism.toLowerCase()}` : type
}

export interface SpecRow {
  label: string
  value?: string
}

// Retire les lignes sans valeur : une spec non renseignée n'est pas affichée.
export function specRows(rows: SpecRow[]) {
  return rows.filter((row): row is Required<SpecRow> => !!row.value)
}
