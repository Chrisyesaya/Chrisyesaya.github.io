import { useEffect, useRef } from 'react'

// Black silk: a domain-warped height field lit like satin.
// Rendered at reduced resolution (silk is soft, so upscaling is invisible) to stay light on laptops and phones.
const VERT = `attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}`
const FRAG = `
precision highp float;
uniform vec2 uRes; uniform float uTime; uniform vec2 uMouse;
float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);}
float fbm(vec2 p){float v=0.,a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);for(int i=0;i<4;i++){v+=a*noise(p);p=m*p;a*=.5;}return v;}
float H(vec2 p,float t){
  vec2 q=vec2(fbm(p*.7+vec2(t,-t*.6)),fbm(p*.7+vec2(4.2-t*.5,1.3+t*.4)));
  float n=fbm(p*1.1+q*1.8);
  return sin(p.x*2.6+p.y*1.4+n*5.2+t*1.4)*.55+n*.45;
}
void main(){
  vec2 p=(gl_FragCoord.xy-.5*uRes)/uRes.y*1.6;
  p+= (uMouse-.5)*.18;
  float t=uTime*.11;
  float e=.012;
  float h=H(p,t);
  float dx=H(p+vec2(e,0.),t)-h;
  float dy=H(p+vec2(0.,e),t)-h;
  vec3 N=normalize(vec3(-dx,-dy,e*1.8));
  vec3 L=normalize(vec3(-.45+uMouse.x*.5,.65-uMouse.y*.3,.6));
  vec3 V=vec3(0.,0.,1.);
  float diff=max(dot(N,L),0.);
  float spec=pow(max(dot(reflect(-L,N),V),0.),22.);
  float rim=pow(1.-max(N.z,0.),2.);
  float lum=.012+diff*.07+spec*.62+rim*.05;
  vec2 uv=gl_FragCoord.xy/uRes;
  lum*=smoothstep(1.25,.25,length((uv-vec2(.55,.45))*vec2(1.25,1.0)));
  lum+= (hash(gl_FragCoord.xy+fract(uTime*7.))-.5)*.022;
  gl_FragColor=vec4(vec3(lum)*vec3(.97,.97,1.),1.);
}`

export default function Silk({ reduced }) {
  const ref = useRef(null)
  useEffect(() => {
    const cv = ref.current
    const gl = cv.getContext('webgl', { antialias: false, premultipliedAlpha: false })
    if (!gl) return
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s }
    const prog = gl.createProgram()
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT))
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG))
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return
    gl.useProgram(prog)
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, 'a')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
    const uRes = gl.getUniformLocation(prog, 'uRes')
    const uTime = gl.getUniformLocation(prog, 'uTime')
    const uMouse = gl.getUniformLocation(prog, 'uMouse')

    const scale = 0.5
    const size = () => {
      const w = Math.max(1, Math.round(cv.clientWidth * scale))
      const h = Math.max(1, Math.round(cv.clientHeight * scale))
      cv.width = w; cv.height = h; gl.viewport(0, 0, w, h); gl.uniform2f(uRes, w, h)
    }
    size()
    const ro = new ResizeObserver(size); ro.observe(cv)

    const mouse = { x: .5, y: .5, tx: .5, ty: .5 }
    const onMove = e => { mouse.tx = e.clientX / innerWidth; mouse.ty = e.clientY / innerHeight }
    addEventListener('pointermove', onMove, { passive: true })

    let raf = 0, visible = true
    const io = new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible && !reduced) loop() })
    io.observe(cv)
    const start = performance.now() - 8000
    const draw = () => {
      mouse.x += (mouse.tx - mouse.x) * .04; mouse.y += (mouse.ty - mouse.y) * .04
      gl.uniform1f(uTime, (performance.now() - start) / 1000)
      gl.uniform2f(uMouse, mouse.x, 1 - mouse.y)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }
    function loop() { cancelAnimationFrame(raf); const f = () => { draw(); if (visible && !document.hidden) raf = requestAnimationFrame(f) }; f() }
    const onVis = () => { if (!document.hidden && !reduced) loop() }
    document.addEventListener('visibilitychange', onVis)
    reduced ? draw() : loop()
    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); removeEventListener('pointermove', onMove); document.removeEventListener('visibilitychange', onVis) }
  }, [reduced])
  return <canvas ref={ref} className="silk" aria-hidden="true" />
}
