// Tiny arcade engine: Snake, Breakout, Pong. Plain canvas, no dependencies.
const C = { bg: '#0A0A0A', grid: 'rgba(255,255,255,.03)', fg: '#EDEBE6', dim: 'rgba(237,235,230,.5)', accent: '#9DB8FF', line: 'rgba(237,235,230,.14)' }
const MONO = '"JetBrains Mono", ui-monospace, monospace'

const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : v } catch { return d } },
  set(k, v) { try { localStorage.setItem(k, v) } catch { /* storage unavailable */ } },
}

let ac = null
let soundOn = store.get('cys-sound', '1') === '1'
function tone(f, d = .07, type = 'square', vol = .035, when = 0, slide = 0) {
  if (!soundOn) return
  try {
    if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)()
    if (ac.state === 'suspended') ac.resume()
    const t = ac.currentTime + when, o = ac.createOscillator(), g = ac.createGain()
    o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + d)
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + d)
    o.connect(g).connect(ac.destination); o.start(t); o.stop(t + d + .02)
  } catch { /* audio unavailable */ }
}
const sfx = {
  eat: () => { tone(660, .05); tone(990, .07, 'square', .03, .05) }, hit: () => tone(440, .04), wall: () => tone(220, .04, 'triangle', .05),
  brick: () => tone(500 + Math.random() * 300, .05, 'square', .03), die: () => tone(300, .4, 'sawtooth', .04, 0, 60),
  win: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, .12, 'square', .035, i * .09)), start: () => tone(880, .05), point: () => tone(330, .2, 'triangle', .05, 0, 165),
}
export const sound = { get on() { return soundOn }, toggle() { soundOn = !soundOn; store.set('cys-sound', soundOn ? '1' : '0'); return soundOn } }
export const best = n => +store.get('cys-best-' + n, 0)

function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h) }
function overlay(ctx, W, H, title, sub) {
  ctx.fillStyle = 'rgba(10,10,10,.78)'; ctx.fillRect(0, 0, W, H); ctx.textAlign = 'center'
  ctx.fillStyle = C.fg; ctx.font = `600 22px ${MONO}`; ctx.fillText(title, W / 2, H / 2 - 6)
  ctx.fillStyle = C.dim; ctx.font = `500 11px ${MONO}`; ctx.fillText(sub, W / 2, H / 2 + 20); ctx.textAlign = 'left'
}

function Snake(api) {
  const cols = 14; let rows, cs, ox, oy, body, dir, q, food, acc, step, state = 'ready', t = 0
  const g = { hint: 'Arrows / WASD / swipe' }
  g.resize = (W, H) => { cs = Math.floor(W / cols); rows = Math.floor(H / cs); ox = (W - cols * cs) / 2; oy = (H - rows * cs) / 2; if (!body || body.some(p => p.y >= rows)) g.reset() }
  g.reset = () => { const m = rows >> 1; body = [{ x: 5, y: m }, { x: 4, y: m }, { x: 3, y: m }]; dir = { x: 1, y: 0 }; q = []; acc = 0; step = .14; api.score(0); place(); state = 'ready' }
  function place() { do { food = { x: Math.floor(Math.random() * cols), y: Math.floor(Math.random() * rows) } } while (body.some(p => p.x === food.x && p.y === food.y)) }
  g.start = () => { if (state === 'over') g.reset(); state = 'play'; sfx.start() }
  g.turn = (dx, dy) => { if (state !== 'play') g.start(); const l = q.length ? q[q.length - 1] : dir; if ((dx === -l.x && dy === -l.y) || (dx === l.x && dy === l.y)) return; if (q.length < 3) q.push({ x: dx, y: dy }) }
  g.key = (k, down) => { if (!down) return; const m = { ArrowUp: [0, -1], w: [0, -1], ArrowDown: [0, 1], s: [0, 1], ArrowLeft: [-1, 0], a: [-1, 0], ArrowRight: [1, 0], d: [1, 0] }[k]; if (m) { g.turn(...m); return true } if (k === ' ') { state === 'play' || g.start(); return true } }
  g.swipe = (dx, dy) => { if (Math.abs(dx) < 14 && Math.abs(dy) < 14) { if (state !== 'play') g.start(); return } Math.abs(dx) > Math.abs(dy) ? g.turn(Math.sign(dx), 0) : g.turn(0, Math.sign(dy)) }
  g.update = dt => {
    t += dt; if (state !== 'play') return; acc += dt
    while (acc >= step) {
      acc -= step; if (q.length) dir = q.shift(); const h = { x: body[0].x + dir.x, y: body[0].y + dir.y }
      if (h.x < 0 || h.y < 0 || h.x >= cols || h.y >= rows || body.some(p => p.x === h.x && p.y === h.y)) { state = 'over'; sfx.die(); return }
      body.unshift(h)
      if (h.x === food.x && h.y === food.y) { api.score(api.cur + 1); sfx.eat(); place(); step = Math.max(.065, step * .965) } else body.pop()
    }
  }
  g.draw = (ctx, W, H) => {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H)
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) if ((x + y) % 2) { ctx.fillStyle = C.grid; ctx.fillRect(ox + x * cs, oy + y * cs, cs, cs) }
    const pr = 1 + Math.sin(t * 6) * .12; ctx.fillStyle = C.accent; ctx.beginPath(); ctx.arc(ox + food.x * cs + cs / 2, oy + food.y * cs + cs / 2, cs * .28 * pr, 0, 6.283); ctx.fill()
    body.forEach((p, i) => { ctx.globalAlpha = 1 - (i / body.length) * .55; ctx.fillStyle = C.fg; rr(ctx, ox + p.x * cs + 1.5, oy + p.y * cs + 1.5, cs - 3, cs - 3, 3); ctx.fill() }); ctx.globalAlpha = 1
    if (state === 'ready') overlay(ctx, W, H, 'SNAKE', 'tap or press space')
    if (state === 'over') overlay(ctx, W, H, 'GAME OVER', 'tap to retry')
  }
  return g
}

function Breakout(api) {
  let W, H, pad, ball, bricks, lives, level, state = 'ready', keys = {}, tx = null
  const g = { hint: 'Drag, mouse or ← →' }, COLS = 7, ROWS = 6
  g.resize = (w, h) => { const first = !W; W = w; H = h; if (first) g.reset(); else { pad.y = H - 26; build(true) } }
  function build(keep) { const bw = (W - 16 - (COLS - 1) * 5) / COLS, bh = 11, old = bricks; bricks = []; for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) bricks.push({ x: 8 + c * (bw + 5), y: 46 + r * (bh + 6), w: bw, h: bh, r, alive: keep && old ? old[r * COLS + c]?.alive : true }) }
  function serve() { ball = { x: pad.x, y: pad.y - 10, r: 5, vx: 0, vy: 0, stuck: true } }
  g.reset = () => { pad = { x: W / 2, y: H - 26, w: Math.max(56, W * .24), h: 8 }; lives = 3; level = 1; api.score(0); build(); serve(); state = 'ready' }
  function launch() { if (!ball.stuck) return; const sp = (260 + level * 30) * (H / 560), a = -Math.PI / 2 + (Math.random() - .5) * .6; ball.vx = Math.cos(a) * sp; ball.vy = Math.sin(a) * sp; ball.stuck = false }
  g.start = () => { if (state === 'over') g.reset(); state = 'play'; launch(); sfx.start() }
  g.key = (k, down) => { if (k === 'ArrowLeft' || k === 'a') { keys.l = down; return true } if (k === 'ArrowRight' || k === 'd') { keys.r = down; return true } if (k === ' ' && down) { state === 'play' ? launch() : g.start(); return true } }
  g.point = x => { tx = x }; g.tap = () => { state === 'play' ? launch() : g.start() }
  g.update = dt => {
    const spd = 520 * (W / 320); if (keys.l) pad.x -= spd * dt; if (keys.r) pad.x += spd * dt; if (tx != null && !keys.l && !keys.r) pad.x += (tx - pad.x) * Math.min(1, dt * 18)
    pad.x = Math.max(pad.w / 2, Math.min(W - pad.w / 2, pad.x))
    if (ball.stuck) { ball.x = pad.x; ball.y = pad.y - pad.h / 2 - ball.r - 1; return }
    if (state !== 'play') return
    for (let s = 0; s < 3; s++) {
      ball.x += ball.vx * dt / 3; ball.y += ball.vy * dt / 3
      if (ball.x < ball.r) { ball.x = ball.r; ball.vx = Math.abs(ball.vx); sfx.wall() } if (ball.x > W - ball.r) { ball.x = W - ball.r; ball.vx = -Math.abs(ball.vx); sfx.wall() }
      if (ball.y < ball.r) { ball.y = ball.r; ball.vy = Math.abs(ball.vy); sfx.wall() }
      if (ball.vy > 0 && ball.y + ball.r >= pad.y - pad.h / 2 && ball.y < pad.y + pad.h && Math.abs(ball.x - pad.x) < pad.w / 2 + ball.r) {
        const sp = Math.hypot(ball.vx, ball.vy) * 1.01, off = (ball.x - pad.x) / (pad.w / 2), a = -Math.PI / 2 + off * 1.05
        ball.vx = Math.cos(a) * sp; ball.vy = Math.sin(a) * sp; ball.y = pad.y - pad.h / 2 - ball.r; sfx.hit()
      }
      for (const b of bricks) {
        if (!b.alive) continue; const nx = Math.max(b.x, Math.min(ball.x, b.x + b.w)), ny = Math.max(b.y, Math.min(ball.y, b.y + b.h)), dx = ball.x - nx, dy = ball.y - ny
        if (dx * dx + dy * dy <= ball.r * ball.r) { b.alive = false; api.score(api.cur + 10); sfx.brick(); Math.abs(dx) > Math.abs(dy) ? ball.vx *= -1 : ball.vy *= -1; break }
      }
    }
    if (ball.y > H + 20) { lives--; sfx.die(); if (lives <= 0) state = 'over'; else serve() }
    if (bricks.every(b => !b.alive)) { level++; sfx.win(); build(); serve(); state = 'ready' }
  }
  g.draw = ctx => {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H)
    ctx.font = `500 11px ${MONO}`; ctx.fillStyle = C.dim; ctx.fillText('LV ' + level, 10, 24); ctx.textAlign = 'right'; ctx.fillText('●'.repeat(Math.max(0, lives)), W - 10, 24); ctx.textAlign = 'left'
    bricks.forEach(b => { if (!b.alive) return; ctx.fillStyle = b.r === 0 ? C.accent : `rgba(237,235,230,${.95 - b.r * .13})`; rr(ctx, b.x, b.y, b.w, b.h, 2); ctx.fill() })
    ctx.fillStyle = C.fg; rr(ctx, pad.x - pad.w / 2, pad.y - pad.h / 2, pad.w, pad.h, 4); ctx.fill()
    ctx.fillStyle = C.accent; ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, 6.283); ctx.fill()
    if (state === 'ready') overlay(ctx, W, H, level > 1 ? 'LEVEL ' + level : 'BREAKOUT', 'tap or press space to launch')
    if (state === 'over') overlay(ctx, W, H, 'GAME OVER', 'tap to retry')
  }
  return g
}

function Pong(api) {
  let W, H, me, cpu, ball, sMe = 0, sCpu = 0, state = 'ready', keys = {}, tx = null, serveDir = 1
  const g = { hint: 'Drag, mouse or ← →  ·  first to 7' }, WIN = 7
  g.resize = (w, h) => { const first = !W; W = w; H = h; if (first) g.reset(); else me.y = H - 22 }
  g.reset = () => { const pw = Math.max(54, W * .26); me = { x: W / 2, y: H - 22, w: pw }; cpu = { x: W / 2, y: 22, w: pw }; sMe = 0; sCpu = 0; api.score(0); serve(1); state = 'ready' }
  function serve(d) { serveDir = d; ball = { x: W / 2, y: H / 2, r: 6, vx: 0, vy: 0 } }
  function go() { const sp = 300 * (H / 560), a = (Math.random() - .5) * .8; ball.vx = Math.sin(a) * sp; ball.vy = Math.cos(a) * sp * serveDir }
  g.start = () => { if (state === 'over') g.reset(); state = 'play'; go(); sfx.start() }
  g.key = (k, down) => { if (k === 'ArrowLeft' || k === 'a') { keys.l = down; return true } if (k === 'ArrowRight' || k === 'd') { keys.r = down; return true } if (k === ' ' && down) { state !== 'play' && g.start(); return true } }
  g.point = x => { tx = x }; g.tap = () => { state !== 'play' && g.start() }
  g.update = dt => {
    const spd = 520 * (W / 320); if (keys.l) me.x -= spd * dt; if (keys.r) me.x += spd * dt; if (tx != null && !keys.l && !keys.r) me.x += (tx - me.x) * Math.min(1, dt * 18)
    me.x = Math.max(me.w / 2, Math.min(W - me.w / 2, me.x)); if (state !== 'play') return
    const target = ball.vy < 0 ? ball.x : W / 2, cs = (210 + sMe * 14) * (W / 320); cpu.x += Math.max(-cs * dt, Math.min(cs * dt, target - cpu.x)); cpu.x = Math.max(cpu.w / 2, Math.min(W - cpu.w / 2, cpu.x))
    ball.x += ball.vx * dt; ball.y += ball.vy * dt
    if (ball.x < ball.r || ball.x > W - ball.r) { ball.vx *= -1; ball.x = Math.max(ball.r, Math.min(W - ball.r, ball.x)); sfx.wall() }
    const hit = (p, down) => {
      const ok = down ? ball.vy > 0 && ball.y + ball.r >= p.y - 4 && ball.y < p.y + 6 : ball.vy < 0 && ball.y - ball.r <= p.y + 4 && ball.y > p.y - 6
      if (ok && Math.abs(ball.x - p.x) < p.w / 2 + ball.r) { const sp = Math.min(Math.hypot(ball.vx, ball.vy) * 1.06, 760 * (H / 560)), off = (ball.x - p.x) / (p.w / 2); ball.vx = Math.sin(off * .9) * sp; ball.vy = Math.cos(off * .9) * sp * (down ? -1 : 1); sfx.hit() }
    }
    hit(me, true); hit(cpu, false)
    if (ball.y > H + 10) { sCpu++; sfx.point(); end(-1) } if (ball.y < -10) { sMe++; api.score(sMe); sfx.point(); end(1) }
  }
  function end(d) { if (sMe >= WIN || sCpu >= WIN) { state = 'over'; if (sMe >= WIN) sfx.win(); return } serve(d); state = 'ready' }
  g.draw = ctx => {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H)
    ctx.setLineDash([4, 8]); ctx.strokeStyle = C.line; ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke(); ctx.setLineDash([])
    ctx.font = `600 44px ${MONO}`; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(237,235,230,.08)'; ctx.fillText(sCpu, W / 2, H / 2 - 28); ctx.fillText(sMe, W / 2, H / 2 + 62); ctx.textAlign = 'left'
    ctx.font = `500 11px ${MONO}`; ctx.fillStyle = C.dim; ctx.fillText('CPU', 10, 48); ctx.fillText('YOU', 10, H - 40)
    ctx.fillStyle = C.dim; rr(ctx, cpu.x - cpu.w / 2, cpu.y - 4, cpu.w, 8, 4); ctx.fill()
    ctx.fillStyle = C.fg; rr(ctx, me.x - me.w / 2, me.y - 4, me.w, 8, 4); ctx.fill()
    ctx.fillStyle = C.accent; ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, 6.283); ctx.fill()
    if (state === 'ready' && sMe + sCpu === 0) overlay(ctx, W, H, 'PONG', 'first to 7 · tap to serve')
    else if (state === 'ready') overlay(ctx, W, H, `${sCpu} : ${sMe}`, 'tap to serve')
    if (state === 'over') overlay(ctx, W, H, sMe >= WIN ? 'YOU WIN' : 'CPU WINS', 'tap for a rematch')
  }
  return g
}

export const GAMES = { snake: Snake, breakout: Breakout, pong: Pong }

// Mounts a game on a stage element. Returns { destroy }.
export function mountGame(name, stage, canvas, onScore, autoFocus = false) {
  const ctx = canvas.getContext('2d')
  let W = 0, H = 0, raf = 0, last = 0, cur = 0, focused = autoFocus, down = false, sx = 0, sy = 0, visible = true
  const api = { get cur() { return cur }, score(v) { cur = v; if (v > best(name)) store.set('cys-best-' + name, v); onScore(v, best(name)) } }
  const g = GAMES[name](api)
  const resize = () => { const r = stage.getBoundingClientRect(); if (!r.width) return; const d = Math.min(2, devicePixelRatio || 1); W = r.width; H = r.height; canvas.width = Math.round(W * d); canvas.height = Math.round(H * d); ctx.setTransform(d, 0, 0, d, 0, 0); g.resize(W, H) }
  const frame = t => { const dt = Math.min(.033, (t - last) / 1000 || 0); last = t; g.update(dt); g.draw(ctx, W, H); raf = requestAnimationFrame(frame) }
  const run = () => { cancelAnimationFrame(raf); if (visible && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame) } }
  const ro = new ResizeObserver(resize); ro.observe(stage); resize()
  const io = new IntersectionObserver(es => { visible = es[0].isIntersecting; run() }, { threshold: .15 }); io.observe(stage)
  const lx = e => e.clientX - stage.getBoundingClientRect().left
  const pd = e => { focused = true; down = true; sx = e.clientX; sy = e.clientY; stage.setPointerCapture?.(e.pointerId); g.point?.(lx(e)) }
  const pm = e => { if (g.point && (down || e.pointerType === 'mouse')) g.point(lx(e)) }
  const pu = e => { if (!down) return; down = false; const dx = e.clientX - sx, dy = e.clientY - sy; if (g.swipe) g.swipe(dx, dy); else if (Math.hypot(dx, dy) < 10) g.tap?.() }
  const pc = () => { down = false }
  const docDown = e => { if (!stage.closest('.device').contains(e.target)) focused = false }
  const key = isDown => e => { if (!focused) return; const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; if (g.key?.(k, isDown)) e.preventDefault() }
  const kd = key(true), ku = key(false)
  stage.addEventListener('pointerdown', pd); stage.addEventListener('pointermove', pm); stage.addEventListener('pointerup', pu); stage.addEventListener('pointercancel', pc)
  document.addEventListener('pointerdown', docDown); addEventListener('keydown', kd); addEventListener('keyup', ku); document.addEventListener('visibilitychange', run)
  api.score(0); run()
  return {
    hint: g.hint,
    destroy() {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect()
      stage.removeEventListener('pointerdown', pd); stage.removeEventListener('pointermove', pm); stage.removeEventListener('pointerup', pu); stage.removeEventListener('pointercancel', pc)
      document.removeEventListener('pointerdown', docDown); removeEventListener('keydown', kd); removeEventListener('keyup', ku); document.removeEventListener('visibilitychange', run)
    },
  }
}
