export function SectionBlock({ id, eyebrow, title, subtitle, action, children, tone = 'light' }) {
  return (
    <section id={id} className={`section-block section-block-${tone}`}>
      <div className="section-block-inner">
        {(eyebrow || title || subtitle || action) && (
          <div className="section-block-head">
            <div>
              {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
              {title ? <h2>{title}</h2> : null}
              {subtitle ? <p className="section-block-subtitle">{subtitle}</p> : null}
            </div>
            {action ? <div className="section-block-action">{action}</div> : null}
          </div>
        )}
        {children}
      </div>
    </section>
  )
}

export function PageIntro({ eyebrow, title, subtitle }) {
  return (
    <section className="page-intro">
      <div className="page-intro-inner">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        {subtitle ? <p className="page-intro-subtitle">{subtitle}</p> : null}
      </div>
    </section>
  )
}
