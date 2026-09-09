/// <reference path="../pb_data/types.d.ts" />

// Génération + déduplication automatique du slug (§7.2 CDCF) : si l'admin ne
// saisit rien, le slug est dérivé du nom ; dans tous les cas il est normalisé
// puis suffixé (-2, -3, ...) en cas de collision avec un slug existant.
//
// Note : PocketBase recompile le code de chaque callback isolément dans un
// runtime JS séparé (pool d'exécuteurs) - aucune fonction top-level de ce
// fichier n'y est visible. Les deux hooks doivent donc être autonomes, d'où
// la duplication des helpers ci-dessous.

onRecordCreateRequest((e) => {
  function slugify(value) {
    var diacritics = new RegExp("[\u0300-\u036f]", "g")
    return (value || "")
      .toString()
      .normalize("NFD")
      .replace(diacritics, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
  }

  function uniqueSlug(app, base, excludeId) {
    var candidate = base
    var attempt = 1

    while (true) {
      var filter = excludeId ? "slug = {:slug} && id != {:id}" : "slug = {:slug}"
      var params = excludeId ? { slug: candidate, id: excludeId } : { slug: candidate }

      try {
        app.findFirstRecordByFilter("knives", filter, params)
      } catch {
        return candidate
      }

      attempt++
      candidate = base + "-" + attempt
    }
  }

  const base = slugify(e.record.get("slug") || e.record.get("name"))
  e.record.set("slug", uniqueSlug(e.app, base))
  e.next()
}, "knives")

onRecordUpdateRequest((e) => {
  function slugify(value) {
    var diacritics = new RegExp("[\u0300-\u036f]", "g")
    return (value || "")
      .toString()
      .normalize("NFD")
      .replace(diacritics, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
  }

  function uniqueSlug(app, base, excludeId) {
    var candidate = base
    var attempt = 1

    while (true) {
      var filter = excludeId ? "slug = {:slug} && id != {:id}" : "slug = {:slug}"
      var params = excludeId ? { slug: candidate, id: excludeId } : { slug: candidate }

      try {
        app.findFirstRecordByFilter("knives", filter, params)
      } catch {
        return candidate
      }

      attempt++
      candidate = base + "-" + attempt
    }
  }

  const base = slugify(e.record.get("slug") || e.record.get("name"))
  e.record.set("slug", uniqueSlug(e.app, base, e.record.get("id")))
  e.next()
}, "knives")
