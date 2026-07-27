import { api } from '@/shared/services/api'

export type AppConfigEntry = {
  config_key: string
  config_value: string
  value_type: 'integer' | 'time' | 'boolean'
  config_group: 'security' | 'reservation' | 'inventory' | 'report'
  label: string
  description?: string | null
  min_value?: number | string | null
  max_value?: number | string | null
  updated_at?: string | null
}

export const appConfigService = {
  listar(): Promise<AppConfigEntry[]> {
    return api.get<AppConfigEntry[]>('/app_config', { acao: 'listar' })
  },
  async atualizar(configuracoes: Record<string, string>): Promise<AppConfigEntry[]> {
    return api.post<AppConfigEntry[]>('/app_config', { acao: 'atualizar', configuracoes: JSON.stringify(configuracoes) })
  }
}
