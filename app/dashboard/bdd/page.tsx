'use client'

import { useState } from 'react'
import { useTheme } from '@/lib/theme-context'
import { Textarea } from '@/components/ui/textarea'
import { PageHeader } from '@/components/ui/page-header'
import { CopyButton } from '@/components/ui/copy-button'
import { Loader2, Terminal, BookOpen, CheckCircle2, Bot, Download } from 'lucide-react'

export default function BddPage() {
  const { accent, colors, lang } = useTheme()
  const [requirement, setRequirement] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'story' | 'gherkin' | 'both'>('both')

  const ui = {
    tr: {
      title: 'User Story & BDD Studio',
      desc: 'Gereksinimi modern Agile formatına ve Gherkin sözdizimine otomatik dönüştür.',
      inputLabel: 'GEREKSİNİM METNİ',
      inputPlaceholder: 'Örnek: Kullanıcı sisteme email ve şifre ile giriş yapabilmeli. Hatalı girişte uyarı gösterilmeli...',
      generateBtn: 'User Story & Gherkin Üret',
      generatingBtn: 'AI üretiyor...',
      storyTab: 'User Story',
      gherkinTab: 'Gherkin',
      bothTab: 'İkisi Birden',
      storyTitle: 'USER STORY',
      asA: 'OLARAK',
      iWant: 'İSTİYORUM Kİ',
      soThat: 'BÖYLECE',
      acTitle: 'KABUL KRİTERLERİ',
      gherkinTitle: 'GHERKIN SENARYOLARI',
      scenarioLabel: 'SENARYO',
      given: 'VERİLDİĞİNDE',
      when: 'NE ZAMAN',
      then: 'O ZAMAN',
      and: 'VE',
      copyBtn: 'Kopyala',
      copiedBtn: 'Kopyalandı',
      downloadBtn: 'İndir (.feature)',
      emptyTitle: 'Gereksinim metni girin',
      emptyDesc: 'AI otomatik User Story ve Gherkin senaryoları üretecek',
      tagLabel: 'ETİKETLER',
      priorityLabel: 'ÖNCELİK',
      storyPointsLabel: 'STORY POINT',
    },
    en: {
      title: 'User Story & BDD Studio',
      desc: 'Automatically convert requirements to modern Agile format and Gherkin syntax.',
      inputLabel: 'REQUIREMENT TEXT',
      inputPlaceholder: 'Example: Users should be able to login with email and password. Show error on wrong credentials...',
      generateBtn: 'Generate User Story & Gherkin',
      generatingBtn: 'AI generating...',
      storyTab: 'User Story',
      gherkinTab: 'Gherkin',
      bothTab: 'Both',
      storyTitle: 'USER STORY',
      asA: 'AS A',
      iWant: 'I WANT TO',
      soThat: 'SO THAT',
      acTitle: 'ACCEPTANCE CRITERIA',
      gherkinTitle: 'GHERKIN SCENARIOS',
      scenarioLabel: 'SCENARIO',
      given: 'GIVEN',
      when: 'WHEN',
      then: 'THEN',
      and: 'AND',
      copyBtn: 'Copy',
      copiedBtn: 'Copied',
      downloadBtn: 'Download (.feature)',
      emptyTitle: 'Enter requirement text',
      emptyDesc: 'AI will generate User Stories and Gherkin scenarios automatically',
      tagLabel: 'TAGS',
      priorityLabel: 'PRIORITY',
      storyPointsLabel: 'STORY POINTS',
    },
    de: {
      title: 'User Story & BDD Studio',
      desc: 'Anforderungen automatisch in modernes Agile-Format und Gherkin-Syntax konvertieren.',
      inputLabel: 'ANFORDERUNGSTEXT',
      inputPlaceholder: 'Beispiel: Benutzer sollen sich mit E-Mail und Passwort anmelden können...',
      generateBtn: 'User Story & Gherkin generieren',
      generatingBtn: 'KI generiert...',
      storyTab: 'User Story',
      gherkinTab: 'Gherkin',
      bothTab: 'Beide',
      storyTitle: 'USER STORY',
      asA: 'ALS',
      iWant: 'MÖCHTE ICH',
      soThat: 'DAMIT',
      acTitle: 'AKZEPTANZKRITERIEN',
      gherkinTitle: 'GHERKIN-SZENARIEN',
      scenarioLabel: 'SZENARIO',
      given: 'GEGEBEN',
      when: 'WENN',
      then: 'DANN',
      and: 'UND',
      copyBtn: 'Kopieren',
      copiedBtn: 'Kopiert',
      downloadBtn: 'Herunterladen (.feature)',
      emptyTitle: 'Anforderungstext eingeben',
      emptyDesc: 'KI generiert automatisch User Stories und Gherkin-Szenarien',
      tagLabel: 'TAGS',
      priorityLabel: 'PRIORITÄT',
      storyPointsLabel: 'STORY PUNKTE',
    },
  }

  const s = ui[lang] || ui.tr

  async function handleGenerate() {
    if (!requirement.trim()) return
    setLoading(true)
    setResult(null)

    const response = await fetch('/api/bdd/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requirement, lang }),
    })
    const data = await response.json()
    setResult(data.result)
    setLoading(false)
  }

  function handleDownload() {
    if (!result?.scenarios) return
    const featureContent = `Feature: ${result.story?.title || 'Feature'}\n\n` +
      result.scenarios.map((sc: any) =>
        `  Scenario: ${sc.title}\n` +
        sc.steps.map((step: any) => `    ${step.keyword} ${step.text}`).join('\n')
      ).join('\n\n')

    const blob = new Blob([featureContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'feature.feature'
    a.click()
  }

  const priorityColors: Record<string, string> = {
    HIGH: '#ef4444', YUKSEK: '#ef4444', KRITIK: '#ef4444',
    MEDIUM: '#f59e0b', ORTA: '#f59e0b',
    LOW: '#10b981', DUSUK: '#10b981',
  }

const keywordColor = (kw: string) => {
    // Görev (b): TR Diakritik düzeltmesi uygulandı (toUpperCase yerine toLocaleUpperCase kullanıldı)
    const k = kw.toLocaleUpperCase('tr-TR')
    if (['GIVEN', 'VERİLDİĞİNDE', 'GEGEBEN'].some(x => k.includes(x))) return '#3b82f6'
    if (['WHEN', 'NE ZAMAN', 'WENN'].some(x => k.includes(x))) return '#8b5cf6'
    if (['THEN', 'O ZAMAN', 'DANN'].some(x => k.includes(x))) return '#10b981'
    return accent
  }

  const btnStyle = {
    padding: '6px 12px',
    borderRadius: '8px',
    border: `0.5px solid ${colors.border}`,
    background: colors.card,
    color: colors.text,
    fontSize: '11px',
    fontWeight: '600' as const,
    cursor: 'pointer',
  }

  return (
    <div>
      {/* Görev (a): Yanlış proplar düzeltildi ve Icon eklendi */}
      <PageHeader title={s.title} description={s.desc} icon={Terminal} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '16px' }}>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ background: colors.card, border: `0.5px solid ${colors.border}`, borderRadius: '12px', padding: '20px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: colors.textMuted, marginBottom: '10px', letterSpacing: '0.06em' }}>
              {s.inputLabel}
            </div>
            <Textarea
              placeholder={s.inputPlaceholder}
              style={{ minHeight: '180px', background: colors.bg, color: colors.text, borderColor: colors.border, fontSize: '13px' }}
              value={requirement}
              onChange={e => setRequirement(e.target.value)}
            />

            <div style={{ display: 'flex', gap: '6px', marginTop: '12px', marginBottom: '12px' }}>
              {(['both', 'story', 'gherkin'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{ flex: 1, padding: '7px', borderRadius: '8px', border: activeTab === tab ? `2px solid ${accent}` : `0.5px solid ${colors.border}`, background: activeTab === tab ? accent + '22' : 'transparent', color: activeTab === tab ? accent : colors.textMuted, fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
                >
                  {tab === 'both' ? s.bothTab : tab === 'story' ? s.storyTab : s.gherkinTab}
                </button>
              ))}
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading || !requirement.trim()}
              style={{ width: '100%', padding: '11px', borderRadius: '8px', border: 'none', background: !requirement.trim() ? colors.border : accent, color: '#fff', fontWeight: '700', fontSize: '13px', cursor: (loading || !requirement.trim()) ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? s.generatingBtn : s.generateBtn}
            </button>
          </div>

          <div style={{ background: colors.card, border: `0.5px solid ${colors.border}`, borderRadius: '12px', padding: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: colors.textMuted, marginBottom: '10px' }}>BDD NEDİR?</div>
            {[
              { Icon: BookOpen, text: 'User Story: Kim, ne istiyor, neden?' },
              { Icon: CheckCircle2, text: 'Acceptance Criteria: Nasıl doğrulanır?' },
              { Icon: Terminal, text: 'Gherkin: Given/When/Then formatı' },
              { Icon: Bot, text: 'Cucumber/SpecFlow ile direkt kullanım' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', borderBottom: i < 3 ? `0.5px solid ${colors.border}` : 'none' }}>
                <span style={{ display: 'flex', color: colors.textMuted }}><item.Icon size={14} /></span>
                <span style={{ fontSize: '12px', color: colors.textMuted }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          {!result && !loading && (
            <div style={{ background: colors.card, border: `0.5px solid ${colors.border}`, borderRadius: '12px', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '12px' }}>
              <Terminal size={44} style={{ opacity: 0.2 }} />
              <div style={{ fontSize: '14px', color: colors.textMuted }}>{s.emptyTitle}</div>
              <div style={{ fontSize: '12px', color: colors.textMuted, opacity: 0.7, textAlign: 'center' }}>{s.emptyDesc}</div>
            </div>
          )}

          {loading && (
            <div style={{ background: colors.card, border: `0.5px solid ${colors.border}`, borderRadius: '12px', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '16px' }}>
              <Loader2 size={36} style={{ animation: 'pulse 1.5s infinite' }} />
              <div style={{ fontSize: '14px', color: colors.text }}>BDD formatına dönüştürülüyor...</div>
              {['User Story analiz ediliyor', 'Kabul kriterleri belirleniyor', 'Gherkin senaryoları yazılıyor', 'Adımlar optimize ediliyor'].map((step, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: accent, opacity: 0.4 + i * 0.2 }}></div>
                  <span style={{ fontSize: '12px', color: colors.textMuted }}>{step}</span>
                </div>
              ))}
            </div>
          )}

          {result && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

              {(activeTab === 'both' || activeTab === 'story') && result.story && (
                <div style={{ background: colors.card, border: `0.5px solid ${colors.border}`, borderRadius: '12px', padding: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: colors.textMuted }}>{s.storyTitle}</div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      {result.story.priority && (
                        <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '10px', background: (priorityColors[result.story.priority] || accent) + '22', color: priorityColors[result.story.priority] || accent }}>
                          {result.story.priority}
                        </span>
                      )}
                      {result.story.storyPoints && (
                        <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '10px', background: accent + '22', color: accent }}>
                          {result.story.storyPoints} SP
                        </span>
                      )}
                      <CopyButton getText={() => `As a ${result.story.asA}\nI want to ${result.story.iWantTo}\nSo that ${result.story.soThat}`} label={s.copyBtn} copiedLabel={s.copiedBtn} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                    {[
                      { label: s.asA, value: result.story.asA, color: '#3b82f6' },
                      { label: s.iWant, value: result.story.iWantTo, color: '#8b5cf6' },
                      { label: s.soThat, value: result.story.soThat, color: '#10b981' },
                    ].map((row, i) => (
                      <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '10px', borderRadius: '8px', background: colors.bg }}>
                        <div style={{ fontSize: '10px', fontWeight: '700', color: row.color, minWidth: '80px', paddingTop: '1px', letterSpacing: '0.04em' }}>{row.label}</div>
                        <div style={{ fontSize: '13px', color: colors.text, flex: 1 }}>{row.value}</div>
                      </div>
                    ))}
                  </div>

                  {result.story.acceptanceCriteria?.length > 0 && (
                    <>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: colors.textMuted, marginBottom: '8px' }}>{s.acTitle}</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {result.story.acceptanceCriteria.map((ac: string, i: number) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '8px', borderRadius: '6px', background: colors.bg }}>
                            <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: accent + '22', color: accent, fontSize: '10px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                              {i + 1}
                            </div>
                            <span style={{ fontSize: '12px', color: colors.text }}>{ac}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {result.story.tags?.length > 0 && (
                    <div style={{ marginTop: '12px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {result.story.tags.map((tag: string, i: number) => (
                        <span key={i} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', background: colors.bg, border: `0.5px solid ${colors.border}`, color: colors.textMuted }}>
                          @{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {(activeTab === 'both' || activeTab === 'gherkin') && result.scenarios?.length > 0 && (
                <div style={{ background: colors.card, border: `0.5px solid ${colors.border}`, borderRadius: '12px', padding: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: colors.textMuted }}>{s.gherkinTitle}</div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <CopyButton
                        getText={() => result.scenarios.map((sc: any) =>
                          `Scenario: ${sc.title}\n` +
                          sc.steps.map((st: any) => `  ${st.keyword} ${st.text}`).join('\n')
                        ).join('\n\n')}
                        label={s.copyBtn}
                        copiedLabel={s.copiedBtn}
                      />
                      <button onClick={handleDownload} style={{ ...btnStyle, display: 'inline-flex', alignItems: 'center', gap: '6px', color: accent, border: `0.5px solid ${accent}44` }}>
                        <Download size={13} /> {s.downloadBtn}
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {result.scenarios.map((scenario: any, si: number) => (
                      <div key={si} style={{ borderRadius: '10px', border: `0.5px solid ${colors.border}`, overflow: 'hidden' }}>
                        <div style={{ padding: '10px 14px', background: accent + '11', borderBottom: `0.5px solid ${colors.border}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 7px', borderRadius: '10px', background: accent + '22', color: accent }}>
                            {s.scenarioLabel} {si + 1}
                          </span>
                          <span style={{ fontSize: '13px', fontWeight: '700', color: colors.text }}>{scenario.title}</span>
                          {scenario.type && (
                            <span style={{ marginLeft: 'auto', fontSize: '10px', color: colors.textMuted }}>{scenario.type}</span>
                          )}
                        </div>
                        <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '4px', background: colors.bg, fontFamily: 'monospace' }}>
                          {scenario.steps?.map((step: any, si2: number) => (
                            <div key={si2} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                              <span style={{ fontSize: '11px', fontWeight: '700', color: keywordColor(step.keyword), minWidth: '70px', textAlign: 'right', flexShrink: 0 }}>
                                {step.keyword}
                              </span>
                              <span style={{ fontSize: '12px', color: colors.text }}>{step.text}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
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