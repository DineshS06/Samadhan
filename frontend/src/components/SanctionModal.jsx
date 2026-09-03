import { useEffect, useRef } from 'react'
import { useLanguage } from '../i18n/LanguageContext'

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export default function SanctionModal({ project, document, loading, onClose, onForward }) {
  const { t } = useLanguage()
  const dialogRef = useRef(null)
  const closeBtnRef = useRef(null)
  const titleId = 'sanction-modal-title'

  // Escape to close + lock body scroll + focus first control.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKey = (e) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      // Simple focus trap — keep focus inside the dialog while open.
      if (e.key !== 'Tab' || !dialogRef.current) return
      const focusables = dialogRef.current.querySelectorAll(FOCUSABLE)
      if (!focusables.length) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement
      if (e.shiftKey && active === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', handleKey)
    // Focus the close button so screen readers announce the dialog.
    queueMicrotask(() => closeBtnRef.current?.focus())

    return () => {
      window.removeEventListener('keydown', handleKey)
      document.body.style.overflow = previousOverflow
    }
  }, [onClose])

  if (!project) return null

  const doc = document || {}

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b bg-[#032B5B] rounded-t-2xl">
          <h2 id={titleId} className="text-white font-bold text-base">{t.modalTitle}</h2>
          <p className="text-blue-200 text-xs mt-1">{project.project_name} — {project.location}</p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 text-sm text-slate-700">
          {loading && (
            <div className="text-xs text-[#F28C0F] font-medium animate-pulse" aria-live="polite">{t.modalLoading}</div>
          )}

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div><span className="text-slate-500 uppercase">{t.modalFrom}</span><p className="font-semibold text-[#032B5B] mt-0.5">{doc.from_office}</p></div>
            <div><span className="text-slate-500 uppercase">{t.modalTo}</span><p className="font-semibold text-[#032B5B] mt-0.5">{doc.to_office}</p></div>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-lg p-4">
            <p className="text-xs text-slate-500 uppercase">{t.modalSubject}</p>
            <p className="font-semibold text-[#032B5B] mt-1">{doc.subject}</p>
          </div>

          <section>
            <h3 className="font-bold text-[#032B5B] text-xs uppercase tracking-wide mb-2">{t.modalScope}</h3>
            <p className="leading-relaxed">{doc.project_scope || doc.summary || project.summary}</p>
          </section>

          <section>
            <h3 className="font-bold text-[#032B5B] text-xs uppercase tracking-wide mb-2">{t.modalBudget}</h3>
            <p className="leading-relaxed">{doc.budget_allocation}</p>
          </section>

          <section>
            <h3 className="font-bold text-[#032B5B] text-xs uppercase tracking-wide mb-2">{t.modalGuidelines}</h3>
            <ol className="list-decimal list-inside space-y-1">
              {(doc.guidelines || []).map((g) => <li key={g}>{g}</li>)}
            </ol>
          </section>

          {doc.sanction_note && (
            <details className="text-xs text-slate-500">
              <summary className="cursor-pointer font-medium text-[#032B5B]">{t.modalFullText}</summary>
              <pre className="mt-2 whitespace-pre-wrap font-sans leading-relaxed">{doc.sanction_note}</pre>
            </details>
          )}
        </div>

        <div className="px-6 py-4 border-t flex gap-3 justify-end bg-slate-50 rounded-b-2xl">
          <button ref={closeBtnRef} type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600">
            {t.modalClose}
          </button>
          <button type="button" onClick={onForward} disabled={loading} className="bg-[#F28C0F] hover:bg-[#e07d0a] disabled:opacity-50 text-white text-sm font-semibold px-5 py-2 rounded-lg shadow">
            {t.modalForward}
          </button>
        </div>
      </div>
    </div>
  )
}
