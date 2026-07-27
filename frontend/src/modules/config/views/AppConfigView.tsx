'use client'

import { useEffect, useMemo, useState } from 'react'
import BaseButton from '@/shared/components/base/BaseButton'
import { appConfigService, type AppConfigEntry } from '../services/app-config.service'

const GROUP_LABELS: Record<AppConfigEntry['config_group'], string> = {
  security: 'Segurança',
  reservation: 'Reservas',
  inventory: 'Estoque',
  report: 'Relatórios'
}

export default function AppConfigView() {
  const [entries, setEntries] = useState<AppConfigEntry[]>([])
  const [values, setValues] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const load = async () => {
    setLoading(true); setError('')
    try {
      const data = await appConfigService.listar()
      setEntries(data)
      setValues(Object.fromEntries(data.map((entry) => [entry.config_key, entry.config_value])))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar configurações.')
    } finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [])

  const groups = useMemo(() => Object.entries(GROUP_LABELS).map(([key, label]) => ({
    key: key as AppConfigEntry['config_group'], label, entries: entries.filter((entry) => entry.config_group === key)
  })).filter((group) => group.entries.length > 0), [entries])

  const save = async () => {
    setSaving(true); setError(''); setSuccess('')
    try {
      const updated = await appConfigService.atualizar(values)
      setEntries(updated)
      setValues(Object.fromEntries(updated.map((entry) => [entry.config_key, entry.config_value])))
      setSuccess('Configurações atualizadas. Novas sessões e operações já usarão os valores salvos.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar configurações.')
    } finally { setSaving(false) }
  }

  if (loading) return <div className="card p-4">Carregando configurações...</div>

  return <div className="card p-4">
    <div className="d-flex justify-content-between align-items-center gap-3 mb-4"><div><h3 className="mb-1">Configurações administrativas</h3><p className="text-muted mb-0">Parâmetros operacionais e políticas de segurança.</p></div><BaseButton variant="primary" disabled={saving} onClick={() => void save()}>{saving ? 'Salvando...' : 'Salvar alterações'}</BaseButton></div>
    {error ? <div className="alert alert-danger">{error}</div> : null}
    {success ? <div className="alert alert-success">{success}</div> : null}
    <div className="row g-4">
      {groups.map((group) => <section className="col-lg-6" key={group.key}><div className="border rounded p-3 h-100"><h5 className="border-bottom pb-2 mb-3">{group.label}</h5>
        {group.entries.map((entry) => <div className="mb-3" key={entry.config_key}><label className="form-label fw-semibold">{entry.label}</label>
          {entry.value_type === 'boolean' ? <select className="form-select" value={values[entry.config_key] ?? ''} onChange={(event) => setValues((current) => ({ ...current, [entry.config_key]: event.target.value }))}><option value="1">Sim</option><option value="0">Não</option></select> : <input className="form-control" type={entry.value_type === 'time' ? 'time' : 'number'} min={entry.min_value ?? undefined} max={entry.max_value ?? undefined} value={values[entry.config_key] ?? ''} onChange={(event) => setValues((current) => ({ ...current, [entry.config_key]: event.target.value }))} />}
          {entry.description ? <small className="text-muted">{entry.description}</small> : null}
        </div>)}
      </div></section>)}
    </div>
  </div>
}
