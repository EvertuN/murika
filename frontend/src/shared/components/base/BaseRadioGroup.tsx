'use client'

type RadioOption = {
  label: string
  value: string | number
}

type BaseRadioGroupProps = {
  modelValue: string | number | null | undefined
  options: RadioOption[]
  name: string
  label?: string
  inline?: boolean
  size?: 'sm' | 'md'
  inputClass?: string
  onChange: (value: string) => void
}

export default function BaseRadioGroup({
  modelValue,
  options,
  name,
  label = '',
  inline = true,
  size = 'sm',
  inputClass = '',
  onChange
}: BaseRadioGroupProps) {
  return (
    <div className="d-flex align-items-center gap-2 flex-wrap">
      {label ? <span className={`form-label fw-bold mb-0 ${size === 'sm' ? 'small' : ''}`}>{label}</span> : null}
      {options.map((option, index) => (
        <div key={`${name}-${String(option.value)}`} className={`form-check mb-0 ${inline ? 'form-check-inline' : ''}`}>
          <input
            id={`${name}-${index}`}
            className={`form-check-input hosp-check ${inputClass}`.trim()}
            type="radio"
            name={name}
            value={String(option.value)}
            checked={String(modelValue ?? '') === String(option.value)}
            onChange={(event) => onChange(event.target.value)}
          />
          <label className={`form-check-label ${size === 'sm' ? 'small' : ''}`} htmlFor={`${name}-${index}`}>
            {option.label}
          </label>
        </div>
      ))}
    </div>
  )
}
