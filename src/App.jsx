import { useEffect, useRef, useState, useCallback } from 'react'
import {
  motion, AnimatePresence, MotionConfig, useScroll, useTransform, useMotionValue, useSpring,
  useVelocity, useAnimationFrame, useReducedMotion, wrap,
} from 'framer-motion'
import Lenis from 'lenis'
import Silk from './components/Silk.jsx'
import Viz from './components/Viz.jsx'
import { mountGame, sound, best } from './games.js'
import { projects, capabilities, tools, EMAIL, LINKEDIN } from './data.js'

const EASE = [0.22, 1, 0.36, 1]

/* ---------- helpers ---------- */
function useJakartaTime() {
  const fmt = () => new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })
  const [t, setT] = useState(fmt)
  useEffect(() => { const id = setInterval(() => setT(fmt()), 10000); return () => clearInterval(id) }, [])
  return t
}

function Toast({ msg }) {
  return (
    <AnimatePresence>
      {msg && (
        <motion.div key={msg} className="toast" role="status" style={{ x: '-50%' }}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: .35, ease: EASE }}>
          {msg}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function useCopy(setToast) {
  return useCallback(async () => {
    try { await navigator.clipboard.writeText(EMAIL); setToast('Email copied') }
    catch {
      const el = document.getElementById('mailText')
      if (el) { const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r) }
      setToast('Selected, press Ctrl+C')
    }
    setTimeout(() => setToast(''), 2200)
  }, [setToast])
}

/* Characters slide up out of a clipped line. */
function Split({ text, delay = 0, step = .028 }) {
  return (
    <span className="line" aria-label={text}>
      {[...text].map((c, i) => (
        <motion.span key={i} className="ch" aria-hidden="true"
          initial={{ y: '108%' }} animate={{ y: '0%' }}
          transition={{ duration: 1.05, ease: EASE, delay: delay + i * step }}>
          {c === ' ' ? ' ' : c}
        </motion.span>
      ))}
    </span>
  )
}

/* Fades/lifts once when scrolled into view. Visible by default under reduced motion. */
function Reveal({ children, delay = 0, y = 24, as = 'div', ...rest }) {
  const M = motion[as]
  return (
    <M initial={{ opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ duration: .9, ease: EASE, delay }} {...rest}>
      {children}
    </M>
  )
}

/* ---------- cursor ---------- */
function Cursor() {
  const x = useMotionValue(-100), y = useMotionValue(-100)
  const sx = useSpring(x, { stiffness: 500, damping: 40, mass: .4 }), sy = useSpring(y, { stiffness: 500, damping: 40, mass: .4 })
  const [label, setLabel] = useState('')
  const [hover, setHover] = useState(false)
  useEffect(() => {
    const mv = e => { x.set(e.clientX); y.set(e.clientY) }
    const ov = e => { const t = e.target.closest?.('a,button,[data-cursor]'); setHover(!!t); setLabel(t?.dataset?.cursor || '') }
    addEventListener('pointermove', mv, { passive: true }); addEventListener('pointerover', ov)
    return () => { removeEventListener('pointermove', mv); removeEventListener('pointerover', ov) }
  }, [x, y])
  return (
    <motion.div className="cursor" style={{ x: sx, y: sy }} animate={{ scale: label ? 7 : hover ? 3 : 1 }} transition={{ type: 'spring', stiffness: 300, damping: 24 }} aria-hidden="true">
      <span style={{ opacity: label ? 1 : 0 }}>{label}</span>
    </motion.div>
  )
}

/* ---------- nav ---------- */
function Nav() {
  const t = useJakartaTime()
  return (
    <motion.header className="nav wrap" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .8, ease: EASE, delay: .9 }}>
      <a href="#top" className="brand">C.Y.S</a>
      <nav className="mid" aria-label="Sections">
        <a className="lnk" href="#work">Work</a><a className="lnk" href="#play">Play</a><a className="lnk" href="#contact">Contact</a>
      </nav>
      <div className="right"><span className="mono">Jakarta {t}</span></div>
    </motion.header>
  )
}

/* ---------- hero ---------- */
function Hero() {
  return (
    <section className="hero wrap" id="top">
      <h1 className="giant"><Split text="Christopher" delay={.15} /></h1>
      <div className="row2">
        <motion.p className="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 1 }}>
          <b>Mobile engineer</b> who works the whole stack. Flutter on the screen, Laravel and SQL Server behind it.
        </motion.p>
        <div className="giant sub"><Split text="Yesaya Susanto" delay={.45} step={.022} /></div>
      </div>
      <motion.div className="base mono" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 1.25 }}>
        <span className="status"><i />Open to work &amp; collaboration</span>
        <span>Informatics · Universitas Bunda Mulia</span>
        <span>Scroll ↓</span>
      </motion.div>
    </section>
  )
}

/* ---------- statement: words light up with scroll ---------- */
function Word({ children, progress, range }) {
  const o = useTransform(progress, range, [.2, 1])
  return <motion.span className="w" style={{ opacity: o }}>{children}</motion.span>
}
function Statement() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'end 0.45'] })
  const text = 'I build software you can hold in one hand. Apps that roles actually use, APIs that stay boring under load, and data that turns into a decision.'
  const words = text.split(' ')
  return (
    <section className="statement wrap" ref={ref}>
      <span className="label">About</span>
      <p>{words.map((w, i) => <Word key={i} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]}>{w}</Word>)}</p>
    </section>
  )
}

/* ---------- work index ---------- */
function Work() {
  const [open, setOpen] = useState(null)
  const [hov, setHov] = useState(null)
  const mx = useMotionValue(0), my = useMotionValue(0)
  const px = useSpring(mx, { stiffness: 220, damping: 26 }), py = useSpring(my, { stiffness: 220, damping: 26 })
  const rot = useTransform(useVelocity(px), [-1500, 1500], [-8, 8])
  const fine = typeof matchMedia !== 'undefined' && matchMedia('(hover: hover) and (pointer: fine)').matches
  const onMove = e => { mx.set(e.clientX + 48); my.set(e.clientY - 115) }
  const current = projects.find(p => p.id === hov)
  return (
    <section className="block wrap" id="work">
      <Reveal className="shead">
        <h2>Selected work<sup>({projects.length})</sup></h2>
        <p>Production apps from my internship at PT Gaya Makmur Tractors, plus two machine-learning research projects.</p>
      </Reveal>
      <ul className="rows" onPointerMove={onMove} onPointerLeave={() => setHov(null)}>
        {projects.map((p, i) => {
          const isOpen = open === p.id
          return (
            <motion.li key={p.id} className={'rowi' + (isOpen ? ' open' : '')} onPointerEnter={() => setHov(p.id)}
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '0px 0px -8% 0px' }} transition={{ duration: .8, ease: EASE, delay: i * .06 }}>
              <button type="button" aria-expanded={isOpen} aria-controls={'d-' + p.id} onClick={() => setOpen(isOpen ? null : p.id)} data-cursor={isOpen ? 'Close' : 'Open'}>
                <span className="idx">{String(i + 1).padStart(2, '0')}</span>
                <motion.span className="nm" animate={{ x: hov === p.id && fine ? 18 : 0 }} transition={{ duration: .5, ease: EASE }}>{p.name}</motion.span>
                <span className="meta mono"><span>{p.kind}<i className="plus" aria-hidden="true" /></span><span style={{ color: 'var(--faint)' }}>{p.full}</span></span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div id={'d-' + p.id} className="detail" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: .6, ease: EASE }}>
                    <div className="in">
                      <span />
                      <div>
                        <p>{p.body}</p>
                        <div className="tags">{p.stack.map(s => <span key={s}>{s}</span>)}</div>
                      </div>
                      <div className="mviz"><Viz type={p.viz} /></div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.li>
          )
        })}
      </ul>
      {fine && (
        <AnimatePresence>
          {current && (
            <motion.div className="preview" style={{ x: px, y: py, rotate: rot }} key="pv"
              initial={{ opacity: 0, scale: .85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: .85 }} transition={{ duration: .35, ease: EASE }}>
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div key={current.id} style={{ position: 'absolute', inset: 0 }} initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '-100%' }} transition={{ duration: .5, ease: EASE }}>
                  <Viz type={current.viz} />
                  <span className="cap">{current.stack.join(' · ')}</span>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </section>
  )
}

/* ---------- capabilities + velocity marquee ---------- */
function Marquee({ items, base = -2.2 }) {
  const reduced = useReducedMotion()
  const x = useMotionValue(0)
  const { scrollY } = useScroll()
  const vel = useSpring(useVelocity(scrollY), { damping: 50, stiffness: 400 })
  const factor = useTransform(vel, [-1500, 0, 1500], [-4, 0, 4], { clamp: false })
  const dir = useRef(1)
  const pos = useTransform(x, v => `${wrap(-50, 0, v)}%`)
  useAnimationFrame((_, dt) => {
    if (reduced) return
    let m = dir.current * base * (dt / 1000)
    const f = factor.get(); if (f < 0) dir.current = -1; else if (f > 0) dir.current = 1
    m += dir.current * m * Math.abs(f)
    x.set(x.get() + m)
  })
  const row = items.map((t, i) => <span key={i}>{t}</span>)
  return <div className="marquee" aria-hidden="true"><motion.div className="track" style={{ x: pos }}>{row}{row}</motion.div></div>
}

function Capabilities() {
  return (
    <section className="block" id="stack">
      <div className="wrap">
        <Reveal className="shead"><h2>Capabilities</h2><p>A small toolkit I know deeply, plus AI assistants in the loop to plan, draft and review faster.</p></Reveal>
        <div className="caps">
          {capabilities.map((c, i) => (
            <Reveal className="cap" key={c.title} delay={i * .08}>
              <h3>{c.title}</h3>
              <ul>{c.items.map(it => <li key={it}>{it}</li>)}</ul>
            </Reveal>
          ))}
        </div>
      </div>
      <Marquee items={tools} />
    </section>
  )
}

/* ---------- playground ---------- */
function Playground() {
  const stageRef = useRef(null), cvRef = useRef(null)
  const [game, setGame] = useState('snake')
  const [score, setScore] = useState(0)
  const [top, setTop] = useState(() => best('snake'))
  const [hint, setHint] = useState('')
  const [snd, setSnd] = useState(sound.on)
  const t = useJakartaTime()
  const picked = useRef(false)
  useEffect(() => {
    const m = mountGame(game, stageRef.current, cvRef.current, (s, b) => { setScore(s); setTop(b) }, picked.current)
    setHint(m.hint)
    return () => m.destroy()
  }, [game])
  return (
    <section className="block wrap" id="play">
      <Reveal className="shead"><h2>Play</h2><p>I'm a mobile engineer, so this portfolio ships with a phone. Pick a game. Your best score stays in this browser.</p></Reveal>
      <div className="play">
        <div className="ctl">
          <div className="picker" role="group" aria-label="Choose a game">
            {[['snake', 'Snake', 'Arrows · swipe'], ['breakout', 'Breakout', 'Mouse · drag'], ['pong', 'Pong', 'First to 7']].map(([id, name, sub]) => (
              <button key={id} type="button" aria-pressed={game === id} onClick={() => { picked.current = true; setGame(id) }} data-cursor="Play">
                <span className="g">{name}</span><span className="label">{sub}</span>
              </button>
            ))}
          </div>
          <div className="hudline">
            <span className="label">Score<b>{score}</b></span>
            <span className="label">Best<b>{top}</b></span>
            <button type="button" className="ghost" aria-pressed={!snd} onClick={() => setSnd(sound.toggle())}>{snd ? 'Sound on' : 'Sound off'}</button>
          </div>
        </div>
        <Reveal y={60}>
          <motion.div className="device" whileHover={{ rotate: -1.2, y: -6 }} transition={{ type: 'spring', stiffness: 200, damping: 18 }}>
            <div className="isl" />
            <div className="scr">
              <div className="bar"><span>{t}</span><span className="mono" style={{ fontSize: 10 }}>5G</span></div>
              <div className="stage" ref={stageRef} tabIndex={0} aria-label={`${game} game. ${hint}`}><canvas ref={cvRef} /></div>
            </div>
            <span className="hint label">{hint}</span>
          </motion.div>
        </Reveal>
      </div>
    </section>
  )
}

/* ---------- journey ---------- */
function Journey() {
  const rows = [
    ['Now', 'Flutter & Laravel Developer', 'PT Gaya Makmur Tractors · Internship', 'Internal mobile and web apps for customer data, warehouse scanning and team discussion, on a SQL Server multi-database architecture.'],
    ['Education', 'Informatics', 'Universitas Bunda Mulia · GPA 3.8+', 'Applied machine learning research: medical image classification with transformers and demand forecasting with gradient boosting.'],
  ]
  return (
    <section className="block wrap" id="journey">
      <Reveal className="shead"><h2>Journey</h2></Reveal>
      <div className="jrows">
        {rows.map((r, i) => (
          <Reveal className="jrow" key={r[1]} delay={i * .08}>
            <span className="label">{r[0]}</span>
            <div><h3>{r[1]}</h3><span className="org">{r[2]}</span></div>
            <p>{r[3]}</p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

/* ---------- contact ---------- */
function Magnet({ children, ...rest }) {
  const ref = useRef(null)
  const x = useMotionValue(0), y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 180, damping: 14 }), sy = useSpring(y, { stiffness: 180, damping: 14 })
  const move = e => { const r = ref.current.getBoundingClientRect(); x.set((e.clientX - r.left - r.width / 2) * .35); y.set((e.clientY - r.top - r.height / 2) * .35) }
  return <motion.button ref={ref} style={{ x: sx, y: sy }} onPointerMove={move} onPointerLeave={() => { x.set(0); y.set(0) }} whileTap={{ scale: .94 }} {...rest}>{children}</motion.button>
}

function Contact({ copy }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end end'] })
  const x1 = useTransform(scrollYProgress, [0, 1], ['-12%', '0%'])
  const x2 = useTransform(scrollYProgress, [0, 1], ['12%', '0%'])
  return (
    <section className="contact wrap" id="contact" ref={ref}>
      <span className="label">Contact</span>
      <h2 className="giant big"><motion.span className="line" style={{ x: x1 }}>Let's build</motion.span><motion.span className="line" style={{ x: x2, textAlign: 'right' }}>something</motion.span></h2>
      <div className="grid">
        <div>
          <span className="mail" id="mailText">{EMAIL}</span>
          <div className="links">
            <a className="ghost" href={LINKEDIN} target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>
            <a className="ghost" href="https://github.com/Chrisyesaya" target="_blank" rel="noopener noreferrer">GitHub ↗</a>
          </div>
        </div>
        <Magnet className="magnet" type="button" onClick={copy} data-cursor="Copy">Copy email</Magnet>
      </div>
    </section>
  )
}

/* ---------- app ---------- */
export default function App() {
  const reduced = useReducedMotion()
  const [toast, setToast] = useState('')
  const copy = useCopy(setToast)
  const { scrollY } = useScroll()
  const veil = useTransform(scrollY, v => Math.min(.72, v / (typeof innerHeight !== 'undefined' ? innerHeight * 1.2 : 900)))

  useEffect(() => {
    if (reduced) return
    const lenis = new Lenis({ lerp: .1, smoothWheel: true })
    let id = requestAnimationFrame(function raf(t) { lenis.raf(t); id = requestAnimationFrame(raf) })
    const onClick = e => { const a = e.target.closest('a[href^="#"]'); if (!a) return; const el = document.querySelector(a.getAttribute('href')); if (el) { e.preventDefault(); lenis.scrollTo(el, { offset: 0, duration: 1.4 }) } }
    document.addEventListener('click', onClick)
    return () => { cancelAnimationFrame(id); lenis.destroy(); document.removeEventListener('click', onClick) }
  }, [reduced])

  return (
    <MotionConfig reducedMotion="user">
      <Silk reduced={reduced} />
      <motion.div className="veil" style={{ opacity: veil }} />
      {!reduced && <Cursor />}
      <Nav />
      <main className="page">
        <Hero />
        <Statement />
        <Work />
        <Capabilities />
        <Playground />
        <Journey />
        <Contact copy={copy} />
        <footer className="wrap mono">
          <span>© 2026 Christopher Yesaya Susanto</span>
          <span style={{ color: 'var(--faint)' }}>Built with React, Framer Motion &amp; a WebGL silk shader</span>
          <a href="#top">Back to top ↑</a>
        </footer>
      </main>
      <Toast msg={toast} />
    </MotionConfig>
  )
}
