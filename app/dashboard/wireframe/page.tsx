'use client'

import { useState } from 'react'
import { useTheme } from '@/lib/theme-context'
import { Textarea } from '@/components/ui/textarea'
import { PageHeader } from '@/components/ui/page-header'
import { CopyButton } from '@/components/ui/copy-button'
import {
  Loader2, Palette, Monitor, Smartphone, Tablet, MousePointerClick, Code2,
  Download, Pencil, FileText, Link2, Package, Square, type LucideIcon, Layout
} from 'lucide-react'

type Platform = 'web' | 'mobile' | 'responsive'
type DesignStyle = 'wireframe' | 'lowfi' | 'hifi'
type OutputTab = 'preview' | 'interactive' | 'code'

export default function WireframePage() {
  const { accent, colors, lang } = useTheme()
  const [requirement, setRequirement] = useState('')
  const [platform, setPlatform] = useState<Platform>('web')
  const [style, setStyle] = useState<DesignStyle>('hifi')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<OutputTab>('preview')
  const [revisionCmd, setRevisionCmd] = useState('')
  const [revising, setRevising] = useState(false)

  async function handleGenerate() {
    if (!requirement.trim()) return
    setLoading(true)
    setResult(null)
    const response = await fetch('/api/wireframe/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requirement, platform, style, lang }),
    })
    const data = await response.json()
    setResult(data.result)
    setLoading(false)
  }

  async function handleRevision() {
    if (!revisionCmd.trim() || !result) return
    setRevising(true)
    const response = await fetch('/api/wireframe/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requirement: `Mevcut tasarim: ${JSON.stringify(result.components)}\n\nRevizyon: ${revisionCmd}`,
        platform, style, lang,
      }),
    })
    const data = await response.json()
    setResult(data.result)
    setRevisionCmd('')
    setRevising(false)
  }

  function handleDownload() {
    if (!result?.htmlCode) return
    const blob = new Blob([result.htmlCode], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'prototype.html'
    a.click()
  }

  const platforms: { key: string; label: string; icon: LucideIcon }[] = [
    { key: 'web', label: 'Web (Desktop)', icon: Monitor },
    { key: 'mobile', label: lang === 'tr' ? 'Mobil' : 'Mobile', icon: Smartphone },
    { key: 'responsive', label: 'Responsive', icon: Tablet },
  ]

  const componentIcon: Record<string, LucideIcon> = {
    input: FileText, button: MousePointerClick, link: Link2, group: Package, text: Pencil,
  }

  const styles = [
    { key: 'wireframe', label: lang === 'tr' ? 'Tel Kafes' : 'Wireframe', desc: lang === 'tr' ? 'Siyah/Beyaz/Çizgisel' : 'Black/White/Lines' },
    { key: 'lowfi', label: 'Low-Fi', desc: lang === 'tr' ? 'Temel Bileşenler' : 'Basic Components' },
    { key: 'hifi', label: 'Hi-Fi', desc: lang === 'tr' ? 'Kurumsal Tema' : 'Corporate Theme' },
  ]

  const tabs: { key: string; label: string; icon: LucideIcon }[] = [
    { key: 'preview', label: lang === 'tr' ? 'Görsel Önizleme' : 'Visual Preview', icon: Palette },
    { key: 'interactive', label: lang === 'tr' ? 'Etkileşim Modu' : 'Interactive', icon: MousePointerClick },
    { key: 'code', label: lang === 'tr' ? 'UI Kodu' : 'UI Code', icon: Code2 },
  ]

  const btnStyle = {
    padding: '6px 12px', borderRadius: '8px',
    border: `0.5px solid ${colors.border}`,
    background: colors.card, color: colors.text,
    fontSize: '11px', fontWeight: '600' as const, cursor: 'pointer',
  }

  return (
    <div>
      {/* Görev (a): PageHeader prop'ları güncellendi ve Layout ikonu eklendi */}
      <PageHeader
        title={lang === 'tr' ? 'Wireframe & Prototip Üretici' : 'Wireframe & Prototype Generator'}
        description={lang === 'tr' ? 'Gereksinimden otomatik ekran taslağı ve tıklanabilir prototip üret.' : 'Generate wireframe and clickable prototype from requirements.'}
        icon={Layout}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '340px minmax(0, 1fr)', gap: '16px' }}>

        {/* Sol Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ background: colors.card, border: `0.5px solid ${colors.border}`, borderRadius: '12px', padding: '18px' }}>

            <div style={{ fontSize: '11px', fontWeight: '700', color: colors.textMuted, marginBottom: '8px', letterSpacing: '0.06em' }}>
              {lang === 'tr' ? 'GEREKSİNİM METNİ' : 'REQUIREMENT TEXT'}
            </div>
            <Textarea
              placeholder={lang === 'tr'
                ? 'Örnek: Kullanıcı giriş yapacak, şifremi unuttum butonu olacak ve altında 3 adet doğrulama kutusu yer alacak...'
                : 'Example: User will login, there will be a forgot password button and 3 verification boxes below...'}
              style={{ minHeight: '140px', background: colors.bg, color: colors.text, borderColor: colors.border, fontSize: '12px', marginBottom: '14px' }}
              value={requirement}
              onChange={e => setRequirement(e.target.value)}
            />

            <div style={{ fontSize: '11px', fontWeight: '700', color: colors.textMuted, marginBottom: '8px', letterSpacing: '0.06em' }}>
              {lang === 'tr' ? 'PLATFORM' : 'PLATFORM'}
            </div>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
              {platforms.map(p => (
                <button key={p.key} onClick={() => setPlatform(p.key as Platform)}
                  style={{ flex: 1, padding: '8px 4px', borderRadius: '8px', border: platform === p.key ? `2px solid ${accent}` : `0.5px solid ${colors.border}`, background: platform === p.key ? accent + '22' : 'transparent', color: platform === p.key ? accent : colors.textMuted, fontSize: '11px', fontWeight: '600', cursor: 'pointer', textAlign: 'center' as const }}>
                  <div style={{ marginBottom: '2px', display: 'flex', justifyContent: 'center' }}><p.icon size={16} /></div>
                  <div>{p.label}</div>
                </button>
              ))}
            </div>

            <div style={{ fontSize: '11px', fontWeight: '700', color: colors.textMuted, marginBottom: '8px', letterSpacing: '0.06em' }}>
              {lang === 'tr' ? 'TASARIM STİLİ' : 'DESIGN STYLE'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
              {styles.map(st => (
                <button key={st.key} onClick={() => setStyle(st.key as DesignStyle)}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', border: style === st.key ? `2px solid ${accent}` : `0.5px solid ${colors.border}`, background: style === st.key ? accent + '11' : 'transparent', cursor: 'pointer', textAlign: 'left' as const }}>
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: `2px solid ${style === st.key ? accent : colors.border}`, background: style === st.key ? accent : 'transparent', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: style === st.key ? accent : colors.text }}>{st.label}</div>
                    <div style={{ fontSize: '10px', color: colors.textMuted }}>{st.desc}</div>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading || !requirement.trim()}
              style={{ width: '100%', padding: '11px', borderRadius: '8px', border: 'none', background: !requirement.trim() ? colors.border : accent, color: '#fff', fontWeight: '700', fontSize: '13px', cursor: (loading || !requirement.trim()) ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? (lang === 'tr' ? 'AI üretiyor...' : 'AI generating...') : (lang === 'tr' ? 'Taslak & Prototip Üret' : 'Generate Wireframe & Prototype')}
            </button>
          </div>

          {result && (
            <div style={{ background: colors.card, border: `0.5px solid ${colors.border}`, borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: colors.textMuted, marginBottom: '10px', letterSpacing: '0.06em' }}>
                {lang === 'tr' ? 'REVİZYON KOMUTU' : 'REVISION COMMAND'}
              </div>
              <input
                value={revisionCmd}
                onChange={e => setRevisionCmd(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleRevision()}
                placeholder={lang === 'tr' ? 'Örn: Butonu sağa al, başlık ekle...' : 'E.g: Move button right, add title...'}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: `0.5px solid ${colors.border}`, background: colors.bg, color: colors.text, fontSize: '12px', outline: 'none', marginBottom: '8px' }}
              />
              <button onClick={handleRevision} disabled={revising || !revisionCmd.trim()}
                style={{ width: '100%', padding: '8px', borderRadius: '8px', border: 'none', background: revisionCmd.trim() ? accent : colors.border, color: '#fff', fontWeight: '600', fontSize: '12px', cursor: revisionCmd.trim() ? 'pointer' : 'not-allowed' }}>
                {revising ? (lang === 'tr' ? 'Revize ediliyor...' : 'Revising...') : (lang === 'tr' ? 'Revize Et' : 'Revise')}
              </button>
            </div>
          )}

          {result?.components && (
            <div style={{ background: colors.card, border: `0.5px solid ${colors.border}`, borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: colors.textMuted, marginBottom: '10px', letterSpacing: '0.06em' }}>
                {lang === 'tr' ? 'TESPİT EDİLEN BİLEŞENLER' : 'DETECTED COMPONENTS'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {result.components.map((comp: any, i: number) => {
                  const CompIc = componentIcon[comp.type] || Square
                  return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', borderRadius: '6px', background: colors.bg }}>
                    <span style={{ display: 'flex', color: colors.textMuted }}>
                      <CompIc size={14} />
                    </span>
                    <div>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: colors.text }}>{comp.label || comp.type}</span>
                      <span style={{ fontSize: '10px', color: colors.textMuted, marginLeft: '6px' }}>{comp.type}</span>
                    </div>
                  </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sağ Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {!result && !loading && (
            <div style={{ background: colors.card, border: `0.5px solid ${colors.border}`, borderRadius: '12px', padding: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '500px', gap: '16px' }}>
              <Palette size={56} style={{ opacity: 0.15 }} />
              <div style={{ fontSize: '15px', fontWeight: '600', color: colors.textMuted }}>{lang === 'tr' ? 'Gereksinim yazın ve üretin' : 'Write requirement and generate'}</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {[
                  lang === 'tr' ? 'Giriş Formu' : 'Login Form',
                  lang === 'tr' ? 'Kayıt Ekranı' : 'Register Screen',
                  lang === 'tr' ? 'Dashboard' : 'Dashboard',
                  lang === 'tr' ? 'Ödeme Formu' : 'Payment Form',
                ].map(ex => (
                  <button key={ex} onClick={() => setRequirement(ex === 'Giriş Formu' || ex === 'Login Form'
                    ? (lang === 'tr' ? 'Kullanıcı email ve şifre ile giriş yapacak. Şifremi unuttum butonu olacak. Altında 3 adet OTP doğrulama kutusu yer alacak.' : 'User will login with email and password. There will be forgot password button. Below there will be 3 OTP verification boxes.')
                    : ex)}
                    style={{ ...btnStyle, fontSize: '11px', color: accent, border: `0.5px solid ${accent}44`, background: accent + '11' }}>
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          )}

          {loading && (
            <div style={{ background: colors.card, border: `0.5px solid ${colors.border}`, borderRadius: '12px', padding: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '500px', gap: '20px' }}>
              <Loader2 size={40} style={{ animation: 'pulse 1.5s infinite' }} />
              <div style={{ fontSize: '15px', fontWeight: '600', color: colors.text }}>{lang === 'tr' ? 'Tasarım üretiliyor...' : 'Generating design...'}</div>
              {[
                lang === 'tr' ? 'Gereksinim analiz ediliyor' : 'Analyzing requirement',
                lang === 'tr' ? 'Bileşenler tespit ediliyor' : 'Detecting components',
                lang === 'tr' ? 'Yerleşim düzenleniyor' : 'Arranging layout',
                lang === 'tr' ? 'HTML/CSS kodu üretiliyor' : 'Generating HTML/CSS code',
                lang === 'tr' ? 'Prototip hazırlanıyor' : 'Preparing prototype',
              ].map((step, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: accent, opacity: 0.3 + i * 0.17 }} />
                  <span style={{ fontSize: '13px', color: colors.textMuted }}>{step}</span>
                </div>
              ))}
            </div>
          )}

          {result && (
            <>
              <div style={{ display: 'flex', gap: '6px' }}>
                {tabs.map(tab => (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key as OutputTab)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '8px', border: activeTab === tab.key ? `2px solid ${accent}` : `0.5px solid ${colors.border}`, background: activeTab === tab.key ? accent + '22' : colors.card, color: activeTab === tab.key ? accent : colors.textMuted, fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                    <tab.icon size={14} /> {tab.label}
                  </button>
                ))}
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
                  {/* Görev (a): CopyButton dil prop'ları tanımlandı */}
                  <CopyButton getText={() => result?.htmlCode || ''} label={lang === 'tr' ? 'Kodu Kopyala' : 'Copy Code'} copiedLabel={lang === 'tr' ? 'Kopyalandı' : 'Copied'} />
                  <button onClick={handleDownload} style={{ ...btnStyle, display: 'inline-flex', alignItems: 'center', gap: '6px', color: accent, border: `0.5px solid ${accent}44` }}>
                    <Download size={14} /> {lang === 'tr' ? 'İndir' : 'Download'}
                  </button>
                </div>
              </div>

              {activeTab === 'preview' && result.wireframeHtml && (
                <div style={{ background: style === 'wireframe' ? '#fff' : colors.card, border: `0.5px solid ${colors.border}`, borderRadius: '12px', padding: '24px', minHeight: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: platform === 'mobile' ? '375px' : '100%', maxWidth: platform === 'mobile' ? '375px' : '800px' }}>
                    <div dangerouslySetInnerHTML={{ __html: result.wireframeHtml }} />
                  </div>
                </div>
              )}

              {activeTab === 'interactive' && result.htmlCode && (
                <div style={{ background: colors.card, border: `0.5px solid ${colors.border}`, borderRadius: '12px', overflow: 'hidden', minHeight: '500px' }}>
                  <div style={{ padding: '10px 16px', borderBottom: `0.5px solid ${colors.border}`, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
                    <span style={{ fontSize: '11px', color: colors.textMuted, marginLeft: '8px' }}>
                      {lang === 'tr' ? 'Tıklanabilir Prototip' : 'Clickable Prototype'}
                    </span>
                  </div>
                  <iframe
                    srcDoc={result.htmlCode}
                    style={{ width: '100%', height: '500px', border: 'none', background: '#fff' }}
                    title="Interactive Prototype"
                  />
                </div>
              )}

              {activeTab === 'code' && result.htmlCode && (
                <div style={{ background: colors.card, border: `0.5px solid ${colors.border}`, borderRadius: '12px', overflow: 'hidden' }}>
                  <div style={{ padding: '10px 16px', borderBottom: `0.5px solid ${colors.border}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '6px', background: accent + '22', color: accent }}>HTML + Tailwind CSS</span>
                    <span style={{ fontSize: '11px', color: colors.textMuted }}>{lang === 'tr' ? 'Direkt kullanıma hazır' : 'Ready to use'}</span>
                  </div>
                  <pre style={{ padding: '16px', fontSize: '11px', color: colors.text, lineHeight: '1.6', overflowX: 'auto', maxHeight: '500px', overflowY: 'auto', fontFamily: 'monospace', margin: 0, background: colors.bg }}>
                    {result.htmlCode}
                  </pre>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}