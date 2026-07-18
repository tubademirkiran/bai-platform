'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '@/lib/theme-context'
import { Textarea } from '@/components/ui/textarea'
import { PageHeader } from '@/components/ui/page-header'
import { CopyButton } from '@/components/ui/copy-button'
import { Database, Save, FileText, Bookmark, Trash2, X } from 'lucide-react'

export default function SqlPage() {
  const { accent, colors, lang, utils } = useTheme()
  const [query, setQuery] = useState('')
  const [sql, setSql] = useState('')
  const [explanation, setExplanation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ŞABLON MOTORU STATE'LERİ
  const [customTemplates, setCustomTemplates] = useState<{ label: string; text: string }[]>([])
  const [newTemplateLabel, setNewTemplateLabel] = useState('')
  const [showSaveArea, setShowSaveArea] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)

  // Çoklu dil (i18n) sözlüğü
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
      errorServer: 'Sunucu hatası oluştu.',
      saveTemplate: 'Şablon Olarak Kaydet',
      templates: 'Şablonlar',
      templatePlaceholder: 'Şablon başlığı yazın...',
      save: 'Kaydet'
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
      errorServer: 'Server error occurred.',
      saveTemplate: 'Save as Template',
      templates: 'Templates',
      templatePlaceholder: 'Enter template title...',
      save: 'Save'
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
      errorServer: 'Serverfehler aufgetreten.',
      saveTemplate: 'Als Vorlage speichern',
      templates: 'Vorlagen',
      templatePlaceholder: 'Vorlagentitel eingeben...',
      save: 'Speichern'
    }
  }

  const s = ui[lang as keyof typeof ui] || ui.tr

  // Tarayıcı hafızasından bu sayfaya ait özel SQL şablonlarını yükle
  useEffect(() => {
    const saved = localStorage.getItem('custom-tmpl-sql-generator')
    if (saved) {
      try {
        setCustomTemplates(JSON.parse(saved))
      } catch (e) {
        console.error("SQL şablonları yüklenemedi:", e)
      }
    }
  }, [])

  // Yazılan SQL sorgu fikrini şablon olarak tarayıcıya ekler
  const handleSaveTemplate = () => {
    if (!query.trim() || !newTemplateLabel.trim()) return
    const updated = [...customTemplates, { label: newTemplateLabel.trim(), text: query }]
    setCustomTemplates(updated)
    localStorage.setItem('custom-tmpl-sql-generator', JSON.stringify(updated))
    setNewTemplateLabel('')
    setShowSaveArea(false)
  }

  // Şablonu silme fonksiyonu
  const handleDeleteTemplate = (index: number, e: React.MouseEvent) => {
    e.stopPropagation()
    const updated = customTemplates.filter((_, i) => i !== index)
    setCustomTemplates(updated)
    localStorage.setItem('custom-tmpl-sql-generator', JSON.stringify(updated))
  }

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
        body: JSON.stringify({ query, lang }),
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
      <PageHeader 
        title={s.title} 
        description={s.desc} 
        icon={Database} 
      />

      <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
        
        {/* Şablon Yönetim Üst Paneli */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ fontSize: 'calc(var(--bai-dashboard-font-size, 13px) - 2px)', fontWeight: 600, color: colors.textMuted }}>
            {utils.toUpperCaseTr(s.inputLabel)}
          </div>
          
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {/* Şablon Olarak Kaydet Butonu */}
            {query.trim() && (
              <button
                onClick={() => setShowSaveArea(prev => !prev)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 10px', borderRadius: '8px', border: `1px solid ${accent}44`, background: `${accent}11`, color: accent, fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
              >
                <Save size={12} /> {s.saveTemplate}
              </button>
            )}

            {/* Kaydedilmiş Şablonları Listeleme Butonu */}
            {customTemplates.length > 0 && (
              <button
                onClick={() => setShowTemplates(prev => !prev)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 10px', borderRadius: '8px', border: `1px solid ${colors.border}`, background: 'transparent', color: colors.text, fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
              >
                <FileText size={13} /> {s.templates}
                <span style={{ fontSize: '10px', background: colors.border, padding: '1px 5px', borderRadius: '10px', color: colors.textMuted }}>
                  {customTemplates.length}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Şablon İsimlendirme Form Alanı */}
        {showSaveArea && (
          <div style={{ display: 'flex', gap: '8px', background: colors.bg, padding: '10px', borderRadius: '8px', border: `1px solid ${colors.border}`, marginBottom: '12px', alignItems: 'center' }}>
            <input
              type="text"
              placeholder={s.templatePlaceholder}
              value={newTemplateLabel}
              onChange={(e) => setNewTemplateLabel(e.target.value)}
              style={{ flex: 1, padding: '6px 10px', borderRadius: '6px', border: `1px solid ${colors.border}`, background: colors.card, color: colors.text, fontSize: 'var(--bai-dashboard-font-size, 13px)', outline: 'none' }}
            />
            <button
              onClick={handleSaveTemplate}
              disabled={!newTemplateLabel.trim()}
              style={{ padding: '6px 14px', borderRadius: '6px', border: 'none', background: newTemplateLabel.trim() ? accent : colors.border, color: '#fff', fontSize: '12px', fontWeight: 600, cursor: newTemplateLabel.trim() ? 'pointer' : 'not-allowed' }}
            >
              {s.save}
            </button>
            <button onClick={() => setShowSaveArea(false)} style={{ background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer', padding: '4px' }}><X size={16} /></button>
          </div>
        )}

        {/* Kayıtlı Şablonların Listelendiği Açılır Panel */}
        {showTemplates && customTemplates.length > 0 && (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px', background: colors.bg + '55', padding: '8px', borderRadius: '8px', border: `1px solid ${colors.border}44` }}>
            {customTemplates.map((tmpl, idx) => (
              <div
                key={`sql-custom-${idx}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '8px', border: `1px solid ${accent}33`, background: `${accent}08` }}
              >
                <button
                  onClick={() => { setQuery(tmpl.text); setShowTemplates(false) }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: colors.text, fontSize: '12px', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                >
                  <Bookmark size={11} style={{ color: accent }} />
                  {tmpl.label}
                </button>
                <button
                  onClick={(e) => handleDeleteTemplate(idx, e)}
                  style={{ background: 'none', border: 'none', color: '#ef4444', padding: '2px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        <Textarea
          placeholder={s.placeholder}
          style={{ minHeight: '120px', background: colors.bg, color: colors.text, borderColor: colors.border, fontSize: 'var(--bai-dashboard-font-size, 13px)' }}
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
                <div style={{ fontSize: 'calc(var(--bai-dashboard-font-size, 13px) - 2px)', fontWeight: 600, color: colors.textMuted }}>
                  {utils.toUpperCaseTr(s.sqlOutput)}
                </div>
                <CopyButton getText={() => sql} label={s.copyBtn} copiedLabel={s.copiedBtn} />
              </div>
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: 'var(--bai-dashboard-font-size, 13px)', color: colors.text, lineHeight: '1.7', background: colors.bg, padding: '16px', borderRadius: '8px', margin: 0, fontFamily: 'monospace' }}>
                {sql}
              </pre>
            </div>
          )}

          {explanation && (
            <div>
              <div style={{ fontSize: 'calc(var(--bai-dashboard-font-size, 13px) - 2px)', fontWeight: 600, color: colors.textMuted, marginBottom: '8px' }}>
                {utils.toUpperCaseTr(s.explanation)}
              </div>
              <div style={{ fontSize: 'var(--bai-dashboard-font-size, 13px)', color: colors.text, lineHeight: '1.6', background: colors.bg, padding: '16px', borderRadius: '8px' }}>
                {explanation}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  )
}