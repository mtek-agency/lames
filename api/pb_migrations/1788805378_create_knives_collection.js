/// <reference path="../pb_data/types.d.ts" />

// Collection `knives` (§4 CDCF).
// Règles d'accès :
//  - list/view : uniquement les pièces publiées (`is_public = true`). Défense en
//    profondeur en cas d'accès direct à l'API PocketBase ; la whitelist de champs
//    reste portée par le BFF Nuxt (§5), PocketBase ne filtrant pas au niveau champ.
//  - create/update/delete : superuser uniquement (règle `null`), l'admin se
//    connectant via l'auth native PocketBase derrière Cloudflare Access (§3.2).
migrate((app) => {
  const collection = new Collection({
    type: "base",
    name: "knives",
    listRule: "is_public = true",
    viewRule: "is_public = true",
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      {
        type: "text",
        name: "slug",
        required: true,
        max: 200,
      },
      {
        type: "text",
        name: "name",
        required: true,
        max: 200,
      },
      {
        type: "text",
        name: "maker",
        required: true,
        max: 200,
      },
      {
        type: "select",
        name: "type",
        required: true,
        maxSelect: 1,
        values: ["folding", "fixed", "kitchen", "outdoor"],
      },
      {
        type: "select",
        name: "mechanism",
        required: false,
        maxSelect: 1,
        values: ["slipjoint", "linerlock", "framelock", "axislock", "friction"],
      },
      {
        type: "text",
        name: "blade_steel",
        required: true,
        max: 100,
      },
      {
        type: "text",
        name: "blade_finish",
        required: false,
        max: 100,
      },
      {
        type: "text",
        name: "handle_material",
        required: true,
        max: 100,
      },
      {
        type: "number",
        name: "overall_length",
        required: false,
        min: 0,
      },
      {
        type: "number",
        name: "blade_length",
        required: false,
        min: 0,
      },
      {
        type: "number",
        name: "weight",
        required: false,
        min: 0,
      },
      {
        type: "text",
        name: "origin_city",
        required: true,
        max: 200,
      },
      {
        type: "number",
        name: "lat",
        required: false,
      },
      {
        type: "number",
        name: "lng",
        required: false,
      },
      {
        type: "editor",
        name: "story",
        required: false,
      },
      {
        // JPEG/PNG uniquement : le hook Go de stripping EXIF (§7.1, main.go)
        // ré-encode via disintegration/imaging, qui ne sait pas produire de WEBP.
        // Le WEBP servi en front (§8.3) est généré à l'affichage par @nuxt/image,
        // pas stocké tel quel à l'upload.
        type: "file",
        name: "photos",
        required: false,
        maxSelect: 20,
        maxSize: 15728640,
        mimeTypes: ["image/jpeg", "image/png"],
      },
      {
        type: "number",
        name: "purchase_price",
        required: false,
        min: 0,
      },
      {
        type: "number",
        name: "estimated_value",
        required: false,
        min: 0,
      },
      {
        type: "date",
        name: "acquisition_date",
        required: false,
      },
      {
        type: "text",
        name: "private_notes",
        required: false,
        max: 5000,
      },
      {
        type: "bool",
        name: "is_public",
        required: false,
      },
      {
        type: "autodate",
        name: "created",
        onCreate: true,
        onUpdate: false,
      },
      {
        type: "autodate",
        name: "updated",
        onCreate: true,
        onUpdate: true,
      },
    ],
    indexes: [
      "CREATE UNIQUE INDEX idx_knives_slug ON knives (slug)",
    ],
  })

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("knives")
  return app.delete(collection)
})
