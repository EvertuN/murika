'use client'

import './Sidebar.css'
import { useMemo, type Dispatch, type SetStateAction } from 'react'
import type { SectionId } from '@/router/section-routes'
import type { AuthRole } from '@/modules/auth/types/auth'

type MenuKey = 'estoque' | 'funcionarios' | 'hospedagem' | 'cadastros' | 'financeiro' | 'configuracoes'

type SidebarProps = {
  currentSectionId: string
  role: AuthRole
  isSidebarCollapsed: boolean
  isMobileSidebarVisible: boolean
  expandedMenus: Record<MenuKey, boolean>
  setExpandedMenus: Dispatch<SetStateAction<Record<MenuKey, boolean>>>
  setIsSidebarCollapsed: Dispatch<SetStateAction<boolean>>
  setIsMobileSidebarVisible: Dispatch<SetStateAction<boolean>>
  navigateTo: (sectionId: string) => void
}

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

export default function Sidebar({
  currentSectionId,
  role,
  isSidebarCollapsed,
  isMobileSidebarVisible,
  expandedMenus,
  setExpandedMenus,
  setIsSidebarCollapsed,
  setIsMobileSidebarVisible,
  navigateTo
}: SidebarProps) {
  const browserWindow = typeof window === 'undefined' ? null : window
  const baseUrl = useMemo(() => {
    const rawBaseUrl = (browserWindow?.MURIKA_BASE_URL || '/').trim()
    if (!rawBaseUrl) return '/'
    return rawBaseUrl.endsWith('/') ? rawBaseUrl : `${rawBaseUrl}/`
  }, [browserWindow])

  const logoutUrl = `${baseUrl}logout`
  const userName = browserWindow?.MURIKA_AUTH_USER?.nome?.trim() || 'Usuário'
  const activeSidebarSection = SIDEBAR_FALLBACKS[currentSectionId] || currentSectionId

  const toggleMenu = (menu: MenuKey) => {
    if (isSidebarCollapsed && browserWindow && browserWindow.innerWidth >= 992) {
      setIsSidebarCollapsed(false)
    }
    setExpandedMenus((prev) => ({
      estoque: false,
      funcionarios: false,
      hospedagem: false,
      cadastros: false,
      financeiro: false,
      configuracoes: false,
      [menu]: !prev[menu]
    }))
  }

  const isSectionActive = (sectionId: string) => activeSidebarSection === sectionId
  const isMenuActive = (menu: MenuKey) => MENU_SECTIONS[menu].includes(activeSidebarSection)

  const goToSection = (sectionId: SectionId) => {
    navigateTo(sectionId)
    if (browserWindow && browserWindow.innerWidth < 992) {
      setIsMobileSidebarVisible(false)
    }
  }

  return (
    <>
      <button className="sidebar-toggler" type="button" id="sidebarToggle" onClick={() => setIsMobileSidebarVisible((prev) => !prev)}>
        <i className="fas fa-bars" />
      </button>

      <aside id="sidebar" className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''} ${isMobileSidebarVisible ? 'show' : ''}`}>
        <button className="collapse-toggle" id="collapseToggle" title="Alternar Menu" onClick={() => setIsSidebarCollapsed((prev) => !prev)}>
          <i className="fas fa-bars" />
        </button>

        <div className="sidebar-header">
          <a className="navbar-brand" href={baseUrl} onClick={(event) => { event.preventDefault(); goToSection('estoque_inicio') }}>
            <span className="brand-full">MURIKA</span>
            <span className="brand-short">M</span>
          </a>
        </div>

        <div className="sidebar-content">
          <ul className="nav flex-column">
            <li className="nav-item">
              <a className={`nav-link ${isMenuActive('estoque') ? 'active' : ''}`} href="#" aria-expanded={expandedMenus.estoque} onClick={(event) => { event.preventDefault(); toggleMenu('estoque') }}>
                <i className="fas fa-boxes" />
                <span className="link-text">Estoque</span>
                <i className="fas fa-chevron-down ms-auto fs-xs" />
              </a>
              <div className={`collapse ${expandedMenus.estoque ? 'show' : ''}`}>
                <ul className="nav flex-column">
                  <li><a className={`dropdown-item ${isSectionActive('estoque_inicio') ? 'active' : ''}`} href="#" onClick={(e) => { e.preventDefault(); goToSection('estoque_inicio') }}><i className="fas fa-boxes-stacked" /> Estoque do Dia</a></li>
                  <li><a className={`dropdown-item ${isSectionActive('historico') ? 'active' : ''}`} href="#" onClick={(e) => { e.preventDefault(); goToSection('historico') }}><i className="fas fa-clock-rotate-left" /> Histórico</a></li>
                </ul>
              </div>
            </li>

            {role === 'admin' ? (
              <li className="nav-item">
                <a className={`nav-link ${isMenuActive('funcionarios') ? 'active' : ''}`} href="#" aria-expanded={expandedMenus.funcionarios} onClick={(event) => { event.preventDefault(); toggleMenu('funcionarios') }}>
                  <i className="fa-solid fa-users" />
                  <span className="link-text">Funcionários</span>
                  <i className="fas fa-chevron-down ms-auto fs-xs" />
                </a>
                <div className={`collapse ${expandedMenus.funcionarios ? 'show' : ''}`}>
                  <ul className="nav flex-column">
                    <li><a className={`dropdown-item ${isSectionActive('listar_funcionarios') ? 'active' : ''}`} href="#" onClick={(e) => { e.preventDefault(); goToSection('listar_funcionarios') }}><i className="fas fa-user-group" /> Funcionários</a></li>
                    <li><a className={`dropdown-item ${isSectionActive('listar_cargos') ? 'active' : ''}`} href="#" onClick={(e) => { e.preventDefault(); goToSection('listar_cargos') }}><i className="fas fa-briefcase" /> Cargos</a></li>
                  </ul>
                </div>
              </li>
            ) : null}

            <li className="nav-item">
              <a className={`nav-link ${isMenuActive('hospedagem') ? 'active' : ''}`} href="#" aria-expanded={expandedMenus.hospedagem} onClick={(event) => { event.preventDefault(); toggleMenu('hospedagem') }}>
                <i className="fa-solid fa-hotel" />
                <span className="link-text">Hospedagem</span>
                <i className="fas fa-chevron-down ms-auto fs-xs" />
              </a>
              <div className={`collapse ${expandedMenus.hospedagem ? 'show' : ''}`}>
                <ul className="nav flex-column">
                  <li><a className={`dropdown-item ${isSectionActive('listar_reservas') ? 'active' : ''}`} href="#" onClick={(e) => { e.preventDefault(); goToSection('listar_reservas') }}><i className="fas fa-bed" /> Reserva</a></li>
                  <li><a className={`dropdown-item ${isSectionActive('listar_clientes') ? 'active' : ''}`} href="#" onClick={(e) => { e.preventDefault(); goToSection('listar_clientes') }}><i className="fas fa-user" /> Clientes</a></li>
                  <li><a className={`dropdown-item ${isSectionActive('listar_empresas') ? 'active' : ''}`} href="#" onClick={(e) => { e.preventDefault(); goToSection('listar_empresas') }}><i className="fas fa-building" /> Empresas</a></li>
                </ul>
              </div>
            </li>

            <li className="nav-item">
              <a className={`nav-link ${isMenuActive('cadastros') ? 'active' : ''}`} href="#" aria-expanded={expandedMenus.cadastros} onClick={(event) => { event.preventDefault(); toggleMenu('cadastros') }}>
                <i className="fas fa-clipboard-list" />
                <span className="link-text">Cadastros</span>
                <i className="fas fa-chevron-down ms-auto fs-xs" />
              </a>
              <div className={`collapse ${expandedMenus.cadastros ? 'show' : ''}`}>
                <ul className="nav flex-column">
                  <li className="sidebar-submenu-label">Estoque</li>
                  <li><a className={`dropdown-item ${isSectionActive('lista_item') ? 'active' : ''}`} href="#" onClick={(event) => { event.preventDefault(); goToSection('lista_item') }}><i className="fas fa-table-list" /> Itens</a></li>
                  <li><a className={`dropdown-item ${isSectionActive('lista_categoria_item') ? 'active' : ''}`} href="#" onClick={(event) => { event.preventDefault(); goToSection('lista_categoria_item') }}><i className="fas fa-layer-group" /> Categorias</a></li>
                  {role === 'admin' ? (
                    <>
                      <li className="sidebar-submenu-label">Hospedagem</li>
                      <li><a className={`dropdown-item ${isSectionActive('cadastros_quartos') ? 'active' : ''}`} href="#" onClick={(event) => { event.preventDefault(); goToSection('cadastros_quartos') }}><i className="fas fa-door-open" /> Quartos</a></li>
                      <li><a className={`dropdown-item ${isSectionActive('cadastros_tipos_quarto') ? 'active' : ''}`} href="#" onClick={(event) => { event.preventDefault(); goToSection('cadastros_tipos_quarto') }}><i className="fas fa-bed" /> Tipos de quarto</a></li>
                      <li><a className={`dropdown-item ${isSectionActive('cadastros_formas_pagamento') ? 'active' : ''}`} href="#" onClick={(event) => { event.preventDefault(); goToSection('cadastros_formas_pagamento') }}><i className="fas fa-credit-card" /> Formas de pagamento</a></li>
                    </>
                  ) : null}
                </ul>
              </div>
            </li>

            {role === 'admin' || role === 'financeiro' ? (
              <li className="nav-item">
                <a className={`nav-link ${isMenuActive('financeiro') ? 'active' : ''}`} href="#" aria-expanded={expandedMenus.financeiro} onClick={(event) => { event.preventDefault(); toggleMenu('financeiro') }}>
                  <i className="fas fa-chart-line" />
                  <span className="link-text">Financeiro</span>
                  <i className="fas fa-chevron-down ms-auto fs-xs" />
                </a>
                <div className={`collapse ${expandedMenus.financeiro ? 'show' : ''}`}>
                  <ul className="nav flex-column">
                    <li><a className={`dropdown-item ${isSectionActive('financeiro') ? 'active' : ''}`} href="#" onClick={(e) => { e.preventDefault(); goToSection('financeiro') }}><i className="fas fa-chart-pie" /> Dashboard</a></li>
                  </ul>
                </div>
              </li>
            ) : null}

            {role === 'admin' ? (
              <li className="nav-item">
                <a className={`nav-link ${isMenuActive('configuracoes') ? 'active' : ''}`} href="#" aria-expanded={expandedMenus.configuracoes} onClick={(event) => { event.preventDefault(); toggleMenu('configuracoes') }}>
                  <i className="fas fa-gear" />
                  <span className="link-text">Configurações</span>
                  <i className="fas fa-chevron-down ms-auto fs-xs" />
                </a>
                <div className={`collapse ${expandedMenus.configuracoes ? 'show' : ''}`}>
                  <ul className="nav flex-column">
                    <li><a className={`dropdown-item ${isSectionActive('app_config') ? 'active' : ''}`} href="#" onClick={(event) => { event.preventDefault(); goToSection('app_config') }}><i className="fas fa-sliders" /> Geral</a></li>
                    <li><a className={`dropdown-item ${isSectionActive('auth_users') ? 'active' : ''}`} href="#" onClick={(event) => { event.preventDefault(); goToSection('auth_users') }}><i className="fas fa-users-gear" /> Usuários</a></li>
                    <li><a className={`dropdown-item ${isSectionActive('auth_admin_logs') ? 'active' : ''}`} href="#" onClick={(event) => { event.preventDefault(); goToSection('auth_admin_logs') }}><i className="fas fa-list-check" /> Logs</a></li>
                  </ul>
                </div>
              </li>
            ) : null}
          </ul>
        </div>

        <div className="sidebar-footer">
          <div className="user-info">
            <i className="fas fa-user-circle fa-2x" />
            <div className="user-name">{userName}</div>
          </div>
          <a href={logoutUrl} className="btn btn-outline-light btn-sm logout-btn">
            <i className="fas fa-sign-out-alt" /> <span>Sair</span>
          </a>
        </div>
      </aside>
    </>
  )
}
