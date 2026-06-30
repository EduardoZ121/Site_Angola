import { HomeIcon } from '../icons/HomeIcon'

export function AboutMission({ items }) {
  return (
    <section className="about-mission" aria-labelledby="about-mission-title">
      <h2 id="about-mission-title" className="about-section-title">
        A nossa missão
      </h2>
      <ul className="about-mission-grid">
        {items.map((item) => (
          <li key={item.title} className="about-mission-card panel-card">
            <span className="about-mission-icon" aria-hidden="true">
              <HomeIcon name={item.icon} />
            </span>
            <strong>{item.title}</strong>
            <p>{item.description}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
