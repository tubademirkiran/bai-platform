'use client'

import { useState } from 'react'
import { useTheme } from '@/lib/theme-context'
import { Textarea } from '@/components/ui/textarea'
import { getHistory } from '@/lib/history'

export default function ImpactPage() {
  const { accent, colors, lang } = useTheme()
  const [currentRule, setCurrentRule] = useState('')
  const [newRule, setNewRule] = useState('')
  const [context, setContext] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [copied, setCopied] = useState(false)

  const ui = {
    tr: {
      title: 'Etki Analizci',
      desc: 'Bir kuralı değiştirirseniz sistemin hangi modüllerini, tabloları ve test senaryolarını etkiler?',
      changeTitle: 'DEĞİŞİKLİK TANIMI',
      currentLabel: 'MEVCUT KURAL',
      currentPlaceholder: 'Örnek: Kullanıcı şifresi en az 6 karakter olmalı',
      newLabel: 'YENİ KURAL',
      newPlaceholder: 'Örnek: Şifre en az 12 karakter, büyük harf, rakam ve özel karakter içermeli',
      contextLabel: 'SİSTEM KONTEKSTİ (Opsiyonel)',
      contextPlaceholder: 'Sistem mimarisi, mevcut modüller veya dokümanları buraya yapıştırın...',
      contextHint: 'Geçmiş modülü otomatik doldurur veya manuel yazabilirsiniz',
      loadHistory: '🕓 Geçmişten Yükle',
      loadingHistory: 'Yükleniyor...',
      analyzeBtn: 'Etki Analizini Başlat',
      analyzingBtn: 'AI analiz ediyor...',
      howTitle: 'NASIL ÇALIŞIR?',
      howSteps: ['Mevcut ve yeni kuralı karşılaştırır', 'Etkilenen modülleri tespit eder', 'Veritabanı tablolarını analiz eder', 'Test senaryolarını listeler', 'Risk seviyesi atar'],
      emptyTitle: 'Mevcut ve yeni kuralı girin',
      emptyDesc: 'AI sisteminizin hangi parçalarının etkileneceğini analiz eder',
      analyzingTitle: 'Sistem analiz ediliyor...',
      analyzingSteps: ['Modüller taranıyor', 'Veritabanı etkileri hesaplanıyor', 'Test senaryoları belirleniyor', 'Risk skoru hesaplanıyor'],
      riskLabel: 'GENEL RİSK SEVİYESİ',
      modulesTitle: 'ETKİLENEN MODÜLLER',
      dbTitle: 'VERİTABANI ETKİLERİ',
      testTitle: 'GÜNCELLENMESİ GEREKEN TEST SENARYOLARI',
      aiTitle: 'AI ÖNERİSİ',
    },
    en: {
      title: 'Impact Analyzer',
      desc: 'If you change a rule, which modules, tables and test cases will be affected?',
      changeTitle: 'CHANGE DEFINITION',
      currentLabel: 'CURRENT RULE',
      currentPlaceholder: 'Example: User password must be at least 6 characters',
      newLabel: 'NEW RULE',
      newPlaceholder: 'Example: Password must be at least 12 characters with uppercase, number and special char',
      contextLabel: 'SYSTEM CONTEXT (Optional)',
      contextPlaceholder: 'Paste system architecture, existing modules or documents here...',
      contextHint: 'History module fills this automatically or you can write manually',
      loadHistory: '🕓 Load from History',
      loadingHistory: 'Loading...',
      analyzeBtn: 'Start Impact Analysis',
      analyzingBtn: 'AI analyzing...',
      howTitle: 'HOW IT WORKS?',
      howSteps: ['Compares current and new rule', 'Identifies affected modules', 'Analyzes database tables', 'Lists test scenarios', 'Assigns risk level'],
      emptyTitle: 'Enter current and new rule',
      emptyDesc: 'AI analyzes which parts of your system will be affected',
      analyzingTitle: 'Analyzing system...',
      analyzingSteps: ['Scanning modules', 'Calculating database impacts', 'Identifying test scenarios', 'Calculating risk score'],
      riskLabel: 'OVERALL RISK LEVEL',
      modulesTitle: 'AFFECTED MODULES',
      dbTitle: 'DATABASE IMPACTS',
      testTitle: 'TEST CASES TO UPDATE',
      aiTitle: 'AI RECOMMENDATION',
    },
    de: {
      title: 'Auswirkungsanalyse',
      desc: 'Welche Module, Tabellen und Testfälle werden betroffen, wenn Sie eine Regel ändern?',
      changeTitle: 'ÄNDERUNGSDEFINITION',
      currentLabel: 'AKTUELLE REGEL',
      currentPlaceholder: 'Beispiel: Benutzerpasswort muss mindestens 6 Zeichen lang sein',
      newLabel: 'NEUE REGEL',
      newPlaceholder: 'Beispiel: Passwort muss mindestens 12 Zeichen mit Großbuchstaben und Sonderzeichen haben',
      contextLabel: 'SYSTEMKONTEXT (Optional)',
      contextPlaceholder: 'Systemarchitektur, vorhandene Module oder Dokumente hier einfügen...',
      contextHint: 'Verlaufsmodul füllt dies automatisch aus oder Sie können manuell schreiben',
      loadHistory: '🕓 Aus Verlauf laden',
      loadingHistory: 'Wird geladen...',
      analyzeBtn: 'Auswirkungsanalyse starten',
      analyzingBtn: 'KI analysiert...',
      howTitle: 'WIE ES FUNKTIONIERT?',
      howSteps: ['Vergleicht aktuelle und neue Regel', 'Identifiziert betroffene Module', 'Analysiert Datenbanktabellen', 'Listet Testszenarien auf', 'Weist Risikostufe zu'],
      emptyTitle: 'Aktuelle und neue Regel eingeben',
      emptyDesc: 'KI analysiert, welche Teile Ihres Systems betroffen sein werden',
      analyzingTitle: 'System wird analysiert...',
      analyzingSteps: ['Module werden gescannt', 'Datenbankauswirkungen werden berechnet', 'Testszenarien werden identifiziert', 'Risikoscore wird berechnet'],
      riskLabel: 'GESAMTRISIKOSTUFE',
      modulesTitle: 'BETROFFENE MODULE',
      dbTitle: 'DATENBANKAUSWIRKUNGEN',
      testTitle: 'ZU AKTUALISIERENDE TESTFÄLLE',
      aiTitle: 'KI-EMPFEHLUNG',
    },
  }

  const s = ui[lang] || ui.tr

  const riskColors: Record<string, string> = {
    KRİTİK: '#ef4444', KRITIK: '#ef4444', CRITICAL: '#ef4444',
    YÜKSEK: '#f97316', YUKSEK: '#f97316', HIGH: '#f97316',
    ORTA: '#f59e0b', MEDIUM: '#f59e0b',
    DÜŞÜK: '#10b981', DUSUK: '#10b981', LOW: '#10b981',
  }

  async function loadFromHistory() {
    setLoadingHistory(true)
    const history = await getHistory()
    const combined = history
      .slice(0, 10)
      .map((h: any) => `[${h.module.toUpperCase()}] ${h.input}: ${h.output?.slice(0, 200)}`)
      .join('\n\n')
    setContext(combined)
    setLoadingHistory(false)
  }

  async function handleAnalyze() {
    if (!currentRule.trim() || !newRule.trim()) return
    setLoading(true)
    setResult(null)
    const response = await fetch('/api/impact/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentRule, newRule, context, lang }),
    })
    const data = await response.json()
    setResult(data.result)
    setLoading(false)
  }

  async function handleCopy() {
    if (!result) return
    await navigator.clipboard.writeText(JSON.stringify(result, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: `0.5px solid ${colors.border}`,
    background: colors.bg,
    color: colors.text,
    fontSize: '13px',
    outline: 'none',
    marginTop: '6px',
  }

  const labelStyle = {
    fontSize: '11px',
    fontWeight: '700' as const,
    color: colors.textMuted,
    letterSpacing: '0.06em',
  }

  const getRiskColor = (level: string) => riskColors[level] || accent
  const getRiskIcon = (level: string) => ['KRİTİK', 'KRITIK', 'CRITICAL'].includes(level) ? '🚨' : ['YÜKSEK', 'YUKSEK', 'HIGH'].includes(level) ? '⚠️' : ['ORTA', 'MEDIUM'].includes(level) ? '🟡' : '✅'

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '800', color: colors.text, marginBottom: '4px' }}>{s.title}</h2>
        <p style={{ fontSize: '13px', color: colors.textMuted }}>{s.desc}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ background: colors.card, border: `0.5px solid ${colors.border}`, borderRadius: '12px', padding: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: colors.textMuted, marginBottom: '16px', letterSpacing: '0.06em' }}>{s.changeTitle}</div>

            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>{s.currentLabel}</label>
              <input style={inputStyle} placeholder={s.currentPlaceholder} value={currentRule} onChange={e => setCurrentRule(e.target.value)} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '4px 0', fontSize: '20px', color: colors.textMuted }}>↓</div>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>{s.newLabel}</label>
              <input style={inputStyle} placeholder={s.newPlaceholder} value={newRule} onChange={e => setNewRule(e.target.value)} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={labelStyle}>{s.contextLabel}</label>
                <button onClick={loadFromHistory} disabled={loadingHistory} style={{ fontSize: '11px', fontWeight: '600', padding: '4px 10px', borderRadius: '6px', border: `0.5px solid ${accent}44`, background: accent + '11', color: accent, cursor: 'pointer' }}>
                  {loadingHistory ? s.loadingHistory : s.loadHistory}
                </button>
              </div>
              <Textarea placeholder={s.contextPlaceholder} style={{ minHeight: '120px', background: colors.bg, color: colors.text, borderColor: colors.border, fontSize: '12px' }} value={context} onChange={e => setContext(e.target.value)} />
              <div style={{ fontSize: '10px', color: colors.textMuted, marginTop: '4px' }}>{s.contextHint}</div>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={loading || !currentRule.trim() || !newRule.trim()}
              style={{ width: '100%', padding: '11px', borderRadius: '8px', border: 'none', background: (!currentRule.trim() || !newRule.trim()) ? colors.border : accent, color: '#fff', fontWeight: '700', fontSize: '13px', cursor: (loading || !currentRule.trim() || !newRule.trim()) ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? s.analyzingBtn : s.analyzeBtn}
            </button>
          </div>

          <div style={{ background: colors.card, border: `0.5px solid ${colors.border}`, borderRadius: '12px', padding: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: colors.textMuted, marginBottom: '10px' }}>{s.howTitle}</div>
            {['🔍', '🗂️', '🗄️', '✅', '⚠️'].map((icon, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', borderBottom: i < 4 ? `0.5px solid ${colors.border}` : 'none' }}>
                <span style={{ fontSize: '14px' }}>{icon}</span>
                <span style={{ fontSize: '12px', color: colors.textMuted }}>{s.howSteps[i]}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          {!result && !loading && (
            <div style={{ background: colors.card, border: `0.5px solid ${colors.border}`, borderRadius: '12px', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '12px' }}>
              <div style={{ fontSize: '52px', opacity: 0.2 }}>🔬</div>
              <div style={{ fontSize: '14px', color: colors.textMuted, textAlign: 'center' }}>{s.emptyTitle}</div>
              <div style={{ fontSize: '12px', color: colors.textMuted, textAlign: 'center', opacity: 0.7 }}>{s.emptyDesc}</div>
            </div>
          )}

          {loading && (
            <div style={{ background: colors.card, border: `0.5px solid ${colors.border}`, borderRadius: '12px', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '16px' }}>
              <div style={{ fontSize: '40px' }}>🔍</div>
              <div style={{ fontSize: '14px', color: colors.text }}>{s.analyzingTitle}</div>
              {s.analyzingSteps.map((step, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: accent, opacity: 0.5 + i * 0.15 }}></div>
                  <span style={{ fontSize: '12px', color: colors.textMuted }}>{step}</span>
                </div>
              ))}
            </div>
          )}

          {result && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ background: colors.card, border: `2px solid ${getRiskColor(result.riskLevel)}`, borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: getRiskColor(result.riskLevel) + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>
                  {getRiskIcon(result.riskLevel)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '11px', color: colors.textMuted, marginBottom: '2px' }}>{s.riskLabel}</div>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: getRiskColor(result.riskLevel) }}>{result.riskLevel}</div>
                  <div style={{ fontSize: '12px', color: colors.textMuted, marginTop: '2px' }}>{result.summary}</div>
                </div>
                <button onClick={handleCopy} style={{ padding: '6px 12px', borderRadius: '8px', border: `0.5px solid ${colors.border}`, background: colors.bg, color: colors.text, fontSize: '11px', cursor: 'pointer' }}>
                  {copied ? '✅' : '📋'}
                </button>
              </div>

              {result.affectedModules?.length > 0 && (
                <div style={{ background: colors.card, border: `0.5px solid ${colors.border}`, borderRadius: '12px', padding: '16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: colors.textMuted, marginBottom: '10px' }}>{s.modulesTitle}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {result.affectedModules.map((mod: any, i: number) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px', borderRadius: '8px', background: colors.bg }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: getRiskColor(mod.risk) + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>
                          {getRiskIcon(mod.risk)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                            <span style={{ fontSize: '13px', fontWeight: '700', color: colors.text }}>{mod.name}</span>
                            <span style={{ fontSize: '10px', fontWeight: '600', padding: '1px 6px', borderRadius: '10px', background: getRiskColor(mod.risk) + '22', color: getRiskColor(mod.risk) }}>{mod.risk}</span>
                          </div>
                          <div style={{ fontSize: '12px', color: colors.textMuted }}>{mod.reason}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.databaseImpact?.length > 0 && (
                <div style={{ background: colors.card, border: `0.5px solid ${colors.border}`, borderRadius: '12px', padding: '16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: colors.textMuted, marginBottom: '10px' }}>{s.dbTitle}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {result.databaseImpact.map((db: any, i: number) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px', borderRadius: '8px', background: colors.bg }}>
                        <span style={{ fontSize: '16px' }}>🗄️</span>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '700', color: colors.text, fontFamily: 'monospace' }}>{db.table}</div>
                          <div style={{ fontSize: '12px', color: colors.textMuted }}>{db.change}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.testCases?.length > 0 && (
                <div style={{ background: colors.card, border: `0.5px solid ${colors.border}`, borderRadius: '12px', padding: '16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: colors.textMuted, marginBottom: '10px' }}>{s.testTitle}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {result.testCases.map((tc: string, i: number) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '8px 10px', borderRadius: '8px', background: colors.bg }}>
                        <span style={{ fontSize: '14px', flexShrink: 0 }}>✅</span>
                        <span style={{ fontSize: '12px', color: colors.text }}>{tc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.recommendation && (
                <div style={{ background: accent + '11', border: `0.5px solid ${accent}44`, borderRadius: '12px', padding: '16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: accent, marginBottom: '6px' }}>{s.aiTitle}</div>
                  <div style={{ fontSize: '13px', color: colors.text, lineHeight: '1.6' }}>{result.recommendation}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}