'use client'

import { useState } from 'react'
import { useTheme } from '@/lib/theme-context'
import { Textarea } from '@/components/ui/textarea'
import { PageHeader } from '@/components/ui/page-header'
import { CopyButton } from '@/components/ui/copy-button'
import { Loader2, Scale, Target, BarChart3, ListChecks, LineChart, Upload, Lightbulb, type LucideIcon, CheckCircle2 } from 'lucide-react'

type Method = 'value_effort' | 'moscow' | 'rice'
type Tab = 'list' | 'matrix' | 'export'

export default function PrioritizationPage() {
  const { accent, colors, lang } = useTheme()
  const [goal, setGoal] = useState('')
  const [requirements, setRequirements] = useState('')
  const [method, setMethod] = useState<Method>('value_effort')
  const [loading, setLoading] = useState(false)

  const [results, setResults] = useState<Record<Method, any | null>>({
    value_effort: null,
    moscow: null,
    rice: null,
  })
  
  const [activeTabs, setActiveTabs] = useState<Record<Method, Tab>>({
    value_effort: 'list',
    moscow: 'list',
    rice: 'list',
  })

  const currentResult = results[method]
  const currentTab = activeTabs[method]

  const setCurrentTab = (tab: Tab) => {
    setActiveTabs(prev => ({ ...prev, [method]: tab }))
  }

  async function handleAnalyze() {
    if (!requirements.trim()) return
    setLoading(true)
    
    const response = await fetch('/api/prioritization/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal, requirements, method, lang }),
    })
    
    const data = await response.json()
    
    setResults(prev => ({ ...prev, [method]: data.result }))
    setCurrentTab('list')
    setLoading(false)
  }

  const buildExportText = () => {
    if (!currentResult) return ''
    let text = `# ÖNCELİKLENDİRME RAPORU\n\n**Hedef:** ${goal || 'Belirtilmedi'}\n**Metodoloji:** ${method.toUpperCase()}\n\n`
    text += `*Koçun Yorumu: ${currentResult.summary}*\n\n---\n\n`

    currentResult.items.forEach((item: any) => {
      text += `### ${item.requirement}\n`
      text += `- Kategori: **${item.category}**\n`
      if (method === 'value_effort') text += `- Değer: ${item.value_score}/10 | Efor: ${item.effort_score}/10\n`
      if (method === 'rice') text += `- RICE Skoru: ${item.score}\n`
      text += `- Koç Tavsiyesi: ${item.coach_advice}\n\n`
    })
    return text
  }

  const methods: { key: string; label: string; desc: string; icon: LucideIcon }[] = [
    { key: 'value_effort', label: 'Value vs. Effort', desc: lang === 'tr' ? 'Efor & Değer Matrisi' : 'Effort & Value Matrix', icon: Scale },
    { key: 'moscow', label: 'MoSCoW', desc: lang === 'tr' ? 'Zaman kısıtı olanlar için' : 'For time constraints', icon: Target },
    { key: 'rice', label: 'RICE Score', desc: lang === 'tr' ? 'Veri odaklı skorlama' : 'Data-driven scoring', icon: BarChart3 },
  ]

  const getCategoryColor = (cat: string) => {
    const c = cat.toLowerCase()
    if (c.includes('quick') || c.includes('must') || c.includes('high')) return '#10b981'
    if (c.includes('major') || c.includes('should')) return '#3b82f6'
    if (c.includes('fill') || c.includes('could')) return '#f59e0b'
    return '#ef4444'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 40px)', overflow: 'hidden' }}>
      
      <div style={{ flexShrink: 0 }}>
        {/* Görev (a): PageHeader bileşenine Scale ikonu eklendi */}
        <PageHeader
          title="Prioritization Coach"
          description={lang === 'tr' ? 'Gereksinimleri iş hedefine göre analiz et ve yapay zeka ile önceliklendir.' : 'Analyze and prioritize requirements based on business goals using AI.'}
          icon={Scale}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px minmax(0, 1fr)', gap: '16px', flex: 1, minHeight: 0 }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%', overflowY: 'auto', paddingRight: '4px', paddingBottom: '20px' }}>
          <div style={{ background: colors.card, border: `0.5px solid ${colors.border}`, borderRadius: '12px', padding: '18px' }}>
            
            <div style={{ fontSize: '11px', fontWeight: '700', color: colors.textMuted, marginBottom: '8px', letterSpacing: '0.06em' }}>
              {lang === 'tr' ? 'ANA İŞ HEDEFİ (Opsiyonel)' : 'MAIN BUSINESS GOAL (Optional)'}
            </div>
            <input
              placeholder={lang === 'tr' ? 'Örn: Kullanıcı güvenliğini artırmak...' : 'E.g: Increase user security...'}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: `0.5px solid ${colors.border}`, background: colors.bg, color: colors.text, fontSize: '12px', outline: 'none', marginBottom: '14px' }}
              value={goal}
              onChange={e => setGoal(e.target.value)}
            />

            <div style={{ fontSize: '11px', fontWeight: '700', color: colors.textMuted, marginBottom: '8px', letterSpacing: '0.06em' }}>
              {lang === 'tr' ? 'GEREKSİNİMLER (Backlog)' : 'REQUIREMENTS (Backlog)'}
            </div>
            <Textarea
              placeholder={lang === 'tr'
                ? "1. Kullanıcılar Google ile giriş yapabilsin\n2. Profil fotoğrafına AR filtreleri eklensin\n3. Şifre yenileme SMS ile olsun..."
                : "1. Users can login with Google\n2. Add AR filters to avatars\n3. Password reset via SMS..."}
              style={{ minHeight: '160px', background: colors.bg, color: colors.text, borderColor: colors.border, fontSize: '12px', marginBottom: '14px', whiteSpace: 'pre-wrap' }}
              value={requirements}
              onChange={e => setRequirements(e.target.value)}
            />

            <div style={{ fontSize: '11px', fontWeight: '700', color: colors.textMuted, marginBottom: '8px', letterSpacing: '0.06em' }}>
              {lang === 'tr' ? 'METODOLOJİ' : 'METHODOLOGY'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '18px' }}>
              {methods.map(m => (
                <button key={m.key} onClick={() => setMethod(m.key as Method)}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', border: method === m.key ? `2px solid ${accent}` : `1px solid ${colors.border}`, background: method === m.key ? accent + '11' : colors.bg, cursor: 'pointer', textAlign: 'left' as const, transition: 'all 0.2s ease' }}>
                  <m.icon size={18} color={method === m.key ? accent : colors.textMuted} />
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: method === m.key ? accent : colors.text }}>{m.label}</div>
                    {/* Görev (a): Emoji yerine Lucide icon kullanıldı */}
                    <div style={{ fontSize: '10px', color: colors.textMuted, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {results[m.key as Method] ? <span style={{ color: '#10b981', display: 'flex', alignItems: 'center' }}><CheckCircle2 size={10} /> {lang === 'tr' ? 'Hazır -' : 'Ready -'} </span> : ''}
                      {m.desc}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={handleAnalyze}
              disabled={loading || !requirements.trim()}
              style={{ width: '100%', padding: '11px', borderRadius: '8px', border: 'none', background: !requirements.trim() ? colors.border : accent, color: '#fff', fontWeight: '700', fontSize: '13px', cursor: (loading || !requirements.trim()) ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? (lang === 'tr' ? 'Analiz ediliyor...' : 'Analyzing...') : (lang === 'tr' ? 'Önceliklendir & Tavsiye Al' : 'Prioritize & Get Advice')}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%', minHeight: 0 }}>
          
          {loading && (
            <div style={{ background: colors.card, border: `0.5px solid ${colors.border}`, borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '20px' }}>
              <Loader2 size={40} style={{ animation: 'pulse 1.5s infinite' }} />
              <div style={{ fontSize: '15px', fontWeight: '600', color: colors.text }}>{lang === 'tr' ? 'Veriler işleniyor...' : 'Processing data...'}</div>
            </div>
          )}

          {!currentResult && !loading && (
            <div style={{ background: colors.card, border: `0.5px solid ${colors.border}`, borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '16px', padding: '40px', textAlign: 'center' }}>
              <Scale size={56} style={{ opacity: 0.15 }} />
              <div style={{ fontSize: '15px', fontWeight: '600', color: colors.textMuted }}>
                {lang === 'tr' ? 'Gereksinimleri yazın, Product Owner asistanınız en mantıklı yolu çizsin.' : 'Write requirements, let your PO assistant draw the logical path.'}
              </div>
            </div>
          )}

          {currentResult && !loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%', minHeight: 0 }}>
              
              <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                <button onClick={() => setCurrentTab('list')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '8px', border: currentTab === 'list' ? `2px solid ${accent}` : `0.5px solid ${colors.border}`, background: currentTab === 'list' ? accent + '22' : colors.card, color: currentTab === 'list' ? accent : colors.textMuted, fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                  <ListChecks size={14} /> {lang === 'tr' ? 'Liste Görünümü' : 'List View'}
                </button>
                {method === 'value_effort' && (
                  <button onClick={() => setCurrentTab('matrix')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '8px', border: currentTab === 'matrix' ? `2px solid ${accent}` : `0.5px solid ${colors.border}`, background: currentTab === 'matrix' ? accent + '22' : colors.card, color: currentTab === 'matrix' ? accent : colors.textMuted, fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                    <LineChart size={14} /> {lang === 'tr' ? 'Görsel Matris' : 'Visual Matrix'}
                  </button>
                )}
                <button onClick={() => setCurrentTab('export')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '8px', border: currentTab === 'export' ? `2px solid ${accent}` : `0.5px solid ${colors.border}`, background: currentTab === 'export' ? accent + '22' : colors.card, color: currentTab === 'export' ? accent : colors.textMuted, fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                  <Upload size={14} /> {lang === 'tr' ? 'Dışa Aktar' : 'Export'}
                </button>
              </div>

              <div style={{ background: accent + '11', border: `1px solid ${accent}44`, borderRadius: '12px', padding: '16px', display: 'flex', gap: '16px', alignItems: 'flex-start', flexShrink: 0 }}>
                <Lightbulb size={22} color={accent} style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '800', color: accent, marginBottom: '4px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    {lang === 'tr' ? 'Sihirbazın Özeti' : 'Coach Summary'}
                  </div>
                  <div style={{ fontSize: '13px', color: colors.text, lineHeight: '1.5' }}>
                    {currentResult.summary}
                  </div>
                </div>
              </div>

              {currentTab === 'list' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto', paddingRight: '4px', paddingBottom: '20px' }}>
                  {currentResult.items.map((item: any, idx: number) => (
                    <div key={idx} style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
                      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: getCategoryColor(item.category) }} />
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingLeft: '8px' }}>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: colors.text, flex: 1, paddingRight: '16px' }}>
                          {item.requirement}
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '12px', background: getCategoryColor(item.category) + '22', color: getCategoryColor(item.category), whiteSpace: 'nowrap' }}>
                          {item.category}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '16px', paddingLeft: '8px' }}>
                        {method === 'value_effort' && (
                          <>
                            <div style={{ fontSize: '12px', color: colors.textMuted }}>{lang === 'tr' ? 'Değer:' : 'Value:'} <span style={{ color: colors.text, fontWeight: '700' }}>{item.value_score}/10</span></div>
                            <div style={{ fontSize: '12px', color: colors.textMuted }}>{lang === 'tr' ? 'Efor:' : 'Effort:'} <span style={{ color: colors.text, fontWeight: '700' }}>{item.effort_score}/10</span></div>
                          </>
                        )}
                        {method === 'rice' && (
                          <>
                            <div style={{ fontSize: '12px', color: colors.textMuted }}>{lang === 'tr' ? 'Skor:' : 'Score:'} <span style={{ color: accent, fontWeight: '800' }}>{item.score}</span></div>
                            <div style={{ fontSize: '12px', color: colors.textMuted }}>{lang === 'tr' ? 'Etki:' : 'Impact:'} <span style={{ color: colors.text, fontWeight: '700' }}>{item.impact}</span></div>
                            <div style={{ fontSize: '12px', color: colors.textMuted }}>{lang === 'tr' ? 'Efor:' : 'Effort:'} <span style={{ color: colors.text, fontWeight: '700' }}>{item.effort} {lang === 'tr' ? 'Ay' : 'Months'}</span></div>
                          </>
                        )}
                      </div>

                      <div style={{ background: colors.bg, padding: '10px 12px', borderRadius: '8px', fontSize: '12px', color: colors.textMuted, borderLeft: `2px solid ${colors.border}`, marginLeft: '8px', fontStyle: 'italic' }}>
                        <span style={{ fontWeight: '700', color: colors.text, marginRight: '4px' }}>{lang === 'tr' ? 'Tavsiye:' : 'Advice:'}</span> 
                        {item.coach_advice}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {currentTab === 'matrix' && method === 'value_effort' && (
                <div style={{ flex: 1, overflowY: 'auto', background: colors.card, border: `1px solid ${colors.border}`, borderRadius: '12px', padding: '24px', display: 'flex', justifyContent: 'center' }}>
                  <div style={{ width: '100%', maxWidth: '500px', aspectRatio: '1/1', position: 'relative', borderLeft: `2px solid ${colors.text}`, borderBottom: `2px solid ${colors.text}`, margin: '20px' }}>
                    <div style={{ position: 'absolute', top: '-25px', left: '-15px', fontSize: '12px', fontWeight: '700', color: colors.textMuted }}>{lang === 'tr' ? 'Değer (Yüksek)' : 'Value (High)'}</div>
                    <div style={{ position: 'absolute', bottom: '-25px', right: '-15px', fontSize: '12px', fontWeight: '700', color: colors.textMuted }}>{lang === 'tr' ? 'Efor (Yüksek)' : 'Effort (High)'}</div>
                    
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '50%', height: '50%', background: '#10b98111', borderRight: `1px dashed ${colors.border}`, borderBottom: `1px dashed ${colors.border}` }}><span style={{ position:'absolute', top:'10px', left:'10px', fontSize:'10px', color:'#10b981', fontWeight:'700'}}>{lang === 'tr' ? 'Hızlı Kazanımlar' : 'Quick Wins'}</span></div>
                    <div style={{ position: 'absolute', top: 0, right: 0, width: '50%', height: '50%', background: '#3b82f611', borderBottom: `1px dashed ${colors.border}` }}><span style={{ position:'absolute', top:'10px', right:'10px', fontSize:'10px', color:'#3b82f6', fontWeight:'700'}}>{lang === 'tr' ? 'Büyük Projeler' : 'Major Projects'}</span></div>
                    <div style={{ position: 'absolute', bottom: 0, left: 0, width: '50%', height: '50%', background: '#f59e0b11', borderRight: `1px dashed ${colors.border}` }}><span style={{ position:'absolute', bottom:'10px', left:'10px', fontSize:'10px', color:'#f59e0b', fontWeight:'700'}}>{lang === 'tr' ? 'Doldurucular' : 'Fill-Ins'}</span></div>
                    <div style={{ position: 'absolute', bottom: 0, right: 0, width: '50%', height: '50%', background: '#ef444411' }}><span style={{ position:'absolute', bottom:'10px', right:'10px', fontSize:'10px', color:'#ef4444', fontWeight:'700'}}>{lang === 'tr' ? 'Zaman Kaybı' : 'Time Wasters'}</span></div>

                    {currentResult.items.map((item: any, idx: number) => {
                      const leftPos = (item.effort_score / 10) * 100;
                      const bottomPos = (item.value_score / 10) * 100;
                      return (
                        <div key={idx} style={{ position: 'absolute', left: `${leftPos}%`, bottom: `${bottomPos}%`, transform: 'translate(-50%, 50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: getCategoryColor(item.category), border: '2px solid #fff', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} title={item.requirement} />
                          <div style={{ fontSize: '10px', fontWeight: '700', color: colors.text, marginTop: '4px', background: colors.bg, padding: '2px 4px', borderRadius: '4px', border: `1px solid ${colors.border}`, whiteSpace: 'nowrap' }}>
                            {lang === 'tr' ? `İtem ${idx + 1}` : `Item ${idx + 1}`}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {currentTab === 'export' && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#1e1e1e', border: `1px solid ${colors.border}`, borderRadius: '12px', overflow: 'hidden' }}>
                  <div style={{ padding: '10px 16px', borderBottom: '1px solid #333', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#252526', flexShrink: 0 }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#888' }}>Markdown / Jira Formatı</span>
                    {/* Görev (a): CopyButton dil desteği eklendi */}
                    <CopyButton getText={buildExportText} label={lang === 'tr' ? 'Kopyala' : 'Copy'} copiedLabel={lang === 'tr' ? 'Kopyalandı' : 'Copied'} />
                  </div>
                  <div style={{ flex: 1, padding: '16px', fontSize: '12px', color: '#d4d4d4', lineHeight: '1.6', overflowY: 'auto', fontFamily: '"Fira Code", monospace', whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
                    {buildExportText()}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}