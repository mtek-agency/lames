<script setup lang="ts">
// Import dynamique (pas de `import ... from 'maplibre-gl'` statique) : garde
// l'évaluation du module tardive et purement côté navigateur, jamais mêlée
// au graphe SSR/build.
import type { MapLayerMouseEvent, GeoJSONSource, MapLibreMap as MapLibreMapType } from 'maplibre-gl'
import type { PublicKnife } from '#shared/types/knife'

type MapKnife = PublicKnife & { coordinates: { lat: number, lng: number } }

const props = withDefaults(defineProps<{
  knives: MapKnife[]
  cluster?: boolean
  // Désactivé sur la mini-carte de la fiche détail : on est déjà sur la
  // pièce affichée, pas besoin d'un clic vers elle-même.
  interactive?: boolean
  heightClass?: string
  // Cadre "tirage photo" (bordure blanche + ombre) : pertinent pour la
  // mini-carte encadrée dans la fiche détail, pas pour la carte pleine page
  // qui doit au contraire se fondre dans la mise en page (plein bord).
  framed?: boolean
}>(), {
  cluster: true,
  interactive: true,
  heightClass: 'h-[70vh]',
  framed: true
})

const emit = defineEmits<{
  markerClick: [knife: MapKnife]
}>()

const config = useRuntimeConfig()
const mapEl = useTemplateRef('mapEl')
const styleError = ref(false)
const errorMessage = ref('Fond de carte indisponible : clé MapTiler manquante ou invalide.')

let map: MapLibreMapType | null = null

const SOURCE_ID = 'knives'
const CLUSTER_LAYER = 'clusters'
const CLUSTER_COUNT_LAYER = 'cluster-count'
const POINT_LAYER = 'unclustered-point'
const BADGE_ICON = 'copper-badge'

// Petit tampon rectangulaire cuivre dessiné sur un canvas, façon étiquette
// "N°" des cartes du catalogue — plus cohérent avec le reste du site qu'un
// simple rond. Généré une fois en mémoire, pas d'asset externe à charger.
function createBadgeImageData(): ImageData {
  const width = 44
  const height = 28
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!

  const radius = 4
  ctx.beginPath()
  ctx.moveTo(radius + 1, 1)
  ctx.arcTo(width - 1, 1, width - 1, height - 1, radius)
  ctx.arcTo(width - 1, height - 1, 1, height - 1, radius)
  ctx.arcTo(1, height - 1, 1, 1, radius)
  ctx.arcTo(1, 1, width - 1, 1, radius)
  ctx.closePath()

  ctx.fillStyle = '#B87333'
  ctx.fill()
  ctx.lineWidth = 2
  ctx.strokeStyle = '#ffffff'
  ctx.stroke()

  return ctx.getImageData(0, 0, width, height)
}

function toGeoJSON(knives: MapKnife[]) {
  return {
    type: 'FeatureCollection' as const,
    features: knives.map((knife, index) => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [knife.coordinates.lng, knife.coordinates.lat] },
      properties: { id: knife.id, index: index + 1 }
    }))
  }
}

// watch(mapEl) plutôt que onMounted : dans ce composant, sur un chargement
// SSR + hydratation (mais pas en navigation SPA), onMounted peut se déclencher
// avant que le ref de template soit réellement attaché au DOM (confirmé en
// pratique : mapEl.value valait null à l'intérieur d'onMounted). onMounted ne
// se redéclenche jamais, donc la carte ne s'initialisait alors jamais, sans
// la moindre erreur. watch(..., { immediate: true }) réagit dès que l'élément
// existe vraiment, quel que soit l'ordre exact de la séquence de montage.
watch(mapEl, async (el) => {
  if (!el || props.knives.length === 0 || map) return

  if (!config.public.maptilerKey) {
    styleError.value = true
    return
  }

  const { MapLibreMap, NavigationControl, AttributionControl, LngLatBounds } = await import('maplibre-gl')

  if (!mapEl.value) return // le composant a pu être démonté pendant l'import

  // maplibre-gl v6 : le constructeur lance une `GPUInitializationError`
  // *synchrone* si WebGL2 est indisponible (carte graphique désactivée, VM,
  // etc.), au lieu de déclencher l'événement `error` géré plus bas — sans ce
  // try/catch, la carte restait silencieusement vide, sans le message
  // d'erreur prévu ni trace exploitable en console.
  try {
    map = new MapLibreMap({
      container: el,
      style: `https://api.maptiler.com/maps/${config.public.maptilerStyle}/style.json?key=${config.public.maptilerKey}`,
      scrollZoom: false,
      attributionControl: false
    })
  } catch (err) {
    console.error('[KnifeMap] Échec d\'initialisation de MapLibre GL', err)
    errorMessage.value = 'Fond de carte indisponible : rendu 3D (WebGL2) non supporté par ce navigateur.'
    styleError.value = true
    return
  }

  // La page peut être montée pendant une View Transition (navigation SPA,
  // cf. `experimental.viewTransition` dans nuxt.config.ts) : le conteneur
  // existe déjà (watch(mapEl) s'est déclenché) mais sa taille lue à l'instant
  // de la création du canvas WebGL peut ne pas correspondre à sa taille
  // finale réelle. MapLibre ne se re-mesure alors jamais tout seul, et le
  // canvas reste bloqué sur un viewport GL périmé : rien ne s'affiche, sans
  // la moindre erreur. Un `resize()` différé d'une frame force la remesure.
  requestAnimationFrame(() => map?.resize())

  map.addControl(new NavigationControl({ showCompass: false }), 'top-right')
  map.addControl(new AttributionControl({ compact: true }))

  map.on('error', () => {
    styleError.value = true
  })

  map.on('load', () => {
    if (!map) return

    map.addSource(SOURCE_ID, {
      type: 'geojson',
      data: toGeoJSON(props.knives),
      cluster: props.cluster,
      clusterMaxZoom: 14,
      clusterRadius: 50
    })

    if (props.cluster) {
      map.addLayer({
        id: CLUSTER_LAYER,
        type: 'circle',
        source: SOURCE_ID,
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#7D4A20',
          'circle-radius': 18,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      })

      map.addLayer({
        id: CLUSTER_COUNT_LAYER,
        type: 'symbol',
        source: SOURCE_ID,
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count}',
          'text-size': 12
        },
        paint: {
          'text-color': '#ffffff'
        }
      })
    }

    map.addImage(BADGE_ICON, createBadgeImageData())

    map.addLayer({
      id: POINT_LAYER,
      type: 'symbol',
      source: SOURCE_ID,
      filter: props.cluster ? ['!', ['has', 'point_count']] : ['all'],
      layout: {
        'icon-image': BADGE_ICON,
        'icon-allow-overlap': true,
        'text-field': ['get', 'index'],
        'text-size': 11,
        'text-allow-overlap': true
      },
      paint: {
        'text-color': '#ffffff'
      }
    })

    if (props.interactive) {
      map.on('click', CLUSTER_LAYER, async (e: MapLayerMouseEvent) => {
        const features = map!.queryRenderedFeatures(e.point, { layers: [CLUSTER_LAYER] })
        const clusterId = features[0]?.properties?.cluster_id
        if (clusterId == null) return

        const geometry = features[0]?.geometry
        if (geometry?.type !== 'Point') return

        const source = map!.getSource(SOURCE_ID) as GeoJSONSource
        const zoom = await source.getClusterExpansionZoom(clusterId)
        map!.easeTo({ center: geometry.coordinates as [number, number], zoom })
      })

      map.on('click', POINT_LAYER, (e: MapLayerMouseEvent) => {
        const id = e.features?.[0]?.properties?.id
        const knife = props.knives.find(k => k.id === id)
        if (knife) emit('markerClick', knife)
      })

      for (const layer of [CLUSTER_LAYER, POINT_LAYER]) {
        map.on('mouseenter', layer, () => {
          map!.getCanvas().style.cursor = 'pointer'
        })
        map.on('mouseleave', layer, () => {
          map!.getCanvas().style.cursor = ''
        })
      }
    }

    const bounds = new LngLatBounds()
    props.knives.forEach(knife => bounds.extend([knife.coordinates.lng, knife.coordinates.lat]))
    map.fitBounds(bounds, { padding: 40, maxZoom: 10, duration: 0 })
  })
}, { immediate: true })

onBeforeUnmount(() => {
  map?.remove()
  map = null
})
</script>

<template>
  <div
    v-if="knives.length"
    class="knife-map relative w-full"
    :class="[heightClass, framed ? 'border-[6px] border-white shadow-md' : 'border-y border-default/50']"
  >
    <div
      ref="mapEl"
      class="w-full h-full"
    />
    <div class="knife-map-grain absolute inset-0 pointer-events-none" />
    <div
      v-if="styleError"
      class="absolute inset-0 flex items-center justify-center bg-elevated text-muted text-sm text-center px-6"
    >
      {{ errorMessage }}
    </div>
  </div>
  <div
    v-else
    class="flex items-center justify-center bg-elevated text-muted"
    :class="[heightClass, framed ? 'border-[6px] border-white shadow-md' : 'border-y border-default/50']"
  >
    Aucune pièce géolocalisée pour l'instant.
  </div>
</template>
