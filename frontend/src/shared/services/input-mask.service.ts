import { onEntityUpdated, onSectionChanged } from './app-events.service'

type MaskedInputElement = HTMLInputElement & {
  __murikaMaskInternal?: boolean
}

type MaskFormatter = (value: string) => string

const inputMaskListeners = new WeakMap<HTMLInputElement, EventListener>()
const cpfMaskListeners = new WeakMap<HTMLInputElement, EventListener>()
const docTypeSelectListeners = new WeakMap<HTMLSelectElement, EventListener>()

let initialized = false

function onlyDigits(value: string): string {
  return String(value || '').replace(/\D+/g, '')
}

function formatMoney(value: string): string {
  const digits = onlyDigits(value)
  if (!digits) return ''

  const cents = digits.padStart(3, '0')
  const integerRaw = cents.slice(0, -2).replace(/^0+(?=\d)/, '')
  const integer = integerRaw || '0'
  const decimal = cents.slice(-2)

  return `${integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${decimal}`
}

function formatPhone(value: string): string {
  const digits = onlyDigits(value).slice(0, 11)
  if (!digits) return ''
  if (digits.length <= 2) return `(${digits}`

  const ddd = digits.slice(0, 2)
  const rest = digits.slice(2)

  if (rest.length <= 4) {
    return `(${ddd}) ${rest}`
  }

  if (rest.length <= 8) {
    return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`
  }

  return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`
}

function formatCnpj(value: string): string {
  const digits = onlyDigits(value).slice(0, 14)
  if (!digits) return ''

  if (digits.length <= 2) return digits
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`
  if (digits.length <= 12) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`
  }
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`
}

function formatCpf(value: string): string {
  const digits = onlyDigits(value).slice(0, 11)
  if (!digits) return ''

  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

function syncInputValue(input: MaskedInputElement, nextValue: string): void {
  if (input.value === nextValue) return

  input.value = nextValue
  input.__murikaMaskInternal = true
  input.dispatchEvent(new Event('input', { bubbles: true }))
  input.__murikaMaskInternal = false
}

function bindInputMask(input: HTMLInputElement, formatter: MaskFormatter): void {
  if (inputMaskListeners.has(input)) return

  const listener: EventListener = () => {
    const target = input as MaskedInputElement
    if (target.__murikaMaskInternal) return
    syncInputValue(target, formatter(target.value))
  }

  input.addEventListener('input', listener)
  inputMaskListeners.set(input, listener)
  syncInputValue(input as MaskedInputElement, formatter(input.value))
}

function bindInputsBySelector(selector: string, formatter: MaskFormatter): void {
  document.querySelectorAll<HTMLInputElement>(selector).forEach((input) => {
    bindInputMask(input, formatter)
  })
}

function unbindCpfMask(input: HTMLInputElement): void {
  const listener = cpfMaskListeners.get(input)
  if (!listener) return

  input.removeEventListener('input', listener)
  cpfMaskListeners.delete(input)
}

function bindCpfMask(input: HTMLInputElement): void {
  if (cpfMaskListeners.has(input)) return

  const listener: EventListener = () => {
    const target = input as MaskedInputElement
    if (target.__murikaMaskInternal) return
    syncInputValue(target, formatCpf(target.value))
  }

  input.addEventListener('input', listener)
  cpfMaskListeners.set(input, listener)
  syncInputValue(input as MaskedInputElement, formatCpf(input.value))
}

function syncCpfMask(select: HTMLSelectElement): void {
  const row = select.closest('.row')
  if (!row) return

  const targetInput = row.querySelector<HTMLInputElement>('input[name="documento"]')
  if (!targetInput) return

  if (select.value === 'CPF') {
    bindCpfMask(targetInput)
    return
  }

  unbindCpfMask(targetInput)
}

function bindCpfSelect(select: HTMLSelectElement): void {
  if (!docTypeSelectListeners.has(select)) {
    const listener: EventListener = () => {
      syncCpfMask(select)
    }

    select.addEventListener('change', listener)
    docTypeSelectListeners.set(select, listener)
  }

  syncCpfMask(select)
}

function bindCpfDocMasks(): void {
  const cadastroSelect = document.getElementById('tipoDocCliente')
  if (cadastroSelect instanceof HTMLSelectElement) {
    bindCpfSelect(cadastroSelect)
  }

  const edicaoSelect = document.getElementById('editTipoDocCliente')
  if (edicaoSelect instanceof HTMLSelectElement) {
    bindCpfSelect(edicaoSelect)
  }
}

export function refreshInputMasks(): void {
  bindInputsBySelector('input.money', formatMoney)
  bindInputsBySelector('input.phone-mask', formatPhone)
  bindInputsBySelector('input.cnpj', formatCnpj)
  bindCpfDocMasks()
}

export function initInputMaskService(): void {
  if (initialized) return
  initialized = true

  const scheduleRefresh = () => {
    window.requestAnimationFrame(() => {
      refreshInputMasks()
    })
  }

  onEntityUpdated(() => {
    scheduleRefresh()
  })
  onSectionChanged(() => {
    scheduleRefresh()
  })

  scheduleRefresh()
}
