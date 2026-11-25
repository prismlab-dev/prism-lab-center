import { useEffect, useRef } from 'react'

// Invented code on a light-and-optics theme (nothing from our real apps), drawn faintly across the whole hero. Dim by default; words near the pointer
// light up white, and words inside the prism's beam take its colour.
const code = `import { createLens } from './optics'
import { mix, clamp } from './color'

export function refract(ray, glass) {
  const n = glass.index ?? 1.52
  const angle = Math.asin(Math.sin(ray.angle) / n)
  return { ...ray, angle, speed: ray.speed / n }
}

const spectrum = ['red', 'orange', 'yellow', 'green', 'blue', 'violet']
const bands = { red: 700, green: 530, blue: 470, violet: 400 }

export default function Lab({ experiments }) {
  const running = experiments.filter((e) => e.active)
  return <Bench items={running} empty="Bancada livre" />
}

async function warmUp(lamp, seconds = 3) {
  const until = Date.now() + seconds * 1000
  while (Date.now() < until) await lamp.step(16)
  lamp.emit('ready')
}

const beam = new Beam({ width: 2, color: 'white' })
beam.through(prism).split(spectrum.length)
const rays = beam.rays.map((r) => refract(r, prism))
for (const r of rays) canvas.draw(r)
log('dispersão', rays.length)

export const palette = defineTokens({
  light: '#ffffff', shadow: '#0e0e10',
  glow: mix('#ffffff', '#9b8cff', 0.2),
})

function wavelength(t, min = 380, max = 750) {
  return clamp(min + (max - min) * t, min, max)
}

export async function ship(ideas) {
  for (const idea of ideas) await build(idea)
  return ideas.length
}`

// One continuous stream of statements, wrapped into long rows that run past both edges, so the
// whole hero reads as a wall of code rather than a few columns. Each row starts at a different point.
const stream = code.split('\n').map((l) => l.trim()).filter(Boolean).join('    ')
const rows = Array.from({ length: 48 }, (_, i) => {
  const start = (i * 397) % stream.length
  return (stream + '    ').repeat(3).slice(start, start + 720)
})

// Words near the pointer light up whole, each in the hue of where it sits on screen, and fade back
// out on their own as the pointer moves on, so lighting follows the code instead of a hard circle.
const R = 150
export default function CodeField() {
  const ref = useRef()

  useEffect(() => {
    const field = ref.current
    const hero = field.closest('.hero')
    const fine = matchMedia('(hover: hover) and (pointer: fine)').matches
    let words = [], lit = new Set()

    // Word centres are measured once (and on resize), so each move is just distance checks.
    const measure = () => {
      const f = field.getBoundingClientRect()
      words = [...field.querySelectorAll('.w')].map((el) => {
        const r = el.getBoundingClientRect()
        const x = r.left - f.left + r.width / 2, y = r.top - f.top + r.height / 2
        return { el, x, y }
      })
      beam()
    }
    // The prism publishes its traced light in this field's pixels (see Prism). Words inside the spectrum take the
    // colour of the band they fall in, and the white beam faintly lights the words it runs over on its way in.
    const cross = (a, v) => a[0] * v[1] - a[1] * v[0], dt = (a, v) => a[0] * v[0] + a[1] * v[1]
    const beam = () => {
      const b = hero.prismBeam
      if (!b) return
      const reach = field.offsetWidth * 0.6
      const rel = (v) => Math.atan2(cross(b.dm, v), dt(b.dm, v))
      const r0 = rel(b.d0), r1 = rel(b.d1)
      for (const w of words) {
        const vx = [w.x - b.x[0], w.y - b.x[1]], ve = [w.x - b.e[0], w.y - b.e[1]]
        const t = dt(b.dm, vx) > 0 ? (rel(vx) - r0) / (r1 - r0) : -1
        const back = -dt(b.din, ve)
        // Hue (red 10 … violet 280) is snapped to steps of 10 and only written when it changes, so a drifting beam stays cheap.
        const v = t >= -0.6 && t <= 1.6 ? Math.round(1 + Math.min(1, Math.max(0, t)) * 27) * 10
          : back > 0 && Math.abs(cross(b.din, ve)) < b.w * 1.8 ? 'w' : null
        // Past the spectrum's edges words fade out, down to 35% at the outer limit, and all lit words dim with distance
        // from the prism, down to 15% at 60% of the field width (snapped to tenths, like the hue).
        const edge = typeof v === 'number' ? 1 - Math.max(-t, t - 1, 0) / 0.6 * 0.65 : 1
        const far = 1 - Math.min(1, (v === 'w' ? back : Math.hypot(...vx)) / reach) * 0.85
        const a = Math.round(edge * far * 10) / 10
        if (v === w.b && a === w.a) continue
        w.b = v; w.a = a
        if (v === null) delete w.el.dataset.beam
        else if (v === 'w') { w.el.dataset.beam = 'w'; w.el.style.setProperty('--a', a) }
        else { w.el.dataset.beam = ''; w.el.style.setProperty('--b', v); w.el.style.setProperty('--a', a) }
        // Delay for the load-in reveal (see App): light reaches each word in order, from the source
        if (v !== null) w.el.style.setProperty('--d', v === 'w' ? Math.max(0, 1 - back / reach) * 0.45 : Math.min(1, Math.hypot(...vx) / reach) * 0.7)
      }
    }
    // Pointer events can fire several times a frame; only the latest one is handled, once per frame.
    let pending = null, moveRaf = 0
    const onMove = (e) => { pending = e; if (!moveRaf) moveRaf = requestAnimationFrame(() => { moveRaf = 0; move(pending) }) }
    const move = (e) => {
      const f = field.getBoundingClientRect()
      const px = e.clientX - f.left, py = e.clientY - f.top
      const next = new Set()
      for (const w of words) {
        const d = Math.hypot((w.x - px) * 0.7, w.y - py)
        if (d > R) continue
        next.add(w.el)
        w.el.dataset.on = d < R * 0.55 ? '2' : '1'
      }
      for (const el of lit) if (!next.has(el)) delete el.dataset.on
      lit = next
    }
    const leave = () => { for (const el of lit) delete el.dataset.on; lit = new Set() }

    measure()
    document.fonts.ready.then(measure)
    addEventListener('resize', measure)
    hero.addEventListener('prism:beam', beam)
    if (fine) {
      hero.addEventListener('pointermove', onMove)
      hero.addEventListener('pointerleave', leave)
    }
    return () => {
      cancelAnimationFrame(moveRaf)
      hero.removeEventListener('prism:beam', beam)
      removeEventListener('resize', measure)
      hero.removeEventListener('pointermove', onMove)
      hero.removeEventListener('pointerleave', leave)
    }
  }, [])

  return (
    <div ref={ref} className="code-field" aria-hidden>
      <pre className="code-dim">
        {rows.map((r, i) => (
          <div key={i} className="code-line">
            {r.split(/(\s+)/).map((t, j) => (/\S/.test(t) ? <span key={j} className="w">{t}</span> : t))}
          </div>
        ))}
      </pre>
    </div>
  )
}
