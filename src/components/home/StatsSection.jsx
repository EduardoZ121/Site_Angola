import { useEffect, useRef, useState } from 'react'
import { homeStats } from '../../data/homeContent'

function useCountUp(target, active, duration = 1400) {
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

function StatItem({ stat, active }) {
  const count = useCountUp(stat.value, active)
  return (
    <article className="hp-stat-card">
      <strong>
        {count.toLocaleString('pt-AO')}
        {stat.suffix}
      </strong>
      <span>{stat.label}</span>
    </article>
  )
}

export function StatsSection() {
  const ref = useRef(null)
  const [active, setActive] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return undefined
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setActive(true)
      },
      { threshold: 0.3 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <section className="hp-section" ref={ref}>
      <div className="hp-container">
        <div className="hp-section-head center">
          <p className="hp-eyebrow dark">Números</p>
          <h2>Kuteka em crescimento</h2>
        </div>
        <div className="hp-stats-grid">
          {homeStats.map((stat) => (
            <StatItem key={stat.label} stat={stat} active={active} />
          ))}
        </div>
      </div>
    </section>
  )
}
