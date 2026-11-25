import { Fragment, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
import gsap from 'gsap'
import './PrismGlassC.css'

// Snell's law drives the beam ribbons and the projected beam data read by CodeField.
// Cross-section, side 1, centroid at the origin, counter-clockwise: apex, left, right.
const H = Math.sqrt(3) / 2
const TRI = [[0, (H * 2) / 3], [-0.5, -H / 3], [0.5, -H / 3]]
const EDGES = TRI.map((p, i) => {
  const q = TRI[(i + 1) % 3], dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy)
  return { p, q, n: [dy / l, -dx / l] } // outward normal
})
const DEPTH = 0.55
const BEVEL = .047
const CAP_SCALE = 1 - BEVEL / (H / 3)

// Optics. Dispersion is exaggerated (real crown glass spreads about a tenth of this) so the fan reads on screen.
const N_RED = 1.25, N_VIOLET = 1.42
const ior = (t) => N_RED + (N_VIOLET - N_RED) * t // t: 0 red … 1 violet
const AIM = [-(0.5 - 0.5 * 0.42), -H / 3 + H * 0.42] // where the light lands on the left face
// Resting source direction: minimum deviation for the middle of the spectrum (the ray runs parallel to the base inside)
const REST = 30 - (Math.asin(ior(0.5) / 2) * 180) / Math.PI // degrees, direction from the face back toward the source
// Source offset from REST: a compromise between a level spectrum and a level source (the glass bends light at least 24°).
// At -4 the white beam climbs about 16° and the spectrum leaves about 8° down.
const AIM_RIGHT = -4
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

const GLSL_SPECTRUM = `vec3 spectrum(float t) { return vec3(exp(-pow(t / .28, 2.)) + .4 * exp(-pow(abs(t - 1.) / .15, 2.)), exp(-pow(abs(t - .42) / .2, 2.)), exp(-pow(abs(t - .78) / .22, 2.))); }`

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
  vec3 c = uColor;
  if (uSpectral > .5) {
    float wavelength = uFlip > .5 ? 1. - vUv.y : vUv.y;
    c = mix(spectrum(wavelength), vec3(.8), .20);
  }
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

// Both passes use the same equilateral section as the Snell trace. The signed
// distance is exact on the sides and rounds naturally around the three vertices.
const TRIANGLE_GLSL = `
float triangleSdf(vec2 p) {
  const float k = 1.7320508;
  p = vec2(abs(p.x) - .5, p.y + .5 / k);
  if (p.x + k * p.y > 0.) p = vec2(p.x - k * p.y, -k * p.x - p.y) * .5;
  p.x -= clamp(p.x, -1., 0.);
  return -length(p) * sign(p.y);
}

float edgeGlow(float d, float core, float halo) {
  return exp(-d / core) + .22 * exp(-d / halo);
}

float grain(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * .1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}
`

const GLASS_VS = `
varying vec3 vLocal, vNormal;
void main() {
  vLocal = position;
  vNormal = normal;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
}
`

// Tone mapping runs once, after the HDR beam and bloom have been composited.
const OUTPUT_FS = `
uniform sampler2D tDiffuse;
varying vec2 vUv;
void main() {
  vec3 light = max(texture2D(tDiffuse, vUv).rgb, 0.);
  vec3 mapped = pow(light, vec3(1.6)) / (.977 * pow(light, vec3(1.568)) + .177);
  gl_FragColor = vec4(mapped, 1.);
  #include <colorspace_fragment>
}
`

const GLASS_FS = `
uniform vec3 uCamera, uNormals[11];
uniform float uOffsets[11], uShow;
uniform mat4 uModel;
varying vec3 vLocal, vNormal;
${TRIANGLE_GLSL}

struct Transmission {
  float thickness;
  float innerRim;
};

Transmission traceGlass(vec3 incident, float ior) {
  vec3 ray = refract(incident, vNormal, 1. / ior);
  vec3 origin = vLocal - vNormal * .0001;
  float thickness = 0.;
  for (int bounce = 0; bounce < 3; bounce++) {
    float travel = 1e6;
    vec3 exitNormal = vec3(0., 0., -1.);
    for (int face = 0; face < 11; face++) {
      float facing = dot(ray, uNormals[face]);
      if (facing <= .0001) continue;
      float hit = (uOffsets[face] - dot(origin, uNormals[face])) / facing;
      if (hit <= 0. || hit >= travel) continue;
      travel = hit;
      exitNormal = uNormals[face];
    }
    origin += ray * travel;
    thickness += travel;
    vec3 outgoing = refract(ray, -exitNormal, ior);
    if (dot(outgoing, outgoing) > .001) {
      float rim = exp(-abs(triangleSdf(origin.xy) + .047) / .005);
      return Transmission(thickness, rim);
    }
    ray = reflect(ray, exitNormal);
    origin -= exitNormal * .0001;
  }
  return Transmission(thickness, 0.);
}

void main() {
  vec3 incident = normalize(vLocal - uCamera);
  Transmission red = traceGlass(incident, 1.460);
  Transmission green = traceGlass(incident, 1.474);
  Transmission blue = traceGlass(incident, 1.490);
  vec3 absorbed = exp(-vec3(.72, .64, .59) * vec3(red.thickness, green.thickness, blue.thickness));

  vec3 viewReflection = normalize(mat3(uModel) * reflect(incident, vNormal));
  float fresnel = .039 + .961 * pow(1. - clamp(dot(-incident, vNormal), 0., 1.), 5.);
  float bevel = step(.12, abs(vNormal.z)) * step(abs(vNormal.z), .97);
  float contour = triangleSdf(vLocal.xy);
  if (triangleSdf(vLocal.xy / .991) > .0026) discard;
  float distanceToEdge = abs(contour);
  float rim = edgeGlow(distanceToEdge, .004, .023);
  float strip = exp(-9. * abs(viewReflection.y + .42 * viewReflection.x - .38));
  float panel = (1. - smoothstep(.045, .07, abs(abs(vLocal.x) - .37 - vLocal.z * .075)))
              * (1. - smoothstep(-.219, -.198, vLocal.y));
  vec3 ivory = vec3(1., .955, .87);
  float key = smoothstep(-.45, .45, vLocal.x + vLocal.y * .16);
  float diagonal = vLocal.x - vLocal.y * .42 + .09;
  float softbox = exp(-17. * diagonal * diagonal);
  vec3 reflections = ivory * (fresnel * (.065 + .66 * strip)
    + bevel * (.048 + .16 * key + .14 * strip + .52 * panel)
    + (.43 + .25 * key) * rim + .015 * softbox);
  float paper = .017 + .0028 * grain(gl_FragCoord.xy);
  float broadLight = .017 * softbox * exp(-1.4 * abs(vLocal.y - .08));
  vec3 body = vec3(paper + broadLight) * absorbed * (1. - .8 * green.innerRim);
  gl_FragColor = vec4((body + reflections) * uShow, 1.);
}
`

const RECEIVER_FS = `
uniform vec2 uPointer, uExit, uDirection;
uniform float uShow, uLit;
varying vec2 vUv;
${TRIANGLE_GLSL}

vec3 edgeRadiance(vec2 point) {
  const vec2 apex = vec2(0., .5773503);
  const vec2 left = vec2(-.5, -.2886751);
  const vec2 right = vec2(.5, -.2886751);
  vec3 light = vec3(0.);
  for (int side = 0; side < 3; side++) {
    vec2 a = side == 0 ? apex : side == 1 ? left : right;
    vec2 b = side == 0 ? left : side == 1 ? right : apex;
    for (int i = 0; i < 8; i++) {
      vec2 emitter = mix(a, b, (float(i) + .5) / 8.);
      float distance = length(vec3(point - emitter, .15));
      float facingLamp = .6 + .4 * exp(-4. * length(emitter - uPointer));
      // The emitter's ray samples the silhouette at the glass plane.
      vec2 blocker = point - vec2(.17, -.22) + emitter * .10;
      float visibility = mix(.24, 1., smoothstep(-.045, .06, triangleSdf(blocker)));
      light += vec3(1., .94, .85) * facingLamp * visibility * pow(distance, -1.35) * exp(-4.8 * distance);
    }
  }
  return light * .005;
}

void main() {
  // A pool of oblique light on the receiver. The shifted triangle occludes the pool.
  vec2 point = (vUv - .5) * vec2(3.05, 2.10);
  float shadowDistance = triangleSdf(point - vec2(.16, -.22));
  float shadow = smoothstep(-.035, .09, shadowDistance);
  vec2 receiver = (point - vec2(.04, -.04)) * vec2(.81, 1.24);
  float pool = exp(-2.5 * dot(receiver, receiver));
  vec2 relative = point - uExit;
  float along = dot(relative, uDirection);
  float across = dot(relative, vec2(-uDirection.y, uDirection.x));
  float caustic = exp(-9. * abs(along - .25)) * smoothstep(0., .22, along);
  vec3 separation = across - vec3(.09, .01, -.08);
  vec3 color = exp(-155. * separation * separation) * caustic * uLit;
  vec3 paper = vec3(.067, .063, .056) * pool * mix(.09, 1., shadow);
  vec3 light = paper + edgeRadiance(point) * pool + color * .095;
  light *= (.955 + .09 * grain(gl_FragCoord.xy)) * uShow;
  float boundary = (1. - smoothstep(.40, .50, abs(vUv.x - .5)))
                 * (1. - smoothstep(.39, .50, abs(vUv.y - .5)));
  gl_FragColor = vec4(light * boundary, 1.);
}
`

// Extrusion and ray intersections share the same 11 planes: two caps, three
// vertical faces and six chamfers. Front and back retain a single flat face.
function glassGeometry() {
  const shape = new THREE.Shape(TRI.map(([x, y]) => new THREE.Vector2(x * CAP_SCALE, y * CAP_SCALE)));
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: DEPTH - 2 * BEVEL, bevelEnabled: true,
    bevelThickness: BEVEL, bevelSize: BEVEL, bevelSegments: 1,
  }).translate(0, 0, BEVEL - DEPTH / 2);
  const normals = [new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, -1)];
  const offsets = [DEPTH / 2, DEPTH / 2];
  for (const { n, p } of EDGES) {
    const side = dot(n, p);
    normals.push(new THREE.Vector3(...n, 0));
    offsets.push(side);
    for (const cap of [-1, 1]) {
      normals.push(new THREE.Vector3(...n, cap).normalize());
      offsets.push((side + DEPTH / 2 - BEVEL) * Math.SQRT1_2);
    }
  }
  return { geometry, normals, offsets };
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

const LIQUID_CHANNELS = [
  { name: 'red', scale: .30, matrix: '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0' },
  { name: 'green', scale: .36, matrix: '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0' },
  { name: 'blue', scale: .42, matrix: '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0' },
]
const MAP_EDGES = [[0, -1, 1], [.894, .447, -.447], [-.894, .447, .447]]
let liquidMapUrl

function liquidMap() {
  if (liquidMapUrl) return liquidMapUrl
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  const image = ctx.createImageData(size, size)

  // Red and green encode the offset along the nearest edge normal.
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (x + .5) / size, v = (y + .5) / size
      let distance = Infinity, normal = MAP_EDGES[0]
      for (const edge of MAP_EDGES) {
        const [nx, ny, offset] = edge
        const gap = nx * u + ny * v + offset
        if (gap < distance) {
          distance = gap
          normal = edge
        }
      }
      const strength = distance < 0 ? 0 : Math.max(0, 1 - distance / .07) ** 2
      image.data.set([128 + normal[0] * 127 * strength, 128 + normal[1] * 127 * strength, 128, 255], (y * size + x) * 4)
    }
  }
  ctx.putImageData(image, 0, 0)
  liquidMapUrl = canvas.toDataURL()
  return liquidMapUrl
}

function LiquidGlass({ filterRef, layerRef }) {
  return <>
    <svg width="0" height="0" className="prism-glass-c-defs" aria-hidden>
      <filter ref={filterRef} id="prism-glass-c-liquid" primitiveUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="frost" />
        <feComposite in="frost" in2="SourceGraphic" operator="arithmetic" k2=".62" k3=".38" result="readableFrost" />
        <feImage href={liquidMap()} preserveAspectRatio="none" result="face" />
        <feFlood floodColor="rgb(128,128,128)" result="flat" />
        <feMerge result="map"><feMergeNode in="flat" /><feMergeNode in="face" /></feMerge>
        {LIQUID_CHANNELS.map(({ name, matrix }) => <Fragment key={name}>
          <feDisplacementMap in="readableFrost" in2="map" scale="0" xChannelSelector="R" yChannelSelector="G" result={name + '-shift'} />
          <feColorMatrix in={name + '-shift'} type="matrix" values={matrix} result={name} />
        </Fragment>)}
        <feBlend in="red" in2="green" mode="screen" result="rg" />
        <feBlend in="rg" in2="blue" mode="screen" result="spectrum" />
        <feGaussianBlur in="spectrum" stdDeviation="0.6" />
      </filter>
    </svg>
    <div ref={layerRef} className="prism-glass-c-liquid" aria-hidden>
      <div className="prism-glass-c-surface" />
      <svg className="prism-glass-c-rim">
        <path className="base" fillRule="evenodd" />
        <path className="back" />
        <path className="rim" />
      </svg>
    </div>
  </>
}

const capVertices = (depth, scale) => TRI.map(([x, y]) => new THREE.Vector3(x * scale, y * scale, depth))
const FRONT_CAP = capVertices(DEPTH / 2, CAP_SCALE)
const REAR_CAP = capVertices(-DEPTH / 2, CAP_SCALE)

function glassOutlineVertices(geometry) {
  // ExtrudeGeometry shortens bevel miters at sharp corners. Project its
  // actual vertices so the CSS backdrop and SVG rim end at the mesh.
  const positions = geometry.getAttribute('position')
  const vertices = new Map()
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i)
    const key = `${x},${y},${z}`
    if (!vertices.has(key)) vertices.set(key, new THREE.Vector3(x, y, z))
  }
  return [...vertices.values()]
}

function liquidGlassProjection(layer, filter, geometry) {
  const outlineVertices = glassOutlineVertices(geometry)
  const map = filter.querySelector('feImage')
  const displacements = filter.querySelectorAll('feDisplacementMap')
  const base = layer.querySelector('.base')
  const back = layer.querySelector('.back')
  const rim = layer.querySelector('.rim')
  const polygon = (points) => `M${points.map((point) => point.join(',')).join('L')}Z`
  let previousProjection, previousOpacity

  return (prism, camera, width, height, scratch, opacity) => {
    if (opacity !== previousOpacity) {
      layer.style.setProperty('--glass-opacity', opacity)
      previousOpacity = opacity
    }
    const project = (vertex) => {
      scratch.copy(vertex).applyMatrix4(prism.matrixWorld).project(camera)
      return [Number(((scratch.x + 1) * width / 2).toFixed(1)),
        Number(((1 - scratch.y) * height / 2).toFixed(1))]
    }
    const front = FRONT_CAP.map(project), rear = REAR_CAP.map(project)
    const outline = outlineVertices.map(project)
    const projection = [front, rear, outline].join('|')
    if (projection === previousProjection) return
    previousProjection = projection
    const hull = hull2(outline)
    const xs = front.map(([x]) => x), ys = front.map(([, y]) => y)
    const x = Math.min(...xs), y = Math.min(...ys)
    const mapWidth = Math.max(...xs) - x, mapHeight = Math.max(...ys) - y
    for (const [name, value] of Object.entries({ x, y, width: mapWidth, height: mapHeight })) {
      map.setAttribute(name, value.toFixed(1))
    }
    displacements.forEach((node, index) => {
      node.setAttribute('scale', (mapHeight * LIQUID_CHANNELS[index].scale).toFixed(1))
    })

    layer.style.setProperty('--clip', `polygon(${hull.map(([x, y]) => `${x}px ${y}px`).join(', ')})`)
    base.setAttribute('d', polygon(hull) + polygon(front))
    rim.setAttribute('d', polygon(hull))
    back.setAttribute('d', polygon(rear) + front.map((point, index) => `M${point}L${rear[index]}`).join(''))
  }
}

export default function PrismGlassC() {
  const ref = useRef(), layerRef = useRef(), filterRef = useRef()

  useEffect(() => {
    const canvas = ref.current, hero = canvas.closest('.hero'), title = hero.querySelector('h1.hero-title')
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches
    let renderer
    try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' }) } catch { return } // no WebGL: the code field alone
    const dpr = Math.min(devicePixelRatio, 1.5)
    renderer.setPixelRatio(dpr)
    renderer.setClearColor(0x000000) // the canvas is screen-blended over the page: black adds nothing

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 50)
    const rig = new THREE.Group() // prism + light, seen a little from above
    rig.rotation.x = -0.09
    scene.add(rig)
    const time = { value: 0 }

    const { geometry, normals, offsets } = glassGeometry();
    const updateLiquidGlass = liquidGlassProjection(layerRef.current, filterRef.current, geometry)
    const glassU = {
      uCamera: { value: new THREE.Vector3() },
      uNormals: { value: normals },
      uOffsets: { value: offsets },
      uShow: { value: 0 },
    };
    const prism = new THREE.Mesh(geometry, new THREE.ShaderMaterial({
      vertexShader: GLASS_VS, fragmentShader: GLASS_FS, uniforms: glassU, depthWrite: false,
    }));
    glassU.uModel = { value: prism.matrixWorld };
    prism.renderOrder = -1;
    rig.add(prism);

    const receiverU = {
      uPointer: { value: new THREE.Vector2(0, .4) },
      uExit: { value: new THREE.Vector2() },
      uDirection: { value: new THREE.Vector2(1, 0) },
      uShow: { value: 0 },
      uLit: { value: 0 },
    };
    const receiver = new THREE.Mesh(new THREE.PlaneGeometry(3.05, 2.10), new THREE.ShaderMaterial({
      vertexShader: FLARE_VS, fragmentShader: RECEIVER_FS, uniforms: receiverU, depthWrite: false,
    }));
    receiver.position.z = -.59;
    receiver.renderOrder = -2;
    rig.add(receiver);

    // Additive beam ribbons share the optical trace used by CodeField.
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
    const fan = BAND.map(({ c }) => ribbon({ color: c, i: 1.3, w0: BEAM_W * 0.6, w1: BEAM_W * 42, sharp: 3.2, noise: 0.28, decay: 0.3, fadeIn: 0.19 }))
    const fanGlow = ribbon({ spectral: 1, i: 0.36, w0: BEAM_W, sharp: 2.5, noise: 0.3, decay: 0.2, fadeIn: 0.5 })
    const extRefl = ribbon({ i: 1, w0: BEAM_W * 0.4, w1: BEAM_W * 2, sharp: 4, decay: 0.6 })
    const intRefl = ribbon({ i: 1, w0: BEAM_W * 0.5, sharp: 3 })
    const hotIn = flare(0.42, [1, 1, 1], 0)
    const hotOut = flare(0.26, [1, 0.95, 0.9], 0)

    // Load-in, on the same beat as App's timeline: the glass settles, white light runs in from the left,
    // the glass lights up as it lands, and the spectrum bursts out to the right.
    const s = still ? { glass: 1, front: 1, lit: 1, fan: 1, flare: 1 } : { glass: 0, front: 0, lit: 0, fan: 0, flare: 0 }
    const intro = still ? null : gsap.timeline()
      .to(s, { glass: 1, duration: 0.8, ease: 'power2.inOut' }, 0.3)
      .to(s, { front: 1, duration: 0.45, ease: 'power2.in' }, 1.1)
      .to(s, { lit: 1, duration: 0.5, ease: 'power2.out' }, 1.55)
      .fromTo(s, { flare: 3 }, { flare: 1, duration: 0.7, ease: 'power3.out', immediateRender: false }, 1.55)
      .to(s, { fan: 1, duration: 0.7, ease: 'power2.out' }, 1.6)

    let W = 1, Hpx = 1, angle = AIM_RIGHT, target = AIM_RIGHT, sent = null, beamPx = 0
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
      hotIn.position.set(E[0], E[1], 0); hotIn.material.uniforms.uI.value = 0.52 * s.flare * (s.front > 0.98 ? 1 : 0)
      hotOut.position.set(X[0], X[1], 0); hotOut.material.uniforms.uI.value = 0.30 * lit

      prism.updateWorldMatrix(true, false);
      camera.updateMatrixWorld();
      updateLiquidGlass(prism, camera, W, Hpx, v3, s.glass)
      glassU.uShow.value = receiverU.uShow.value = s.glass;
      prism.worldToLocal(glassU.uCamera.value.copy(camera.position));
      receiverU.uExit.value.set(...X);
      receiverU.uDirection.value.set(...mid.out);
      receiverU.uLit.value = s.fan;

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
    const output = new ShaderPass({
      uniforms: { tDiffuse: { value: null } },
      vertexShader: FLARE_VS,
      fragmentShader: OUTPUT_FS,
    })
    composer.addPass(output)

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
    let disposed = false
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    document.fonts.ready.then(() => { if (!disposed) resize() })

    // The glass turns a little toward the pointer: the light stays put in the room, so reflections slide over it
    const tilt = { x: 0, y: 0, tx: 0, ty: 0 }
    const fine = matchMedia('(hover: hover) and (pointer: fine)').matches && !still
    const lamp = new THREE.Vector2(0, .4)
    const pointerOnPlane = (event) => {
      const bounds = canvas.getBoundingClientRect()
      const x = (event.clientX - bounds.left) / W
      const y = (event.clientY - bounds.top) / Hpx
      const direction = v3.set(x * 2 - 1, 1 - y * 2, .5).unproject(camera).sub(camera.position)
      direction.multiplyScalar(-camera.position.z / direction.z).add(camera.position)
      return rig.worldToLocal(direction)
    }
    const move = (event) => {
      const pointer = pointerOnPlane(event)
      lamp.set(pointer.x, pointer.y).clampScalar(-1, 1)
      tilt.ty = lamp.x * .15
      tilt.tx = -lamp.y * .08
    }
    const leave = () => {
      tilt.tx = tilt.ty = 0
      lamp.set(0, .4)
    }
    const click = (event) => {
      if (event.target.closest('button, a')) return
      const pointer = pointerOnPlane(event)
      const inside = EDGES.every(({ n, p }) => dot(n, [pointer.x, pointer.y]) <= dot(n, p))
      if (!inside) return
      target = AIM_RIGHT + THREE.MathUtils.clamp(pointer.y * 17, -7, 7)
    }
    if (fine) {
      hero.addEventListener('pointermove', move)
      hero.addEventListener('pointerleave', leave)
    }
    if (!still) hero.addEventListener('click', click)

    let drift = 0
    const wander = () => { target = AIM_RIGHT + (Math.random() * 2 - 1) * 4; drift = setTimeout(wander, 4000 + Math.random() * 4000) }
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
      prism.rotation.set(tilt.x, tilt.y, 0)
      receiverU.uPointer.value.lerp(lamp, 1 - Math.exp(-dt * 5))
      update()
      composer.render()
    }
    if (!still) raf = requestAnimationFrame(frame)

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      clearTimeout(drift)
      intro?.kill()
      ro.disconnect()
      io.disconnect()
      hero.removeEventListener('pointermove', move)
      hero.removeEventListener('pointerleave', leave)
      hero.removeEventListener('click', click)
      bloom.dispose()
      output.dispose()
      scene.traverse((o) => { o.geometry?.dispose(); o.material?.dispose() })
      composer.dispose(); renderer.dispose()
    }
  }, [])

  return <>
    <LiquidGlass filterRef={filterRef} layerRef={layerRef} />
    <canvas ref={ref} className="prism-gl" aria-hidden />
  </>
}
