import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, MotionConfig, useScroll, useTransform, useReducedMotion } from 'framer-motion'
import Lenis from 'lenis'
import Silk from './components/Silk.jsx'
import Viz from './components/Viz.jsx'
import { projects, capabilities, tools, EMAIL, LINKEDIN } from './data.js'

const EASE = [0.22, 1, 0.36, 1]
const GMAIL = `https://mail.google.com/mail/?view=cm&fs=1&to=${EMAIL}`

/* ---------- helpers ---------- */
function useJakartaTime() {
  const fmt = () => new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })
  const [t, setT] = useState(fmt)
  useEffect(() => { const id = setInterval(() => setT(fmt()), 10000); return () => clearInterval(id) }, [])
  return t
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

/* Fades/lifts once when scrolled into view. */
function Reveal({ children, delay = 0, y = 24, ...rest }) {
  return (
    <motion.div initial={{ opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ duration: .9, ease: EASE, delay }} {...rest}>
      {children}
    </motion.div>
  )
}

/* ---------- nav ---------- */
function Nav() {
  const t = useJakartaTime()
  return (
    <motion.header className="nav wrap" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .8, ease: EASE, delay: .9 }}>
      <nav className="links-nav" aria-label="Sections">
        <a className="lnk" href="#top">Home</a><a className="lnk" href="#work">Work</a><a className="lnk" href="#contact">Contact</a>
      </nav>
      <span className="mono">Jakarta {t}</span>
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
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.9', 'center 0.6'] })
  const text = 'I build software you can hold in one hand. Apps that roles actually use, APIs that stay boring under load, and data that turns into a decision.'
  const words = text.split(' ')
  return (
    <section className="statement wrap" ref={ref}>
      <span className="label">About</span>
      <p>{words.map((w, i) => <Word key={i} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]}>{w}</Word>)}</p>
    </section>
  )
}

/* ---------- work index: click a row to open its details and visual ---------- */
function Work() {
  const [open, setOpen] = useState(null)
  return (
    <section className="block wrap" id="work">
      <Reveal className="shead">
        <h2>Selected work<sup>({projects.length})</sup></h2>
        <p>Production apps from my internship at PT Gaya Makmur Tractors, plus two machine-learning research projects.</p>
      </Reveal>
      <ul className="rows">
        {projects.map((p, i) => {
          const isOpen = open === p.id
          return (
            <motion.li key={p.id} className={'rowi' + (isOpen ? ' open' : '')}
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '0px 0px -8% 0px' }} transition={{ duration: .8, ease: EASE, delay: i * .06 }}>
              <button type="button" aria-expanded={isOpen} aria-controls={'d-' + p.id} onClick={() => setOpen(isOpen ? null : p.id)}>
                <span className="idx">{String(i + 1).padStart(2, '0')}</span>
                <span className="nm">{p.name}</span>
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
    </section>
  )
}

/* ---------- capabilities + marquee (constant speed, moving right) ---------- */
function Marquee({ items }) {
  const row = items.map((t, i) => <span key={i}>{t}</span>)
  return <div className="marquee" aria-hidden="true"><div className="track">{row}{row}</div></div>
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
function Contact() {
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
          <span className="mail">{EMAIL}</span>
          <div className="links">
            <a className="ghost" href={LINKEDIN} target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>
            <a className="ghost" href="https://github.com/Chrisyesaya" target="_blank" rel="noopener noreferrer">GitHub ↗</a>
          </div>
        </div>
        <motion.a className="magnet" href={GMAIL} target="_blank" rel="noopener noreferrer" whileHover={{ scale: 1.04 }} whileTap={{ scale: .96 }}>
          Email me ↗
        </motion.a>
      </div>
    </section>
  )
}

/* ---------- app ---------- */
export default function App() {
  const reduced = useReducedMotion()
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
      <Nav />
      <main className="page">
        <Hero />
        <Statement />
        <Work />
        <Capabilities />
        <Journey />
        <Contact />
        <footer className="wrap mono">
          <span>© 2026 Christopher Yesaya Susanto</span>
          <span style={{ color: 'var(--faint)' }}>Built with React, Framer Motion &amp; a WebGL silk shader</span>
          <a href="#top">Back to top ↑</a>
        </footer>
      </main>
    </MotionConfig>
  )
}
