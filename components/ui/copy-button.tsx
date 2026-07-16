'use client'

import { useState } from 'react'
import { useTheme } from '@/lib/theme-context'
import { Copy, Check } from 'lucide-react'

/**
 * Kopyala butonu — panoya yazar ve 2 sn "Kopyalandı" geri bildirimi gösterir.
 * Önceden ~13 sayfada elle tekrarlanıyordu.
 */
export function CopyButton({
  getText,
  label = 'Kopyala',
  copiedLabel = 'Kopyalandı',
}: {
  getText: () => string
  label?: string
  copiedLabel?: string
}) {
  const { colors } = useTheme()
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    const text = getText()
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* pano erişimi yoksa sessizce geç */
    }
  }

  return (
    <button
      onClick={handleCopy}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: '7px 12px', borderRadius: '8px',
        border: `1px solid ${copied ? '#10b981' : colors.border}`,
        background: colors.card, color: copied ? '#10b981' : colors.text,
        fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
      }}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? copiedLabel : label}
    </button>
  )
}
