import { useEffect, useRef, useState } from 'react'
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { products } from './data/products'
import { IntroScreen } from './components/IntroScreen'
import './App.css'

gsap.registerPlugin(ScrollTrigger)

const framePaths = Array.from({ length: 120 }, (_, index) =>
  `/frames/jar/${String(index + 1).padStart(4, '0')}.webp`,
)

const featureCards = [
  {
    title: 'Hand-picked Quality',
    text: 'Thoughtfully selected ingredients chosen for natural richness and texture.',
    start: 0.22,
    end: 0.42,
    side: 'right',
  },
  {
    title: 'Freshly Packed',
    text: 'Packed to preserve taste, flavour and freshness from source to shelf.',
    start: 0.46,
    end: 0.68,
    side: 'left',
  },
  {
    title: 'Naturally Delicious',
    text: 'Simple, wholesome goodness made for everyday rituals and gifting.',
    start: 0.7,
    end: 0.9,
    side: 'right',
  },
]

const storyFeatures = [
  {
    icon: '01',
    title: 'Premium Quality',
    text: 'Only the finest dry fruits selected for richness, texture and natural character.',
  },
  {
    icon: '02',
    title: 'Carefully Selected',
    text: 'Every pick is made to celebrate freshness, flavour and trust in daily rituals.',
  },
  {
    icon: '03',
    title: 'Freshly Packed',
    text: 'Thoughtful packing keeps nature intact while delivering consistent quality.',
  },
  {
    icon: '04',
    title: 'Naturally Delicious',
    text: 'Simple ingredients bring satisfying bites and genuine nourishment to every day.',
  },
]

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

function App() {
  const canvasRef = useRef(null)
  const sequenceRef = useRef(null)
  const productRef = useRef(null)
  const frameImagesRef = useRef([])
  const smoothFrameRef = useRef(0)
  const targetFrameRef = useRef(0)
  const heroProgressRef = useRef(0)

  const [heroProgress, setHeroProgress] = useState(0)
  const [productProgress, setProductProgress] = useState(0)
  const [loaderProgress, setLoaderProgress] = useState(0)
  const [ready, setReady] = useState(false)
  const [frameNumber, setFrameNumber] = useState(0)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.15,
      smoothWheel: true,
      lerp: 0.08,
      touchMultiplier: 1.1,
    })

    let rafId
    const onFrame = (time) => {
      lenis.raf(time)
      rafId = requestAnimationFrame(onFrame)
    }

    rafId = requestAnimationFrame(onFrame)

    return () => {
      cancelAnimationFrame(rafId)
      lenis.destroy()
    }
  }, [])

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reduceMotion) {
      setHeroProgress(1)
      setProductProgress(1)
      setReady(true)
      setLoaderProgress(1)
      setFrameNumber(119)
      return undefined
    }

    const preloadFrames = async () => {
      const images = []
      const BATCH = 10
      for (let b = 0; b < framePaths.length; b += BATCH) {
        const slice = framePaths.slice(b, b + BATCH)
        await Promise.all(
          slice.map((src, i) =>
            new Promise((resolve) => {
              const img = new Image()
              img.decoding = 'async'
              img.src = src
              img.onload = img.onerror = () => {
                images[b + i] = img
                resolve()
              }
            }),
          ),
        )
        setLoaderProgress(Math.min((b + BATCH) / framePaths.length, 1))
      }
      frameImagesRef.current = images
      setReady(true)
      setFrameNumber(framePaths.length - 1)
    }

    preloadFrames()

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: sequenceRef.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1,
        onUpdate: (self) => {
          setHeroProgress(self.progress)
          heroProgressRef.current = self.progress
        },
      })

      ScrollTrigger.create({
        trigger: productRef.current,
        start: 'top 85%',
        end: 'bottom bottom',
        scrub: 1,
        onUpdate: (self) => setProductProgress(self.progress),
      })

      gsap.fromTo(
        '.story-card',
        { autoAlpha: 0, y: 42 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.story-section',
            start: 'top 78%',
          },
        },
      )

      gsap.fromTo(
        '.feature-card',
        { autoAlpha: 0, y: 38 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.9,
          stagger: 0.12,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.story-section',
            start: 'top 58%',
          },
        },
      )

      ScrollTrigger.create({
        trigger: sequenceRef.current,
        start: 'top top',
        end: 'bottom top',
        onToggle: (self) => {
          document.body.classList.toggle('header-solid', self.isActive)
        },
      })
    }, sequenceRef)

    return () => ctx.revert()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !ready) return undefined

    const context = canvas.getContext('2d')
    let animationFrame = 0

    const renderFrame = () => {
      const images = frameImagesRef.current
      if (!images.length) return

      targetFrameRef.current = clamp(Math.round(heroProgressRef.current * 119), 0, 119)
      smoothFrameRef.current += (targetFrameRef.current - smoothFrameRef.current) * 0.1
      const frameIndex = Math.round(smoothFrameRef.current)
      const image = images[frameIndex]

      if (image) {
        const ratio = window.devicePixelRatio || 1
        const width = 1280
        const height = 720
        canvas.width = width * ratio
        canvas.height = height * ratio
        canvas.style.width = '100%'
        canvas.style.height = '100%'
        context.setTransform(ratio, 0, 0, ratio, 0, 0)
        context.clearRect(0, 0, width, height)
        context.drawImage(image, 0, 0, width, height)
      }

      setFrameNumber(frameIndex)
      animationFrame = requestAnimationFrame(renderFrame)
    }

    renderFrame()
    return () => cancelAnimationFrame(animationFrame)
  }, [ready])

  const headlineOpacity = clamp(1 - heroProgress / 0.22, 0, 1)
  const headlineScale = 1 + heroProgress * 0.08
  const fadeToNext = clamp((heroProgress - 0.92) / 0.08, 0, 1)
  const productStageOpacity = clamp((productProgress - 0.08) / 0.24, 0, 1)

  return (
    <div className="page-shell">
      <a href="#story" className="skip-link">Skip to content</a>
      <IntroScreen loaderProgress={loaderProgress} ready={ready} />
      <header className="site-header">
        <div className="nav-inner">
          <a href="#home" className="brand" aria-label="Jain Aura home">
            <span className="brand-mark">J</span>
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

          <a href="#products" className="button-primary nav-cta">
            Explore Products
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
          <a href="#products" className="button-primary" onClick={() => setMobileNavOpen(false)}>
            Explore Products
          </a>
        </nav>
      )}

      <main>
        <section className="sequence-01" id="home" ref={sequenceRef}>
          {!ready && (
            <div className="sequence-loader">
              <span>Loading jar sequence</span>
              <div className="loader-bar">
                <span style={{ width: `${Math.round(loaderProgress * 100)}%` }} />
              </div>
            </div>
          )}

          <div className="sequence-stage">
            <canvas ref={canvasRef} className="jar-canvas" aria-label="Jain Aura jar opening sequence" />

            <div className="sequence-mixture" style={{ opacity: 1 - fadeToNext }} />

            <div className="sequence-copy" aria-live="polite">
              <p className="mono-tag">NATURAL GOODNESS // PURE LIFE</p>
              <h1
                className="hero-wordmark"
                style={{
                  opacity: headlineOpacity,
                  transform: `translate3d(0,0,0) scale(${headlineScale})`,
                }}
              >
                JAIN AURA
              </h1>
            </div>

            {featureCards.map((card) => {
              const localProgress = clamp((heroProgress - card.start) / (card.end - card.start), 0, 1)
              const opacity = clamp((Math.sin(localProgress * Math.PI) + 0.15) / 1.15, 0, 1)
              const offset = card.side === 'left' ? -30 + localProgress * 36 : 30 - localProgress * 36

              return (
                <div
                  key={card.title}
                  className={`glass-card ${card.side}`}
                  style={{
                    opacity,
                    transform: `translate3d(${offset}px, ${50 - localProgress * 50}px, 0)`,
                  }}
                >
                  <span>{card.title}</span>
                  <small>{card.text}</small>
                </div>
              )
            })}

            <div className="hud hud-left" aria-hidden="true">
              SEQUENCE 01 // UNSEAL - FRAME {String(frameNumber + 1).padStart(3, '0')}/120
            </div>
            <div className="hud hud-right" aria-hidden="true">WEIGHT 500G - 100% NATURAL</div>
            <div className="fade-next" style={{ opacity: fadeToNext }} />
          </div>
        </section>

        <section className="story-section section-shell" id="story">
          <div className="story-intro story-card">
            <p className="eyebrow">Goodness in Every Bite</p>
            <h2>Carefully selected dry fruits and fine foods, packed for everyday nourishment.</h2>
          </div>

          <div className="feature-grid">
            {storyFeatures.map((feature) => (
              <article className="feature-card story-card" key={feature.title}>
                <div className="feature-icon" aria-hidden="true">
                  {feature.icon}
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="product-sequence" id="products" ref={productRef}>
          <div className="product-stage" style={{ opacity: productStageOpacity }}>
            {products.slice(0, 5).map((product, index) => {
              const localProgress = clamp((productProgress - index * 0.22) / 0.2, 0, 1)
              const opacity = clamp(1 - Math.abs(localProgress - 0.5) * 2, 0, 1)
              const scale = 0.92 + opacity * 0.08

              return (
                <article
                  key={product.id}
                  className="product-spotlight"
                  style={{
                    opacity,
                    transform: `translate3d(0, ${40 - localProgress * 120}px, 0) scale(${scale})`,
                  }}
                >
                  <div className="product-shot">
                    <img src={product.image} alt={product.name} />
                  </div>

                  <div className="glass-card product-glass">
                    <div className="product-copy">
                      <span className="product-kicker">{product.badge}</span>
                      <h3>{product.name}</h3>
                      <p>{product.weight || '500g'}</p>
                      <div className="price-row">
                        <span className="price">{product.price}</span>
                        <span className="old-price">{product.oldPrice}</span>
                      </div>
                      <a href="#contact" className="button-primary product-button">
                        Explore Products
                      </a>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>

          <div className="product-dots" aria-label="Selected products">
            {products.slice(0, 5).map((product, index) => (
              <span
                key={product.id}
                className={index === Math.round(productProgress * 4) ? 'active' : ''}
                aria-hidden="true"
              />
            ))}
          </div>
        </section>

        <section className="final-cta section-shell" id="contact">
          <div className="cta-panel">
            <div className="cta-copy">
              <p className="eyebrow">Bring home nature&apos;s finest</p>
              <h2>Discover the Jain Aura collection.</h2>
              <a href="#products" className="button-primary">
                Explore Our Products
              </a>
            </div>
            <div className="cta-visual">
              <img src="/products/mixed-dry-fruits.svg" alt="Premium mixed dry fruits by Jain Aura" />
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <div>
            <a href="#home" className="brand footer-brand" aria-label="Jain Aura home">
              <span className="brand-mark">J</span>
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
            <h3>Products</h3>
            <ul>
              {products.slice(0, 5).map((product) => (
                <li key={product.id}><a href="#products">{product.name}</a></li>
              ))}
            </ul>
          </div>

          <div>
            <h3>Social</h3>
            <ul>
              <li><a href="#contact">Instagram</a></li>
              <li><a href="#contact">Facebook</a></li>
              <li><a href="#contact">Pinterest</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">© 2026 Jain Aura. All rights reserved.</div>
      </footer>
    </div>
  )
}

export default App
