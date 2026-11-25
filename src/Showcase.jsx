import { useRef, useState } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Download, Hexagon, Pyramid, ArrowUpRight, Home, Target, Briefcase, Timer, Wallet, CreditCard, Laptop, Inbox, CalendarCheck, Monitor, Hash, MonitorUp, Play, Layers2, Folder, FolderOpen, HardDrive, HardDriveDownload, ChevronRight, Check, GripVertical, Copy, FolderInput, FolderTree, Info } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

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
              <div className="rv rounded-xl border border-white/5 bg-white/[.02] p-3">
                <div className="flex justify-between gap-2"><span className="text-[11px] font-medium">Balanço do mês</span><span style={{ color: a }}>+ R$ 2.033,10</span></div>
                <svg viewBox="0 0 100 40" className="mt-2 h-12 w-full" preserveAspectRatio="none">
                  <path d="M0 14 H100 V40 H0Z" fill={a} opacity=".12" />
                  <path className="draw" d="M0 14 H100" stroke={a} strokeWidth="1.2" fill="none" />
                  <path className="draw" d="M0 36 L30 30 L55 22 L80 18 L100 16" stroke="#ff7b8a" strokeWidth="1.2" fill="none" />
                </svg>
                <div className="mt-1 flex gap-3 text-ink-3"><span style={{ color: a }}>● <span className="text-ink-3">Receitas</span></span><span className="text-coral">● <span className="text-ink-3">Despesas</span></span></div>
              </div>
              <div className="rv rounded-xl border border-white/5 bg-white/[.02] p-3">
                <div className="flex justify-between gap-2"><span className="text-[11px] font-medium">Gastos por categoria</span><span>R$ 4.166,90</span></div>
                <div className="mt-2 flex gap-1">{cats.map(([n, , c, w]) => <i key={n} className="grow-x h-1.5 rounded-full" style={{ width: `${w}%`, background: c }} />)}<i className="h-1.5 flex-1 rounded-full bg-saffron" /></div>
                <div className="mt-2 grid gap-1.5">
                  {cats.map(([n, p, c, w]) => (
                    <div key={n}>
                      <div className="flex justify-between"><span>{n}</span><span className="text-ink-3">{p}</span></div>
                      <div className="mt-0.5 h-0.5 rounded-full bg-white/5"><div className="grow-x h-full rounded-full" style={{ width: `${w * 2}%`, background: c }} /></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="rv rounded-xl border border-white/5 bg-white/[.02] p-3">
              <p className="text-[11px] font-medium">Movimentações de outubro</p>
              <div className="mt-2 grid gap-2">
                {moves.map(([I, c, n, sub, v]) => (
                  <div key={n} className="rv flex items-center gap-2.5">
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
        <div className="mt-2 flex gap-1">{[6, 7, 8, 9, 10, 11, 12].map((d) => <i key={d} className="grow-y h-1 flex-1 rounded-full" style={{ background: d === 12 ? '#9b8cff' : d < 8 ? 'rgb(155 140 255 / .4)' : 'rgb(255 255 255 / .08)' }} />)}</div>
        <p className="mt-2 text-[10px] text-ink-3">Vence dia 12, daqui a 5 dias</p>
      </div>
      <div className="float bottom-[-6%] left-[-6%] flex w-48 items-center gap-3">
        <svg viewBox="0 0 36 36" className="size-11 -rotate-90"><circle cx="18" cy="18" r="15" stroke="rgb(255 255 255 / .08)" strokeWidth="4" fill="none" /><circle cx="18" cy="18" r="15" stroke="#ff7b8a" strokeWidth="4" fill="none" className="ring" strokeDasharray="94.2" strokeDashoffset="35.8" strokeLinecap="round" /></svg>
        <div><p className="text-[10px] text-ink-3">Reserva de emergência</p><p className="count text-base font-semibold">62%</p><p className="text-[10px] text-ink-3">R$ 6.200 de R$ 10.000</p></div>
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

// The Merer home screen: its spectrum backdrop, sidebar with projects, and today's tasks with their meta.
function MererMock({ a }) {
  return (
    <>
      <Window url="merer.madebyprism.app">
        <div className="relative flex text-[10px]">
          <div className="pointer-events-none absolute inset-0 opacity-60" style={{ background: 'radial-gradient(50% 60% at 70% 0%, rgb(155 140 255 / .18), transparent 70%), radial-gradient(40% 50% at 100% 30%, rgb(61 214 195 / .1), transparent 70%), radial-gradient(40% 50% at 40% 0%, rgb(255 123 138 / .1), transparent 70%)' }} />
          <div className="relative w-32 shrink-0 border-r border-white/5 p-2.5">
            <div className="flex items-center gap-1.5 px-1 text-[12px] font-semibold"><Pyramid size={13} color="#fff" /> Merer</div>
            <div className="mt-2.5 flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 font-medium">
              <span className="grid size-3.5 place-items-center rounded-full text-[9px] text-canvas" style={{ background: a }}>+</span> Adicionar tarefa
            </div>
            <div className="mt-2.5 grid gap-0.5">
              {nav.map(([I, n, c], i) => (
                <div key={n} className={`rv flex items-center gap-2 rounded-md px-1.5 py-1 ${i === 0 ? 'bg-white/10 text-white' : 'text-ink-2'}`}>
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
            <p className="rv text-xl font-semibold tracking-tight">Boa noite.</p>
            <p className="text-ink-3">quinta-feira, 19 de novembro.</p>
            <div className="mt-2.5 h-0.5 rounded-full bg-white/5"><div className="grow-x h-full w-1/3 rounded-full bg-coral" /></div>
            <p className="mt-2 text-ink-3"><b className="text-white">3</b> tarefas para hoje <span className="text-ink-4">·</span> <b className="text-white">4.2h</b> de trabalho</p>
            <div className="mt-3 rounded-xl border border-white/5 bg-white/[.02] p-2.5">
              <p className="flex items-center gap-1.5 text-[8px] font-semibold text-ink-3"><CalendarCheck size={10} color="#3dd6c3" /> PLANEJADAS PARA HOJE</p>
              {today.map(([t, ring, meta, proj, pc]) => (
                <div key={t} className="rv mt-2 flex gap-2 border-b border-white/5 pb-2 last:border-0 last:pb-0">
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
                <div key={n} className="rv">
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
              {/* daniel's desktop: an editor open on a wallpaper, with luiz's pointer at a line (ScreenShare's pointer feature). */}
              <div className="absolute inset-0" style={{ background: 'radial-gradient(120% 90% at 80% 0%, #3b2a6b, #14121f 55%, #0b0b0c)' }} />
              <div className="pop absolute inset-x-[8%] top-[16%] bottom-[14%] overflow-hidden rounded-md border border-white/10 bg-[#16161a] shadow-2xl">
                <div className="flex items-center gap-1 border-b border-white/5 px-1.5 py-1">
                  {['#ff5f57', '#febc2e', '#28c840'].map((c) => <i key={c} className="size-1 rounded-full" style={{ background: c }} />)}
                  <span className="ml-1.5 rounded-sm bg-white/5 px-1.5 text-[6px] text-ink-2">projetos.js</span>
                </div>
                <pre className="px-2 py-1.5 font-mono text-[6.5px] leading-[1.6] text-ink-2">
{[
  [['const ', '#c084fc'], ['projetos', '#fff'], [' = ', '#8b8b94'], ['[', '#8b8b94']],
  [["  'Silus'", a], [',', '#8b8b94']],
  [["  'Merer'", a], [',', '#8b8b94']],
  [["  'ScreenShare'", a], [',', '#8b8b94']],
  [[']', '#8b8b94']],
  [['lancar', '#60a5fa'], ['(projetos)', '#8b8b94']],
].map((line, i) => (
  <span key={i} className={`rv block ${i === 2 ? '-mx-2 bg-white/[.06] px-2' : ''}`}>
    <span className="mr-2 text-ink-4">{i + 1}</span>{line.map(([t, c], j) => <span key={j} style={{ color: c }}>{t}</span>)}
  </span>
))}
                </pre>
              </div>
              <div className="cursor absolute left-[46%] top-[44%] flex items-start">
                <svg viewBox="0 0 12 16" className="h-3.5 w-auto drop-shadow" aria-hidden><path d="M1 1 L11 9 L6.5 9.5 L4 14.5 Z" fill="#fff" stroke="#0b0b0c" strokeWidth="1" strokeLinejoin="round" /></svg>
                <span className="mt-2.5 rounded-full px-1.5 py-0.5 text-[7px] font-semibold text-canvas" style={{ background: '#60a5fa' }}>luiz</span>
              </div>
              <span className="absolute left-2 top-2 flex items-center gap-1.5 rounded-full bg-black/60 py-1 pl-2 pr-1.5 backdrop-blur"><b>daniel</b><span className="text-ink-3">Entire screen</span><LiveBadge a={a} /></span>
            </div>
          </div>
        </div>
      </Window>
    </>
  )
}

// Same surfaces as the other mocks; only the format colours come from Lumer.
const L = { ground: 'rgb(255 255 255 / .03)', panel: 'rgb(255 255 255 / .02)', line: 'rgb(255 255 255 / .06)', ink: '#fff', ink2: '#9d9d9f', ink3: '#78787b' }
const fmt = { '3x2': [3, 2, '#d37bb0'], '16x9': [16, 9, '#8e95e0'], '9x16': [9, 16, '#8e95e0'] }
const Aspect = ({ k, s = 10 }) => {
  const [w, h, c] = fmt[k], f = Math.min((s - 2) / w, (s - 2) / h)
  return <span className="grid shrink-0 place-items-center" style={{ width: s, height: s }}><i className="rounded-[1px] border" style={{ width: w * f, height: h * f, borderColor: c, background: `${c}33` }} /></span>
}
const Sw = ({ on, a }) => (
  <i className="relative mt-0.5 h-2 w-3.5 shrink-0 rounded-full" style={{ background: on ? a : 'rgb(255 255 255 / .1)' }}>
    <i className={`absolute top-[1px] size-1.5 rounded-full ${on ? 'knob-on' : ''}`} style={{ left: on ? 7 : 1, background: on ? '#0e0e10' : L.ink3 }} />
  </i>
)
const lumerRules = [
  ['Separar por data', 'Uma pasta para cada dia.', '1 pasta', 'applied'],
  ['Separar por formato', 'Uma pasta por proporção.', '3 formatos', 'applied'],
  ['Separar por câmera', 'Uma pasta por câmera.', '2 câmeras', 'applied'],
  ['Separar por lente', 'Uma pasta por distância focal.', '', 'off'],
  ['Separar por tipo de arquivo', 'JPG, RAW e vídeo separados.', '', 'off'],
]
const node = { applied: { borderColor: '#F7C04A', background: '#F7C04A' }, off: { borderColor: '#58585b', background: 'transparent' } }
const lumerTree = [
  [0, '2026-11-22 - Casamento', 412],
  [1, '3x2', 286, '3x2'], [2, 'Canon EOS R6 - Daniel', 204], [2, 'Sony A7 IV - Luiz', 82],
  [1, '16x9', 94, '16x9'], [2, 'Sony A7 IV - Luiz', 94],
  [1, '9x16', 32, '9x16'],
]

// The Lumer organiser as it ships: frameless title bar, Origem | Estrutura | Destino columns and the action bar.
function LumerMock({ a }) {
  const col = 'min-w-0 px-2.5 pb-3 pt-2'
  const head = (t, d) => <div className="mb-2"><p className="text-[10px] font-semibold" style={{ color: L.ink }}>{t}</p><p className="text-[7.5px]" style={{ color: L.ink2 }}>{d}</p></div>
  const path = (I, name, parent) => (
    <div className="flex items-start gap-1.5 rounded-md border px-1.5 py-1.5" style={{ borderColor: L.line, background: L.ground }}>
      <I size={11} strokeWidth={1.5} color={L.ink2} className="mt-px shrink-0" />
      <span className="min-w-0 flex-1"><span className="block truncate text-[9px] font-semibold">{name}</span><span className="block truncate font-mono text-[7px]" style={{ color: L.ink3 }}>{parent}</span></span>
      <span className="text-[7px]" style={{ color: L.ink2 }}>Trocar</span>
    </div>
  )
  return (
    <>
      <Window url="Lumer">
        <div style={{ fontVariantNumeric: 'tabular-nums' }}>
        <div className="grid grid-cols-[.9fr_1fr_1.15fr] text-[8px]">
          <div className={col} style={{ background: L.panel, borderRight: `1px solid ${L.line}` }}>
            {head('Origem', 'Cartão ou pasta com fotos e vídeos.')}
            {path(HardDrive, 'DCIM', 'E:\\')}
            <p className="mt-2 text-[9.5px]">412 arquivos encontrados</p>
            <p className="text-[7.5px]" style={{ color: L.ink2 }}>38,6 GB para transferir</p>
            <p className="mt-3 text-[8.5px] font-semibold">Filtrar arquivos</p>
            <p className="flex items-center justify-between py-1 font-semibold"><span className="flex items-center gap-1"><ChevronRight size={8} className="rotate-90" /> Formato</span><span style={{ color: L.ink2 }}>3</span></p>
            {[['3x2', '3:2', 'Horizontal', 286], ['16x9', '16:9', 'Horizontal', 94], ['9x16', '9:16', 'Vertical', 32]].map(([k, n, d, c]) => (
              <div key={k} className="rv flex items-center gap-1.5 py-0.5 pl-3">
                <i className="grid size-2 place-items-center rounded-[2px]" style={{ background: a }}><Check size={6} strokeWidth={4} color="#0e0e10" /></i>
                <Aspect k={k} /><span className="flex-1 leading-tight">{n}<span className="block text-[6.5px]" style={{ color: L.ink3 }}>{d}</span></span><span style={{ color: L.ink2 }}>{c}</span>
              </div>
            ))}
            {[['Câmera', 2], ['Lente', 4], ['Tipo de arquivo', 3]].map(([n, c]) => (
              <p key={n} className="flex items-center justify-between py-1 font-semibold"><span className="flex items-center gap-1"><ChevronRight size={8} /> {n}</span><span style={{ color: L.ink2 }}>{c}</span></p>
            ))}
          </div>
          <div className={col} style={{ borderRight: `1px solid ${L.line}` }}>
            {head('Estrutura', 'Como as pastas serão criadas dentro do destino.')}
            <p className="text-[7.5px] font-semibold" style={{ color: L.ink2 }}>Nome do evento</p>
            <p className="mt-0.5 rounded-md border px-1.5 py-1" style={{ borderColor: L.line, background: L.ground }}>Casamento</p>
            <p className="mt-3 text-[8.5px] font-semibold">Pastas</p>
            <ul className="mt-1">
              {lumerRules.map(([t, d, s, st], i) => (
                <li key={t} className="rv relative flex items-start gap-1.5 pb-2 last:pb-0">
                  {i < lumerRules.length - 1 && <i className="absolute bottom-0 left-[10.5px] top-[10px] w-px" style={{ background: L.line }} />}
                  <GripVertical size={8} color={L.ink3} className="mt-px shrink-0 opacity-60" />
                  <i className="mt-[2px] size-[6px] shrink-0 rounded-full border-[1.5px]" style={node[st]} />
                  <span className="min-w-0 flex-1 leading-tight">
                    <span className="block font-semibold" style={{ color: st === 'off' ? L.ink2 : L.ink }}>{t}</span>
                    <span className="block text-[6.5px]" style={{ color: L.ink3 }}>{d}</span>
                    {s && <span className="block text-[6.5px]" style={{ color: a }}>{s}</span>}
                  </span>
                  <Sw on={st !== 'off'} a={a} />
                </li>
              ))}
            </ul>
          </div>
          <div className={col}>
            {head('Destino', 'Onde as pastas do evento serão criadas.')}
            <p className="mb-0.5 text-[7.5px] font-semibold" style={{ color: L.ink2 }}>O que fazer com os arquivos</p>
            <div className="grid grid-cols-3 gap-1">
              {[[Copy, 'Copiar'], [FolderInput, 'Mover'], [FolderTree, 'Reorganizar']].map(([I, t], i) => (
                <span key={t} className="flex items-center gap-1 rounded-md border px-1 py-1 font-semibold" style={i ? { borderColor: L.line } : { borderColor: a, background: `${a}1a` }}><I size={8} color={i ? L.ink3 : a} /> {t}</span>
              ))}
            </div>
            <div className="mt-2">{path(HardDriveDownload, 'Eventos 2026', 'D:\\Fotos\\')}</div>
            <p className="mt-3 flex items-baseline justify-between"><span className="text-[8.5px] font-semibold">Prévia</span><span className="text-[7px]" style={{ color: L.ink2 }}>7 pastas, 38,6 GB</span></p>
            <p className="mt-1 flex items-center gap-1 font-mono text-[7px]" style={{ color: L.ink3 }}><FolderOpen size={9} strokeWidth={1.5} /> Eventos 2026</p>
            <div className="ml-1 border-l pl-1.5" style={{ borderColor: L.line }}>
              {lumerTree.map(([d, n, c, k], i) => (
                <div key={i} className="rv flex items-center gap-1 py-[1.5px]" style={{ paddingLeft: d * 8 }}>
                  {k ? <Aspect k={k} s={9} /> : d === 0 ? <FolderOpen size={9} strokeWidth={1.5} color={a} /> : <Folder size={9} strokeWidth={1.5} color={L.ink3} />}
                  <span className="min-w-0 flex-1 truncate font-mono text-[7px]" style={{ color: d ? L.ink2 : L.ink }}>{n}</span>
                  <span className="text-[7px]" style={{ color: L.ink2 }}>{c}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 border-t px-2.5 py-2" style={{ borderColor: L.line, background: L.panel }}>
          <span className="flex items-center gap-1 text-[8px]" style={{ color: L.ink2 }}><Info size={9} /> Pronto para copiar 412 arquivos para Eventos 2026.</span>
          <span className="rounded-md px-3 py-1 text-[8px] font-semibold" style={{ background: a, color: '#0e0e10' }}>Copiar 412 arquivos</span>
        </div>
        </div>
      </Window>
      <div className="float bottom-[-9%] right-[-5%] w-48">
        <div className="flex justify-between text-[11px]"><span className="font-medium">Copiando arquivos...</span><span className="count tabular-nums text-ink-3">65%</span></div>
        <div className="mt-2 h-1 rounded-full bg-white/[.08]"><div className="grow-x h-full w-[65%] rounded-full" style={{ background: a }} /></div>
        <p className="mt-2 truncate text-[10px] text-ink-3">268 de 412, IMG_4821.CR3</p>
      </div>
    </>
  )
}

export const projects = [
  { id: 'silus', name: 'Silus', desc: 'Controle financeiro pessoal: contas, metas e para onde vai cada real do mês.', href: 'https://www.silus.app', host: 'silus.app', Icon: Hexagon, accent: '#3dd6c3', Mock: SilusMock },
  { id: 'merer', name: 'Merer', desc: 'Tarefas, projetos e foco num só lugar, com temas que mudam de cor com você.', href: 'https://merer.madebyprism.app', host: 'merer.madebyprism.app', Icon: Pyramid, accent: '#9b8cff', Mock: MererMock },
  { id: 'screenshare', name: 'ScreenShare', desc: 'Compartilhe a tela direto do navegador, ponto a ponto. Manda o link e pronto.', href: 'https://screen.luizfranzon.dev/', host: 'screen.luizfranzon.dev', dl: 'https://screen.luizfranzon.dev/desktop/Screenshare%20Setup%201.9.5.exe', Icon: Play, accent: '#bef264', Mock: ScreenMock },
  { id: 'lumer', name: 'Lumer', desc: 'Descarrega o cartão e organiza fotos e vídeos por evento, data, formato e câmera, sem sobrescrever nada.', dl: 'https://github.com/prismlab-dev/lumer/releases/download/v1.0.0/Lumer.Setup.1.0.0.exe', Icon: Layers2, accent: '#F7C04A', Mock: LumerMock },
]

function Project({ p }) {
  const root = useRef()
  const stage = useRef()
  const cta = useRef()

  // CTA as a small prism: it leans toward the pointer like a magnet, a spot of light under the pointer takes the hue of
  // where it sits (red at the left edge through violet at the right), and a spectrum edge turns around the pill while hovered.
  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => cta.current.querySelectorAll('.cta').forEach((el) => {
      const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' })
      const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' })
      gsap.set(el, { '--ang': '0deg', '--on': 0 })
      let spin
      const enter = () => {
        gsap.to(el, { '--on': 1, scale: 1.04, duration: 0.35, ease: 'power3.out', overwrite: 'auto' })
        spin = gsap.to(el, { '--ang': '+=360deg', duration: 2.4, ease: 'none', repeat: -1 })
      }
      const move = (e) => {
        const r = el.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top
        el.style.setProperty('--mx', `${mx}px`)
        el.style.setProperty('--my', `${my}px`)
        el.style.setProperty('--h', Math.round(gsap.utils.clamp(0, 1, mx / r.width) * 280))
        xTo((mx - r.width / 2) * 0.18)
        yTo((my - r.height / 2) * 0.3)
      }
      const leave = () => {
        xTo(0); yTo(0); spin?.kill()
        gsap.to(el, { '--on': 0, scale: 1, duration: 0.4, ease: 'power3.out', overwrite: 'auto' })
      }
      const down = () => gsap.to(el, { scale: 0.95, duration: 0.12, ease: 'power2.out', overwrite: 'auto' })
      const up = () => gsap.to(el, { scale: 1.04, duration: 0.5, ease: 'elastic.out(1, 0.45)', overwrite: 'auto' })
      const ev = { pointerenter: enter, pointermove: move, pointerleave: leave, pointerdown: down, pointerup: up }
      Object.entries(ev).forEach(([k, f]) => el.addEventListener(k, f))
      return () => { spin?.kill(); Object.entries(ev).forEach(([k, f]) => el.removeEventListener(k, f)) }
    }))
  }, { scope: cta })

  // Entrance, once per section as it scrolls in: the window opens out of a thin vertical slit like a beam widening
  // into light, the halo blooms behind it, the icon turns in (the hero atom's move), the name is drawn left to right
  // and the copy follows. One orchestrated moment; nothing repeats.
  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.timeline({ scrollTrigger: { trigger: root.current, start: 'top 72%', once: true }, defaults: { ease: 'expo.out' } })
        .from('.window', { clipPath: 'inset(0% 49.5% 0% 49.5% round 18px)', duration: 1.3, ease: 'expo.inOut', clearProps: 'clipPath' }, 0)
        // Out of focus as it opens, sharpening a beat behind the opening so it lands crisp just as it reaches full width.
        .from('.window', { filter: 'blur(18px)', duration: 1.6, ease: 'power2.out', clearProps: 'filter' }, 0)
        .from('.halo', { scale: 0.2, autoAlpha: 0, duration: 1.8 }, 0.25)
        // Icon: each stroke is traced like light running round the shape, out of a blur, as the glyph settles to size.
        .from('.icon-3d', { scale: 0.8, rotation: -20, filter: 'blur(10px)', duration: 1.4, clearProps: 'filter' }, 0.1)
        .fromTo('.icon-3d .lucide > *', { strokeDashoffset: (i, el) => el.getTotalLength?.() ?? 0, strokeDasharray: (i, el) => el.getTotalLength?.() ?? 0 },
          { strokeDashoffset: 0, duration: 1.3, ease: 'power2.inOut', stagger: 0.12, clearProps: 'strokeDasharray,strokeDashoffset' }, 0.1)
        // Name: letter by letter, each rising out of a blur and turning up from below like a card flipped into the light.
        .from('.title-3d .ch', { yPercent: 70, rotationX: -75, autoAlpha: 0, filter: 'blur(12px)', transformOrigin: '50% 100%', duration: 1.1, stagger: 0.045, clearProps: 'filter' }, 0.3)
        // Inside the window, once it has opened: the content builds itself up in reading order.
        .from('.window .rv', { autoAlpha: 0, y: 8, filter: 'blur(6px)', duration: 0.7, stagger: 0.04, ease: 'power3.out', clearProps: 'filter' }, 0.75)
        .from('.window .pop', { scale: 0.85, autoAlpha: 0, duration: 0.9, ease: 'back.out(1.4)' }, 0.8)
        .from('.grow-x', { scaleX: 0, transformOrigin: 'left center', duration: 1.1, stagger: 0.05 }, 1)
        .from('.grow-y', { scaleY: 0, transformOrigin: 'center bottom', duration: 0.6, stagger: 0.04, ease: 'back.out(2)' }, 1.5)
        .fromTo('.draw', { strokeDasharray: 200, strokeDashoffset: 200 }, { strokeDashoffset: 0, duration: 1.4, ease: 'power2.inOut', stagger: 0.15, clearProps: 'strokeDasharray,strokeDashoffset' }, 0.9)
        .from('.ring', { strokeDashoffset: 94.2, duration: 1.4, ease: 'power3.inOut' }, 1.5)
        .from('.knob-on', { left: 1, duration: 0.4, stagger: 0.1, ease: 'back.out(2)' }, 1.2)
        .from('.cursor', { x: -70, y: 50, autoAlpha: 0, duration: 1.3, ease: 'power3.inOut' }, 1.3)
        // The floating cards fly in last, from behind the window toward the viewer, with a little overshoot.
        .from('.float', { autoAlpha: 0, y: 40, scale: 0.7, rotationX: -35, filter: 'blur(10px)', duration: 1.1, ease: 'back.out(1.5)', stagger: 0.18, clearProps: 'filter' }, 1.3)
        .add(() => root.current.querySelectorAll('.count').forEach((el) => {
          const n = parseFloat(el.textContent), o = { v: 0 }
          gsap.to(o, { v: n, duration: 1.2, ease: 'power2.out', onUpdate: () => { el.textContent = `${Math.round(o.v)}%` } })
        }), 1.4)
        .from('.p-copy > *', { y: 14, autoAlpha: 0, duration: 0.9, stagger: 0.08 }, 0.4)
    })
  }, { scope: root })

  // Pointer, fine pointers with motion allowed only: the device tilts toward it, the halo drifts after it like a light
  // source being carried, and the window's rim lights up in the spectrum on the side nearest the pointer (the same
  // spectrum edge the buttons wear, here as an arc that follows instead of a full turn).
  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
      // Listens on the whole project row, so the tilt answers from the copy side too; the maths stays relative to the device.
      const el = stage.current, area = root.current, win = el.querySelector('.window')
      const rx = gsap.quickTo('.device', 'rotationX', { duration: 0.9, ease: 'power3' })
      const ry = gsap.quickTo('.device', 'rotationY', { duration: 0.9, ease: 'power3' })
      const hx = gsap.quickTo('.halo', 'x', { duration: 1.4, ease: 'power3' })
      const hy = gsap.quickTo('.halo', 'y', { duration: 1.4, ease: 'power3' })
      const base = -16
      gsap.set('.device', { rotationX: 10, rotationY: base })
      gsap.set(win, { '--rim': 0, '--ra': '0deg' })
      let ang = 0
      const move = (e) => {
        const r = el.getBoundingClientRect(), nx = gsap.utils.clamp(-0.5, 0.5, (e.clientX - r.left) / r.width - 0.5), ny = gsap.utils.clamp(-0.5, 0.5, (e.clientY - r.top) / r.height - 0.5)
        ry(base + nx * 16)
        rx(10 - ny * 12)
        hx(nx * r.width * 0.25)
        hy(ny * r.height * 0.25)
        // Shortest way round, so crossing ±180deg doesn't spin the arc all the way back.
        const t = Math.atan2(ny, nx) * 180 / Math.PI + 90
        ang += ((t - ang + 540) % 360) - 180
        gsap.to(win, { '--ra': `${ang}deg`, '--rim': 1, duration: 0.5, ease: 'power3.out', overwrite: 'auto' })
      }
      const leave = () => { rx(10); ry(base); hx(0); hy(0); gsap.to(win, { '--rim': 0, duration: 0.6, ease: 'power3.out', overwrite: 'auto' }) }
      area.addEventListener('pointermove', move)
      area.addEventListener('pointerleave', leave)
      return () => { area.removeEventListener('pointermove', move); area.removeEventListener('pointerleave', leave) }
    })
  }, { scope: stage })

  return (
    <article ref={root} id={p.id} style={{ '--accent': p.accent }} className="project relative grid items-center gap-10 py-16 md:grid-cols-[2fr_3fr] md:gap-16">
      <div className="p-text">
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
        <h3 aria-label={p.name} className={`title-3d font-[Sora] font-semibold tracking-[-.03em] whitespace-nowrap title-fit`}>
          {[...p.name].map((c, i) => <span key={i} className="ch" aria-hidden>{c}</span>)}
        </h3>
        </div>
        <div className="p-copy">
        <p className="mt-6 max-w-sm text-lg leading-relaxed text-ink-2">{p.desc}</p>
        <div ref={cta} className="mt-8 flex flex-wrap items-center gap-3">
          {p.href && (
            <a href={p.href} target="_blank" rel="noreferrer" className="cta cta-solid relative inline-flex items-center gap-1.5 overflow-hidden rounded-full px-5 py-3 text-sm font-medium" style={{ '--fill': p.accent }}>
              <span className="spec" aria-hidden />Abrir {p.host} <ArrowUpRight className="cta-icon" size={16} />
            </a>
          )}
          {/* Same tab: the installer is served as an attachment, so the browser just saves it. Secondary when there's also a site. */}
          {p.dl && (
            <a href={p.dl} className={`cta relative inline-flex items-center gap-1.5 overflow-hidden rounded-full px-5 py-3 text-sm font-medium ${p.href ? 'cta-ghost border' : 'cta-solid'}`} style={p.href ? { borderColor: `rgb(from ${p.accent} r g b / .4)`, color: p.accent } : { '--fill': p.accent }}>
              <span className="spec" aria-hidden />Baixar para Windows <Download className="cta-icon cta-dl" size={16} />
            </a>
          )}
          {!p.href && !p.dl && <span className="flex items-center gap-2 text-sm text-ink-3"><i className="size-2 rounded-full border border-ink-3" /> Em breve</span>}
        </div>
        </div>
      </div>

      <div ref={stage} className="stage relative">
        <span className="halo" />
        <div className="device" style={{ '--tilt': '-16deg' }}>
          <p.Mock a={p.accent} />
        </div>
      </div>
    </article>
  )
}

export default function Showcase() {
  const root = useRef()
  const toc = useRef()
  const [active, setActive] = useState(null)

  // Side index: shows once the hero is left behind and the projects are on screen, its beam fills with the scroll
  // through the showcase, and the project under the middle of the viewport is the lit one.
  useGSAP(() => {
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches
    ScrollTrigger.create({ trigger: root.current, start: 'top 60%', end: 'bottom 40%',
      onToggle: (st) => gsap.to(toc.current, { autoAlpha: st.isActive ? 1 : 0, x: still ? 0 : st.isActive ? 0 : -12, duration: still ? 0 : 0.5, ease: 'power3.out' }) })
    gsap.fromTo('.toc-fill', { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top 50%', end: 'bottom 50%', scrub: still ? true : 0.4 } })
    projects.forEach((p) => ScrollTrigger.create({ trigger: `#${p.id}`, start: 'top 50%', end: 'bottom 50%', onToggle: (st) => st.isActive && setActive(p.id) }))
  }, { scope: root })

  return (
    <section ref={root} id="projetos" aria-label="Nossos projetos" className="relative pb-16">
      <nav ref={toc} className="toc" aria-label="Projetos">
        <span className="toc-track" aria-hidden><span className="toc-fill" style={{ background: `linear-gradient(${projects.map((p) => p.accent).join(', ')})` }} /></span>
        <ul>
          {projects.map((p) => (
            <li key={p.id}>
              <a href={`#${p.id}`} className="toc-item" aria-current={active === p.id ? 'true' : undefined} style={{ '--accent': p.accent }}>
                <span className="toc-node"><p.Icon size={14} strokeWidth={2} aria-hidden /></span>
                <span className="toc-name">{p.name}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
      {projects.map((p) => <Project key={p.name} p={p} />)}
    </section>
  )
}
