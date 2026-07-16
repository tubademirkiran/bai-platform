'use client'

import { useState } from 'react'
import { useTheme } from '@/lib/theme-context'
import { Textarea } from '@/components/ui/textarea'
import { PageHeader } from '@/components/ui/page-header'
import { CopyButton } from '@/components/ui/copy-button'

export default function SqlPage() {
  const { accent, colors } = useTheme()
  const [query, setQuery] = useState('')
  const [sql, setSql] = useState('')
  const [explanation, setExplanation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate() {
    if (!query.trim() || loading) return
    setLoading(true)
    setSql('')
    setExplanation('')
    setError(null)

    try {
      const response = await fetch('/api/sql/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })
      const data = await response.json()

      if (response.ok) {
        setSql(data.sql)
        setExplanation(data.explanation)
      } else {
        setError(data.error || 'Bir hata oluştu')
      }
    } catch (err) {
      console.error(err)
      setError('Sunucu hatası oluştu.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader title="SQL Generator" badge="Oracle" desc="Doğal dille yaz, AI Oracle SQL sorgusuna çevirsin." />

      <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: colors.textMuted, marginBottom: '10px' }}>Ne sorgulamak istiyorsun?</div>
        <Textarea
          placeholder="Sorgu yazın..."
          style={{ minHeight: '120px', background: colors.bg, color: colors.text, borderColor: colors.border }}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          onClick={handleGenerate}
          disabled={loading || !query.trim()}
          style={{ marginTop: '12px', width: '100%', padding: '10px', borderRadius: '8px', border: 'none', background: !query.trim() ? colors.border : accent, color: '#fff', fontWeight: 600, fontSize: '13px', cursor: loading || !query.trim() ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'AI üretiyor...' : 'SQL Üret'}
        </button>
      </div>

      {error && (
        <div style={{ background: '#ef444415', border: '1px solid #ef444455', color: '#ef4444', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', fontSize: '13px' }}>
          {error}
        </div>
      )}

      {(sql || explanation) && (
        <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>

          {sql && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', gap: '8px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: colors.textMuted }}>Üretilen Oracle SQL</div>
                <CopyButton getText={() => sql} label="Kodu Kopyala" />
              </div>
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: '13px', color: colors.text, lineHeight: '1.7', background: colors.bg, padding: '16px', borderRadius: '8px', margin: 0, fontFamily: 'monospace' }}>
                {sql}
              </pre>
            </div>
          )}

          {explanation && (
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: colors.textMuted, marginBottom: '8px' }}>Açıklama</div>
              <div style={{ fontSize: '13px', color: colors.text, lineHeight: '1.6', background: colors.bg, padding: '16px', borderRadius: '8px' }}>
                {explanation}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  )
}
