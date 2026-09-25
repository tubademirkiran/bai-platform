'use client'

import { useEffect } from 'react'
import { useTheme } from '@/lib/theme-context'
import { AlertTriangle, RotateCw } from 'lucide-react'

/**
 * Dashboard geneli hata sınırı (Next.js App Router).
 *
 * NEDEN: Route'lar geçerli JSON döndürse bile model bazen beklenen şekli
 * üretmiyor (ör. `result.personas` dizi yerine undefined). O durumda sayfa
 * render sırasında patlıyor ve kullanıcı bomboş ekran görüyordu. Burası o
 * çöküşü yakalayıp anlaşılır bir mesaj ve "tekrar dene" düğmesi gösterir.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const { colors, accent } = useTheme()

  useEffect(() => {
    console.error('Dashboard render hatası:', error)
  }, [error])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '14px',
        minHeight: '60vh',
        textAlign: 'center',
        padding: '24px',
      }}
    >
      <AlertTriangle size={40} color="#ef4444" />
      <div style={{ fontSize: '16px', fontWeight: 700, color: colors.text }}>
        Bu sayfa beklenmeyen bir yanıt aldı
      </div>
      <div style={{ fontSize: '13px', color: colors.textMuted, maxWidth: '460px', lineHeight: 1.6 }}>
        Yapay zeka çıktısı beklenen biçimde olmadığı için ekran çizilemedi. Tekrar denediğinizde
        genellikle düzelir.
      </div>
      <button
        onClick={reset}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          marginTop: '4px',
          padding: '10px 18px',
          borderRadius: '8px',
          border: 'none',
          background: accent,
          color: '#fff',
          fontWeight: 700,
          fontSize: '13px',
          cursor: 'pointer',
        }}
      >
        <RotateCw size={14} /> Tekrar Dene
      </button>
    </div>
  )
}
