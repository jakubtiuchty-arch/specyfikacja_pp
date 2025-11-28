import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Analizator Specyfikacji Terminali',
  description: 'Automatyczna analiza zgodności terminali mobilnych z wymaganiami przetargowymi',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pl">
      <body className="font-sans">{children}</body>
    </html>
  )
}
