'use client'

import './FinanceiroAppView.css'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import Chart from 'chart.js/auto'
import financeiroService, {
  type FinanceiroDashboard,
  type FinanceiroEstoqueCategoria
} from '@/modules/financeiro/services/financeiro.service'

type TabKey = 'resumo' | 'pagamentos' | 'quartos' | 'estoque'
type ChartType = 'bar' | 'doughnut'

type ChartBoxProps = {
  type: ChartType
  labels: string[]
  values: number[]
  label: string
  currency?: boolean
}

type ChartPanelProps = {
  title: string
  labels: string[]
  values: number[]
  label: string
  currency?: boolean
  initialType?: ChartType
  action?: ReactNode
}

const MONTHS = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' }
]

const CHART_COLORS = ['#000000', '#3F3F46', '#71717A', '#A1A1AA', '#0C447C', '#3C3489', '#146C43', '#9A3412']

function toNumber(value: number | string | null | undefined): number {
  if (typeof value === 'number') return value
  if (!value) return 0
  return Number(value) || 0
}

function money(value: number | string | null | undefined): string {
  return toNumber(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function integer(value: number | string | null | undefined): string {
  return Math.round(toNumber(value)).toLocaleString('pt-BR')
}

function currentMonthFilter() {
  const now = new Date()
  return { mes: now.getMonth() + 1, ano: now.getFullYear() }
}

function ChartBox({ type, labels, values, label, currency = true }: ChartBoxProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const chart = new Chart(canvasRef.current, {
      type,
      data: {
        labels,
        datasets: [
          {
            label,
            data: values,
            backgroundColor: type === 'doughnut' ? CHART_COLORS : '#000000',
            borderColor: type === 'doughnut' ? '#ffffff' : '#000000',
            borderWidth: type === 'doughnut' ? 2 : 1,
            borderRadius: type === 'bar' ? 6 : 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
          legend: { display: type === 'doughnut', position: 'bottom' },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const raw = typeof ctx.raw === 'number' ? ctx.raw : Number(ctx.raw || 0)
                return `${ctx.dataset.label}: ${currency ? money(raw) : integer(raw)}`
              }
            }
          }
        },
        scales: type === 'bar'
          ? {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: (value) => currency ? money(Number(value)) : integer(Number(value))
                }
              }
            }
          : undefined
      }
    })

    return () => chart.destroy()
  }, [currency, label, labels, type, values])

  return (
    <div className="Financeiro-chart">
      <canvas ref={canvasRef} />
    </div>
  )
}

function ChartPanel({ title, labels, values, label, currency = true, initialType = 'bar', action }: ChartPanelProps) {
  const [chartType, setChartType] = useState<ChartType>(initialType)

  return (
    <section className="Financeiro-panel">
      <div className="Financeiro-panelHeader">
        <h2>{title}</h2>
        <div className="Financeiro-panelActions">
          {action}
          <div className="Financeiro-chartToggle" aria-label={`Visualização do gráfico ${title}`}>
            <button
              className={chartType === 'bar' ? 'active' : ''}
              type="button"
              onClick={() => setChartType('bar')}
            >
              Barra
            </button>
            <button
              className={chartType === 'doughnut' ? 'active' : ''}
              type="button"
              onClick={() => setChartType('doughnut')}
            >
              Pizza
            </button>
          </div>
        </div>
      </div>
      <ChartBox type={chartType} labels={labels} values={values} label={label} currency={currency} />
    </section>
  )
}

function SummaryCard({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'danger' | 'muted' }) {
  return (
    <div className={`Financeiro-card Financeiro-card--${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function PaymentsTab({ data }: { data: FinanceiroDashboard }) {
  const labels = data.pagamentos.map((item) => item.forma)
  const values = data.pagamentos.map((item) => toNumber(item.total))

  return (
    <div className="Financeiro-grid">
      <ChartPanel title="Pagamentos por forma" labels={labels} values={values} label="Total" initialType="doughnut" />
      <section className="Financeiro-panel">
        <h2>Detalhamento</h2>
        <SimpleTable
          headers={['Forma', 'Quantidade', 'Total']}
          rows={data.pagamentos.map((item) => [item.forma, integer(item.quantidade), money(item.total)])}
        />
      </section>
    </div>
  )
}

function RoomsTab({ data }: { data: FinanceiroDashboard }) {
  const [showRoomsModal, setShowRoomsModal] = useState(false)
  const [roomListMode, setRoomListMode] = useState<'quarto' | 'tipo'>('quarto')
  const topRooms = data.quartos.slice(0, 5)
  const roomsByReservations = [...data.quartos].sort((a, b) => toNumber(b.reservas) - toNumber(a.reservas))
  const roomTypesByReservations = [...data.tipos_quarto].sort((a, b) => toNumber(b.reservas) - toNumber(a.reservas))
  const roomListRows = roomListMode === 'quarto'
    ? roomsByReservations.map((item) => [item.numero, item.tipo, integer(item.reservas), money(item.total), money(item.media_reserva)])
    : roomTypesByReservations.map((item) => [item.tipo, integer(item.reservas), money(item.total), money(item.media_reserva)])

  return (
    <div className="Financeiro-stack">
      <div className="Financeiro-grid">
        <ChartPanel
          title="Total por quarto"
          labels={topRooms.map((item) => item.numero)}
          values={topRooms.map((item) => toNumber(item.total))}
          label="Total"
          action={(
            <button className="Financeiro-iconButton" type="button" title="Ver todos os quartos" onClick={() => setShowRoomsModal(true)}>
              <i className="fas fa-expand" />
            </button>
          )}
        />
        <ChartPanel title="Total por tipo" labels={data.tipos_quarto.map((item) => item.tipo)} values={data.tipos_quarto.map((item) => toNumber(item.total))} label="Total" />
      </div>
      <section className="Financeiro-panel">
        <div className="Financeiro-panelHeader">
          <h2>{roomListMode === 'quarto' ? 'Quartos' : 'Tipos de quarto'}</h2>
          <label className="Financeiro-inlineSelect">
            <span>Visualização</span>
            <select className="form-select" value={roomListMode} onChange={(event) => setRoomListMode(event.target.value as 'quarto' | 'tipo')}>
              <option value="quarto">Por quarto</option>
              <option value="tipo">Por tipo</option>
            </select>
          </label>
        </div>
        <SimpleTable
          headers={roomListMode === 'quarto' ? ['Quarto', 'Tipo', 'Reservas', 'Total', 'Média'] : ['Tipo', 'Reservas', 'Total', 'Média']}
          rows={roomListRows}
        />
      </section>

      {showRoomsModal ? (
        <>
          <div className="modal-backdrop fade show" />
          <div className="modal fade show d-block Financeiro-modal" tabIndex={-1} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-xl Financeiro-roomsModalDialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Todos os quartos</h5>
                  <button className="btn-close" type="button" aria-label="Fechar" onClick={() => setShowRoomsModal(false)} />
                </div>
                <div className="modal-body">
                  <SimpleTable
                    headers={['Quarto', 'Tipo', 'Reservas', 'Total', 'Média']}
                    rows={roomsByReservations.map((item) => [item.numero, item.tipo, integer(item.reservas), money(item.total), money(item.media_reserva)])}
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}

function StockTab({ data }: { data: FinanceiroDashboard }) {
  const categorias = data.estoque.por_categoria
  const labels = categorias.map((item) => item.categoria)
  const values = categorias.map((item) => toNumber(item.valor_saida))

  return (
    <div className="Financeiro-stack">
      <div className="Financeiro-cards">
        <SummaryCard label="Entradas" value={integer(data.estoque.geral.quantidade_entrada)} />
        <SummaryCard label="Saídas" value={integer(data.estoque.geral.quantidade_saida)} />
        <SummaryCard label="Valor de saídas" value={money(data.estoque.geral.valor_saida)} />
        <SummaryCard label="Movimentos" value={integer(data.estoque.geral.movimentos_entrada + data.estoque.geral.movimentos_saida)} />
      </div>
      <div className="Financeiro-grid">
        <ChartPanel title="Saídas por categoria" labels={labels} values={values} label="Valor" />
        <section className="Financeiro-panel">
          <h2>Categorias</h2>
          <StockCategoryTable rows={categorias} />
        </section>
      </div>
      <section className="Financeiro-panel">
        <h2>Itens mais consumidos</h2>
        <SimpleTable
          headers={['Item', 'Categoria', 'Quantidade', 'Valor']}
          rows={data.estoque.por_item.map((item) => [item.nome, item.categoria, integer(item.quantidade_saida), money(item.valor_saida)])}
        />
      </section>
    </div>
  )
}

function StockCategoryTable({ rows }: { rows: FinanceiroEstoqueCategoria[] }) {
  return (
    <SimpleTable
      headers={['Categoria', 'Entradas', 'Saídas', 'Valor saídas']}
      rows={rows.map((item) => [item.categoria, integer(item.quantidade_entrada), integer(item.quantidade_saida), money(item.valor_saida)])}
    />
  )
}

function SimpleTable({ headers, rows }: { headers: string[]; rows: Array<Array<string | number>> }) {
  return (
    <div className="Financeiro-tableWrap">
      <table className="Financeiro-table">
        <thead>
          <tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.length ? rows.map((row, index) => (
            <tr key={`${row.join('-')}-${index}`}>
              {row.map((cell, cellIndex) => <td key={`${headers[cellIndex]}-${cellIndex}`}>{cell}</td>)}
            </tr>
          )) : (
            <tr>
              <td colSpan={headers.length} className="Financeiro-empty">Nenhum dado encontrado.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

function SummaryTab({ data }: { data: FinanceiroDashboard }) {
  const chartLabels = ['Total recebido', 'Recebido no período', 'A prazo']
  const chartValues = [
    data.resumo.total_murika,
    data.resumo.total_sem_prazo,
    data.resumo.total_prazo
  ]

  return (
    <div className="Financeiro-grid">
      <ChartPanel title="Recebimentos" labels={chartLabels} values={chartValues} label="Total" />
      <section className="Financeiro-panel">
        <h2>Números absolutos</h2>
        <SimpleTable
          headers={['Indicador', 'Total']}
          rows={[
            ['Pagamentos lançados', integer(data.resumo.pagamentos)],
            ['Reservas pagas', integer(data.resumo.reservas_pagas)],
            ['Reservas abertas', integer(data.resumo.reservas_abertas)],
            ['Reservas fechadas', integer(data.resumo.reservas_fechadas)],
            ['Fechadas sem pagamento', integer(data.resumo.reservas_fechadas_sem_pagamento)],
            ['Reservas canceladas', integer(data.resumo.reservas_canceladas)]
          ]}
        />
      </section>
    </div>
  )
}

export default function FinanceiroAppView() {
  const initialFilter = useMemo(() => currentMonthFilter(), [])
  const [month, setMonth] = useState(initialFilter.mes)
  const [year, setYear] = useState(initialFilter.ano)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [activeTab, setActiveTab] = useState<TabKey>('resumo')
  const [data, setData] = useState<FinanceiroDashboard | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const loadDashboard = async (filter: { mes?: number; ano?: number; data_inicio?: string; data_fim?: string }) => {
    setIsLoading(true)
    setError('')
    try {
      const response = await financeiroService.dashboard(filter)
      setData(response)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Não foi possível carregar o financeiro.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadDashboard(initialFilter)
  }, [initialFilter])

  const handleMonthSearch = () => {
    setStartDate('')
    setEndDate('')
    void loadDashboard({ mes: month, ano: year })
  }

  const handleRangeSearch = () => {
    if (!startDate || !endDate) {
      setError('Informe a data inicial e final.')
      return
    }
    void loadDashboard({ data_inicio: startDate, data_fim: endDate })
  }

  const handleCurrentMonth = () => {
    const current = currentMonthFilter()
    setMonth(current.mes)
    setYear(current.ano)
    setStartDate('')
    setEndDate('')
    void loadDashboard(current)
  }

  const tabs: Array<{ key: TabKey; label: string }> = [
    { key: 'resumo', label: 'Resumo' },
    { key: 'pagamentos', label: 'Pagamentos' },
    { key: 'quartos', label: 'Quartos' },
    { key: 'estoque', label: 'Estoque' }
  ]

  return (
    <div className="Financeiro-view">
      <header className="Financeiro-header">
        <div>
          <h1>Financeiro</h1>
          <p>{data?.periodo.label || 'Carregando período'}</p>
        </div>
        <button className="btn btn-outline-secondary" type="button" onClick={handleCurrentMonth} disabled={isLoading}>
          Mês atual
        </button>
      </header>

      <section className="Financeiro-filter">
        <div className="Financeiro-filterGroup">
          <label>
            Mês
            <select className="form-select" value={month} onChange={(event) => setMonth(Number(event.target.value))}>
              {MONTHS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          <label>
            Ano
            <input className="form-control" type="number" value={year} onChange={(event) => setYear(Number(event.target.value))} />
          </label>
          <button className="btn btn-primary" type="button" onClick={handleMonthSearch} disabled={isLoading}>
            Buscar mês
          </button>
        </div>
        <div className="Financeiro-filterGroup">
          <label>
            Início
            <input className="form-control" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          </label>
          <label>
            Fim
            <input className="form-control" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
          </label>
          <button className="btn btn-outline-secondary" type="button" onClick={handleRangeSearch} disabled={isLoading}>
            Buscar intervalo
          </button>
        </div>
      </section>

      {error ? <div className="alert alert-danger">{error}</div> : null}

      {data ? (
        <>
          <section className="Financeiro-cards">
            <SummaryCard label="Receita total" value={money(data.resumo.total_murika)} />
            <SummaryCard label="Total sem a prazo" value={money(data.resumo.total_sem_prazo)} />
            <SummaryCard label="Total a prazo" value={money(data.resumo.total_prazo)} />
            <SummaryCard label="Fechadas sem pagamento" value={integer(data.resumo.reservas_fechadas_sem_pagamento)} tone={data.resumo.reservas_fechadas_sem_pagamento > 0 ? 'danger' : 'muted'} />
          </section>

          <nav className="Financeiro-tabs">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                className={activeTab === tab.key ? 'active' : ''}
                type="button"
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {isLoading ? <div className="Financeiro-loading">Atualizando dados...</div> : null}
          {activeTab === 'resumo' ? <SummaryTab data={data} /> : null}
          {activeTab === 'pagamentos' ? <PaymentsTab data={data} /> : null}
          {activeTab === 'quartos' ? <RoomsTab data={data} /> : null}
          {activeTab === 'estoque' ? <StockTab data={data} /> : null}
        </>
      ) : (
        <div className="Financeiro-emptyState">{isLoading ? 'Carregando financeiro...' : 'Nenhum dado carregado.'}</div>
      )}
    </div>
  )
}
