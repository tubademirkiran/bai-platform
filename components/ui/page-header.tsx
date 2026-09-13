'use client'

import { useTheme } from '@/lib/theme-context'
import type { LucideIcon } from 'lucide-react'

/**
 * Modül sayfaları için ortak başlık. Önceden her sayfada elle tekrarlanıyordu.
 */
export function PageHeader({ title, badge, desc, description, icon: Icon }: { title: string; badge?: string; desc?: string; description?: string; icon?: LucideIcon }) {
  const { accent, colors } = useTheme()
  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
        {Icon && <Icon size={22} color={accent} aria-hidden="true" />}
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: colors.text, margin: 0, letterSpacing: '-0.02em' }}>{title}</h2>
        {badge && (
          <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', background: accent + '22', color: accent }}>{badge}</span>
        )}
      </div>
      {(desc || description) && <p style={{ fontSize: '13px', color: colors.textMuted, margin: 0 }}>{desc || description}</p>}
    </div>
  )
}
