'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '@/lib/theme-context'
import { useGenerate } from '@/lib/use-generate'
import { Textarea } from '@/components/ui/textarea'
import { PageHeader } from '@/components/ui/page-header'
import { CopyButton } from '@/components/ui/copy-button'
import { Prose } from '@/components/ui/prose'
import { Download, FileText, Save, Trash2, Bookmark, X } from 'lucide-react'

export type GenField =
  | { type: 'textarea'; name: string; label: string; placeholder?: string; minHeight?: number }
  | { type: 'number'; name: string; label: string; placeholder?: string }

export interface GeneratorConfig {
  title: string
  badge?: string
  desc?: string
  endpoint: string
  fields: GenField[]
  /** Yalnızca ilk textarea'ya uygulanan hızlı şablonlar */
  templates?: { label: string; text: string }[]
  submitLabel: string
  loadingLabel: string
  stopLabel?: string
  outputLabel: string
  output?: 'markdown' | 'text'
  /** Alan değerlerini istek gövdesine çevirir (lang vb. burada eklenir) */
  buildBody: (values: Record<string, string>) => unknown
  isValid?: (values: Record<string, string>) => boolean
  download?: { filename: string }
  labels?: { copy?: string; copied?: string; templates?: string; saveTemplate?: string; templateTitle?: string; save?: string }
}

/**
 * Aile A üretim araçları (SQL Generator, Requirement vb.) için config-driven bileşen.
 * LocalStorage tabanlı dinamik özel şablon kaydetme, silme ve listeleme özellikleri içerir.
 */
export function GeneratorTool({ config }: { config: GeneratorConfig }) {
  const { accent, colors, lang, utils } = useTheme()
  const { text: result, loading, error, run, stop } = useGenerate(config.endpoint)
  const [values, setValues] = useState<Record<string, string>>(
    () => Object.fromEntries(config.fields.map((f) => [f.name, '']))
  )
  const [showTemplates, setShowTemplates] = useState(false)
  
  // Kullanıcıya özel şablon state'leri
  const [customTemplates, setCustomTemplates] = useState<{ label: string; text: string }[]>([])
  const [newTemplateLabel, setNewTemplateLabel] = useState('')
  const [showSaveArea, setShowSaveArea] = useState(false)

  const numberFields = config.fields.filter((f) => f.type === 'number')
  const textareaFields = config.fields.filter((f) => f.type === 'textarea')
  const firstTextarea = textareaFields[0]?.name

  // İlgili modülün adına göre LocalStorage'daki özel şablonları çek
  useEffect(() => {
    const saved = localStorage.getItem(`custom-tmpl-${config.title}`)
    if (saved) {
      try {
        setCustomTemplates(JSON.parse(saved))
      } catch (e) {
        console.error("Özel şablonlar yüklenemedi:", e)
      }
    }
  }, [config.title])

  const valid = config.isValid
    ? config.isValid(values)
    : config.fields.every((f) => (values[f.name] || '').trim())

  const setValue = (name: string, v: string) => setValues((prev) => ({ ...prev, [name]: v }))

  // Girdi metnini LocalStorage'a kaydetme fonksiyonu
  const handleSaveCustomTemplate = () => {
    if (!firstTextarea || !values[firstTextarea]?.trim() || !newTemplateLabel.trim()) return
    
    const updated = [...customTemplates, { label: newTemplateLabel.trim(), text: values[firstTextarea] }]
    setCustomTemplates(updated)
    localStorage.setItem(`custom-tmpl-${config.title}`, JSON.stringify(updated))
    setNewTemplateLabel('')
    setShowSaveArea(false)
  }

  // Kaydedilen şablonu LocalStorage'dan uçurma fonksiyonu
  const handleDeleteCustomTemplate = (index: number, e: React.MouseEvent) => {
    e.stopPropagation()
    const updated = customTemplates.filter((_, i) => i !== index)
    setCustomTemplates(updated)
    localStorage.setItem(`custom-tmpl-${config.title}`, JSON.stringify(updated))
  }

  async function handleGenerate() {
    if (!valid || loading) return
    await run(config.buildBody(values))
  }

  function handleDownload() {
    if (!config.download || !result) return
    const blob = new Blob([result], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = config.download.filename
    a.click()
    URL.revokeObjectURL(url)
  }

  // CSS Değişkeni hatasını önleyen güvenli inline stiller
  const inputStyle = {
    width: '100%', 
    padding: '10px 12px', 
    borderRadius: '8px',
    border: `1px solid ${colors.border}`, 
    background: colors.bg,
    color: colors.text, 
    outline: 'none',
    fontSize: 'var(--bai-dashboard-font-size, 13px)',
  } as React.CSSProperties

  const labelStyle = {
    fontWeight: 600, 
    color: colors.textMuted, 
    marginBottom: '6px', 
    display: 'block',
    fontSize: 'calc(var(--bai-dashboard-font-size, 13px) - 2px)',
  } as React.CSSProperties

  return (
    <div>
      <PageHeader title={config.title} badge={config.badge} desc={config.desc} />

      <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>

        {/* Sayısal alanlar (varsa) */}
        {numberFields.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: textareaFields.length ? '16px' : '0' }}>
            {numberFields.map((f) => (
              <div key={f.name}>
                <label style={labelStyle}>{utils.toUpperCaseTr(f.label)}</label>
                <input type="number" placeholder={f.placeholder} style={inputStyle} value={values[f.name]} onChange={(e) => setValue(f.name, e.target.value)} />
              </div>
            ))}
          </div>
        )}

        {/* Metin alanları */}
        {textareaFields.map((f) => (
          <div key={f.name} style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={labelStyle}>{utils.toUpperCaseTr(f.label)}</label>
              
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {/* Şablon Oluşturma Kontrolü */}
                {f.name === firstTextarea && values[f.name]?.trim() && (
                  <button
                    onClick={() => setShowSaveArea((s) => !s)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 10px', borderRadius: '8px', border: `1px solid ${accent}44`, background: `${accent}11`, color: accent, fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    <Save size={12} /> {config.labels?.saveTemplate || (lang === 'tr' ? 'Şablon Olarak Kaydet' : 'Save as Template')}
                  </button>
                )}

                {((config.templates && config.templates.length > 0) || customTemplates.length > 0) && f.name === firstTextarea && (
                  <button
                    onClick={() => setShowTemplates((s) => !s)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 10px', borderRadius: '8px', border: `1px solid ${colors.border}`, background: 'transparent', color: colors.text, fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    <FileText size={13} /> {config.labels?.templates || (lang === 'tr' ? 'Şablonlar' : 'Templates')}
                    {(config.templates?.length || 0) + customTemplates.length > 0 && (
                      <span style={{ fontSize: '10px', background: colors.border, padding: '1px 5px', borderRadius: '10px', color: colors.textMuted }}>
                        {(config.templates?.length || 0) + customTemplates.length}
                      </span>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Şablon İsimlendirme Kutusu */}
            {f.name === firstTextarea && showSaveArea && (
              <div style={{ display: 'flex', gap: '8px', background: colors.bg, padding: '10px', borderRadius: '8px', border: `1px solid ${colors.border}`, marginBottom: '12px', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder={config.labels?.templateTitle || (lang === 'tr' ? 'Şablon başlığı yazın...' : 'Enter template title...')}
                  value={newTemplateLabel}
                  onChange={(e) => setNewTemplateLabel(e.target.value)}
                  style={{ ...inputStyle, flex: 1, padding: '6px 10px' }}
                />
                <button
                  onClick={handleSaveCustomTemplate}
                  disabled={!newTemplateLabel.trim()}
                  style={{ padding: '6px 14px', borderRadius: '6px', border: 'none', background: newTemplateLabel.trim() ? accent : colors.border, color: '#fff', fontSize: '12px', fontWeight: 600, cursor: newTemplateLabel.trim() ? 'pointer' : 'not-allowed' }}
                >
                  {config.labels?.save || (lang === 'tr' ? 'Kaydet' : 'Save')}
                </button>
              </div>
            )}

            {/* Sistem ve Kullanıcı Şablon Seçim Listesi */}
            {f.name === firstTextarea && showTemplates && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px', background: colors.bg + '55', padding: '8px', borderRadius: '8px', border: `1px solid ${colors.border}44` }}>
                {config.templates?.map((tmpl) => (
                  <button
                    key={tmpl.label}
                    onClick={() => { setValue(f.name, tmpl.text); setShowTemplates(false) }}
                    style={{ padding: '6px 12px', borderRadius: '8px', border: `1px solid ${colors.border}`, background: colors.card, color: colors.text, fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    {tmpl.label}
                  </button>
                ))}

                {customTemplates.map((tmpl, idx) => (
                  <div
                    key={`custom-${idx}`}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '8px', border: `1px solid ${accent}33`, background: `${accent}08` }}
                  >
                    <button
                      onClick={() => { setValue(f.name, tmpl.text); setShowTemplates(false) }}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: colors.text, fontSize: '12px', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                    >
                      <Bookmark size={11} style={{ color: accent }} />
                      {tmpl.label}
                    </button>
                    <button
                      onClick={(e) => handleDeleteCustomTemplate(idx, e)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', padding: '2px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <Textarea
              placeholder={f.placeholder}
              style={{ minHeight: `${f.minHeight || 120}px`, background: colors.bg, color: colors.text, borderColor: colors.border, fontSize: 'var(--bai-dashboard-font-size, 13px)' }}
              value={values[f.name]}
              onChange={(e) => setValue(f.name, e.target.value)}
            />
          </div>
        ))}

        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          <button
            onClick={handleGenerate}
            disabled={loading || !valid}
            style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: !valid ? colors.border : accent, color: '#fff', fontWeight: 600, fontSize: '13px', cursor: loading || !valid ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? config.loadingLabel : config.submitLabel}
          </button>
          {loading && (
            <button
              onClick={stop}
              style={{ padding: '10px 16px', borderRadius: '8px', border: `1px solid ${colors.border}`, background: 'transparent', color: '#ef4444', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
            >
              {config.stopLabel || 'Durdur'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div style={{ background: '#ef444415', border: '1px solid #ef444455', color: '#ef4444', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', fontSize: '13px' }}>
          {error}
        </div>
      )}

      {result && (
        <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: colors.textMuted }}>{config.outputLabel}</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <CopyButton getText={() => result} label={config.labels?.copy} copiedLabel={config.labels?.copied} />
              {config.download && (
                <button
                  onClick={handleDownload}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 12px', borderRadius: '8px', border: `1px solid ${colors.border}`, background: colors.card, color: colors.text, fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                >
                  <Download size={14} /> {lang === 'tr' ? 'İndir' : 'Download'}
                </button>
              )}
            </div>
          </div>

          {config.output === 'markdown'
            ? <Prose>{result}</Prose>
            : <pre style={{ whiteSpace: 'pre-wrap', fontSize: 'var(--bai-dashboard-font-size, 13px)', color: colors.text, lineHeight: '1.7', margin: 0, fontFamily: 'inherit' }}>{result}</pre>}
        </div>
      )}
    </div>
  )
}