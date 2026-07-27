'use client'

type BasePaginationProps = {
  page: number
  totalPages: number
  disabled?: boolean
  onChangePage: (page: number) => void
}

export default function BasePagination({
  page,
  totalPages,
  disabled = false,
  onChangePage
}: BasePaginationProps) {
  if (totalPages <= 1) return null

  const total = Math.max(1, totalPages || 1)
  const current = Math.min(Math.max(1, page || 1), total)
  const start = Math.max(1, current - 2)
  const end = Math.min(total, start + 4)
  const realStart = Math.max(1, end - 4)
  const visiblePages: number[] = []

  for (let p = realStart; p <= end; p += 1) {
    visiblePages.push(p)
  }

  const goTo = (nextPage: number) => {
    if (disabled || nextPage < 1 || nextPage > totalPages || nextPage === page) return
    onChangePage(nextPage)
  }

  return (
    <div className="d-flex justify-content-center align-items-center gap-1 flex-wrap">
      <button className="btn btn-sm btn-outline-secondary" disabled={disabled || page <= 1} onClick={() => goTo(page - 1)}>
        Anterior
      </button>
      {visiblePages.map((p) => (
        <button
          key={p}
          className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-outline-secondary'}`}
          disabled={disabled}
          onClick={() => goTo(p)}
        >
          {p}
        </button>
      ))}
      <button className="btn btn-sm btn-outline-secondary" disabled={disabled || page >= totalPages} onClick={() => goTo(page + 1)}>
        Proxima
      </button>
    </div>
  )
}
