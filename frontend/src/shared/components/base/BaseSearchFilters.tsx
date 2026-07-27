'use client'

import BaseButton from './BaseButton'

type BaseSearchFiltersProps = {
  modelValue: string
  secondaryValue?: string
  primaryLabel?: string
  secondaryLabel?: string
  primaryPlaceholder?: string
  secondaryPlaceholder?: string
  onPrimaryChange: (value: string) => void
  onSecondaryChange: (value: string) => void
  onClear: () => void
}

export default function BaseSearchFilters({
  modelValue,
  secondaryValue = '',
  primaryLabel = 'Pesquisar',
  secondaryLabel = 'Documento',
  primaryPlaceholder = 'Digite para pesquisar',
  secondaryPlaceholder = 'Digite o documento',
  onPrimaryChange,
  onSecondaryChange,
  onClear
}: BaseSearchFiltersProps) {
  const clearFilters = () => {
    onPrimaryChange('')
    onSecondaryChange('')
    onClear()
  }

  return (
    <div className="row g-2 align-items-end mb-3">
      <div className="col-md-5">
        <label className="form-label small fw-bold">{primaryLabel}</label>
        <input
          type="text"
          className="form-control form-control-sm"
          value={modelValue}
          placeholder={primaryPlaceholder}
          onChange={(event) => onPrimaryChange(event.target.value)}
        />
      </div>
      <div className="col-md-5">
        <label className="form-label small fw-bold">{secondaryLabel}</label>
        <input
          type="text"
          className="form-control form-control-sm"
          value={secondaryValue}
          placeholder={secondaryPlaceholder}
          onChange={(event) => onSecondaryChange(event.target.value)}
        />
      </div>
      <div className="col-md-1">
        <label className="form-label small fw-bold invisible d-block">Ações</label>
        <BaseButton variant="outline-secondary" size="toolbar" block onClick={clearFilters}>
          Limpar
        </BaseButton>
      </div>
    </div>
  )
}
