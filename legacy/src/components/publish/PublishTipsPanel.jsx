import { useState } from 'react'
import { PUBLISH_FUTURE_FEATURES, PUBLISH_TIPS } from '../../constants/publishCategories'
import { HomeIcon } from '../icons/HomeIcon'

export function PublishTipsPanel() {
  const [open, setOpen] = useState(false)

  return (
    <aside className="publish-tips-panel">
      <p className="publish-tips-title">Dicas para vender mais rápido</p>
      <button
        type="button"
        className="publish-tips-toggle"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <HomeIcon name="bolt" />
        <span>Dicas para vender mais rápido</span>
        <span className="publish-tips-chevron">{open ? '▲' : '▼'}</span>
      </button>

      <div className={`publish-tips-body${open ? ' open' : ''}`}>
        <ul className="publish-tips-list">
          {PUBLISH_TIPS.map((tip) => (
            <li key={tip}>
              <HomeIcon name="check" />
              <span>{tip}</span>
            </li>
          ))}
        </ul>

        <div className="publish-future-teaser">
          <p className="publish-future-title">Em breve na Kuteka</p>
          <div className="publish-future-tags">
            {PUBLISH_FUTURE_FEATURES.map((item) => (
              <span key={item} className="publish-future-tag">
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </aside>
  )
}
