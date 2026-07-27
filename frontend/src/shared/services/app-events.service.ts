export type SectionChangedDetail = {
  sectionId: string
}

export type EntityUpdatedDetail = {
  endpoint?: string
}

type Listener<TDetail> = (detail: TDetail) => void

function createEventChannel<TDetail>() {
  const listeners = new Set<Listener<TDetail>>()

  function emit(detail: TDetail): void {
    listeners.forEach((listener) => {
      listener(detail)
    })
  }

  function on(listener: Listener<TDetail>): () => void {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }

  return { emit, on }
}

const sectionChangedChannel = createEventChannel<SectionChangedDetail>()
const entityUpdatedChannel = createEventChannel<EntityUpdatedDetail>()

export function emitSectionChanged(detail: SectionChangedDetail): void {
  sectionChangedChannel.emit(detail)
}

export function onSectionChanged(listener: Listener<SectionChangedDetail>): () => void {
  return sectionChangedChannel.on(listener)
}

export function emitEntityUpdated(detail: EntityUpdatedDetail): void {
  entityUpdatedChannel.emit(detail)
}

export function onEntityUpdated(listener: Listener<EntityUpdatedDetail>): () => void {
  return entityUpdatedChannel.on(listener)
}
