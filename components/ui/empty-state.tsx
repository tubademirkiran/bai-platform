'use client'

import { ReactNode } from 'react'
import { useTheme } from '@/lib/theme-context'

/**
 * Çıktı alanı için boş/yükleniyor durumu kutusu.
 * jira/persona vb. sayfalardaki tekrarlı placeholder'ları ortaklaştırır.
 */
export function EmptyState({
  icon,
  text,
  minHeight = 300,
  dashed = true,
}: {
  icon: ReactNode
  text: string
  minHeight?: number
  dashed?: boolean
}) {
  const { colors } = useTheme()
  return (
    <div
      style={{
        background: colors.card,
        border: `1px ${dashed ? 'dashed' : 'solid'} ${colors.border}`,
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: `${minHeight}px`,
        gap: '16px',
        padding: '40px',
        textAlign: 'center',
      }}
    >
      <div style={{ color: colors.textMuted, opacity: 0.5 }}>{icon}</div>
      <div style={{ color: colors.textMuted, fontSize: '14px', fontWeight: 600, maxWidth: '360px' }}>{text}</div>
    </div>
  )
}
