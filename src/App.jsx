import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { Atom } from 'lucide-react'
import Showcase from './Showcase'
import CodeField from './CodeField'

const GithubIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" /></svg>
)

const team = ['Daniel Frizzatti', 'Luiz Franzon', 'Ryan Rodrigues']

const links = [
  { name: 'GitHub', desc: 'Código de todos os projetos', href: 'https://github.com/prismlab-dev', Icon: GithubIcon },
]

export default function App() {
  const root = useRef()

  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      // One orchestrated load: the code wakes up line by line, the name opens from its centre like an aperture
      // while the tracking settles, the atom spins into place, the team is named, and a first glitch lands as it settles.
      gsap.timeline({ defaults: { ease: 'expo.out' } })
        .from('.code-dim .code-line', { opacity: 0, duration: 1.2, stagger: { each: 0.012, from: 'random' }, ease: 'power1.out' }, 0)
        .fromTo('h1.hero-title', { clipPath: 'inset(-25% 50% -25% 50%)', letterSpacing: '.34em' }, { clipPath: 'inset(-25% -4% -25% -4%)', letterSpacing: '.18em', duration: 2 }, 0.15)
        .from('h1 .atom-a', { rotation: -140, scale: 0.85, transformOrigin: '50% 50%', duration: 2.2 }, 0.3)
        .from('.name-item', { opacity: 0, y: 10, scale: 0.96, filter: 'blur(4px)', duration: 0.9, stagger: 0.08, clearProps: 'filter' }, 1.05)

      // Glitch: every few seconds the red and cyan channels tear off in horizontal slices for a few frames.
      // Short and rare on purpose, so it reads as a signal flicker rather than a constant effect.
      const r = gsap.utils.random
      const burst = () => {
        const tl = gsap.timeline({ onComplete: () => gsap.delayedCall(r(2.5, 6), burst) })
        for (let i = 0; i < 5; i++) {
          const top = r(0, 80), cut = `inset(${top}% 0 ${Math.max(0, 100 - top - r(8, 30))}% 0)`
          tl.set('.gl-a', { opacity: 1, x: r(-10, 10), clipPath: cut }, i * 0.05)
            .set('.gl-b', { opacity: 1, x: r(-10, 10), clipPath: `inset(${r(0, 80)}% 0 ${r(0, 60)}% 0)` }, i * 0.05)
            .set('h1.hero-title', { x: r(-3, 3), skewX: r(-4, 4) }, i * 0.05)
        }
        tl.set('.glitch', { opacity: 0, x: 0 }, 0.25).set('h1.hero-title', { x: 0, skewX: 0 }, 0.25)
      }
      gsap.delayedCall(1.5, burst)

      // The atom repeats its entrance spin now and then, one full turn, then rests.
      const spin = () => gsap.to('h1 .atom-a', { rotation: '+=360', duration: 1.8, ease: 'expo.inOut', onComplete: () => gsap.delayedCall(r(6, 11), spin) })
      gsap.delayedCall(r(6, 9), spin)
    })
  }, { scope: root })

  return (
    <div ref={root} className="relative overflow-x-clip">
      <header className="relative">
        <nav className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 text-sm">
          <a href="#" className="flex items-center gap-2.5 font-[Firjar] text-[15px] tracking-[.12em] uppercase">
            <Atom className="size-5" strokeWidth={1.75} aria-hidden /> Prism Labs
          </a>
          <div className="-mr-2 flex items-center gap-1 text-ink-3">
            {links.map(({ name, desc, href, Icon }) => (
              <a key={name} href={href} target="_blank" rel="noreferrer" aria-label={name} title={desc} className="team grid size-10 place-items-center rounded-full">
                <Icon className="size-[18px]" />
              </a>
            ))}
          </div>
        </nav>

        <section className="hero relative">
          <CodeField />
          <div className="relative mx-auto flex min-h-[60svh] max-w-6xl flex-col items-center justify-center px-6 pb-6 text-center">
            <div className="relative">
              <h1 className="hero-title" aria-label="Prism Labs">
                <span aria-hidden>Prism L<Atom className="atom-a" strokeWidth={1.6} />bs</span>
              </h1>
              {['gl-a', 'gl-b'].map((g) => (
                <span key={g} className={`hero-title glitch ${g}`} aria-hidden>Prism L<Atom className="atom-a" strokeWidth={1.6} />bs</span>
              ))}
            </div>
            <ul className="hero-names mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1" aria-label="Equipe">
              {team.map((n, i) => <li key={n} className="name-item">{i > 0 && <span className="mr-4 text-ink-4" aria-hidden>·</span>}{n}</li>)}
            </ul>
          </div>
        </section>
      </header>

      <main className="mx-auto max-w-6xl px-6">
        <Showcase />
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-ink-3">© {new Date().getFullYear()} Prism Labs</div>
      </footer>
    </div>
  )
}
