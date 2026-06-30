import { useEffect, useRef, useState } from 'react'
import { HelpTip } from '../ui/HelpTip'

function useCountUp(target, active, duration = 1200) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!active) return undefined
    let frame = 0
    const totalFrames = Math.round(duration / 16)
    const timer = window.setInterval(() => {
      frame += 1
      const progress = frame / totalFrames
      const eased = 1 - (1 - progress) ** 3
      setValue(Math.round(target * eased))
      if (frame >= totalFrames) {
        setValue(target)
        window.clearInterval(timer)
      }
    }, 16)
    return () => window.clearInterval(timer)
  }, [target, active, duration])

  return value
}

function StatCard({ stat, active }) {
  const count = useCountUp(stat.value, active)
  return (
    <article className="about-stat-card panel-card">
      <strong>{count.toLocaleString('pt-AO')}{stat.suffix}</strong>
      <span>{stat.label}</span>
    </article>
  )
}

export function AboutLiveStats({ stats }) {
  const ref = useRef(null)
  const [active, setActive] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return undefined
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setActive(true)
      },
      { threshold: 0.2 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  if (!stats.length) return null

  return (
    <section className="about-stats" ref={ref} aria-labelledby="about-stats-title">
      <div className="about-stats-head">
        <h2 id="about-stats-title" className="about-section-title">
          Kuteka hoje
        </h2>
        <HelpTip
          label="Ajuda: números"
          text="Contagens actualizadas a partir dos anúncios activos no marketplace (demo local)."
        />
      </div>
      <div className="about-stats-grid">
        {stats.map((stat) => (
          <StatCard key={stat.label} stat={stat} active={active} />
        ))}
      </div>
    </section>
  )
}
