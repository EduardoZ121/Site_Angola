import { useId, useState } from 'react'

export function HelpTip({ label, text }) {
  const id = useId()
  const [open, setOpen] = useState(false)

  return (
    <span className="ui-help-tip-wrap">
      <button
        type="button"
        className="ui-help-tip"
        aria-label={label}
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        title={text}
        onClick={() => setOpen((value) => !value)}
      >
        ?
      </button>
      {open ? (
        <span className="ui-help-tip-popover" id={id} role="tooltip">
          {text}
        </span>
      ) : null}
    </span>
  )
}
