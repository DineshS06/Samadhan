import { Children } from 'react'

/**
 * One scored input, presented so a reader can use it rather than read past it.
 *
 * The three inputs used to be consecutive <section> blocks of unbroken prose.
 * Each opened with an <h2> and ran on for two or three paragraphs, so the weight,
 * the definition, and the limit were equally buried. A reader could not tell at a
 * a glance how much of the score a component carried, or what it was not allowed
 * to decide.
 *
 * Each card now answers four questions in a fixed order:
 *   what it is      one sentence
 *   how it is read  the detail
 *   what it cannot  the honest limit
 *
 * The weight is drawn as a proportion of the 100-point total, so 40% and 20% are
 * visibly different rather than just differently worded.
 */
export function InputCard({ name, weight, headline, children, caveat, sources }) {
  return (
    <article className='input-card'>
      <header className='input-card__head'>
        <div>
          <h3 className='input-card__name'>{name}</h3>
          {headline && <p className='input-card__headline'>{headline}</p>}
        </div>
        <div className='input-card__weight' aria-label={`Weight: ${weight}%`}>
          <span className='input-card__weight-value'>{weight}%</span>
          <span className='input-card__weight-track' aria-hidden='true'>
            <span className='input-card__weight-fill' style={{ width: `${weight}%` }} />
          </span>
        </div>
      </header>

      <div className='input-card__body'>{children}</div>

      {sources && sources.length > 0 && (
        <div className='input-card__sources'>
          <h4>Sources it can draw on</h4>
          <ul>
            {sources.map((s) => (
              <li key={s.label}>
                {s.href ? (
                  <>
                    <strong>
                      <a href={s.href} rel='noopener noreferrer' target='_blank'>
                        {s.label}
                      </a>
                    </strong>
                    {s.note ? ` — ${s.note}` : null}
                  </>
                ) : (
                  <>
                    <strong>{s.label}</strong>
                    {s.note ? ` — ${s.note}` : null}
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {caveat && (
        <p className='input-card__caveat'>
          <span className='input-card__caveat-label'>What this cannot tell you</span>
          {caveat}
        </p>
      )}
    </article>
  )
}

/** Small labelled wrapper for a short paragraph inside a card. */
export function Detail({ label, children }) {
  return (
    <div className='input-card__detail'>
      <span className='input-card__detail-label'>{label}</span>
      <div>{Children.toArray(children)}</div>
    </div>
  )
}

export default InputCard