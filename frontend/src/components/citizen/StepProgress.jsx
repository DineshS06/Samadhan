import { STEPS } from '../../data/formConfig'

export default function StepProgress({ currentStep }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between relative">
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-slate-200 -z-0" />
        <div
          className="absolute top-5 left-0 h-0.5 bg-[#F28C0F] -z-0 transition-all duration-500"
          style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
        />
        {STEPS.map((step) => {
          const done = step.id < currentStep
          const active = step.id === currentStep
          return (
            <div key={step.id} className="flex flex-col items-center z-10 flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
                  done
                    ? 'bg-[#F28C0F] border-[#F28C0F] text-white'
                    : active
                      ? 'bg-[#032B5B] border-[#032B5B] text-white'
                      : 'bg-white border-slate-300 text-slate-400'
                }`}
              >
                {done ? '✓' : step.id}
              </div>
              <p className={`text-xs font-semibold mt-2 text-center hidden sm:block ${active ? 'text-[#032B5B]' : 'text-slate-500'}`}>
                {step.title}
              </p>
            </div>
          )
        })}
      </div>
      <p className="text-center text-sm text-slate-500 mt-4 sm:hidden">
        Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].desc}
      </p>
    </div>
  )
}
