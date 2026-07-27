'use client'

import EstoqueDiaView from './EstoqueDiaView'
import EstoqueHistoricoView from './EstoqueHistoricoView'

type Props = { sectionId: string }

export default function EstoqueOperacoesView({ sectionId }: Props) {
  if (sectionId === 'historico') return <EstoqueHistoricoView />
  return <EstoqueDiaView />
}
