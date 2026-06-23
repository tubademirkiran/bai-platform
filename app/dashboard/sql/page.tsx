'use client'

import { useState } from 'react'
import { useTheme } from '@/lib/theme-context'
import { Textarea } from '@/components/ui/textarea'

export default function SqlPage() {
  const { accent, colors } = useTheme()
  const [query, setQuery] = useState('')
  
  // Eski tek parça 'result' yerine iki yeni state ekledik
  const [sql, setSql] = useState('')
  const [explanation, setExplanation] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false) // Kopyalandı efektini yönetmek için

  async function handleGenerate() {
    if (!query.trim()) return
    setLoading(true)
    setSql('')
    setExplanation('')
    setCopied(false)

    try {
      const response = await fetch('/api/sql/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })
      const data = await response.json()

      if (response.ok) {
        // Backend'den gelen yeni anahtarları state'e yazıyoruz
        setSql(data.sql)
        setExplanation(data.explanation)
      } else {
        alert(data.error || 'Bir hata oluştu')
      }
    } catch (error) {
      console.error(error)
      alert('Sunucu hatası oluştu.')
    } finally {
      setLoading(false)
    }
  }

  // SQL Kodunu panoya kopyalayan fonksiyon
  const handleCopy = () => {
    if (!sql) return
    navigator.clipboard.writeText(sql)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000) // 2 saniye sonra yazıyı eski haline getir
  }

  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: '800', color: colors.text, marginBottom: '4px' }}>SQL Generator</h2>
      <p style={{ fontSize: '13px', color: colors.textMuted, marginBottom: '24px' }}>Doğal dille yaz, AI Oracle SQL sorgusuna çevirsin.</p>

      <div style={{ background: colors.card, border: `0.5px solid ${colors.border}`, borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
        <div style={{ fontSize: '12px', fontWeight: '600', color: colors.textMuted, marginBottom: '10px' }}>Ne sorgulamak istiyorsun?</div>
        <Textarea
          placeholder="Sorgu yazin..."
          style={{ minHeight: '120px', background: colors.bg, color: colors.text, borderColor: colors.border }}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          onClick={handleGenerate}
          disabled={loading}
          style={{ marginTop: '12px', width: '100%', padding: '10px', borderRadius: '8px', border: 'none', background: accent, color: '#fff', fontWeight: '600', fontSize: '13px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'AI uretiyor...' : 'SQL Uret'}
        </button>
      </div>

      {/* SQL veya Açıklama varsa bu alanı göster */}
      {(sql || explanation) && (
        <div style={{ background: colors.card, border: `0.5px solid ${colors.border}`, borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* 1. Üretilen SQL Alanı */}
          {sql && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: colors.textMuted }}>Uretilen Oracle SQL</div>
                <button 
                  onClick={handleCopy}
                  style={{ background: 'transparent', border: 'none', color: accent, fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}
                >
                  {copied ? 'Kopyalandı! ✓' : 'Kodu Kopyala'}
                </button>
              </div>
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: '13px', color: colors.text, lineHeight: '1.7', background: colors.bg, padding: '16px', borderRadius: '8px', margin: 0, fontFamily: 'monospace' }}>
                {sql}
              </pre>
            </div>
          )}

          {/* 2. Açıklama Alanı */}
          {explanation && (
            <div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: colors.textMuted, marginBottom: '8px' }}>Açıklama</div>
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