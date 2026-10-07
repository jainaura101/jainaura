import { useEffect, useRef, useState, useCallback } from 'react'
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { products } from './data/products'
import { IntroScreen } from './components/IntroScreen'
import './App.css'

gsap.registerPlugin(ScrollTrigger)

const FRAME_COUNT = 120
const framePaths = Array.from(
  { length: FRAME_COUNT },
  (_, i) => `/frames/jar/${String(i + 1).padStart(4, '0')}.webp`,
)
const NAV_H = 72

const storyFeatures = [
  { icon: '01', title: 'Premium Quality', text: 'Only the finest dry fruits selected for richness, texture and natural character.' },
  { icon: '02', title: 'Carefully Selected', text: 'Every pick is made to celebrate freshness, flavour and trust in daily rituals.' },
  { icon: '03', title: 'Freshly Packed', text: 'Thoughtful packing keeps nature intact while delivering consistent quality.' },
  { icon: '04', title: 'Naturally Delicious', text: 'Simple ingredients bring satisfying bites and genuine nourishment to every day.' },
]

const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi)
const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

function loadFrame(src) {
  return new Promise((resolve) => {
    if (typeof createImageBitmap !== 'undefined') {
      fetch(src)
        .then(r => r.blob())
        .then(blob => createImageBitmap(blob))
        .then(resolve)
        .catch(() => {
          const img = new Image(); img.src = src
          img.onload = () => resolve(img); img.onerror = () => resolve(null)
        })
    } else {
      const img = new Image(); img.decoding = 'async'; img.src = src
      img.onload = () => resolve(img); img.onerror = () => resolve(null)
    }
  })
}

// ─── WHATSAPP LINK ─────────────────────────────────────────────
const WA_NUMBER   = '917877492349'
const WA_LINK     = `https://wa.me/${WA_NUMBER}`
const MEESHO_LINK = 'https://www.meesho.com/Jaintradehub?ms=2'
const INSTA_LINK  = 'https://www.instagram.com/jaintradehub.in'

// CTA auto-slider component
function CtaSlider() {
  const [idx, setIdx] = useState(0)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setFading(true)
      setTimeout(() => {
        setIdx(i => (i + 1) % products.length)
        setFading(false)
      }, 400)
    }, 3000)
    return () => clearInterval(timer)
  }, [])

  const product = products[idx]
  return (
    <a
      href={product.link || MEESHO_LINK}
      target="_blank"
      rel="noopener noreferrer"
      className="cta-slider-link"
      aria-label={`Buy ${product.name}`}
    >
      <div className={`cta-slider-img${fading ? ' fading' : ''}`}>
        <img src={product.image} alt={product.name} />
        <div className="cta-slider-badge">
          <span className="cta-slider-name">{product.name}</span>
          <span className="cta-slider-weight">{product.weight}</span>
        </div>
      </div>
      <div className="cta-slider-dots">
        {products.map((_, i) => (
          <span key={i} className={`cta-dot${i === idx ? ' active' : ''}`} />
        ))}
      </div>
    </a>
  )
}

function App() {
  const reduceMotion = prefersReducedMotion()
  const canvasRef      = useRef(null)
  const sequenceRef    = useRef(null)
  const frameImagesRef = useRef([])
  const smoothFrameRef = useRef(0)
  const targetFrameRef = useRef(0)
  const rafIdRef       = useRef(0)
  const scrubReadyRef  = useRef(reduceMotion)

  const [loaderProgress, setLoaderProgress] = useState(reduceMotion ? 1 : 0)
  const [ready,          setReady]          = useState(reduceMotion)
  const [mobileNavOpen,  setMobileNavOpen]  = useState(false)
  const [introGone,      setIntroGone]      = useState(false)
  const [scrollHintVisible, setScrollHintVisible] = useState(true)
  const [handoffOpacity, setHandoffOpacity] = useState(0)

  // ── Lenis ────────────────────────────────────────────────────
  useEffect(() => {
    const lenis = new Lenis({ duration: 1.15, smoothWheel: true, lerp: 0.08 })
    let id
    const tick = (t) => { lenis.raf(t); id = requestAnimationFrame(tick) }
    id = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(id); lenis.destroy() }
  }, [])

  // ── Draw frame: COVER-FIT, downscale only, watermark masked ──
  const drawFrame = useCallback((img) => {
    const canvas = canvasRef.current
    if (!canvas || !img) return
    const ctx = canvas.getContext('2d')
    const dpr  = Math.min(window.devicePixelRatio || 1, 2)
    const cssW = canvas.offsetWidth
    const cssH = canvas.offsetHeight
    const areaW = cssW
    const areaH = cssH - NAV_H

    const frameW = img.naturalWidth  || img.width  || 1920
    const frameH = img.naturalHeight || img.height || 1080

    // COVER: fill the area, downscale only (never upscale)
    const scaleW = areaW / frameW
    const scaleH = areaH / frameH
    const scale  = Math.min(Math.max(scaleW, scaleH), 1)   // cover, cap at 1

    const drawW = frameW * scale
    const drawH = frameH * scale
    const x = (areaW  - drawW) / 2
    const y = NAV_H + (areaH - drawH) / 2

    canvas.width  = cssW * dpr
    canvas.height = cssH * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, cssW, cssH)
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, x, y, drawW, drawH)

    // ── Mask KlingAI watermark (bottom-right corner) ───────────
    const wmW = drawW * 0.24
    const wmH = Math.max(drawH * 0.07, 36)
    const wmX = x + drawW - wmW
    const wmY = y + drawH - wmH
    // Gradient from transparent → cream to invisibly cover the watermark
    const g1 = ctx.createLinearGradient(wmX, wmY + wmH * 0.3, wmX + wmW, wmY + wmH)
    g1.addColorStop(0,   'rgba(244,238,230,0)')
    g1.addColorStop(0.45,'rgba(244,238,230,0.88)')
    g1.addColorStop(1,   'rgba(244,238,230,1)')
    ctx.fillStyle = g1
    ctx.fillRect(wmX, wmY, wmW, wmH)

    // Also mask left/right sides that might show background seam
    // Left edge gradient
    const gL = ctx.createLinearGradient(0, 0, Math.min(x + 8, 60), 0)
    gL.addColorStop(0, 'rgba(244,238,230,1)')
    gL.addColorStop(1, 'rgba(244,238,230,0)')
    ctx.fillStyle = gL
    ctx.fillRect(0, NAV_H, x + 8, areaH)

    // Right edge gradient
    const rStart = x + drawW - 8
    const gR = ctx.createLinearGradient(rStart, 0, cssW, 0)
    gR.addColorStop(0, 'rgba(244,238,230,0)')
    gR.addColorStop(1, 'rgba(244,238,230,1)')
    ctx.fillStyle = gR
    ctx.fillRect(rStart, NAV_H, cssW - rStart, areaH)
  }, [])

  // ── Preload frames ───────────────────────────────────────────
  useEffect(() => {
    if (reduceMotion) {
      loadFrame(framePaths[FRAME_COUNT - 1]).then(img => {
        if (img) { frameImagesRef.current[FRAME_COUNT - 1] = img; drawFrame(img) }
      })
      return
    }
    loadFrame(framePaths[0]).then(img => {
      if (img) { frameImagesRef.current[0] = img; drawFrame(img) }
    })
    const BATCH = 8; let cancelled = false
    const loadAll = async () => {
      for (let b = 0; b < framePaths.length; b += BATCH) {
        if (cancelled) break
        await Promise.all(
          framePaths.slice(b, b + BATCH).map((src, i) =>
            loadFrame(src).then(img => { if (img) frameImagesRef.current[b + i] = img })
          )
        )
        setLoaderProgress(Math.min((b + BATCH) / framePaths.length, 1))
        if (b + BATCH >= 20) scrubReadyRef.current = true
        if (b + BATCH >= framePaths.length) setReady(true)
      }
    }
    loadAll()
    return () => { cancelled = true }
  }, [reduceMotion, drawFrame])

  // ── rAF render loop ──────────────────────────────────────────
  useEffect(() => {
    if (reduceMotion) return
    const render = () => {
      const target = targetFrameRef.current
      smoothFrameRef.current += (target - smoothFrameRef.current) * 0.12
      const idx = Math.round(smoothFrameRef.current)
      const img = frameImagesRef.current[idx]
      if (img) drawFrame(img)
      rafIdRef.current = requestAnimationFrame(render)
    }
    rafIdRef.current = requestAnimationFrame(render)
    return () => cancelAnimationFrame(rafIdRef.current)
  }, [reduceMotion, drawFrame])

  // ── Scroll progress ──────────────────────────────────────────
  useEffect(() => {
    if (reduceMotion) return
    const wrapper = sequenceRef.current
    if (!wrapper) return
    let ticking = false
    const update = () => {
      ticking = false
      const wrapH  = wrapper.offsetHeight
      const vh     = window.innerHeight
      const scrollY = window.scrollY || window.pageYOffset
      const wrapTop = wrapper.getBoundingClientRect().top + scrollY
      const progress = clamp((scrollY - wrapTop) / (wrapH - vh), 0, 1)
      if (scrubReadyRef.current)
        targetFrameRef.current = Math.round(progress * (FRAME_COUNT - 1))
      if (progress > 0.03) setScrollHintVisible(false)
      setHandoffOpacity(clamp((progress - 0.94) / 0.06, 0, 1))
      document.body.classList.toggle('header-solid', progress >= 1)
    }
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update) } }
    window.addEventListener('scroll', onScroll, { passive: true })
    update()
    return () => window.removeEventListener('scroll', onScroll)
  }, [reduceMotion])

  // ── Story cards stagger ──────────────────────────────────────
  useEffect(() => {
    const tween = gsap.fromTo('.feature-card',
      { autoAlpha: 0, y: 30 },
      { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out',
        scrollTrigger: { trigger: '.story-section', start: 'top 72%' } }
    )
    // Product cards stagger (static grid)
    const ptween = gsap.fromTo('.prod-card',
      { autoAlpha: 0, y: 24 },
      { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.07, ease: 'power3.out',
        scrollTrigger: { trigger: '.products-grid-section', start: 'top 78%' } }
    )
    return () => { tween.kill(); ptween.kill() }
  }, [])

  return (
    <div className="page-shell">
      <a href="#story" className="skip-link">Skip to content</a>
      <IntroScreen loaderProgress={loaderProgress} ready={ready} onGone={() => setIntroGone(true)} />

      {/* ── WhatsApp float ───────────────────────────────────── */}
      <a href={WA_LINK} target="_blank" rel="noopener noreferrer"
         className="wa-float" aria-label="Chat on WhatsApp">
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" width="28" height="28">
          <circle cx="16" cy="16" r="16" fill="#25D366"/>
          <path d="M23.5 8.5A10.4 10.4 0 0 0 16 5.5c-5.8 0-10.5 4.7-10.5 10.5 0 1.85.48 3.65 1.4 5.23L5.5 26.5l5.43-1.38A10.4 10.4 0 0 0 16 26.5c5.8 0 10.5-4.7 10.5-10.5a10.4 10.4 0 0 0-3-7.5Z" fill="#25D366"/>
          <path d="M21.3 18.7c-.27-.13-1.6-.79-1.85-.88-.25-.1-.43-.13-.6.13-.18.27-.7.88-.86 1.06-.16.18-.31.2-.58.07-1.6-.8-2.64-1.43-3.7-3.23-.28-.48.28-.45.8-1.5.09-.18.04-.33-.02-.47-.07-.13-.6-1.45-.83-1.99-.22-.52-.44-.45-.6-.46h-.52c-.18 0-.47.07-.71.33-.25.27-.95.93-.95 2.27s.97 2.64 1.1 2.82c.14.18 1.9 2.9 4.6 4.07 1.72.74 2.39.8 3.25.68.52-.08 1.6-.66 1.83-1.29.22-.63.22-1.17.16-1.28-.06-.12-.24-.18-.5-.3Z" fill="#fff"/>
        </svg>
      </a>

      {/* ── Navbar ──────────────────────────────────────────── */}
      <header className="site-header">
        <div className="nav-inner">
          <a href="#home" className="brand" aria-label="Jain Aura home">
            <img src="/jain-auro-hero.jpeg" alt="Jain Aura Logo" className="brand-logo-img" />
            <span>JAIN AURA</span>
          </a>
          <nav className="main-nav" aria-label="Main navigation">
            <a href="#home">Home</a>
            <a href="#story">Our Story</a>
            <a href="#products">Products</a>
            <a href="#story">Why Jain Aura</a>
            <a href="#contact">Contact</a>
          </nav>
          <button
            className={`hamburger${mobileNavOpen ? ' open' : ''}`}
            aria-label={mobileNavOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileNavOpen}
            onClick={() => setMobileNavOpen(v => !v)}
          >
            <span /><span /><span />
          </button>
          <a href={MEESHO_LINK} target="_blank" rel="noopener noreferrer"
             className="button-primary nav-cta">
            Buy Now
          </a>
        </div>
      </header>

      {mobileNavOpen && (
        <nav className="mobile-nav" aria-label="Mobile navigation">
          {['#home','#story','#products','#contact'].map((href, i) => (
            <a key={href} href={href} onClick={() => setMobileNavOpen(false)}>
              {['Home','Our Story','Products','Contact'][i]}
            </a>
          ))}
          <a href={MEESHO_LINK} target="_blank" rel="noopener noreferrer"
             className="button-primary" onClick={() => setMobileNavOpen(false)}>
            Buy Now
          </a>
        </nav>
      )}

      <main>
        {/* ═══ HERO — CLEAN CANVAS ONLY ═══ */}
        <section className="sequence-01" id="home" ref={sequenceRef} aria-label="Jain Aura jar sequence">
          <div className="sequence-stage">
            <canvas ref={canvasRef} className="jar-canvas" aria-label="Jain Aura jar" />
            {!ready && (
              <div className="hero-progress-bar"
                   style={{ width: `${Math.round(loaderProgress * 100)}%` }}
                   aria-hidden="true" />
            )}
            <div className="scroll-hint" aria-hidden="true"
                 style={{ opacity: introGone && scrollHintVisible ? 1 : 0 }}>
              Scroll
            </div>
            <div className="hero-handoff" aria-hidden="true"
                 style={{ opacity: handoffOpacity }} />
          </div>
        </section>

        {/* ═══ GOODNESS SECTION ═══ */}
        <section className="story-section section-shell" id="story">
          <div className="story-intro story-card">
            <p className="eyebrow">Goodness in Every Bite</p>
            <h2>Carefully selected dry fruits and fine foods, packed for everyday nourishment.</h2>
          </div>
          <div className="feature-grid">
            {storyFeatures.map(f => (
              <article className="feature-card story-card" key={f.title}>
                <div className="feature-icon" aria-hidden="true">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ═══ PRODUCTS GRID — 2 rows × 4 cols ═══ */}
        <section className="products-grid-section" id="products">
          <div className="products-grid-inner">
            <p className="eyebrow" style={{ textAlign: 'center', marginBottom: '0.5rem' }}>Our Collection</p>
            <h2 className="products-heading">Best Sellers</h2>
            <div className="products-grid">
              {products.map((product) => (
                <article key={product.id} className="prod-card">
                  <div className="prod-img-wrap">
                    <img src={product.image} alt={product.name} loading="lazy" />
                  </div>
                  <div className="prod-info">
                    <span className="prod-badge">{product.badge}</span>
                    <h3 className="prod-name">{product.name}</h3>
                    <p className="prod-weight">{product.weight}</p>
                    <a
                      href={product.link || MEESHO_LINK}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="button-primary prod-buy-btn"
                    >
                      Buy Now
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ CTA ═══ */}
        <section className="final-cta section-shell" id="contact">
          <div className="cta-panel">
            <div className="cta-copy">
              <p className="eyebrow">Bring home nature&apos;s finest</p>
              <h2>Discover the Jain Aura collection.</h2>
              <div className="cta-btns">
                <a href={MEESHO_LINK} target="_blank" rel="noopener noreferrer"
                   className="button-primary">
                  Shop on Meesho
                </a>
                <a href={WA_LINK} target="_blank" rel="noopener noreferrer"
                   className="button-secondary">
                  WhatsApp Us
                </a>
              </div>
            </div>
            <div className="cta-visual">
              <CtaSlider />
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="site-footer">
        <div className="footer-inner">
          <div>
            <a href="#home" className="brand footer-brand" aria-label="Jain Aura home">
              <img src="/jain-auro-hero.jpeg" alt="Jain Aura Logo" className="brand-logo-img" />
              <span>JAIN AURA</span>
            </a>
            <p>Premium dry fruits, thoughtfully selected for everyday goodness.</p>
          </div>
          <div>
            <h3>Quick Links</h3>
            <ul>
              <li><a href="#home">Home</a></li>
              <li><a href="#story">Our Story</a></li>
              <li><a href="#products">Products</a></li>
              <li><a href="#contact">Contact</a></li>
            </ul>
          </div>
          <div>
            <h3>Shop</h3>
            <ul>
              <li><a href={MEESHO_LINK} target="_blank" rel="noopener noreferrer">Meesho Store</a></li>
              {products.slice(0, 4).map(p => (
                <li key={p.id}><a href={MEESHO_LINK} target="_blank" rel="noopener noreferrer">{p.name}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h3>Contact</h3>
            <ul>
              <li><a href={WA_LINK} target="_blank" rel="noopener noreferrer">WhatsApp: +91 78774 92349</a></li>
              <li><a href={INSTA_LINK} target="_blank" rel="noopener noreferrer">Instagram</a></li>
              <li><a href="#contact">Facebook</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">© 2026 Jain Aura. All rights reserved.</div>
      </footer>
    </div>
  )
}

export default App
