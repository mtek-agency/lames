/// <reference path="../pb_data/types.d.ts" />

// Refonte "Collection couteaux" (maquette ../design/design_site_collection_couteau.pen, hors dépôt) :
// champs publics supplémentaires affichés par le rouleau, la liste et la fiche.
// Insérés juste avant le bloc des champs privés (`purchase_price`...) pour que
// le formulaire de l'admin PocketBase garde les champs publics groupés.
//
// `lat` / `lng` ne sont plus exposés par le BFF depuis la suppression de la
// carte, mais restent en base : les supprimer ici détruirait les coordonnées
// déjà saisies sans possibilité de retour arrière.
const NEW_FIELDS = [
  // N° d'inventaire affiché partout ("N° 03"). Vide = numérotation dérivée de
  // l'ordre de création côté BFF.
  { type: "number", name: "inventory_number", required: false, min: 0, onlyInt: true },
  // Année de fabrication (colonne "Année" de la liste, tri).
  { type: "number", name: "year", required: false, min: 0, onlyInt: true },
  // Année d'entrée dans la collection ("Entrée en 2026 — N° 03"). Volontairement
  // distincte de `acquisition_date`, qui reste privée (date complète).
  { type: "number", name: "entry_year", required: false, min: 0, onlyInt: true },
  // Filtres de la vue liste.
  { type: "select", name: "category", required: false, maxSelect: 1, values: ["classique", "montagne", "urbain"] },
  { type: "bool", name: "limited_edition", required: false },
  // Mitre(s) : "Laiton massif".
  { type: "text", name: "bolster", required: false, max: 100 },
  // Longueur fermé (mm) et épaisseur de lame (mm, décimales autorisées : 2,5 mm).
  { type: "number", name: "closed_length", required: false, min: 0 },
  { type: "number", name: "blade_thickness", required: false, min: 0 },
  // État : "Neuf, jamais affûté".
  { type: "text", name: "condition", required: false, max: 200 },
  // Citation courte centrée sous le couteau détouré de la fiche.
  { type: "text", name: "collector_note", required: false, max: 300 },
  // Encart éditorial au milieu de la galerie photo.
  { type: "text", name: "detail_heading", required: false, max: 300 },
  { type: "text", name: "detail_text", required: false, max: 2000 },
  // Visuel détouré (PNG transparent) du haut de la fiche et des vignettes.
  // Même contrainte JPEG/PNG que `photos` : le hook Go de stripping EXIF
  // ré-encode via disintegration/imaging (main.go).
  {
    type: "file",
    name: "hero_image",
    required: false,
    maxSelect: 1,
    maxSize: 15728640,
    mimeTypes: ["image/png", "image/jpeg"],
  },
  // Légendes des photos, une par ligne, dans l'ordre des photos.
  { type: "text", name: "photo_captions", required: false, max: 5000 },
  // Complément de l'en-tête de galerie : "photographiées à Lyon, 2026".
  { type: "text", name: "photos_note", required: false, max: 200 },
]

migrate((app) => {
  const collection = app.findCollectionByNameOrId("knives")
  const privateStart = collection.fields.fieldNames().indexOf("purchase_price")
  let position = privateStart >= 0 ? privateStart : collection.fields.fieldNames().length

  for (const field of NEW_FIELDS) {
    collection.fields.addAt(position, new Field(field))
    position++
  }

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("knives")

  for (const field of NEW_FIELDS) {
    collection.fields.removeByName(field.name)
  }

  return app.save(collection)
})
