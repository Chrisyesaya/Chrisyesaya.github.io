import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

function Bars() {
  const h = [42, 68, 55, 92, 61, 78, 70]
  return (
    <div className="viz v-bars">
      <div className="side"><span className="on">GM · all branches</span><span>Area filter</span><span>Unit population</span><span>Service reminder</span></div>
      <div className="bars">
        {h.map((v, i) => (
          <motion.i key={i} style={{ height: v + '%' }} initial={{ scaleY: .05 }} animate={{ scaleY: 1 }} transition={{ delay: i * .05, duration: .7, ease: [.22, 1, .36, 1] }} />
        ))}
      </div>
    </div>
  )
}

function Barcode() {
  return <div className="viz v-code"><div className="bc"><div className="laser" /></div></div>
}

function Chat() {
  return (
    <div className="viz v-chat">
      <motion.div className="m" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .4 }}><b>Sales</b>Is part 6D16 in stock for Medan?</motion.div>
      <motion.div className="m r" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .4, delay: .35 }}><b>Sparepart</b>12 units. Shipping today.</motion.div>
    </div>
  )
}

// Illustrative series: one scale for every mark.
function Band() {
  const n = 24, W = 340, H = 230, top = 34, bot = 196, split = 16
  const q50 = [], lo = [], hi = []
  for (let i = 0; i < n; i++) { const b = 40 + 18 * Math.sin(i / 3.2) + i * 1.6 + ((i * 37) % 11) - 5; q50.push(b); const s = 8 + i * .9; lo.push(b - s); hi.push(b + s * 1.25) }
  const mx = Math.max(...hi) + 5, mn = Math.min(...lo) - 5
  const X = i => 16 + i * (W - 32) / (n - 1), Y = v => bot - (v - mn) / (mx - mn) * (bot - top)
  const line = (a, o = 0) => a.map((v, i) => (i ? 'L' : 'M') + X(i + o).toFixed(1) + ' ' + Y(v).toFixed(1)).join(' ')
  const band = line(hi) + ' ' + lo.slice().reverse().map((v, i) => 'L' + X(n - 1 - i).toFixed(1) + ' ' + Y(v).toFixed(1)).join(' ') + 'Z'
  return (
    <div className="viz">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        {[0, 1, 2, 3].map(k => <line key={k} x1="16" x2={W - 16} y1={top + k * (bot - top) / 3} y2={top + k * (bot - top) / 3} stroke="rgba(237,235,230,.08)" />)}
        <path d={band} fill="rgba(157,184,255,.16)" />
        <motion.path d={line(q50.slice(0, split + 1))} fill="none" stroke="#EDEBE6" strokeWidth="1.6" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, ease: 'easeOut' }} />
        <path d={line(q50.slice(split), split)} fill="none" stroke="#9DB8FF" strokeWidth="1.6" strokeDasharray="5 4" />
        <line x1={X(split)} x2={X(split)} y1={top - 8} y2={bot} stroke="rgba(237,235,230,.3)" strokeDasharray="2 3" />
        <text x={W - 16} y={Y(hi[n - 1]) - 6} textAnchor="end" fontFamily="JetBrains Mono, monospace" fontSize="10" fill="#9DB8FF">Q90</text>
        <text x={W - 16} y={Y(q50[n - 1]) - 6} textAnchor="end" fontFamily="JetBrains Mono, monospace" fontSize="10" fill="#EDEBE6">Q50</text>
        <text x={W - 16} y={Y(lo[n - 1]) + 14} textAnchor="end" fontFamily="JetBrains Mono, monospace" fontSize="10" fill="#9DB8FF">Q10</text>
      </svg>
    </div>
  )
}

function Heat() {
  const ref = useRef(null)
  useEffect(() => {
    const cv = ref.current, ctx = cv.getContext('2d')
    const draw = () => {
      const r = cv.getBoundingClientRect(); if (!r.width) return
      const d = Math.min(2, devicePixelRatio || 1); cv.width = r.width * d; cv.height = r.height * d; ctx.setTransform(d, 0, 0, d, 0, 0)
      const w = r.width, h = r.height, cx = w / 2
      ctx.fillStyle = '#0B0B0B'; ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#262626'; [-1, 1].forEach(s => { ctx.beginPath(); ctx.ellipse(cx + s * w * .15, h * .54, w * .11, h * .36, s * .08, 0, 6.283); ctx.fill() })
      ctx.strokeStyle = 'rgba(237,235,230,.18)'; ctx.lineWidth = 2
      for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.ellipse(cx, h * .28 + i * h * .09, w * .3, h * .07, 0, Math.PI * .15, Math.PI * .85); ctx.stroke() }
      const c = 9
      for (let y = 0; y < h; y += c) for (let x = 0; x < w; x += c) {
        const v = Math.exp(-(((x - (cx + w * .15)) / (w * .09)) ** 2 + ((y - h * .38) / (h * .16)) ** 2)) * .95 + Math.exp(-(((x - (cx - w * .17)) / (w * .07)) ** 2 + ((y - h * .66) / (h * .12)) ** 2)) * .45
        if (v < .08) continue
        ctx.fillStyle = `hsla(${225 - v * 225},90%,${55 + v * 8}%,${Math.min(.72, v * .8)})`; ctx.fillRect(x, y, c - 1, c - 1)
      }
    }
    draw(); const ro = new ResizeObserver(draw); ro.observe(cv); return () => ro.disconnect()
  }, [])
  return <div className="viz"><canvas ref={ref} /></div>
}

const MAP = { bars: Bars, barcode: Barcode, chat: Chat, band: Band, heat: Heat }
export default function Viz({ type }) { const V = MAP[type]; return V ? <V /> : null }
