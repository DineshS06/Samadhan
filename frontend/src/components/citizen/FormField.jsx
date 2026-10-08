import { Children, cloneElement, isValidElement, useId } from 'react'

// focus:outline-none is deliberately absent. It suppressed the global
// :focus-visible outline on every control in the portal, leaving only
// focus:ring-2 with #F28C0F at 40% opacity — measured at 1.43:1 on white, where
// WCAG 2.2 SC 2.4.11 asks 3:1. The ring was removed rather than strengthened:
// the global two-tone outline already clears 3:1 on both light and dark
// surfaces, so a second, weaker ring underneath it added nothing.
const inputClass =
  'w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:border-[#F28C0F] bg-white'

const labelClass = 'block text-sm font-semibold text-[#032B5B] mb-1.5'

// text-slate-400 measured 2.56:1 on white, below the 4.5:1 AA threshold for
// body text. Hints are instructions a citizen may act on — where to find the
// reference ID, what the format is — so they are not decorative. slate-500
// measures 4.76:1.
const hintClass = 'text-slate-500 mt-1'

// Tailwind resets so <fieldset> renders like a plain block.
const fieldsetClass = 'border-0 p-0 m-0 min-w-0'

// Elements a <label for> can legally point at.
const LABELABLE = new Set(['input', 'select', 'textarea'])

const isLabelable = (node) =>
  isValidElement(node) && typeof node.type === 'string' && LABELABLE.has(node.type)

/**
 * Labelled form field.
 *
 * Two modes, because the portal has both kinds of control:
 *
 * - Single control (input/select/textarea): that element is cloned to receive a
 *   generated `id`, and the label points at it with `htmlFor`. Without that the
 *   field was announced as unlabelled, because the <label> was a sibling of the
 *   input rather than a parent.
 * - Control group (the language and severity button rows): rendered as a
 *   <fieldset> with a <legend>. A <label for> aimed at a <div> is inert, and
 *   without fieldset/legend the group of buttons had no accessible name at all.
 *
 * Deliberately does NOT use Children.only(). That threw
 * "React.Children.only expected to receive a single React element child" and
 * took down the whole report-issue page whenever a field had an extra sibling
 * (the attachment input plus its confirmation message). Any number of children
 * is allowed; the first labelable one gets the association and the rest render
 * after it.
 *
 * A caller-supplied id always wins, so a field can keep a stable id if needed.
 */
export function FormField({ label, required, children, hint, hintId }) {
  const generatedId = useId()
  const list = Children.toArray(children)

  const controlIndex = list.findIndex(isLabelable)
  const control = controlIndex === -1 ? null : list[controlIndex]

  const controlId = control?.props?.id || generatedId
  const hintNodeId = hint ? hintId || `${controlId}-hint` : undefined

  const hintNode = hint ? (
    <p className={hintClass} id={hintNodeId}>
      {hint}
    </p>
  ) : null

  const marker = required === true ? (
    <span className="text-red-500 ml-0.5" aria-hidden="true">
      *
    </span>
  ) : null

  // Group mode: no labelable control among the children.
  if (!control) {
    return (
      <fieldset className={fieldsetClass}>
        <legend className={labelClass}>
          {label}
          {marker}
        </legend>
        {/* role="group" is redundant on fieldset but explicit for the audit and
            for assistive tech that ignores the fieldset role mapping. */}
        <div
          id={controlId}
          role="group"
          aria-required={required === true ? 'true' : undefined}
          aria-describedby={hintNodeId}
        >
          {list}
        </div>
        {hintNode}
      </fieldset>
    )
  }

  const rest = [...list.slice(0, controlIndex), ...list.slice(controlIndex + 1)]

  const enhanced = cloneElement(control, {
    id: controlId,
    // Only supply `required` when the caller has not set it, so an explicitly
    // optional control stays optional.
    ...(required === true && control.props.required === undefined ? { required: true } : {}),
    ...(hintNodeId ? { 'aria-describedby': hintNodeId } : {}),
  })

  return (
    <div>
      <label className={labelClass} htmlFor={controlId}>
        {label}
        {marker}
      </label>
      {enhanced}
      {hintNode}
      {rest}
    </div>
  )
}

export { inputClass, labelClass, hintClass }