import { Camera, Mesh, Plane, Program, Renderer, Texture, Transform } from 'ogl'

// Rouleau desktop en WebGL, inspiré de jesperlandberg.com : les cartes sont
// posées sur un tambour qui tourne autour d'un axe vertical. La molette, le
// trackpad ou un glisser font défiler en boucle infinie ; pendant le
// mouvement, une vague proportionnelle à la vitesse fait onduler les cartes.

export interface CylinderLayout {
  cardWidth: number
  cardHeight: number
  // Décalage vers le haut de la carte centrale (px), pour la légende dessous.
  lift: number
}

export interface CylinderGalleryOptions {
  container: HTMLElement
  // Une image par pièce, dans l'ordre ; null = tuile vide.
  images: (string | null)[]
  startIndex: number
  reducedMotion: boolean
  onSelect: (index: number) => void
  onOpen: (index: number) => void
  onLayout: (layout: CylinderLayout) => void
}

const FOV = 35
// La maquette place la carte centrale 20 px au-dessus du centre de l'écran.
const LIFT = 20
// Grande carte paysage (3:2), comme sur jesperlandberg.com : ~50 % de la
// largeur, limitée par la hauteur pour laisser la place au header, à la
// légende et à la barre du bas.
const CARD_RATIO = 3 / 2
const CARD_MAX_WIDTH = 0.5
const VERTICAL_RESERVE = 340
const CARD_MIN_HEIGHT = 280
// Le rayon du tambour règle la courbure : les cartes voisines dépassent
// d'environ un quart d'écran de chaque côté.
const GAP_RATIO = 0.06
const RADIUS_RATIO = 2
// Au-delà de cet angle (rad), une carte est presque de profil : on la masque.
const MAX_ANGLE = 1.7

// Sensation du défilement, calée sur celle de jesperlandberg.com :
// - 1 px de molette / trackpad = 1,25 px de rouleau ;
// - un cran de molette de souris (gros delta isolé) compte double et
//   s'étale sur quelques frames, pour ne pas donner d'à-coups ;
// - la position affichée rattrape la cible de 10 % par frame ;
// - la cible ne peut pas devancer l'affichage de plus d'une largeur d'écran
//   (borne douce en tanh : pas de butée sèche sur un coup de trackpad).
const WHEEL_MULTIPLIER = 1.25
const NOTCH_MULTIPLIER = 2
const NOTCH_MIN_DELTA = 40
const NOTCH_EASE = 0.22
const BURST_GAP = 30
const BURST_COOLDOWN = 500
const EASE = 0.1
const MAX_LEAD_VIEWPORTS = 1
// Le rouleau se cale sur une carte (pour la légende) une fois le défilement
// retombé, en favorisant la carte vers laquelle on allait : un seul cran de
// molette (~1/3 de carte) suffit à passer à la suivante.
const SNAP_DELAY = 300
const SNAP_BIAS = 0.35

const vertex = /* glsl */ `
attribute vec3 position;
attribute vec2 uv;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform vec2 uSize;
uniform float uOffset;
uniform float uRadius;
uniform float uVelocity;

varying vec2 vUv;
varying float vAngle;

void main() {
  vUv = uv;

  // Position le long du ruban, enroulée sur le tambour.
  float s = uOffset + position.x * uSize.x;
  float angle = s / uRadius;
  vec3 p = vec3(sin(angle) * uRadius, position.y * uSize.y, (cos(angle) - 1.0) * uRadius);

  // Vague verticale qui traverse le tambour pendant le défilement.
  p.y += uVelocity * uSize.y * 0.14 * sin(angle * 3.2);

  vAngle = angle;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
`

const fragment = /* glsl */ `
precision highp float;

uniform sampler2D tMap;
uniform vec2 uSize;
uniform vec2 uImageSize;
uniform float uCorner;
uniform float uReveal;

varying vec2 vUv;
varying float vAngle;

float roundedBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

void main() {
  // Équivalent de object-fit: cover.
  float planeAspect = uSize.x / uSize.y;
  float imageAspect = uImageSize.x / uImageSize.y;
  vec2 scale = planeAspect > imageAspect
    ? vec2(1.0, imageAspect / planeAspect)
    : vec2(planeAspect / imageAspect, 1.0);
  vec2 uv = (vUv - 0.5) * scale + 0.5;

  // Tuile #1C1C1C tant que l'image n'est pas chargée, puis fondu.
  vec3 color = mix(vec3(0.11), texture2D(tMap, uv).rgb, uReveal);

  // Les cartes s'assombrissent en tournant vers l'arrière du tambour.
  float shade = mix(1.0, 0.35, smoothstep(0.0, 1.35, abs(vAngle)));
  float fade = 1.0 - smoothstep(1.25, 1.55, abs(vAngle));

  float d = roundedBox((vUv - 0.5) * uSize, uSize * 0.5, uCorner);
  float edge = 1.0 - smoothstep(-0.75, 0.75, d);

  gl_FragColor = vec4(color * shade, edge * fade);
}
`

interface Card {
  mesh: Mesh
  program: Program
  // Index de la pièce affichée (les pièces sont répétées si elles sont peu
  // nombreuses, pour que la boucle ne laisse jamais de trou).
  index: number
  revealStart: number | null
}

const mod = (value: number, length: number) => ((value % length) + length) % length

export class CylinderGallery {
  private renderer: Renderer
  private camera: Camera
  private scene = new Transform()
  private cards: Card[] = []
  private options: CylinderGalleryOptions

  private layout: CylinderLayout = { cardWidth: 420, cardHeight: 460, lift: LIFT }
  private step = 0
  private radius = 0
  private viewport = { width: 0, height: 0 }

  // Positions exprimées en cartes (1 = une carte) : le défilement reste
  // cohérent quand la taille des cartes change au redimensionnement.
  private current: number
  private target: number
  private velocity = 0
  private selected = -1

  private dragging = false
  private dragStartX = 0
  private dragStartTarget = 0
  private dragDistance = 0
  private lastPointerX = 0

  private snapTimer: ReturnType<typeof setTimeout> | undefined
  private frame = 0
  private lastTime = 0
  private pendingNotch = 0
  private direction = 0
  private lastWheelTime = 0
  private burstStart = -BURST_COOLDOWN
  private needsRender = true
  private resizeObserver: ResizeObserver

  constructor(options: CylinderGalleryOptions) {
    this.options = options
    this.current = this.target = options.startIndex

    this.renderer = new Renderer({
      dpr: Math.min(window.devicePixelRatio, 2),
      alpha: true,
      antialias: true
    })
    const gl = this.renderer.gl
    if (!gl) throw new Error('WebGL indisponible')
    gl.clearColor(0, 0, 0, 0)

    const canvas = gl.canvas as HTMLCanvasElement
    canvas.style.display = 'block'
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    options.container.appendChild(canvas)

    this.camera = new Camera(gl, { fov: FOV, near: 1, far: 10000 })

    this.createCards()
    this.resize()

    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(options.container)

    canvas.addEventListener('pointerdown', this.onPointerDown)
    canvas.addEventListener('pointermove', this.onPointerMove)
    canvas.addEventListener('pointerup', this.onPointerUp)
    canvas.addEventListener('pointercancel', this.onPointerUp)
    canvas.addEventListener('pointerleave', this.onPointerLeave)
    window.addEventListener('wheel', this.onWheel, { passive: true })

    this.frame = requestAnimationFrame(this.tick)
  }

  next() {
    this.goTo(Math.round(this.target) + 1)
  }

  prev() {
    this.goTo(Math.round(this.target) - 1)
  }

  destroy() {
    cancelAnimationFrame(this.frame)
    clearTimeout(this.snapTimer)
    this.resizeObserver.disconnect()
    window.removeEventListener('wheel', this.onWheel)

    const gl = this.renderer.gl
    const canvas = gl.canvas as HTMLCanvasElement
    canvas.removeEventListener('pointerdown', this.onPointerDown)
    canvas.removeEventListener('pointermove', this.onPointerMove)
    canvas.removeEventListener('pointerup', this.onPointerUp)
    canvas.removeEventListener('pointercancel', this.onPointerUp)
    canvas.removeEventListener('pointerleave', this.onPointerLeave)
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    canvas.remove()
  }

  private createCards() {
    const gl = this.renderer.gl
    const geometry = new Plane(gl, { widthSegments: 48, heightSegments: 16 })
    const { images } = this.options

    // Le ruban doit couvrir au moins la face visible du tambour (π × rayon)
    // plus une carte de marge de chaque côté, sinon la boucle se verrait.
    const minCount = Math.ceil((Math.PI * RADIUS_RATIO) / (1 + GAP_RATIO)) + 2
    const repeat = Math.max(1, Math.ceil(minCount / images.length))

    const textures = images.map((url) => {
      const texture = new Texture(gl)
      const entry = { texture, size: [1, 1], loadedAt: null as number | null }
      if (url) {
        const image = new Image()
        image.crossOrigin = 'anonymous'
        image.decoding = 'async'
        image.onload = () => {
          texture.image = image
          entry.size = [image.naturalWidth, image.naturalHeight]
          entry.loadedAt = performance.now()
          for (const card of this.cards) {
            if (images[card.index] !== url) continue
            card.program.uniforms.uImageSize!.value = entry.size
            card.revealStart = entry.loadedAt
          }
          this.needsRender = true
        }
        image.src = url
      }
      return entry
    })

    for (let slot = 0; slot < images.length * repeat; slot++) {
      const index = slot % images.length
      const program = new Program(gl, {
        vertex,
        fragment,
        transparent: true,
        cullFace: false,
        uniforms: {
          tMap: { value: textures[index]!.texture },
          uSize: { value: [1, 1] },
          uImageSize: { value: textures[index]!.size },
          uOffset: { value: 0 },
          uRadius: { value: 1 },
          uVelocity: { value: 0 },
          uCorner: { value: 18 },
          uReveal: { value: 0 }
        }
      })
      const mesh = new Mesh(gl, { geometry, program })
      // Les sommets sont déplacés dans le shader : les bornes de la géométrie
      // ne reflètent pas la position réelle de la carte.
      mesh.frustumCulled = false
      mesh.setParent(this.scene)
      this.cards.push({ mesh, program, index, revealStart: textures[index]!.loadedAt })
    }
  }

  private resize() {
    const { clientWidth: width, clientHeight: height } = this.options.container
    if (!width || !height) return
    this.viewport = { width, height }

    this.renderer.setSize(width, height)
    this.camera.perspective({ aspect: width / height })

    // Caméra placée pour que le plan avant du tambour soit à l'échelle 1 px.
    const distance = height / (2 * Math.tan((FOV * Math.PI) / 360))
    this.camera.position.set(0, -LIFT, distance)

    const cardWidth = Math.max(
      Math.min(width * CARD_MAX_WIDTH, (height - VERTICAL_RESERVE) * CARD_RATIO),
      CARD_MIN_HEIGHT * CARD_RATIO
    )
    const cardHeight = cardWidth / CARD_RATIO
    this.step = cardWidth * (1 + GAP_RATIO)
    this.radius = cardWidth * RADIUS_RATIO
    this.layout = { cardWidth, cardHeight, lift: LIFT }

    for (const { program } of this.cards) {
      program.uniforms.uSize!.value = [cardWidth, cardHeight]
      program.uniforms.uRadius!.value = this.radius
    }

    this.options.onLayout(this.layout)
    this.needsRender = true
  }

  private tick = (time: number) => {
    this.frame = requestAnimationFrame(this.tick)

    const dt = this.lastTime ? Math.min(Math.max((time - this.lastTime) / (1000 / 60), 0.01), 4) : 1
    this.lastTime = time

    // Crans de molette étalés sur plusieurs frames.
    if (this.pendingNotch) {
      const share = this.pendingNotch * (1 - Math.pow(1 - NOTCH_EASE, dt))
      this.pendingNotch -= share
      if (Math.abs(this.pendingNotch) < 0.05) {
        this.scrollBy(share + this.pendingNotch)
        this.pendingNotch = 0
      } else {
        this.scrollBy(share)
      }
    }

    const previous = this.current
    const ease = 1 - Math.pow(1 - (this.options.reducedMotion ? 0.2 : EASE), dt)
    this.current += (this.target - this.current) * ease
    if (Math.abs(this.target - this.current) < 0.0005) this.current = this.target

    const frameVelocity = (this.current - previous) / dt
    this.velocity += (frameVelocity - this.velocity) * Math.min(0.12 * dt, 1)
    if (Math.abs(this.velocity) < 0.0001) this.velocity = 0

    const selected = mod(Math.round(this.current), this.options.images.length)
    if (selected !== this.selected) {
      this.selected = selected
      this.options.onSelect(selected)
    }

    let revealing = false
    for (const card of this.cards) {
      if (card.revealStart === null) continue
      const reveal = Math.min(Math.max((time - card.revealStart) / 600, 0), 1)
      card.program.uniforms.uReveal!.value = reveal
      if (reveal < 1) revealing = true
    }

    // Rendu à la demande : rien n'est redessiné quand le rouleau est immobile.
    const moving = this.current !== previous || this.velocity !== 0
    if (!moving && !revealing && !this.needsRender) return
    this.needsRender = false

    const count = this.cards.length
    const wave = this.options.reducedMotion ? 0 : Math.max(-1, Math.min(1, this.velocity * 5))

    this.cards.forEach((card, slot) => {
      // Position de la carte par rapport au centre, ramenée dans le ruban
      // [-count/2, count/2) : c'est ce qui rend la boucle infinie.
      const offset = (mod(slot - this.current + count / 2, count) - count / 2) * this.step
      const visible = Math.abs(offset / this.radius) < MAX_ANGLE
      card.mesh.visible = visible
      if (!visible) return

      card.program.uniforms.uOffset!.value = offset
      card.program.uniforms.uVelocity!.value = wave
    })

    this.renderer.render({ scene: this.scene, camera: this.camera })
  }

  private goTo(position: number) {
    clearTimeout(this.snapTimer)
    this.pendingNotch = 0
    this.direction = 0
    this.target = position
  }

  // Après une rafale de molette ou un glisser, le rouleau se cale sur la
  // carte la plus proche (celle dont la légende est affichée).
  private scheduleSnap(delay = SNAP_DELAY) {
    clearTimeout(this.snapTimer)
    this.snapTimer = setTimeout(() => {
      if (this.dragging) return
      if (this.pendingNotch) return this.scheduleSnap(delay)
      this.target = Math.round(this.target + SNAP_BIAS * this.direction)
      this.direction = 0
    }, delay)
  }

  // Avance la cible de `px` pixels de rouleau, avec la borne douce sur
  // l'avance maximale par rapport à la position affichée.
  private scrollBy(px: number) {
    if (px) this.direction = Math.sign(px)
    const limit = (this.viewport.width * MAX_LEAD_VIEWPORTS) / this.step
    const lead = this.target + px / this.step - this.current
    this.target = this.current + Math.tanh(lead / limit) * limit
  }

  private onWheel = (event: WheelEvent) => {
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? this.viewport.height : 1
    const delta = (Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY) * unit

    // Trackpad / molette libre : flux d'événements rapprochés. Molette
    // crantée : gros deltas isolés, en dehors d'une rafale récente.
    const gap = event.timeStamp - this.lastWheelTime
    if (gap < BURST_GAP) this.burstStart = event.timeStamp
    const notch = Math.abs(delta) >= NOTCH_MIN_DELTA && gap >= BURST_GAP && event.timeStamp - this.burstStart >= BURST_COOLDOWN
    this.lastWheelTime = event.timeStamp

    if (notch) {
      this.pendingNotch += delta * WHEEL_MULTIPLIER * NOTCH_MULTIPLIER
      this.direction = Math.sign(delta)
    } else {
      this.scrollBy(delta * WHEEL_MULTIPLIER)
    }

    this.scheduleSnap()
  }

  private centerHit(event: PointerEvent) {
    const rect = (this.renderer.gl.canvas as HTMLCanvasElement).getBoundingClientRect()
    const x = event.clientX - rect.left - rect.width / 2
    const y = event.clientY - rect.top - (rect.height / 2 - LIFT)
    return {
      x,
      inside: Math.abs(x) <= this.layout.cardWidth / 2 && Math.abs(y) <= this.layout.cardHeight / 2
    }
  }

  private setCursor(cursor: string) {
    (this.renderer.gl.canvas as HTMLCanvasElement).style.cursor = cursor
  }

  private onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0) return
    clearTimeout(this.snapTimer)
    this.pendingNotch = 0
    this.dragging = true
    this.dragStartX = event.clientX
    this.lastPointerX = event.clientX
    this.dragStartTarget = this.target
    this.dragDistance = 0
    ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
  }

  private onPointerMove = (event: PointerEvent) => {
    if (!this.dragging) {
      this.setCursor(this.centerHit(event).inside ? 'pointer' : 'grab')
      return
    }

    const dx = event.clientX - this.dragStartX
    this.dragDistance = Math.max(this.dragDistance, Math.abs(dx))
    // Sens du dernier mouvement de la main, pour le calage au relâcher.
    if (event.clientX !== this.lastPointerX) this.direction = -Math.sign(event.clientX - this.lastPointerX)
    this.lastPointerX = event.clientX
    this.target = this.dragStartTarget - dx / this.step
    if (this.dragDistance > 6) this.setCursor('grabbing')
  }

  private onPointerUp = (event: PointerEvent) => {
    if (!this.dragging) return
    this.dragging = false

    if (this.dragDistance > 6) {
      this.scheduleSnap(0)
      this.setCursor('grab')
      return
    }

    // Simple clic : la carte centrale ouvre la fiche, une carte latérale
    // vient au centre.
    const hit = this.centerHit(event)
    if (hit.inside && Math.abs(this.target - Math.round(this.target)) < 0.05) {
      this.options.onOpen(this.selected)
    } else if (!hit.inside) {
      this.goTo(Math.round(this.target) + Math.sign(hit.x))
    }
  }

  private onPointerLeave = () => {
    if (!this.dragging) this.setCursor('')
  }
}
