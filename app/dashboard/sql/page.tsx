'use client'

import { useState } from 'react'
import { useTheme } from '@/lib/theme-context'
import { Textarea } from '@/components/ui/textarea'
import { PageHeader } from '@/components/ui/page-header'
import { CopyButton } from '@/components/ui/copy-button'
import { Database } from 'lucide-react'

export default function SqlPage() {
  const { accent, colors, lang } = useTheme()
  const [query, setQuery] = useState('')
  const [sql, setSql] = useState('')
  const [explanation, setExplanation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Çoklu dil (i18n) sözlüğü eklendi
  const ui = {
    tr: {
      title: 'SQL Generator',
      desc: 'Doğal dille yaz, AI Oracle SQL sorgusuna çevirsin.',
      inputLabel: 'Ne sorgulamak istiyorsun?',
      placeholder: 'Örn: Son 1 ayda kayıt olan ve hiç sipariş vermeyen kullanıcıları getir...',
      generateBtn: 'SQL Üret',
      generatingBtn: 'AI üretiyor...',
      sqlOutput: 'Üretilen Oracle SQL',
      explanation: 'Açıklama',
      copyBtn: 'Kodu Kopyala',
      copiedBtn: 'Kopyalandı',
      errorGeneric: 'Bir hata oluştu',
      errorServer: 'Sunucu hatası oluştu.'
    },
    en: {
      title: 'SQL Generator',
      desc: 'Write in natural language, let AI convert it to an Oracle SQL query.',
      inputLabel: 'What do you want to query?',
      placeholder: 'E.g: Get users who registered in the last month but placed no orders...',
      generateBtn: 'Generate SQL',
      generatingBtn: 'AI generating...',
      sqlOutput: 'Generated Oracle SQL',
      explanation: 'Explanation',
      copyBtn: 'Copy Code',
      copiedBtn: 'Copied',
      errorGeneric: 'An error occurred',
      errorServer: 'Server error occurred.'
    },
    de: {
      title: 'SQL Generator',
      desc: 'Schreibe in natürlicher Sprache, KI wandelt es in eine Oracle SQL-Abfrage um.',
      inputLabel: 'Was möchten Sie abfragen?',
      placeholder: 'Z.B.: Holen Sie Benutzer, die sich im letzten Monat registriert haben...',
      generateBtn: 'SQL Generieren',
      generatingBtn: 'KI generiert...',
      sqlOutput: 'Generiertes Oracle SQL',
      explanation: 'Erklärung',
      copyBtn: 'Code kopieren',
      copiedBtn: 'Kopiert',
      errorGeneric: 'Ein Fehler ist aufgetreten',
      errorServer: 'Serverfehler aufgetreten.'
    }
  }

  const s = ui[lang as keyof typeof ui] || ui.tr

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
        body: JSON.stringify({ query, lang }), // lang parametresi AI'ın o dilde dönmesi için eklendi
      })
      const data = await response.json()

      if (response.ok) {
        setSql(data.sql)
        setExplanation(data.explanation)
      } else {
        setError(data.error || s.errorGeneric)
      }
    } catch (err) {
      console.error(err)
      setError(s.errorServer)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Görev (a): PageHeader düzeltildi ve Database ikonu eklendi */}
      <PageHeader 
        title={s.title} 
        description={s.desc} 
        icon={Database} 
      />

      <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: colors.textMuted, marginBottom: '10px' }}>{s.inputLabel}</div>
        <Textarea
          placeholder={s.placeholder}
          style={{ minHeight: '120px', background: colors.bg, color: colors.text, borderColor: colors.border }}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          onClick={handleGenerate}
          disabled={loading || !query.trim()}
          style={{ marginTop: '12px', width: '100%', padding: '10px', borderRadius: '8px', border: 'none', background: !query.trim() ? colors.border : accent, color: '#fff', fontWeight: 600, fontSize: '13px', cursor: loading || !query.trim() ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? s.generatingBtn : s.generateBtn}
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
                <div style={{ fontSize: '12px', fontWeight: 600, color: colors.textMuted }}>{s.sqlOutput}</div>
                <CopyButton getText={() => sql} label={s.copyBtn} copiedLabel={s.copiedBtn} />
              </div>
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: '13px', color: colors.text, lineHeight: '1.7', background: colors.bg, padding: '16px', borderRadius: '8px', margin: 0, fontFamily: 'monospace' }}>
                {sql}
              </pre>
            </div>
          )}

          {explanation && (
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: colors.textMuted, marginBottom: '8px' }}>{s.explanation}</div>
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