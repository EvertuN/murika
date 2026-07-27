export const DEFAULT_SECTION_ID = 'listar_reservas'

export const SECTION_PATHS = {
  estoque_inicio: '/estoque/dia',
  historico: '/estoque/historico',
  lista_item: '/cadastros/itens',
  cadastrar_item: '/cadastros/itens/novo',
  lista_categoria_item: '/cadastros/categorias',
  cadastrar_categoria_item: '/cadastros/categorias/nova',
  listar_funcionarios: '/funcionarios',
  cadastrar_funcionario: '/funcionarios/novo',
  listar_cargos: '/funcionarios/cargos',
  cadastrar_cargo: '/funcionarios/cargos/novo',
  listar_reservas: '/hospedagem/reservas',
  listar_clientes: '/hospedagem/clientes',
  cadastrar_cliente: '/hospedagem/clientes/novo',
  listar_empresas: '/hospedagem/empresas',
  cadastrar_empresa: '/hospedagem/empresas/nova',
  cadastros_quartos: '/cadastros/quartos',
  cadastros_tipos_quarto: '/cadastros/tipos-de-quarto',
  cadastros_formas_pagamento: '/cadastros/formas-de-pagamento',
  financeiro: '/financeiro',
  auth_users: '/admin/usuarios',
  auth_admin_logs: '/admin/logs',
  app_config: '/admin/configuracoes'
} as const

export type SectionId = keyof typeof SECTION_PATHS

const PATH_TO_SECTION_ID = Object.entries(SECTION_PATHS).reduce<Record<string, SectionId>>(
  (acc, [sectionId, path]) => {
    acc[path] = sectionId as SectionId
    return acc
  },
  {}
)

// Mantem links antigos funcionando apos reorganizar os cadastros.
PATH_TO_SECTION_ID['/estoque/itens'] = 'lista_item'
PATH_TO_SECTION_ID['/estoque/itens/novo'] = 'cadastrar_item'
PATH_TO_SECTION_ID['/estoque/categorias'] = 'lista_categoria_item'
PATH_TO_SECTION_ID['/estoque/categorias/nova'] = 'cadastrar_categoria_item'
PATH_TO_SECTION_ID['/cadastros'] = 'cadastros_quartos'
PATH_TO_SECTION_ID['/hospedagem/cadastros'] = 'cadastros_quartos'

export function isSectionId(value: string): value is SectionId {
  return Object.prototype.hasOwnProperty.call(SECTION_PATHS, value)
}

export function getPathBySectionId(sectionId: string): string | null {
  if (!isSectionId(sectionId)) return null
  return SECTION_PATHS[sectionId]
}

export function getSectionIdByPath(path: string): SectionId | null {
  return PATH_TO_SECTION_ID[path] ?? null
}
