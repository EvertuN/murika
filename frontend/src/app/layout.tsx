import './globals.css'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Murika | Gestão hoteleira',
  description: 'Sistema de gestão hoteleira para reservas, estoque e financeiro.',
  icons: {
    icon: [{ url: '/assets/image/icon.svg', type: 'image/svg+xml' }]
  }
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
