'use client'

import { useState } from 'react'
import { useTheme } from '@/lib/theme-context'
import { Textarea } from '@/components/ui/textarea'
import { saveToHistory } from '@/lib/history'

type Methodology = 'waterfall' | 'agile' | 'hybrid'
type Tab = 'scope' | 'schedule' | 'stakeholders' | 'risks'

export default function PMIPlannerPage() {
  const { accent, colors, lang, isDark } = useTheme()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<Tab>('scope')

  // Form State
  const [form, setForm] = useState({
    projectName: '',
    summary: '',
    constraints: '',
    stakeholders: '',
    methodology: 'hybrid' as Methodology
  })

  async function handleGenerate() {
    if (!form.projectName || !form.summary) return
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/pmi/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, lang }),
      })
      const data = await response.json()
      setResult(data.result)
      
      // Geçmişe Kaydet
      await saveToHistory(
        'PMI Project Planner',
        `Proje: ${form.projectName}\nÖzet: ${form.summary}`,
        JSON.stringify(data.result)
      )
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '10px 12px', borderRadius: '8px',
    border: `1px solid ${colors.border}`, background: colors.bg,
    color: colors.text, fontSize: '12px', outline: 'none', marginBottom: '12px'
  }

  const tabs = [
    { key: 'scope', label: lang === 'tr' ? '🎯 Kapsam & WBS' : '🎯 Scope & WBS' },
    { key: 'schedule', label: lang === 'tr' ? '⏳ Zaman & Maliyet' : '⏳ Schedule & Cost' },
    { key: 'stakeholders', label: lang === 'tr' ? '👥 Paydaş & RACI' : '👥 Stakeholder & RACI' },
    { key: 'risks', label: lang === 'tr' ? '⚠️ Risk & Kalite' : '⚠️ Risk & Quality' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: colors.text, margin: 0 }}>
            {lang === 'tr' ? 'PMI Proje Planlama Sihirbazı' : 'PMI Project Planning Wizard'}
          </h2>
          <span style={{ fontSize: '10px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px', background: accent + '22', color: accent }}>PMBOK v7</span>
        </div>
        <p style={{ fontSize: '13px', color: colors.textMuted, marginTop: '4px' }}>
          {lang === 'tr' ? 'Uluslararası standartlarda (PMI) proje başlatma belgesi ve master plan üretin.' : 'Generate project charter and master plan based on PMI standards.'}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '16px', alignItems: 'start' }}>
        
        {/* Sol Panel: Girdi */}
        <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: '12px', padding: '18px', display: 'flex', flexDirection: 'column' }}>
          <label style={{ fontSize: '11px', fontWeight: '700', color: colors.textMuted, marginBottom: '6px' }}>PROJE ADI</label>
          <input 
            style={inputStyle} 
            value={form.projectName} 
            onChange={e => setForm({...form, projectName: e.target.value})}
            placeholder="Örn: E-Ticaret Mobil Uygulama Geçişi" 
          />

          <label style={{ fontSize: '11px', fontWeight: '700', color: colors.textMuted, marginBottom: '6px' }}>PROJE ÖZETİ & HEDEF</label>
          <Textarea 
            style={{ ...inputStyle, minHeight: '100px' }} 
            value={form.summary}
            onChange={e => setForm({...form, summary: e.target.value})}
            placeholder="Projenin amacı ve beklenen iş değeri nedir?" 
          />

          <label style={{ fontSize: '11px', fontWeight: '700', color: colors.textMuted, marginBottom: '6px' }}>KISITLAR (BÜTÇE / SÜRE)</label>
          <input 
            style={inputStyle} 
            value={form.constraints}
            onChange={e => setForm({...form, constraints: e.target.value})}
            placeholder="Örn: 500k TL Bütçe, 4 Ay Süre" 
          />

          <label style={{ fontSize: '11px', fontWeight: '700', color: colors.textMuted, marginBottom: '6px' }}>ANA PAYDAŞLAR</label>
          <input 
            style={inputStyle} 
            value={form.stakeholders}
            onChange={e => setForm({...form, stakeholders: e.target.value})}
            placeholder="Örn: Sponsor, IT Ekibi, Müşteriler" 
          />

          <label style={{ fontSize: '11px', fontWeight: '700', color: colors.textMuted, marginBottom: '6px' }}>METODOLOJİ</label>
          <select 
            style={inputStyle} 
            value={form.methodology}
            onChange={e => setForm({...form, methodology: e.target.value as Methodology})}
          >
            <option value="waterfall">Waterfall (Geleneksel)</option>
            <option value="agile">Agile (Çevik)</option>
            <option value="hybrid">Hybrid (Karma)</option>
          </select>

          <button
            onClick={handleGenerate}
            disabled={loading || !form.projectName}
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'none', background: accent, color: '#fff', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? '⚙️ Plan Hazırlanıyor...' : '🏛️ Projeyi Planla'}
          </button>
        </div>

        {/* Sağ Panel: Çıktı */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {result ? (
            <>
              {/* Tab Nav */}
              <div style={{ display: 'flex', gap: '4px', background: colors.card, padding: '4px', borderRadius: '10px', border: `1px solid ${colors.border}` }}>
                {tabs.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as Tab)}
                    style={{
                      flex: 1, padding: '10px', borderRadius: '8px', border: 'none', fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                      background: activeTab === tab.key ? accent : 'transparent',
                      color: activeTab === tab.key ? '#fff' : colors.textMuted,
                      transition: 'all 0.2s'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: '12px', padding: '24px', minHeight: '400px' }}>
                
                {/* TAB 1: SCOPE */}
                {activeTab === 'scope' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <Section title="🎯 In-Scope (Kapsam Dahili)" items={result.scope.in} color="#10b981" />
                    <Section title="🚫 Out-of-Scope (Kapsam Dışı)" items={result.scope.out} color="#ef4444" />
                    <WBSStructure data={result.scope.wbs} accent={accent} colors={colors} />
                  </div>
                )}

                {/* TAB 2: SCHEDULE */}
                {activeTab === 'schedule' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div style={{ background: colors.bg, padding: '16px', borderRadius: '12px', border: `1px solid ${colors.border}` }}>
                        <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: accent }}>🕒 Milestones (Kilometre Taşları)</h4>
                        {result.schedule.milestones.map((m: any, i: number) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '6px 0', borderBottom: `1px solid ${colors.border}55` }}>
                            <span style={{ color: colors.text }}>{m.event}</span>
                            <span style={{ fontWeight: '700', color: accent }}>{m.date}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ background: colors.bg, padding: '16px', borderRadius: '12px', border: `1px solid ${colors.border}` }}>
                        <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#f59e0b' }}>💰 Bütçe Dağılımı</h4>
                        {result.schedule.budget_breakdown.map((b: any, i: number) => (
                          <div key={i} style={{ marginBottom: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                              <span style={{ color: colors.text }}>{b.category}</span>
                              <span style={{ fontWeight: '700' }}>%{b.percent}</span>
                            </div>
                            <div style={{ height: '4px', background: colors.border, borderRadius: '2px' }}>
                              <div style={{ height: '100%', width: `${b.percent}%`, background: '#f59e0b', borderRadius: '2px' }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: STAKEHOLDERS */}
                {activeTab === 'stakeholders' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                     <h4 style={{ margin: 0, fontSize: '14px', color: accent }}>📋 RACI Matrisi</h4>
                     <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                        <thead>
                          <tr style={{ textAlign: 'left', borderBottom: `2px solid ${colors.border}` }}>
                            <th style={{ padding: '10px' }}>Görev / Teslimat</th>
                            {result.stakeholders.roles.map((r: string) => <th key={r} style={{ padding: '10px' }}>{r}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {result.stakeholders.raci.map((row: any, i: number) => (
                            <tr key={i} style={{ borderBottom: `1px solid ${colors.border}55` }}>
                              <td style={{ padding: '10px', fontWeight: '600', color: colors.text }}>{row.task}</td>
                              {row.assignments.map((a: string, j: number) => (
                                <td key={j} style={{ padding: '10px', textAlign: 'center' }}>
                                  <span style={{ 
                                    padding: '2px 6px', borderRadius: '4px', fontWeight: '800', fontSize: '10px',
                                    background: a === 'R' ? accent : a === 'A' ? '#f59e0b' : 'transparent',
                                    color: (a === 'R' || a === 'A') ? '#fff' : colors.textMuted,
                                    border: (a === 'C' || a === 'I') ? `1px solid ${colors.border}` : 'none'
                                  }}>{a}</span>
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                     </table>
                     <div style={{ fontSize: '10px', color: colors.textMuted }}>* R: Responsible, A: Accountable, C: Consulted, I: Informed</div>
                  </div>
                )}

                {/* TAB 4: RISKS */}
                {activeTab === 'risks' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div>
                      <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#ef4444' }}>⚠️ Kritik Riskler & Önleme</h4>
                      {result.risks.items.map((r: any, i: number) => (
                        <div key={i} style={{ marginBottom: '12px', padding: '10px', background: colors.bg, borderRadius: '8px', borderLeft: `3px solid #ef4444` }}>
                          <div style={{ fontWeight: '700', fontSize: '12px', color: colors.text }}>{r.risk}</div>
                          <div style={{ fontSize: '11px', color: colors.textMuted, marginTop: '4px' }}>Mitigation: {r.mitigation}</div>
                        </div>
                      ))}
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#10b981' }}>✅ Kabul Kriterleri</h4>
                      {result.risks.acceptance.map((a: string, i: number) => (
                        <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px', fontSize: '12px', color: colors.text }}>
                          <span style={{ color: '#10b981' }}>✔</span> {a}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </>
          ) : (
            <div style={{ background: colors.card, border: `1px dashed ${colors.border}`, borderRadius: '12px', height: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: colors.textMuted }}>
              <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>🏛️</div>
              <div style={{ fontSize: '14px', fontWeight: '600' }}>Proje detaylarını girin ve PMI standartlarında plan oluşturun.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// YARDIMCI BİLEŞENLER
function Section({ title, items, color }: any) {
  return (
    <div>
      <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color }}>{title}</h4>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {items.map((item: string, i: number) => (
          <span key={i} style={{ padding: '4px 10px', background: color + '15', color, borderRadius: '6px', fontSize: '11px', fontWeight: '600', border: `1px solid ${color}33` }}>
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

function WBSStructure({ data, accent, colors }: any) {
  return (
    <div style={{ background: colors.bg, padding: '16px', borderRadius: '12px', border: `1px solid ${colors.border}` }}>
      <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: accent }}>🏗️ WBS (İş Kırılım Yapısı)</h4>
      {data.map((node: any, i: number) => (
        <div key={i} style={{ marginBottom: '10px' }}>
          <div style={{ fontWeight: '700', fontSize: '12px', color: accent }}>{node.phase}</div>
          <div style={{ paddingLeft: '16px', borderLeft: `1px dashed ${colors.border}`, marginTop: '4px' }}>
            {node.tasks.map((t: string, j: number) => (
              <div key={j} style={{ fontSize: '11px', padding: '2px 0', color: colors.text }}>• {t}</div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}