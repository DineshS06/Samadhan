const inputClass =
  'w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#F28C0F]/40 focus:border-[#F28C0F] bg-white'

const labelClass = 'block text-sm font-semibold text-[#032B5B] mb-1.5'

export function FormField({ label, required, children, hint }) {
  return (
    <div>
      <label className={labelClass}>
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  )
}

export { inputClass, labelClass }
