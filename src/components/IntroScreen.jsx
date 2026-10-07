import { useEffect, useState } from 'react'

export function IntroScreen({ loaderProgress, ready, onGone }) {
  const [gone, setGone] = useState(false)

  useEffect(() => {
    if (!ready || gone) return undefined
    // 5 second hold after ready
    const t = setTimeout(() => {
      setGone(true)
      onGone?.()
    }, 5000)
    return () => clearTimeout(t)
  }, [ready, gone, onGone])

  if (gone) return null

  const leaving = ready && !gone

  return (
    <div className={`intro-screen${leaving ? ' intro-leaving' : ''}`} aria-hidden="true">
      <div className="intro-inner">
        {/* Logo image */}
        <img src="/jain-auro-hero.jpeg" alt="Jain Aura" className="intro-logo-img" />
        <p className="intro-tag">NATURAL GOODNESS // PURE LIFE</p>
        <h1 className="intro-wordmark">JAIN AURA</h1>
        {loaderProgress < 1 && (
          <div className="intro-loader">
            <div className="intro-bar">
              <span style={{ width: `${Math.round(loaderProgress * 100)}%` }} />
            </div>
            <span className="intro-percent">{Math.round(loaderProgress * 100)}%</span>
          </div>
        )}
      </div>
    </div>
  )
}
