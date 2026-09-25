'use client'

import { useTheme } from '@/lib/theme-context'
import { AlertTriangle, RotateCw } from 'lucide-react'

/**
 * AI çağrısı başarısız olduğunda kullanıcıya görünür tek tip hata kutusu.
 *
 * NEDEN: Sayfalar eskiden `data.result`'ı doğrudan state'e yazıyordu; istek
 * 401/429/502 dönünce `result` undefined oluyor, loading kapanıyor ve sayfa
 * sessizce başlangıç haline dönüyordu. Kullanıcı "hiçbir yanıt gelmedi" diye
 * görüyordu. Artık her sayfa hatayı bu bileşenle gösteriyor.
 */
export function ErrorBanner({
  message,
  onRetry,
  retryLabel,
}: {
  message: string
  onRetry?: () => void
  retryLabel?: string
}) {
  const { colors, lang } = useTheme()

  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        background: '#ef444415',
        border: '1px solid #ef444455',
        borderRadius: '10px',
        padding: '12px 14px',
        marginBottom: '16px',
        fontSize: '13px',
        color: colors.text,
      }}
    >
      <AlertTriangle size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: '1px' }} />
      <div style={{ flex: 1, lineHeight: 1.5 }}>{message}</div>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 10px',
            borderRadius: '8px',
            border: '1px solid #ef444466',
            background: 'transparent',
            color: '#ef4444',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <RotateCw size={12} /> {retryLabel || (lang === 'tr' ? 'Tekrar Dene' : 'Retry')}
        </button>
      )}
    </div>
  )
}
