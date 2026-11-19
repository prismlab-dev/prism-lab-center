import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { Hexagon, Pyramid, ArrowUpRight, Home, Target, Briefcase, Timer, Wallet, CreditCard, Laptop, Inbox, CalendarCheck, Monitor, Hash, MonitorUp, Play } from 'lucide-react'

function Window({ url, children }) {
  return (
    <div className="window">
      <div className="flex items-center gap-1.5 border-b border-white/5 px-3 py-2.5">
        {[0, 1, 2].map((i) => <i key={i} className="size-2.5 rounded-full bg-white/10" />)}
        <span className="mx-auto rounded-md bg-white/5 px-3 py-0.5 text-[10px] text-ink-3">{url}</span>
      </div>
      {children}
    </div>
  )
}

const cats = [['Moradia', '44.4%', '#5cb8ff', 44], ['Cartão de crédito', '34.3%', '#9b8cff', 34], ['Metas', '12.0%', '#ff7b8a', 12]]
const moves = [
  [Briefcase, '#3dd6c3', 'Salário', 'Conta corrente · Renda', '+ R$ 6.200,00'],
  [Home, '#5cb8ff', 'Aluguel', 'Conta corrente · Moradia', '− R$ 1.850,00'],
  [CreditCard, '#9b8cff', 'Fatura do cartão', 'Cartão de crédito · Vence dia 12', '− R$ 1.427,90'],
  [Laptop, '#f7c04a', 'Notebook', 'Cartão de crédito · Parcela 4/10', '− R$ 389,00'],
]
const Tile = ({ I, c, s = 13 }) => (
  <span className="grid size-7 shrink-0 place-items-center rounded-lg border" style={{ background: `rgb(from ${c} r g b / .12)`, borderColor: `rgb(from ${c} r g b / .25)` }}><I size={s} color={c} /></span>
)

// Mirrors the Silus login showcase: same sample month, same category colours.
function SilusMock({ a }) {
  return (
    <>
      <Window url="silus.app">
        <div className="flex">
          <div className="flex w-12 shrink-0 flex-col items-center border-r border-white/5 py-3">
            <span className="grid size-8 place-items-center"><Hexagon size={16} color="#fff" /></span>
            <i className="my-2.5 h-px w-6 bg-white/10" />
            <div className="grid gap-1.5">
              {[Home, Wallet, CreditCard, Target].map((I, i) => (
                <span key={i} className={`grid size-8 place-items-center rounded-lg ${i === 0 ? 'bg-white/10' : ''}`}><I size={14} color={i === 0 ? '#fff' : '#58585b'} /></span>
              ))}
            </div>
          </div>
          <div className="grid flex-1 gap-2.5 p-3 text-[10px]">
            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-xl border border-white/5 bg-white/[.02] p-3">
                <div className="flex justify-between gap-2"><span className="text-[11px] font-medium">Balanço do mês</span><span style={{ color: a }}>+ R$ 2.033,10</span></div>
                <svg viewBox="0 0 100 40" className="mt-2 h-12 w-full" preserveAspectRatio="none">
                  <path d="M0 14 H100 V40 H0Z" fill={a} opacity=".12" />
                  <path d="M0 14 H100" stroke={a} strokeWidth="1.2" fill="none" />
                  <path d="M0 36 L30 30 L55 22 L80 18 L100 16" stroke="#ff7b8a" strokeWidth="1.2" fill="none" />
                </svg>
                <div className="mt-1 flex gap-3 text-ink-3"><span style={{ color: a }}>● <span className="text-ink-3">Receitas</span></span><span className="text-coral">● <span className="text-ink-3">Despesas</span></span></div>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/[.02] p-3">
                <div className="flex justify-between gap-2"><span className="text-[11px] font-medium">Gastos por categoria</span><span>R$ 4.166,90</span></div>
                <div className="mt-2 flex gap-1">{cats.map(([n, , c, w]) => <i key={n} className="h-1.5 rounded-full" style={{ width: `${w}%`, background: c }} />)}<i className="h-1.5 flex-1 rounded-full bg-saffron" /></div>
                <div className="mt-2 grid gap-1.5">
                  {cats.map(([n, p, c, w]) => (
                    <div key={n}>
                      <div className="flex justify-between"><span>{n}</span><span className="text-ink-3">{p}</span></div>
                      <div className="mt-0.5 h-0.5 rounded-full bg-white/5"><div className="h-full rounded-full" style={{ width: `${w * 2}%`, background: c }} /></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/[.02] p-3">
              <p className="text-[11px] font-medium">Movimentações de outubro</p>
              <div className="mt-2 grid gap-2">
                {moves.map(([I, c, n, sub, v]) => (
                  <div key={n} className="flex items-center gap-2.5">
                    <Tile I={I} c={c} />
                    <span className="flex-1"><span className="block text-[11px] font-medium">{n}</span><span className="text-ink-3">{sub}</span></span>
                    <span style={{ color: v.startsWith('+') ? a : '#ff7b8a' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Window>
      <div className="float right-[-7%] top-[30%] w-48">
        <div className="flex items-center gap-2 text-[11px]"><Tile I={CreditCard} c="#9b8cff" s={11} /><span className="flex-1 font-medium">Fatura de outubro</span><span className="text-ink-3">Fechada</span></div>
        <p className="mt-2 text-lg font-semibold">R$ 1.427,90</p>
        <div className="mt-2 flex gap-1">{[6, 7, 8, 9, 10, 11, 12].map((d) => <i key={d} className="h-1 flex-1 rounded-full" style={{ background: d === 12 ? '#9b8cff' : d < 8 ? 'rgb(155 140 255 / .4)' : 'rgb(255 255 255 / .08)' }} />)}</div>
        <p className="mt-2 text-[10px] text-ink-3">Vence dia 12, daqui a 5 dias</p>
      </div>
      <div className="float bottom-[-6%] left-[-6%] flex w-48 items-center gap-3">
        <svg viewBox="0 0 36 36" className="size-11 -rotate-90"><circle cx="18" cy="18" r="15" stroke="rgb(255 255 255 / .08)" strokeWidth="4" fill="none" /><circle cx="18" cy="18" r="15" stroke="#ff7b8a" strokeWidth="4" fill="none" strokeDasharray="94.2" strokeDashoffset="35.8" strokeLinecap="round" /></svg>
        <div><p className="text-[10px] text-ink-3">Reserva de emergência</p><p className="text-base font-semibold">62%</p><p className="text-[10px] text-ink-3">R$ 6.200 de R$ 10.000</p></div>
      </div>
    </>
  )
}

const nav = [[Home, 'Início'], [Inbox, 'Entrada', 2], [CalendarCheck, 'Hoje', 3], [Timer, 'Pomodoro']]
const today = [
  ['Escrever textos da página inicial', '#f7c04a', [['Hoje', '#5cb8ff'], ['3h', '#78787b'], ['conteúdo', '#78787b']], 'Lançamento', '#9b8cff'],
  ['Regar as plantas', '#78787b', [['Hoje', '#3dd6c3'], ['rotina', '#78787b']], 'Casa', '#3dd6c3'],
  ['Fechar briefing da landing', '#ff7b8a', [['Hoje 10:00', '#3dd6c3'], ['design', '#78787b']], 'Lançamento', '#9b8cff'],
]

// The Prism home screen: its spectrum backdrop, sidebar with projects, and today's tasks with their meta.
function PrismMock({ a }) {
  return (
    <>
      <Window url="prism">
        <div className="relative flex text-[10px]">
          <div className="pointer-events-none absolute inset-0 opacity-60" style={{ background: 'radial-gradient(50% 60% at 70% 0%, rgb(155 140 255 / .18), transparent 70%), radial-gradient(40% 50% at 100% 30%, rgb(61 214 195 / .1), transparent 70%), radial-gradient(40% 50% at 40% 0%, rgb(255 123 138 / .1), transparent 70%)' }} />
          <div className="relative w-32 shrink-0 border-r border-white/5 p-2.5">
            <div className="flex items-center gap-1.5 px-1 text-[12px] font-semibold"><Pyramid size={13} color="#fff" /> Prism</div>
            <div className="mt-2.5 flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 font-medium">
              <span className="grid size-3.5 place-items-center rounded-full text-[9px] text-canvas" style={{ background: a }}>+</span> Adicionar tarefa
            </div>
            <div className="mt-2.5 grid gap-0.5">
              {nav.map(([I, n, c], i) => (
                <div key={n} className={`flex items-center gap-2 rounded-md px-1.5 py-1 ${i === 0 ? 'bg-white/10 text-white' : 'text-ink-2'}`}>
                  <I size={11} /> <span className="flex-1">{n}</span>{c && <span className="text-ink-3">{c}</span>}
                </div>
              ))}
            </div>
            <p className="mt-3 px-1.5 text-[8px] font-medium text-ink-4">Meus projetos</p>
            {[['Lançamento', '#9b8cff'], ['Casa', '#3dd6c3'], ['Pessoal', '#ff7b8a']].map(([n, c]) => (
              <div key={n} className="flex items-center gap-2 px-1.5 py-1 text-ink-2"><Hash size={10} color={c} /> {n}</div>
            ))}
          </div>
          <div className="relative flex-1 p-4">
            <p className="text-xl font-semibold tracking-tight">Boa noite.</p>
            <p className="text-ink-3">quinta-feira, 19 de novembro.</p>
            <div className="mt-2.5 h-0.5 rounded-full bg-white/5"><div className="h-full w-1/3 rounded-full bg-coral" /></div>
            <p className="mt-2 text-ink-3"><b className="text-white">3</b> tarefas para hoje <span className="text-ink-4">·</span> <b className="text-white">4.2h</b> de trabalho</p>
            <div className="mt-3 rounded-xl border border-white/5 bg-white/[.02] p-2.5">
              <p className="flex items-center gap-1.5 text-[8px] font-semibold text-ink-3"><CalendarCheck size={10} color="#3dd6c3" /> PLANEJADAS PARA HOJE</p>
              {today.map(([t, ring, meta, proj, pc]) => (
                <div key={t} className="mt-2 flex gap-2 border-b border-white/5 pb-2 last:border-0 last:pb-0">
                  <i className="mt-0.5 size-3 shrink-0 rounded-full border-[1.5px]" style={{ borderColor: ring }} />
                  <div className="flex-1">
                    <p className="text-[11px] font-medium">{t}</p>
                    <p className="mt-0.5 flex gap-2">{meta.map(([m, c]) => <span key={m} style={{ color: c }}>{m}</span>)}</p>
                  </div>
                  <span className="flex items-start gap-1 text-ink-3">{proj} <Hash size={9} color={pc} /></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Window>
      <div className="float bottom-[-8%] right-[-5%] flex items-center gap-2.5">
        <span className="grid size-8 place-items-center rounded-full" style={{ background: `rgb(from ${a} r g b / .18)` }}><Timer size={15} color={a} /></span>
        <div><p className="text-base font-semibold leading-none tabular-nums">24:13</p><p className="mt-1 text-[10px] text-ink-3">Pomodoro</p></div>
      </div>
    </>
  )
}

const LiveBadge = ({ a }) => (
  <span className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[8px] font-semibold" style={{ background: `rgb(from ${a} r g b / .15)`, color: a }}>
    <i className="size-1 rounded-full" style={{ background: a }} /> Ao vivo
  </span>
)
const people = [['daniel', 'Entire screen', true], ['luiz'], ['ryan']]
const Avatar = ({ n, size = 'size-4', text = 'text-[8px]' }) => (
  <span className={`grid ${size} shrink-0 place-items-center rounded-full bg-[#26262a] ${text} font-semibold uppercase text-ink-2`}>{n[0]}</span>
)

// The ScreenShare session screen: sessions + participants on the left, the stage with live tiles on the right.
function ScreenMock({ a }) {
  return (
    <>
      <Window url="screen.luizfranzon.dev">
        <div className="flex bg-[#0b0b0c] text-[10px]">
          <div className="flex w-36 shrink-0 flex-col border-r border-[#1f1f23] bg-[#111113]">
            <div className="flex items-center gap-1.5 px-3 py-3">
              <svg viewBox="0 0 331 347" className="h-3 w-auto" aria-hidden><path d="M292.807 130.64C327.023 149.247 327.023 197.412 292.807 216.019L86.2142 328.363C52.9601 346.447 12.0938 322.91 12.0938 285.674V60.985C12.0938 23.7488 52.9601 0.211785 86.2141 18.2953L292.807 130.64Z" fill={a} stroke={a} strokeWidth="24" /></svg>
              <span className="font-mono text-[12px] font-medium tracking-tight">Screenshare</span>
            </div>
            <p className="px-3 text-[9px] text-ink-3">Sessões</p>
            <div className="mx-2 mt-1 flex items-center gap-1.5 rounded-lg bg-[#1c1c1f] px-2 py-1.5 font-medium"><Monitor size={11} color={a} /> prism labs</div>
            <div className="ml-3 mt-1 grid gap-1 pr-2">
              {people.map(([n, screen, live]) => (
                <div key={n}>
                  <div className="flex items-center gap-1.5 px-1 py-0.5 text-[#d4d4d8]"><Avatar n={n} /> <span className="flex-1">{n}</span>{live && <LiveBadge a={a} />}</div>
                  {screen && <p className="ml-6 border-l border-[#3f3f46] pl-2 text-[9px] text-ink-3">{screen}</p>}
                </div>
              ))}
            </div>
            <div className="mt-auto flex items-center gap-1.5 border-t border-[#1f1f23] px-3 py-2.5"><Avatar n="luiz" size="size-5" /><span><span className="block font-medium">luiz</span><span className="text-[9px]" style={{ color: a }}>Conectado</span></span></div>
          </div>
          <div className="flex-1 p-3">
            <div className="flex justify-end"><span className="flex items-center gap-1 rounded-lg border border-[#26262a] px-2 py-1 font-medium"><MonitorUp size={11} /> Adicionar fonte</span></div>
            <div className="relative mt-3 aspect-video overflow-hidden rounded-xl border border-[#26262a] bg-[#0b0b0c]">
              {/* daniel's desktop: an editor open on a wallpaper, with his pointer at a line (ScreenShare's pointer feature). */}
              <div className="absolute inset-0" style={{ background: 'radial-gradient(120% 90% at 80% 0%, #3b2a6b, #14121f 55%, #0b0b0c)' }} />
              <div className="absolute inset-x-[8%] top-[16%] bottom-[14%] overflow-hidden rounded-md border border-white/10 bg-[#16161a] shadow-2xl">
                <div className="flex items-center gap-1 border-b border-white/5 px-1.5 py-1">
                  {['#ff5f57', '#febc2e', '#28c840'].map((c) => <i key={c} className="size-1 rounded-full" style={{ background: c }} />)}
                  <span className="ml-1.5 rounded-sm bg-white/5 px-1.5 text-[6px] text-ink-2">projetos.js</span>
                </div>
                <pre className="px-2 py-1.5 font-mono text-[6.5px] leading-[1.6] text-ink-2">
{[
  [['const ', '#c084fc'], ['projetos', '#fff'], [' = ', '#8b8b94'], ['[', '#8b8b94']],
  [["  'Silus Finance'", a], [',', '#8b8b94']],
  [["  'Prism'", a], [',', '#8b8b94']],
  [["  'ScreenShare'", a], [',', '#8b8b94']],
  [[']', '#8b8b94']],
  [['lancar', '#60a5fa'], ['(projetos)', '#8b8b94']],
].map((line, i) => (
  <span key={i} className={`block ${i === 2 ? '-mx-2 bg-white/[.06] px-2' : ''}`}>
    <span className="mr-2 text-ink-4">{i + 1}</span>{line.map(([t, c], j) => <span key={j} style={{ color: c }}>{t}</span>)}
  </span>
))}
                </pre>
              </div>
              <div className="absolute left-[46%] top-[44%] flex items-start">
                <svg viewBox="0 0 12 16" className="h-3.5 w-auto drop-shadow" aria-hidden><path d="M1 1 L11 9 L6.5 9.5 L4 14.5 Z" fill="#fff" stroke="#0b0b0c" strokeWidth="1" strokeLinejoin="round" /></svg>
                <span className="mt-2.5 rounded-full px-1.5 py-0.5 text-[7px] font-semibold text-canvas" style={{ background: '#60a5fa' }}>daniel</span>
              </div>
              <span className="absolute left-2 top-2 flex items-center gap-1.5 rounded-full bg-black/60 py-1 pl-2 pr-1.5 backdrop-blur"><b>daniel</b><span className="text-ink-3">Entire screen</span><LiveBadge a={a} /></span>
            </div>
          </div>
        </div>
      </Window>
    </>
  )
}

export const projects = [
  { name: 'Silus Finance', desc: 'Controle financeiro pessoal: contas, metas e para onde vai cada real do mês.', href: 'https://www.silus.app', host: 'silus.app', Icon: Hexagon, accent: '#3dd6c3', Mock: SilusMock },
  { name: 'Prism', desc: 'Tarefas, projetos e foco num só lugar, com temas que mudam de cor com você.', href: null, Icon: Pyramid, accent: '#9b8cff', Mock: PrismMock },
  { name: 'ScreenShare', desc: 'Compartilhe a tela direto do navegador, ponto a ponto. Manda o link e pronto.', href: 'https://screen.luizfranzon.dev/', host: 'screen.luizfranzon.dev', Icon: Play, accent: '#bef264', Mock: ScreenMock },
]

function Project({ p, flip }) {
  const stage = useRef()

  // The device tilts toward the pointer: decorative, so fine pointers with motion allowed only.
  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
      const el = stage.current
      const rx = gsap.quickTo('.device', 'rotationX', { duration: 0.9, ease: 'power3' })
      const ry = gsap.quickTo('.device', 'rotationY', { duration: 0.9, ease: 'power3' })
      const base = flip ? 16 : -16
      gsap.set('.device', { rotationX: 10, rotationY: base })
      const move = (e) => {
        const r = el.getBoundingClientRect()
        ry(base + ((e.clientX - r.left) / r.width - 0.5) * 16)
        rx(10 - ((e.clientY - r.top) / r.height - 0.5) * 12)
      }
      const leave = () => { rx(10); ry(base) }
      el.addEventListener('pointermove', move)
      el.addEventListener('pointerleave', leave)
      return () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave) }
    })
  }, { scope: stage })

  const Cta = p.href ? 'a' : 'span'
  return (
    <article style={{ '--accent': p.accent }} className="project grid items-center gap-10 py-16 md:grid-cols-2 md:gap-16">
      <div className={flip ? 'md:order-2' : ''}>
        <div className="flex items-center gap-5">
        <span className="icon-3d" aria-hidden>
          {/* Stroke lit from above: bright top, project colour through the middle, deep shade at the bottom. */}
          <svg width="0" height="0" className="absolute">
            <linearGradient id={`lit-${p.name.replace(/\W/g, "")}`} gradientUnits="userSpaceOnUse" x1="4" y1="2" x2="20" y2="22">
              <stop offset="0" stopColor={`color-mix(in oklab, ${p.accent} 35%, #fff)`} />
              <stop offset=".55" stopColor={p.accent} />
              <stop offset="1" stopColor={`color-mix(in oklab, ${p.accent} 70%, #000)`} />
            </linearGradient>
          </svg>
          <p.Icon size={64} strokeWidth={2.25} color={`url(#lit-${p.name.replace(/\W/g, "")})`} />
        </span>
        <h3 className="title-3d font-[Sora] text-4xl font-semibold tracking-[-.03em] md:text-5xl">{p.name}</h3>
        </div>
        <p className="mt-6 max-w-sm text-lg leading-relaxed text-ink-2">{p.desc}</p>
        <div className="mt-8 flex items-center gap-4">
          <Cta {...(p.href && { href: p.href, target: '_blank', rel: 'noreferrer' })}
            className={`cta group inline-flex items-center gap-1.5 rounded-full px-5 py-3 text-sm font-medium ${p.href ? 'text-canvas' : 'border border-line text-ink-2'}`}
            style={p.href ? { background: p.accent } : undefined}>
            {p.href ? <>Abrir {p.host} <ArrowUpRight className="arrow" size={16} /></> : 'Em desenvolvimento'}
          </Cta>
          {p.href && <span className="flex items-center gap-2 text-sm text-ink-3"><i className="size-2 rounded-full bg-[#4ade80] shadow-[0_0_10px_#4ade80]" /> No ar</span>}
        </div>
      </div>

      <div ref={stage} className="stage relative">
        <span className="halo" />
        <div className="device" style={{ '--tilt': flip ? '16deg' : '-16deg' }}>
          <p.Mock a={p.accent} />
        </div>
      </div>
    </article>
  )
}

export default function Showcase() {
  return (
    <section id="projetos" aria-label="Nossos projetos" className="pb-16">
      {projects.map((p, i) => <Project key={p.name} p={p} flip={i % 2 === 1} />)}
    </section>
  )
}
