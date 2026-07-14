'use client'

import { useState } from 'react'
import { useTheme } from '@/lib/theme-context'
import { Textarea } from '@/components/ui/textarea'
import { useGenerate } from '@/lib/use-generate'
// Not: Geçmişe kayıt artık API route'unda (server tarafında) yapılıyor — çift kayıt olmaması için client'tan kaldırıldı.
// 🌟 YENİ EKKLENEN IMPORTLAR
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const templatesByLang = {
  tr: [
    { label: 'Login Modulu', text: 'Kullanici email ve sifre ile sisteme giris yapabilmeli.' },
    { label: 'Odeme Sistemi', text: 'Kullanici kredi karti ile odeme yapabilmeli. 3D secure desteklenmeli.' },
    { label: 'Bildirim', text: 'Sistem kullaniciya email ve push notification gonderebilmeli.' },
    { label: 'Rapor', text: 'Kullanici tarih araligina gore satis raporlarini PDF olarak indirebilmeli.' },
  ],
  en: [
    { label: 'Login Module', text: 'Users should be able to log in with email and password.' },
    { label: 'Payment System', text: 'Users should be able to pay with credit card. 3D secure must be supported.' },
    { label: 'Notifications', text: 'System should send email and push notifications to users.' },
    { label: 'Reports', text: 'Users should be able to download sales reports as PDF by date range.' },
  ],
  de: [
    { label: 'Login Modul', text: 'Benutzer sollen sich mit E-Mail und Passwort anmelden können.' },
    { label: 'Zahlungssystem', text: 'Benutzer sollen mit Kreditkarte zahlen können. 3D Secure muss unterstützt werden.' },
    { label: 'Benachrichtigungen', text: 'Das System soll E-Mail und Push-Benachrichtigungen senden.' },
    { label: 'Berichte', text: 'Benutzer sollen Verkaufsberichte als PDF herunterladen können.' },
  ],
}

export default function RequirementPage() {
  const { accent, colors, t, lang } = useTheme()
  const [idea, setIdea] = useState('')
  const { text: result, loading, error, run } = useGenerate('/api/requirement/generate')
  const [copied, setCopied] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)

  const templates = templatesByLang[lang] || templatesByLang.tr

  async function handleGenerate() {
    if (!idea.trim()) return
    await run({ idea, lang })
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleDownload() {
    const blob = new Blob([result], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'requirement.txt'
    a.click()
  }

  const btnStyle = {
    padding: '7px 14px',
    borderRadius: '8px',
    border: `0.5px solid ${colors.border}`,
    background: colors.card,
    color: colors.text,
    fontSize: '12px',
    fontWeight: '600' as const,
    cursor: 'pointer',
  }

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '800', color: colors.text, marginBottom: '4px' }}>{t.reqTitle}</h2>
        <p style={{ fontSize: '13px', color: colors.textMuted }}>{t.reqDesc}</p>
      </div>

      <div style={{ background: colors.card, border: `0.5px solid ${colors.border}`, borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: colors.textMuted }}>{t.reqInput}</div>
          <button onClick={() => setShowTemplates(!showTemplates)} style={{ ...btnStyle, fontSize: '11px', color: accent, border: `0.5px solid ${accent}44` }}>
            📚 {t.templates}
          </button>
        </div>

        {showTemplates && (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
            {templates.map(tmpl => (
              <button key={tmpl.label} onClick={() => { setIdea(tmpl.text); setShowTemplates(false) }} style={btnStyle}>
                {tmpl.label}
              </button>
            ))}
          </div>
        )}

        <Textarea
          placeholder={t.reqPlaceholder}
          style={{ minHeight: '120px', background: colors.bg, color: colors.text, borderColor: colors.border }}
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
        />
        <button onClick={handleGenerate} disabled={loading} style={{ marginTop: '12px', width: '100%', padding: '10px', borderRadius: '8px', border: 'none', background: accent, color: '#fff', fontWeight: '600', fontSize: '13px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
          {loading ? t.reqLoading : t.reqBtn}
        </button>
      </div>

      {error && (
        <div style={{ background: '#ef444415', border: '1px solid #ef444455', color: '#ef4444', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', fontSize: '13px' }}>
          {error}
        </div>
      )}

      {result && (
        <div style={{ background: colors.card, border: `0.5px solid ${colors.border}`, borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: colors.textMuted }}>{t.reqOutput}</div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={handleCopy} style={btnStyle}>{copied ? `✅ ${t.copied}` : `📋 ${t.copy}`}</button>
              <button onClick={handleDownload} style={btnStyle}>📄 {t.download}</button>
            </div>
          </div>
          
          {/* 🌟 ESKİ <pre> ALANI YERİNE GEÇEN DİNAMİK MARKDOWN RENDERER */}
          <div style={{ fontSize: '13px', color: colors.text, lineHeight: '1.7' }}>
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                table: ({ ...props }) => <div style={{ overflowX: 'auto', marginBottom: '16px' }}><table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '8px' }} {...props} /></div>,
                thead: ({ ...props }) => <thead style={{ backgroundColor: colors.bg }} {...props} />,
                th: ({ ...props }) => <th style={{ border: `0.5px solid ${colors.border}`, padding: '8px 12px', fontWeight: '700', textAlign: 'left', fontSize: '12px', color: colors.textMuted }} {...props} />,
                td: ({ ...props }) => <td style={{ border: `0.5px solid ${colors.border}`, padding: '8px 12px', fontSize: '12px' }} {...props} />,
                h1: ({ ...props }) => <h1 style={{ fontSize: '18px', fontWeight: '800', marginTop: '20px', marginBottom: '10px', color: accent }} {...props} />,
                h2: ({ ...props }) => <h2 style={{ fontSize: '14px', fontWeight: '700', marginTop: '16px', marginBottom: '8px', color: colors.text, borderBottom: `0.5px solid ${colors.border}`, paddingBottom: '4px' }} {...props} />,
                h3: ({ ...props }) => <h3 style={{ fontSize: '13px', fontWeight: '700', marginTop: '12px', marginBottom: '4px', color: accent }} {...props} />,
                p: ({ ...props }) => <p style={{ marginBottom: '10px', color: colors.text }} {...props} />,
                ul: ({ ...props }) => <ul style={{ paddingLeft: '20px', marginBottom: '12px', listStyleType: 'disc' }} {...props} />,
                li: ({ ...props }) => <li style={{ marginBottom: '4px' }} {...props} />,
                strong: ({ ...props }) => <strong style={{ fontWeight: '700', color: accent }} {...props} />
              }}
            >
              {result}
            </ReactMarkdown>
          </div>

        </div>
      )}
    </div>
  )
}