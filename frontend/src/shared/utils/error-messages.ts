export type ErrorEntity = 'empresa' | 'cliente'
export type ErrorAction = 'load' | 'create' | 'update' | 'delete'

type ErrorContext = {
  entity: ErrorEntity
  action: ErrorAction
}

const FALLBACK_MESSAGES: Record<ErrorEntity, Record<ErrorAction, string>> = {
  empresa: {
    load: 'Erro ao carregar empresas.',
    create: 'Erro ao cadastrar empresa.',
    update: 'Erro ao atualizar empresa.',
    delete: 'Erro ao excluir empresa.'
  },
  cliente: {
    load: 'Erro ao carregar clientes.',
    create: 'Erro ao cadastrar cliente.',
    update: 'Erro ao atualizar cliente.',
    delete: 'Erro ao excluir cliente.'
  }
}

function normalizeText(value: unknown) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function getRawMessage(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message
    return String(message || '')
  }
  return String(error || '')
}

export function getUserErrorMessage(error: unknown, context: ErrorContext): string {
  const fallback = FALLBACK_MESSAGES[context.entity][context.action]
  const rawMessage = getRawMessage(error).trim()
  const raw = normalizeText(rawMessage)

  if (!raw) return fallback

  // Regras globais primeiro
  if (raw.includes('acesso negado')) return 'Você não tem permissão para esta ação.'
  if (raw.includes('sessao') && (raw.includes('expirada') || raw.includes('invalida'))) {
    return 'Sessão expirada. Atualize a página e tente novamente.'
  }

  // Regras de empresa
  if (context.entity === 'empresa') {
    if (raw.includes('cnpj ja cadastrado')) return 'CNPJ já cadastrado.'
    if (raw.includes('campo') && raw.includes('cnpj')) return 'CNPJ é obrigatório.'
    if (raw.includes('campo') && raw.includes('razao_social')) return 'Razão social é obrigatória.'
  }

  // Regras de cliente
  if (context.entity === 'cliente') {
    if (raw.includes('cpf invalido') || (raw.includes('cpf') && raw.includes('inval'))) return 'CPF inválido.'
    if (raw.includes('cpf ja cadastrado') || (raw.includes('cpf') && raw.includes('cadastrad'))) return 'CPF já cadastrado.'
    if (raw.includes('campo') && raw.includes('nome')) return 'Nome do cliente é obrigatório.'
    if (raw.includes('campo') && raw.includes('tipo_documento')) return 'Tipo de documento é obrigatório.'
    if (raw.includes('campo') && raw.includes('documento')) return 'Documento é obrigatório.'
  }

  if (
    rawMessage &&
    raw !== 'erro na requisicao' &&
    !raw.includes('resposta invalida da api')
  ) {
    return rawMessage
  }

  return fallback
}
