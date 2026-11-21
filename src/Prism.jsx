import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import gsap from 'gsap'

// A real glass prism in WebGL. The light is not drawn on top of it: a white ray is traced through the prism's
// cross-section with Snell's law, once per wavelength, and every beam, glint and lit face comes from that trace.
// White enters the left face, bends, splits inside the glass and leaves the right face as a spectrum.
// The glass itself is a bevelled extrusion with a transmissive, dispersive physical material, lit by a dark studio
// environment, so its faces and chamfers catch light by their own orientation.
// The traced beam (in screen pixels) is published on the hero as `prismBeam` + a `prism:beam` event for CodeField.

// Cross-section, side 1, centroid at the origin, counter-clockwise: apex, left, right.
const H = Math.sqrt(3) / 2
const TRI = [[0, (H * 2) / 3], [-0.5, -H / 3], [0.5, -H / 3]]
const EDGES = TRI.map((p, i) => {
  const q = TRI[(i + 1) % 3], dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy)
  return { p, q, n: [dy / l, -dx / l] } // outward normal
})
const DEPTH = 0.55

// Optics. Dispersion is exaggerated (real crown glass spreads about a tenth of this) so the fan reads on screen.
const N_RED = 1.45, N_VIOLET = 1.62
const ior = (t) => N_RED + (N_VIOLET - N_RED) * t // t: 0 red … 1 violet
const AIM = [-(0.5 - 0.5 * 0.42), -H / 3 + H * 0.42] // where the light lands on the left face
// Resting source direction: minimum deviation for the middle of the spectrum (the ray runs parallel to the base inside)
const REST = 30 - (Math.asin(ior(0.5) / 2) * 180) / Math.PI // degrees, direction from the face back toward the source
const BEAM_W = 0.045
const BANDS = 14

const dot = (a, b) => a[0] * b[0] + a[1] * b[1]
const add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k]
const norm = (a) => { const l = Math.hypot(a[0], a[1]); return [a[0] / l, a[1] / l] }
const reflect = (d, n) => add(d, n, -2 * dot(d, n))
// n faces against d; eta = n1 / n2. Null on total internal reflection.
const refract = (d, n, eta) => {
  const c = -dot(d, n), k = 1 - eta * eta * (1 - c * c)
  return k < 0 ? null : add([d[0] * eta, d[1] * eta], n, eta * c - Math.sqrt(k))
}
const schlick = (c, n1, n2) => { const r = ((n1 - n2) / (n1 + n2)) ** 2; return r + (1 - r) * (1 - c) ** 5 }

function hit(o, d, skip) {
  let best = null
  EDGES.forEach((e, i) => {
    if (i === skip) return
    const ex = e.q[0] - e.p[0], ey = e.q[1] - e.p[1], den = d[0] * ey - d[1] * ex
    if (Math.abs(den) < 1e-9) return
    const wx = e.p[0] - o[0], wy = e.p[1] - o[1]
    const t = (wx * ey - wy * ex) / den, u = (wx * d[1] - wy * d[0]) / den
    if (t > 1e-6 && u >= 0 && u <= 1 && (!best || t < best.t)) best = { t, i, p: add(o, d, t), n: e.n }
  })
  return best
}

// One wavelength through the glass: refract in, bounce off any face that totally reflects, refract out.
function trace(o, d, n) {
  const entry = hit(o, d)
  if (!entry || dot(d, entry.n) >= 0) return null
  let p = entry.p, dir = refract(d, entry.n, 1 / n), skip = entry.i
  for (let k = 0; k < 4; k++) {
    const exit = hit(p, dir, skip)
    if (!exit) return null
    const out = refract(dir, [-exit.n[0], -exit.n[1]], n)
    if (out) return { entry, exit, inner: dir, from: p, out }
    dir = reflect(dir, exit.n); p = exit.p; skip = exit.i
  }
  return null
}

// Visible spectrum as a smooth sum of gaussians (red, green, blue, plus the red in violet). Same curve in GLSL.
const spectrum = (t) => [
  Math.exp(-((t / 0.28) ** 2)) + 0.4 * Math.exp(-(((t - 1) / 0.15) ** 2)),
  Math.exp(-(((t - 0.42) / 0.2) ** 2)),
  Math.exp(-(((t - 0.78) / 0.22) ** 2)),
]
// The bands are weighted so that, overlapping, they add back up to exactly white: the beam is white until it splits.
const BAND = (() => {
  const ts = Array.from({ length: BANDS }, (_, i) => (i + 0.5) / BANDS)
  const sum = ts.reduce((s, t) => spectrum(t).map((c, k) => s[k] + c), [0, 0, 0])
  return ts.map((t) => ({ t, c: spectrum(t).map((c, k) => c / sum[k]) }))
})()

const GLSL_SPECTRUM = `vec3 spectrum(float t) { return vec3(exp(-pow(t / .28, 2.)) + .4 * exp(-pow((t - 1.) / .15, 2.)), exp(-pow((t - .42) / .2, 2.)), exp(-pow((t - .78) / .22, 2.))); }`

// A beam: a ribbon in the cross-section plane, laid out on the GPU from its start, direction, length and widths.
const RIBBON_VS = `
uniform vec2 uA, uDir; uniform float uLen, uW0, uW1;
varying vec2 vUv;
void main() {
  vUv = uv;
  vec2 perp = vec2(-uDir.y, uDir.x);
  vec2 p = uA + uDir * uv.x * uLen + perp * (uv.y * 2. - 1.) * mix(uW0, uW1, uv.x);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 0., 1.);
}`
const RIBBON_FS = `
uniform vec3 uColor; uniform float uFadeIn, uI, uSharp, uNoise, uDecay, uSpectral, uFlip, uSeed, uFront, uFrontDir, uTime, uLen, uW0, uW1;
varying vec2 vUv;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + 1.), f.x), f.y); }
${GLSL_SPECTRUM}
void main() {
  float v = vUv.y * 2. - 1., d = vUv.x * uLen;
  // The light front: how far along the ribbon the light has reached (load-in)
  float shown = uFrontDir > 0. ? 1. - smoothstep(uFront - .08, uFront, d) : smoothstep(uFront, uFront + .08, d);
  // Spreading dims it: the same light over a wider band
  float a = exp(-v * v * uSharp) * uW0 / mix(uW0, uW1, vUv.x) * exp(-d * uDecay) * shown * smoothstep(0., uFadeIn + 1e-4, d);
  if (uNoise > 0.) {
    float n = vnoise(vec2(d * 2.2 - uTime * .12, v * 1.6 + uSeed)) * .65 + vnoise(vec2(d * 5. + uTime * .05, v * 3.1 - uSeed)) * .35;
    a *= mix(1., .25 + 1.5 * n, uNoise);
  }
  vec3 c = uSpectral > .5 ? spectrum(uFlip > .5 ? 1. - vUv.y : vUv.y) : uColor;
  gl_FragColor = vec4(c * a * uI, 1.);
}`
const FLARE_VS = `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`
const FLARE_FS = `
uniform vec3 uColor; uniform float uI; varying vec2 vUv;
void main() {
  vec2 p = vUv * 2. - 1.; float r = length(p);
  float a = exp(-r * r * 60.) + exp(-r * 5.) * .2 + exp(-abs(p.y) * 90.) * exp(-abs(p.x) * 3.) * .5 + exp(-abs(p.x) * 90.) * exp(-abs(p.y) * 5.) * .12;
  gl_FragColor = vec4(uColor * a * (1. - smoothstep(.75, 1., r)) * uI, 1.);
}`

// Added to the glass material: where the light sheet crosses a face, the face lights up along the depth of the glass
// (the bright slivers at the corners), and light scattering in the bulk glows faintly along the path inside.
const SPOTS = 6, SEGS = 3
const GLASS_HEAD = `
uniform vec2 uSpotP[${SPOTS}]; uniform vec3 uSpotC[${SPOTS}];
uniform vec2 uSegA[${SEGS}]; uniform vec2 uSegB[${SEGS}]; uniform vec3 uSegC[${SEGS}];
uniform float uSpotR, uSheet, uScatterR;
varying vec3 vLocal; varying vec3 vLocalN;
float segDist(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; return length(pa - ba * clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0., 1.)); }`
const GLASS_BODY = `{
  float wall = 1. - smoothstep(.3, .8, abs(vLocalN.z));
  vec3 beam = vec3(0.);
  for (int i = 0; i < ${SPOTS}; i++) { vec2 q = vLocal.xy - uSpotP[i]; beam += uSpotC[i] * exp(-dot(q, q) / (uSpotR * uSpotR)); }
  beam *= wall * exp(-pow(vLocal.z / uSheet, 2.));
  if (gl_FrontFacing && vLocalN.z > .8) for (int i = 0; i < ${SEGS}; i++) {
    float d = segDist(vLocal.xy, uSegA[i], uSegB[i]); beam += uSegC[i] * exp(-d * d / (uScatterR * uScatterR));
  }
  totalEmissiveRadiance += beam;
}`

// The triangle with slightly rounded corners, so the long edges of the glass catch a highlight too.
function triShape(r) {
  const s = new THREE.Shape()
  TRI.forEach((p, i) => {
    const prev = TRI[(i + 2) % 3], next = TRI[(i + 1) % 3]
    const a = add(p, norm(add(prev, p, -1)), r), b = add(p, norm(add(next, p, -1)), r)
    i ? s.lineTo(...a) : s.moveTo(...a)
    s.quadraticCurveTo(p[0], p[1], b[0], b[1])
  })
  return s
}

// A dark studio: black, with a few narrow light strips. Faces and chamfers only light up when they turn toward one.
function studio(renderer) {
  const env = new THREE.Scene()
  env.add(new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), new THREE.MeshBasicMaterial({ color: 0, side: THREE.BackSide })))
  const strip = (w, h, pos, k) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color().setScalar(k), side: THREE.DoubleSide }))
    m.position.set(...pos); m.lookAt(0, 0, 0); env.add(m)
  }
  strip(7, 0.5, [0, 4.6, 0.5], 7) // long strip overhead: the top chamfers
  strip(0.45, 5, [4.6, 0.6, 1.5], 5) // tall strip on the right
  strip(0.3, 4, [-4.6, -0.8, 0.5], 9) // narrow, hot strip on the left, the side the light comes from
  strip(2.2, 1.2, [-2.4, 2.6, 4.4], 1.6) // soft box up front, a faint sheen across the face
  strip(4, 0.25, [0.5, -4.6, 2], 0.8) // bounce from below: the bottom edge
  const pmrem = new THREE.PMREMGenerator(renderer)
  const tex = pmrem.fromScene(env, 0).texture
  pmrem.dispose()
  env.traverse((o) => { o.geometry?.dispose(); o.material?.dispose() })
  return tex
}

const FOV = 36
// Convex hull of 2D points (monotone chain).
function hull2(ps) {
  ps = [...ps].sort((a, b) => a[0] - b[0] || a[1] - b[1])
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  const half = (list) => list.reduce((h, p) => { while (h.length > 1 && cr(h[h.length - 2], h[h.length - 1], p) <= 0) h.pop(); h.push(p); return h }, [])
  const lo = half(ps), hi = half([...ps].reverse())
  return [...lo.slice(0, -1), ...hi.slice(0, -1)]
}

// Refraction map for the glass filter, in the prism's on-screen box (apex top centre, base along the bottom): red and green
// hold how far each pixel's sample is pulled inward, strongest at the edges and falling off over a bezel, flat inside.
let mapUrl
function glassMap() {
  if (mapUrl) return mapUrl
  const N = 256, c = document.createElement('canvas'); c.width = c.height = N
  const g = c.getContext('2d'), img = g.createImageData(N, N)
  // Edges as inward unit normal n and offset k (inside where n.p + k > 0), for the triangle (0.5,0) (0,1) (1,1).
  const edges = [[[0, -1], 1], [[0.894, 0.447], -0.447], [[-0.894, 0.447], 0.447]], bezel = 0.22
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const p = [(x + 0.5) / N, (y + 0.5) / N]
    let d = Infinity, n = [0, 0]
    for (const [e, k] of edges) { const v = e[0] * p[0] + e[1] * p[1] + k; if (v < d) { d = v; n = e } }
    const m = d < 0 ? 0 : Math.max(0, 1 - d / bezel) ** 2
    img.data.set([128 + n[0] * m * 127, 128 + n[1] * m * 127, 128, 255], (y * N + x) * 4)
  }
  g.putImageData(img, 0, 0)
  return (mapUrl = c.toDataURL())
}

export default function Prism() {
  const ref = useRef(), blurRef = useRef(), svgRef = useRef()

  useEffect(() => {
    const canvas = ref.current, hero = canvas.closest('.hero'), title = hero.querySelector('h1.hero-title')
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches
    let renderer
    try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' }) } catch { return } // no WebGL: the code field alone
    const dpr = Math.min(devicePixelRatio, 1.5)
    renderer.setPixelRatio(dpr)
    renderer.setClearColor(0x000000) // the canvas is screen-blended over the page: black adds nothing
    renderer.toneMapping = THREE.ACESFilmicToneMapping

    const scene = new THREE.Scene()
    scene.environment = studio(renderer)
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 50)
    const rig = new THREE.Group() // prism + light, seen a little from above
    rig.rotation.x = -0.22
    scene.add(rig)
    const time = { value: 0 }

    // Glass
    const geo = new THREE.ExtrudeGeometry(triShape(0.035), {
      depth: DEPTH, bevelEnabled: true, bevelThickness: 0.035, bevelSize: 0.03, bevelOffset: -0.03, bevelSegments: 3, curveSegments: 6,
    }).translate(0, 0, -DEPTH / 2)
    const glassU = {
      uSpotP: { value: Array.from({ length: SPOTS }, () => new THREE.Vector2()) },
      uSpotC: { value: Array.from({ length: SPOTS }, () => new THREE.Color(0)) },
      uSegA: { value: Array.from({ length: SEGS }, () => new THREE.Vector2()) },
      uSegB: { value: Array.from({ length: SEGS }, () => new THREE.Vector2()) },
      uSegC: { value: Array.from({ length: SEGS }, () => new THREE.Color(0)) },
      uSpotR: { value: 0.055 }, uSheet: { value: DEPTH * 0.42 }, uScatterR: { value: 0.05 },
    }
    // Surface texture: a fine grain drawn once to a canvas and used to vary the glass's roughness and bump,
    // so highlights soften slightly instead of sitting on a perfect surface.
    const tc = document.createElement('canvas'); tc.width = tc.height = 512
    const g = tc.getContext('2d'), img = g.createImageData(512, 512)
    for (let i = 0; i < img.data.length; i += 4) { const v = 110 + Math.random() * 40; img.data.set([v, v, v, 255], i) }
    g.putImageData(img, 0, 0)
    const tex = new THREE.CanvasTexture(tc)
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(1.5, 1.5); tex.anisotropy = 4
    const glass = new THREE.MeshPhysicalMaterial({
      roughnessMap: tex, bumpMap: tex, bumpScale: 0.6,
      color: 0xffffff, metalness: 0, roughness: 0.12, transmission: 1, ior: ior(0.5), thickness: 0.6, dispersion: 5,
      attenuationColor: new THREE.Color(0xa3acc0), attenuationDistance: 0.8, specularIntensity: 1, envMapIntensity: 0, side: THREE.DoubleSide,
    })
    glass.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, glassU)
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vLocal; varying vec3 vLocalN;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLocal = position; vLocalN = normal;')
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>\n${GLASS_HEAD}`)
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>\n${GLASS_BODY}`)
    }
    const prism = new THREE.Mesh(geo, glass)
    rig.add(prism)

    // Light. Beams are opaque-additive so the transmission pass sees them: what lies behind or inside the glass is
    // refracted and dispersed by it, not pasted over it.
    const ribbonGeo = new THREE.PlaneGeometry(1, 1, 24, 1)
    const ribbon = ({ color = [1, 1, 1], i = 1, w0 = BEAM_W, w1 = w0, sharp = 4, noise = 0, decay = 0, spectral = 0, frontDir = 1, fadeIn = 0 }) => {
      const m = new THREE.ShaderMaterial({
        vertexShader: RIBBON_VS, fragmentShader: RIBBON_FS, blending: THREE.AdditiveBlending, depthWrite: false,
        uniforms: {
          uA: { value: new THREE.Vector2() }, uDir: { value: new THREE.Vector2(1, 0) }, uLen: { value: 1 }, uW0: { value: w0 }, uW1: { value: w1 },
          uColor: { value: new THREE.Color(...color) }, uI: { value: i }, uFadeIn: { value: fadeIn }, uSharp: { value: sharp }, uNoise: { value: noise }, uDecay: { value: decay },
          uSpectral: { value: spectral }, uFlip: { value: 0 }, uSeed: { value: Math.random() * 10 }, uFront: { value: 0 }, uFrontDir: { value: frontDir }, uTime: time,
        },
      })
      const mesh = new THREE.Mesh(ribbonGeo, m)
      mesh.frustumCulled = false
      rig.add(mesh)
      return m.uniforms
    }
    const place = (u, a, d, len) => { u.uA.value.set(...a); u.uDir.value.set(...d); u.uLen.value = len }
    const flare = (size, color, i) => {
      const m = new THREE.ShaderMaterial({
        vertexShader: FLARE_VS, fragmentShader: FLARE_FS, blending: THREE.AdditiveBlending, transparent: true, depthTest: false, depthWrite: false,
        uniforms: { uColor: { value: new THREE.Color(...color) }, uI: { value: i } },
      })
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), m)
      mesh.renderOrder = 2
      rig.add(mesh)
      return mesh
    }

    const LONG = 9
    const inCore = ribbon({ i: 0.9, w0: BEAM_W * 0.4, w1: BEAM_W * 0.6, sharp: 5, frontDir: -1 })
    const inHalo = ribbon({ i: 0.05, w0: BEAM_W * 3.5, w1: BEAM_W * 5, sharp: 6, noise: 0.5, decay: 0.3, frontDir: -1 })
    const inner = BAND.map(({ c }) => ribbon({ color: c, i: 0.8, w0: BEAM_W * 0.7, sharp: 5 }))
    const fan = BAND.map(({ c }) => ribbon({ color: c, i: 1.3, w0: BEAM_W * 0.6, w1: BEAM_W * 42, sharp: 3.2, noise: 1, decay: 0.3, fadeIn: 0.35 }))
    const fanGlow = ribbon({ spectral: 1, i: 0.3, w0: BEAM_W, sharp: 2.5, noise: 1, decay: 0.2, fadeIn: 0.5 })
    const extRefl = ribbon({ i: 1, w0: BEAM_W * 0.4, w1: BEAM_W * 2, sharp: 4, decay: 0.6 })
    const intRefl = ribbon({ i: 1, w0: BEAM_W * 0.5, sharp: 3 })
    const hotIn = flare(0.42, [1, 1, 1], 0)
    const hotOut = flare(0.26, [1, 0.95, 0.9], 0)

    // Load-in, on the same beat as App's timeline: the glass settles, white light runs in from the left,
    // the glass lights up as it lands, and the spectrum bursts out to the right.
    const s = still ? { glass: 1, front: 1, lit: 1, fan: 1, flare: 1 } : { glass: 0, front: 0, lit: 0, fan: 0, flare: 0 }
    const intro = still ? null : gsap.timeline()
      .to(s, { glass: 1, duration: 0.8, ease: 'expo.out' }, 0.45)
      .to(s, { front: 1, duration: 0.45, ease: 'power2.in' }, 1.1)
      .to(s, { lit: 1, duration: 0.5, ease: 'power2.out' }, 1.55)
      .fromTo(s, { flare: 3 }, { flare: 1, duration: 0.7, ease: 'power3.out', immediateRender: false }, 1.55)
      .to(s, { fan: 1, duration: 0.7, ease: 'power2.out' }, 1.6)

    let W = 1, Hpx = 1, angle = 0, target = 0, sent = null, beamPx = 0
    const v3 = new THREE.Vector3()
    const toPx = (p) => { v3.set(p[0], p[1], 0).applyMatrix4(rig.matrixWorld).project(camera); return [((v3.x + 1) / 2) * W, ((1 - v3.y) / 2) * Hpx] }
    const pxDir = (p, d) => { const a = toPx(p), b = toPx(add(p, d, 0.5)); return norm([b[0] - a[0], b[1] - a[1]]) }

    const update = (force) => {
      const a = ((REST + angle) * Math.PI) / 180, d = [Math.cos(a), -Math.sin(a)], o = add(AIM, d, -6)
      const rays = BAND.map(({ t }) => trace(o, d, ior(t))), mid = trace(o, d, ior(0.5))
      if (!mid || rays.some((r) => !r)) return
      const E = mid.entry.p, X = mid.exit.p, lit = s.lit
      const back = [-d[0], -d[1]], frontIn = (1 - s.front) * 3.4
      place(inCore, E, back, LONG); place(inHalo, E, back, LONG)
      inCore.uFront.value = inHalo.uFront.value = frontIn
      rays.forEach((r, i) => {
        const seg = add(r.exit.p, r.from, -1), len = Math.hypot(...seg)
        place(inner[i], r.from, norm(seg), len); inner[i].uFront.value = lit * len
        place(fan[i], r.exit.p, r.out, LONG); fan[i].uFront.value = s.fan * 5
      })
      const r0 = rays[0].out, r1 = rays.at(-1).out, perp = [-mid.out[1], mid.out[0]]
      place(fanGlow, X, mid.out, LONG); fanGlow.uFront.value = s.fan * 5
      fanGlow.uW1.value = LONG * Math.sin(Math.acos(Math.min(1, dot(r0, r1))) / 2) * 1.3
      fanGlow.uFlip.value = dot(perp, add(r1, r0, -1)) > 0 ? 0 : 1
      // Partial reflections, as strong as Fresnel says: off the entry face outward, and back off the exit face inside
      const fIn = schlick(-dot(d, mid.entry.n), 1, ior(0.5)), fOut = schlick(dot(mid.out, mid.exit.n), ior(0.5), 1)
      place(extRefl, E, reflect(d, mid.entry.n), 4); extRefl.uI.value = fIn * 9 * lit
      const rd = reflect(mid.inner, mid.exit.n), R = hit(X, rd, mid.exit.i)?.p ?? X
      place(intRefl, X, rd, Math.hypot(...add(R, X, -1))); intRefl.uI.value = fOut * 14 * lit
      hotIn.position.set(E[0], E[1], 0); hotIn.material.uniforms.uI.value = 1.5 * s.flare * (s.front > 0.98 ? 1 : 0)
      hotOut.position.set(X[0], X[1], 0); hotOut.material.uniforms.uI.value = 0.9 * lit
      // Where the light touches the glass
      const spot = (i, p, c, k) => { glassU.uSpotP.value[i].set(...p); glassU.uSpotC.value[i].setRGB(c[0] * k, c[1] * k, c[2] * k) }
      spot(0, E, [1, 1, 1], 2.4 * Math.min(1, s.flare))
      spot(1, rays[0].exit.p, spectrum(0), 1.4 * lit)
      spot(2, X, [1, 1, 1], 1.2 * lit)
      spot(3, rays.at(-1).exit.p, spectrum(1), 1.6 * lit)
      spot(4, R, [0.8, 0.9, 1], fOut * 12 * lit)
      spot(5, add(E, mid.inner, 0.06), spectrum(0.6), 0.5 * lit)
      const seg = (i, a, b, c, k) => { glassU.uSegA.value[i].set(...a); glassU.uSegB.value[i].set(...b); glassU.uSegC.value[i].setRGB(c[0] * k, c[1] * k, c[2] * k) }
      seg(0, E, X, [1, 0.97, 0.95], 0.12 * lit)
      seg(1, X, R, [0.7, 0.85, 1], 0.06 * lit)
      seg(2, E, add(E, reflect(d, mid.entry.n), 0.3), [1, 1, 1], 0.08 * lit)
      glass.envMapIntensity = 2.3 * s.glass
      // The code behind the glass is blurred: a backdrop blur clipped to the prism's on-screen outline (front face)
      // It follows the glass: blur grows toward the thick base, and the code is lit where the beam crosses and shaded elsewhere.
      prism.updateMatrixWorld()
      const pt = ([x, y], z = DEPTH / 2) => {
        v3.set(x, y, z).applyMatrix4(prism.matrixWorld).project(camera)
        return [((v3.x + 1) / 2) * W, ((1 - v3.y) / 2) * Hpx]
      }
      const px = (p) => pt(p).map((v) => `${v.toFixed(1)}px`).join(' ')
      const el = blurRef.current, top = pt(TRI[0]), base = pt([0, -H / 3])
      // Clip to the whole solid as seen (hull of front and back caps), so faces seen in perspective, like the base, get the glass too.
      const hull = hull2([...TRI.map((q) => pt(q)), ...TRI.map((q) => pt(q, -DEPTH / 2))])
      el.style.setProperty('--clip', `polygon(${hull.map((q) => `${q[0].toFixed(1)}px ${q[1].toFixed(1)}px`).join(', ')})`)
      // The glass filter's refraction map is stretched over the prism's on-screen box; its strength scales with the prism.
      const xs = hull, x0 = Math.min(...xs.map((q) => q[0])), y0 = Math.min(...xs.map((q) => q[1]))
      const mw = Math.max(...xs.map((q) => q[0])) - x0, mh = Math.max(...xs.map((q) => q[1])) - y0
      const svg = svgRef.current
      for (const a of [['x', x0], ['y', y0], ['width', mw], ['height', mh]]) svg.querySelector('feImage').setAttribute(a[0], a[1].toFixed(1))
      svg.querySelectorAll('feDisplacementMap').forEach((m, i) => m.setAttribute('scale', (mh * (0.2 + i * 0.025)).toFixed(1)))
      el.style.setProperty('--base', px([0, -H / 3]))
      el.style.setProperty('--e', px(E))
      el.style.setProperty('--x', px(X))
      el.style.setProperty('--r', `${Math.hypot(top[0] - base[0], top[1] - base[1]).toFixed(0)}px`)
      el.style.setProperty('--lit', lit.toFixed(2))
      el.style.opacity = s.glass
      prism.scale.setScalar(0.94 + 0.06 * s.glass)

      // Publish the beam in screen pixels, only once it has turned enough to matter for the code it lights
      if (!force && sent !== null && Math.abs(angle - sent) < 0.2) return
      sent = angle
      rig.updateMatrixWorld()
      const Xs = toPx(X)
      hero.prismBeam = { e: toPx(E), din: pxDir(E, d), x: Xs, dm: pxDir(X, mid.out), d0: pxDir(rays[0].exit.p, r0), d1: pxDir(rays.at(-1).exit.p, r1), w: beamPx }
      hero.dispatchEvent(new CustomEvent('prism:beam'))
    }

    const composer = new EffectComposer(renderer)
    composer.setPixelRatio(dpr)
    composer.addPass(new RenderPass(scene, camera))
    const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.4, 0.45, 0.92) // only the hottest light blooms
    composer.addPass(bloom)
    composer.addPass(new OutputPass())

    // The prism stands just above the title (the hero leaves room for it, see .hero-stage); the view is shifted
    // rather than the prism moved, so it is always seen straight on.
    const resize = () => {
      W = canvas.clientWidth; Hpx = canvas.clientHeight
      if (!W || !Hpx) return
      renderer.setSize(W, Hpx, false); composer.setSize(W, Hpx)
      const size = Math.max(170, Math.min(W * 0.25, innerHeight * 0.38, 320)) // prism height, px; matches .hero-stage
      const wpp = H / size
      beamPx = (BEAM_W * 0.9) / wpp
      camera.aspect = W / Hpx
      camera.position.z = (Hpx * wpp) / 2 / Math.tan((FOV / 2) * (Math.PI / 180))
      const t = title.getBoundingClientRect(), c = canvas.getBoundingClientRect()
      camera.setViewOffset(W, Hpx, W / 2 - (t.left + t.width / 2 - c.left), Hpx / 2 - (t.top - c.top - size * 0.45), W, Hpx)
      camera.updateProjectionMatrix()
      update(true)
      if (still) composer.render()
    }
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    document.fonts.ready.then(resize)

    // The glass turns a little toward the pointer: the light stays put in the room, so reflections slide over it
    const tilt = { x: 0, y: 0, tx: 0, ty: 0 }
    const fine = matchMedia('(hover: hover) and (pointer: fine)').matches && !still
    const move = (e) => { const r = hero.getBoundingClientRect(); tilt.ty = ((e.clientX - r.left) / r.width - 0.5) * 0.36; tilt.tx = ((e.clientY - r.top) / r.height - 0.5) * 0.22 }
    const leave = () => { tilt.tx = tilt.ty = 0 }
    if (fine) { hero.addEventListener('pointermove', move); hero.addEventListener('pointerleave', leave) }

    // Now and then the light source drifts to a new angle, slowly, like a lamp on a heavy mount. The whole path
    // follows from the trace: the landing point slides, the bend changes, the spectrum swings and widens.
    let drift = 0
    const wander = () => { target = (Math.random() * 2 - 1) * 7; drift = setTimeout(wander, 4000 + Math.random() * 4000) }
    if (!still) drift = setTimeout(wander, 4500)

    let visible = true, raf = 0, last = performance.now()
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting })
    io.observe(canvas)
    const frame = (now) => {
      raf = requestAnimationFrame(frame)
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (!visible) return
      time.value += dt
      angle += (target - angle) * (1 - Math.exp(-dt * 0.9))
      tilt.x += (tilt.tx - tilt.x) * (1 - Math.exp(-dt * 4)); tilt.y += (tilt.ty - tilt.y) * (1 - Math.exp(-dt * 4))
      prism.rotation.set(tilt.x, tilt.y, 0) // ponytail: the trace ignores this small tilt; it moves the glass, not the cross-section
      update()
      composer.render()
    }
    if (!still) raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf); clearTimeout(drift); intro?.kill(); ro.disconnect(); io.disconnect()
      hero.removeEventListener('pointermove', move); hero.removeEventListener('pointerleave', leave)
      scene.traverse((o) => { o.geometry?.dispose(); o.material?.dispose() })
      scene.environment.dispose(); composer.dispose(); renderer.dispose()
    }
  }, [])

  // Figma-style glass for the code behind the prism (used by .prism-blur): a light frost, then refraction that bends the
  // code hardest at the edges (a bezel map, see glassMap), with red, green and blue bent by slightly different amounts.
  const disp = (c, k) => [
    <feDisplacementMap key={c} in="frost" in2="map" scale="0" xChannelSelector="R" yChannelSelector="G" result={`d${c}`} />,
    <feColorMatrix key={c + 'm'} in={`d${c}`} type="matrix" values={k} result={c} />,
  ]
  return <><svg ref={svgRef} width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
    <filter id="prism-glass" primitiveUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
      <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="frost" />
      <feImage href={glassMap()} preserveAspectRatio="none" result="map" />
      {disp('r', '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0')}
      {disp('g', '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0')}
      {disp('b', '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0')}
      <feBlend in="r" in2="g" mode="screen" result="rg" />
      <feBlend in="rg" in2="b" mode="screen" />
    </filter>
  </svg><div ref={blurRef} className="prism-blur" aria-hidden><i /></div><canvas ref={ref} className="prism-gl" aria-hidden /></>
}
