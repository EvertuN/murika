'use client'

import EstoqueCategoriasView from './EstoqueCategoriasView'
import EstoqueItensView from './EstoqueItensView'

type Props = { sectionId: string }

export default function EstoqueCadastrosView({ sectionId }: Props) {
  if (sectionId === 'lista_categoria_item' || sectionId === 'cadastrar_categoria_item') {
    return <EstoqueCategoriasView sectionId={sectionId} />
  }

  return <EstoqueItensView sectionId={sectionId} />
}
