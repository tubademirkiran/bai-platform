import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BAI Platform',
  description: 'AI Business Analyst Assistant',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  )
}