import { useEffect, useState } from 'react'

export function IntroScreen({ loaderProgress, ready }) {
  const [leaving, setLeaving] = useState(false)
  const [gone, setGone] = useState(false)

  useEffect(() => {
    if (ready && !leaving) {
      setLeaving(true)
      const t = setTimeout(() => setGone(true), 900)
      return () => clearTimeout(t)
    }
  }, [ready, leaving])

  if (gone) return null

  return (
    <div className={`intro-screen${leaving ? ' intro-leaving' : ''}`} aria-hidden="true">
      <div className="intro-inner">
        <p className="intro-tag">NATURAL GOODNESS // PURE LIFE</p>
        <h1 className="intro-wordmark">JAIN AURA</h1>
        {loaderProgress < 1 && (
          <div className="intro-loader">
            <span className="intro-loader-label">LOADING JAR SEQUENCE</span>
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
