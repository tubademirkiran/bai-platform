'use client'

import { useState } from 'react'
import { useTheme } from '@/lib/theme-context'
import { useGenerate } from '@/lib/use-generate'
import { Textarea } from '@/components/ui/textarea'
import { PageHeader } from '@/components/ui/page-header'
import { CopyButton } from '@/components/ui/copy-button'
import { Prose } from '@/components/ui/prose'
import { Download, FileText } from 'lucide-react'

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
  labels?: { copy?: string; copied?: string; templates?: string }
}

/**
 * Aile A üretim araçları (başlık + girdi + üret + metin/markdown çıktı) için
 * tek, config-driven bileşen. Streaming'i useGenerate ile yönetir; Durdur,
 * Kopyala ve (opsiyonel) İndir aksiyonlarını içerir.
 */
export function GeneratorTool({ config }: { config: GeneratorConfig }) {
  const { accent, colors } = useTheme()
  const { text: result, loading, error, run, stop } = useGenerate(config.endpoint)
  const [values, setValues] = useState<Record<string, string>>(
    () => Object.fromEntries(config.fields.map((f) => [f.name, '']))
  )
  const [showTemplates, setShowTemplates] = useState(false)

  const numberFields = config.fields.filter((f) => f.type === 'number')
  const textareaFields = config.fields.filter((f) => f.type === 'textarea')
  const firstTextarea = textareaFields[0]?.name

  const valid = config.isValid
    ? config.isValid(values)
    : config.fields.every((f) => (values[f.name] || '').trim())

  const setValue = (name: string, v: string) => setValues((prev) => ({ ...prev, [name]: v }))

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

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: '8px',
    border: `1px solid ${colors.border}`, background: colors.bg,
    color: colors.text, fontSize: '13px', outline: 'none',
  }
  const labelStyle: React.CSSProperties = {
    fontSize: '12px', fontWeight: 600, color: colors.textMuted, marginBottom: '6px', display: 'block',
  }

  return (
    <div>
      <PageHeader title={config.title} badge={config.badge} desc={config.desc} />

      <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>

        {/* Sayısal alanlar (varsa) — responsive grid */}
        {numberFields.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: textareaFields.length ? '16px' : '0' }}>
            {numberFields.map((f) => (
              <div key={f.name}>
                <label style={labelStyle}>{f.label}</label>
                <input type="number" placeholder={f.placeholder} style={inputStyle} value={values[f.name]} onChange={(e) => setValue(f.name, e.target.value)} />
              </div>
            ))}
          </div>
        )}

        {/* Metin alanları */}
        {textareaFields.map((f) => (
          <div key={f.name} style={{ marginBottom: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={labelStyle} >{f.label}</label>
              {config.templates && f.name === firstTextarea && (
                <button
                  onClick={() => setShowTemplates((s) => !s)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 10px', borderRadius: '8px', border: `1px solid ${accent}44`, background: 'transparent', color: accent, fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                >
                  <FileText size={13} /> {config.labels?.templates || 'Şablonlar'}
                </button>
              )}
            </div>

            {config.templates && f.name === firstTextarea && showTemplates && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                {config.templates.map((tmpl) => (
                  <button
                    key={tmpl.label}
                    onClick={() => { setValue(f.name, tmpl.text); setShowTemplates(false) }}
                    style={{ padding: '7px 12px', borderRadius: '8px', border: `1px solid ${colors.border}`, background: colors.card, color: colors.text, fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    {tmpl.label}
                  </button>
                ))}
              </div>
            )}

            <Textarea
              placeholder={f.placeholder}
              style={{ minHeight: `${f.minHeight || 120}px`, background: colors.bg, color: colors.text, borderColor: colors.border }}
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
                  <Download size={14} /> İndir
                </button>
              )}
            </div>
          </div>

          {config.output === 'markdown'
            ? <Prose>{result}</Prose>
            : <pre style={{ whiteSpace: 'pre-wrap', fontSize: '13px', color: colors.text, lineHeight: '1.7', margin: 0, fontFamily: 'inherit' }}>{result}</pre>}
        </div>
      )}
    </div>
  )
}
