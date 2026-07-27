type HeaderCell = {
  text: string
}

type TableCardRecord = {
  container: HTMLElement
  table: HTMLTableElement
  mobileView: HTMLDivElement
}

class TableToCardsManager {
  private readonly records = new Map<HTMLTableElement, TableCardRecord>()
  private mutationObserver: MutationObserver | null = null

  public init(): void {
    this.convertAllTables()
    this.observeDomMutations()
  }

  public updateTable(tableElement: HTMLTableElement): void {
    const record = this.records.get(tableElement)
    if (record) {
      this.updateCards(record.table, record.mobileView)
      return
    }

    const container = tableElement.closest<HTMLElement>('.table-responsive')
    if (!container || container.dataset.noAutoConvert === 'true') return

    const nextSibling = container.nextElementSibling
    const mobileView =
      nextSibling instanceof HTMLDivElement && nextSibling.classList.contains('mobile-card-view')
        ? nextSibling
        : this.createMobileView(container)

    container.dataset.converted = 'true'
    this.records.set(tableElement, { container, table: tableElement, mobileView })
    this.updateCards(tableElement, mobileView)
  }

  public updateAllTables(): void {
    this.records.forEach(({ table, mobileView }) => {
      this.updateCards(table, mobileView)
    })
  }

  private convertAllTables(): void {
    const containers = document.querySelectorAll<HTMLElement>('.table-responsive')
    containers.forEach((container) => {
      this.convertContainer(container)
    })
  }

  private convertContainer(container: HTMLElement): void {
    if (container.dataset.noAutoConvert === 'true') return

    const table = container.querySelector('table')
    if (!(table instanceof HTMLTableElement)) return

    const existingRecord = this.records.get(table)
    if (existingRecord) {
      this.updateCards(existingRecord.table, existingRecord.mobileView)
      return
    }

    const nextSibling = container.nextElementSibling
    const mobileView =
      nextSibling instanceof HTMLDivElement && nextSibling.classList.contains('mobile-card-view')
        ? nextSibling
        : this.createMobileView(container)

    container.dataset.converted = 'true'
    this.records.set(table, { container, table, mobileView })
    this.updateCards(table, mobileView)
  }

  private createMobileView(container: HTMLElement): HTMLDivElement {
    const mobileView = document.createElement('div')
    mobileView.className = 'mobile-card-view'
    container.parentNode?.insertBefore(mobileView, container.nextSibling)
    return mobileView
  }

  private updateCards(table: HTMLTableElement, mobileView: HTMLDivElement): void {
    const tbody = table.querySelector('tbody')
    const thead = table.querySelector('thead')
    if (!(tbody instanceof HTMLTableSectionElement) || !(thead instanceof HTMLTableSectionElement)) {
      return
    }

    mobileView.innerHTML = ''

    const headers: HeaderCell[] = Array.from(thead.querySelectorAll('th')).map((th) => ({
      text: (th.textContent || '').trim()
    }))

    const rows = Array.from(tbody.querySelectorAll('tr'))
    if (!rows.length) {
      mobileView.innerHTML = `
        <div class="mobile-card-empty">
          <i class="fas fa-inbox"></i>
          <p>Nenhum registro encontrado</p>
        </div>
      `
      return
    }

    const headerDiv = document.createElement('div')
    headerDiv.className = 'mobile-cards-header'
    headerDiv.innerHTML = `
      <div class="mobile-cards-count">
        <strong>${rows.length}</strong> ${rows.length === 1 ? 'registro' : 'registros'}
      </div>
    `
    mobileView.appendChild(headerDiv)

    rows.forEach((row, index) => {
      const cells = Array.from(row.querySelectorAll('td'))
      const card = this.createCard(headers, cells, index)
      mobileView.appendChild(card)
    })
  }

  private createCard(headers: HeaderCell[], cells: HTMLTableCellElement[], index: number): HTMLDivElement {
    const card = document.createElement('div')
    card.className = 'mobile-card'

    let cardHtml = ''
    let titleValue = ''
    let idValue = ''
    let actionsHtml = ''
    const rows: Array<{ label: string; value: string }> = []

    cells.forEach((cell, cellIndex) => {
      const header = headers[cellIndex]
      if (!header) return

      const cellContent = cell.innerHTML.trim()
      const cellText = (cell.textContent || '').trim()

      const isLastCell = cellIndex === cells.length - 1
      const containsAction = cellContent.includes('btn') || cellContent.includes('button')
      if (isLastCell && containsAction) {
        actionsHtml = cellContent
        return
      }

      const headerText = header.text.toLowerCase()
      if (cellIndex === 0 || headerText.includes('id')) {
        idValue = cellText
        return
      }

      if (cellIndex === 1 || headerText.includes('nome') || headerText.includes('item')) {
        titleValue = cellText
      }

      if (cellText && cellText !== '-') {
        rows.push({ label: header.text, value: cellContent })
      }
    })

    cardHtml += '<div class="mobile-card-header">'
    if (titleValue) {
      cardHtml += `<div class="mobile-card-title">${titleValue}</div>`
    }
    if (idValue) {
      cardHtml += `<div class="mobile-card-id">#${idValue}</div>`
    }
    cardHtml += '</div>'

    if (rows.length) {
      cardHtml += '<div class="mobile-card-body">'
      rows.forEach((row) => {
        cardHtml += `
          <div class="mobile-card-row">
            <div class="mobile-card-label">${row.label}</div>
            <div class="mobile-card-value">${row.value}</div>
          </div>
        `
      })
      cardHtml += '</div>'
    }

    if (actionsHtml) {
      cardHtml += `<div class="mobile-card-footer">${actionsHtml}</div>`
    }

    card.innerHTML = cardHtml
    card.style.animationDelay = `${index * 0.05}s`
    return card
  }

  private observeDomMutations(): void {
    if (this.mutationObserver) return

    this.mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            this.handleAddedNode(node)
          })
        }

        if (mutation.target instanceof HTMLTableSectionElement && mutation.target.tagName === 'TBODY') {
          const table = mutation.target.closest('table')
          if (table instanceof HTMLTableElement) {
            this.updateTable(table)
          }
        }
      })
    })

    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    })
  }

  private handleAddedNode(node: Node): void {
    if (!(node instanceof HTMLElement)) return

    if (node.classList.contains('table-responsive')) {
      this.convertContainer(node)
    }

    node.querySelectorAll<HTMLElement>('.table-responsive').forEach((container) => {
      this.convertContainer(container)
    })
  }
}

let tableToCardsInstance: TableToCardsManager | null = null

export function initTableToCards(): TableToCardsManager {
  if (tableToCardsInstance) return tableToCardsInstance

  tableToCardsInstance = new TableToCardsManager()
  tableToCardsInstance.init()
  window.TableToCards = tableToCardsInstance

  return tableToCardsInstance
}
