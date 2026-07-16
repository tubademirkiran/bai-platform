'use client'

import { useTheme } from '@/lib/theme-context'

/**
 * Modül sayfaları için ortak başlık. Önceden her sayfada elle tekrarlanıyordu.
 */
export function PageHeader({ title, badge, desc }: { title: string; badge?: string; desc?: string }) {
  const { accent, colors } = useTheme()
  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: colors.text, margin: 0, letterSpacing: '-0.02em' }}>{title}</h2>
        {badge && (
          <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', background: accent + '22', color: accent }}>{badge}</span>
        )}
      </div>
      {desc && <p style={{ fontSize: '13px', color: colors.textMuted, margin: 0 }}>{desc}</p>}
    </div>
  )
}
