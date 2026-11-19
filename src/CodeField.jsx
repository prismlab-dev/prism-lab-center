import { useEffect, useRef } from 'react'

// Code from our own apps, drawn faintly across the whole hero. Dim by default; words near the
// pointer light up in the full hue wheel.
const code = `import { useMemo } from 'react'
import { formatBRL } from './money'

export function balancoDoMes(movs) {
  const receitas = movs.filter((m) => m.valor > 0)
  const despesas = movs.filter((m) => m.valor < 0)
  return soma(receitas) + soma(despesas)
}

const categorias = ['Moradia', 'Cartão', 'Metas']
const cores = { moradia: '#5cb8ff', cartao: '#9b8cff' }

export default function Hoje({ tarefas }) {
  const pendentes = tarefas.filter((t) => !t.feita)
  return <Lista itens={pendentes} vazio="Nada pra hoje" />
}

async function iniciarPomodoro(minutos = 25) {
  const fim = Date.now() + minutos * 60_000
  while (Date.now() < fim) await tick(1000)
  notificar('Pausa de 5 minutos')
}

const peer = new RTCPeerConnection({ iceServers })
peer.addTrack(stream.getVideoTracks()[0], stream)
const oferta = await peer.createOffer()
await peer.setLocalDescription(oferta)
socket.emit('sinal', { sala, oferta })

export const tema = createTheme({
  iris: '#9b8cff', lagoon: '#3dd6c3',
  azure: '#5cb8ff', coral: '#ff7b8a',
})

function parcela(total, n, i) {
  return Math.round((total / n) * 100) / 100
}

export async function lancar(projetos) {
  for (const p of projetos) await deploy(p)
  return projetos.length
}`

// One continuous stream of statements, wrapped into long rows that run past both edges, so the
// whole hero reads as a wall of code rather than a few columns. Each row starts at a different point.
const stream = code.split('\n').map((l) => l.trim()).filter(Boolean).join('    ')
const rows = Array.from({ length: 48 }, (_, i) => {
  const start = (i * 397) % stream.length
  return (stream + '    ' + stream).slice(start, start + 320)
})

// Words near the pointer light up whole, each in the hue of where it sits on screen, and fade back
// out on their own as the pointer moves on, so lighting follows the code instead of a hard circle.
const R = 150
export default function CodeField() {
  const ref = useRef()

  useEffect(() => {
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return
    const field = ref.current
    const hero = field.closest('.hero')
    let words = [], lit = new Set()

    // Word centres are measured once (and on resize), so each move is just distance checks.
    const measure = () => {
      const f = field.getBoundingClientRect()
      words = [...field.querySelectorAll('.w')].map((el) => {
        const r = el.getBoundingClientRect()
        const x = r.left - f.left + r.width / 2, y = r.top - f.top + r.height / 2
        el.style.setProperty('--h', Math.round((x / f.width) * 300 + y * 0.25) % 360)
        return { el, x, y }
      })
    }
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
    hero.addEventListener('pointermove', move)
    hero.addEventListener('pointerleave', leave)
    return () => {
      removeEventListener('resize', measure)
      hero.removeEventListener('pointermove', move)
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
