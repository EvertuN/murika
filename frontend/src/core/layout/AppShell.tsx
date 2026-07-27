'use client'

import './AppShell.css'
import { useEffect, useMemo, useState } from 'react'
import { useInputMask } from '@/core/hooks/useInputMask'
import { useSessionTimer } from '@/core/hooks/useSessionTimer'
import { useSectionRouter } from '@/core/hooks/useSectionRouter'
import { initTableToCards } from '@/shared/utils/table-to-cards'
import Sidebar from './Sidebar'
import EstoqueOperacoesView from '@/modules/estoque/views/EstoqueOperacoesView'
import EstoqueCadastrosView from '@/modules/estoque/views/EstoqueCadastrosView'
import FuncionariosView from '@/modules/funcionarios/views/FuncionariosView'
import CargoView from '@/modules/funcionarios/views/CargoView'
import AppHospedagem from '@/modules/hospedagem/views/checkin/AppHospedagem'
import AppClientes from '@/modules/hospedagem/views/clientes/AppClientes'
import AppEmpresas from '@/modules/hospedagem/views/empresas/AppEmpresas'
import HospedagemCadastrosView from '@/modules/hospedagem/views/cadastros/HospedagemCadastrosView'
import AuthAdminLogsView from '@/modules/auth/views/AuthAdminLogsView'
import AuthUsersView from '@/modules/auth/views/AuthUsersView'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import type { AuthRole } from '@/modules/auth/types/auth'
import FinanceiroAppView from '@/modules/financeiro/views/FinanceiroAppView'
import AppConfigView from '@/modules/config/views/AppConfigView'

type MenuKey = 'estoque' | 'funcionarios' | 'hospedagem' | 'cadastros' | 'financeiro' | 'configuracoes'

const MENU_SECTIONS: Record<MenuKey, string[]> = {
  estoque: ['estoque_inicio', 'historico'],
  funcionarios: ['listar_funcionarios', 'listar_cargos'],
  hospedagem: ['listar_reservas', 'listar_clientes', 'listar_empresas'],
  cadastros: ['lista_item', 'lista_categoria_item', 'cadastros_quartos', 'cadastros_tipos_quarto', 'cadastros_formas_pagamento'],
  financeiro: ['financeiro'],
  configuracoes: ['app_config', 'auth_users', 'auth_admin_logs']
}

const SIDEBAR_FALLBACKS: Record<string, string> = {
  cadastrar_item: 'lista_item',
  cadastrar_categoria_item: 'lista_categoria_item',
  cadastrar_funcionario: 'listar_funcionarios',
  cadastrar_cargo: 'listar_cargos',
  cadastrar_cliente: 'listar_clientes',
  cadastrar_empresa: 'listar_empresas',
  auth_usuario_logs: 'auth_admin_logs'
}

function renderSection(sectionId: string, role: AuthRole) {
  if (role !== 'admin' && ['listar_funcionarios', 'cadastrar_funcionario', 'listar_cargos', 'cadastrar_cargo', 'cadastros_quartos', 'cadastros_tipos_quarto', 'cadastros_formas_pagamento', 'auth_admin_logs', 'auth_users', 'app_config'].includes(sectionId)) {
    return <AppHospedagem />
  }
  if (role !== 'admin' && ['cadastrar_item', 'cadastrar_categoria_item'].includes(sectionId)) {
    return <EstoqueCadastrosView sectionId={sectionId === 'cadastrar_item' ? 'lista_item' : 'lista_categoria_item'} />
  }
  if (role === 'financeiro' && ['cadastrar_cliente', 'cadastrar_empresa'].includes(sectionId)) {
    return sectionId === 'cadastrar_cliente'
      ? <AppClientes sectionId="listar_clientes" />
      : <AppEmpresas sectionId="listar_empresas" />
  }
  if (role === 'recepcao' && sectionId === 'financeiro') {
    return <AppHospedagem />
  }
  if (sectionId === 'estoque_inicio' || sectionId === 'historico') {
    return <EstoqueOperacoesView sectionId={sectionId} />
  }
  if (sectionId === 'lista_item' || sectionId === 'cadastrar_item' || sectionId === 'lista_categoria_item' || sectionId === 'cadastrar_categoria_item') {
    return <EstoqueCadastrosView sectionId={sectionId} />
  }
  if (sectionId === 'listar_funcionarios' || sectionId === 'cadastrar_funcionario') {
    return <FuncionariosView sectionId={sectionId} />
  }
  if (sectionId === 'listar_cargos' || sectionId === 'cadastrar_cargo') {
    return <CargoView sectionId={sectionId} />
  }
  if (sectionId === 'listar_reservas') {
    return <AppHospedagem />
  }
  if (sectionId === 'listar_clientes' || sectionId === 'cadastrar_cliente') {
    return <AppClientes sectionId={sectionId} />
  }
  if (sectionId === 'listar_empresas' || sectionId === 'cadastrar_empresa') {
    return <AppEmpresas sectionId={sectionId} />
  }
  if (sectionId === 'cadastros_quartos') {
    return <HospedagemCadastrosView key="quartos" section="quartos" />
  }
  if (sectionId === 'cadastros_tipos_quarto') {
    return <HospedagemCadastrosView key="tipos_quarto" section="tipos_quarto" />
  }
  if (sectionId === 'cadastros_formas_pagamento') {
    return <HospedagemCadastrosView key="formas_pagamento" section="formas_pagamento" />
  }
  if (sectionId === 'auth_admin_logs') {
    return <AuthAdminLogsView />
  }
  if (sectionId === 'auth_users') {
    return <AuthUsersView />
  }
  if (sectionId === 'app_config') {
    return <AppConfigView />
  }
  if (sectionId === 'financeiro') {
    return <FinanceiroAppView />
  }
  return <EstoqueOperacoesView sectionId="estoque_inicio" />
}

export default function AppShell() {
  const { currentSectionId, navigateTo } = useSectionRouter()
  const { user, permissions } = useAuth()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileSidebarVisible, setIsMobileSidebarVisible] = useState(false)
  const [expandedMenus, setExpandedMenus] = useState<Record<MenuKey, boolean>>({
    estoque: false,
    funcionarios: false,
    hospedagem: false,
    cadastros: false,
    financeiro: false,
    configuracoes: false
  })

  useInputMask()
  useSessionTimer()

  useEffect(() => {
    initTableToCards()
  }, [])

  const role = user?.role ?? 'recepcao'

  const activeSidebarSection = useMemo(
    () => SIDEBAR_FALLBACKS[currentSectionId] || currentSectionId,
    [currentSectionId]
  )

  useEffect(() => {
    if (isSidebarCollapsed) {
      setExpandedMenus({ estoque: false, funcionarios: false, hospedagem: false, cadastros: false, financeiro: false, configuracoes: false })
      return
    }

    const activeMenu = (Object.keys(MENU_SECTIONS) as MenuKey[])
      .find((key) => MENU_SECTIONS[key].includes(activeSidebarSection))

    if (!activeMenu) return

    setExpandedMenus({
      estoque: activeMenu === 'estoque',
      funcionarios: activeMenu === 'funcionarios',
      hospedagem: activeMenu === 'hospedagem',
      cadastros: activeMenu === 'cadastros',
      financeiro: activeMenu === 'financeiro',
      configuracoes: activeMenu === 'configuracoes'
    })
  }, [activeSidebarSection, isSidebarCollapsed])

  return (
    <>
      <Sidebar
        currentSectionId={currentSectionId}
        role={role}
        isSidebarCollapsed={isSidebarCollapsed}
        isMobileSidebarVisible={isMobileSidebarVisible}
        expandedMenus={expandedMenus}
        setExpandedMenus={setExpandedMenus}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        setIsMobileSidebarVisible={setIsMobileSidebarVisible}
        navigateTo={(sectionId) => {
          navigateTo(sectionId)
        }}
      />
      <div className={`main-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {!permissions.operationalWrite && role === 'financeiro' ? (
          <div className="alert alert-info m-3 mb-0">Perfil financeiro: reservas e estoque estão disponíveis somente para leitura.</div>
        ) : null}
        {renderSection(currentSectionId, role)}
      </div>
    </>
  )
}
