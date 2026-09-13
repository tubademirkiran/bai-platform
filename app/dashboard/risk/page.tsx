'use client'

import { useState } from 'react'
import { useTheme } from '@/lib/theme-context'
import { useGenerate } from '@/lib/use-generate'
import { useMediaQuery } from '@/lib/use-media-query'
import { PageHeader } from '@/components/ui/page-header'
import { CopyButton } from '@/components/ui/copy-button'
import { Prose } from '@/components/ui/prose'
import { EmptyState } from '@/components/ui/empty-state'
import {
  ShieldAlert, Rocket, Smartphone, Building2, Users, CalendarDays,
  ListChecks, SlidersHorizontal, ChevronDown, ChevronUp, Zap, Loader2, Square,
} from 'lucide-react'

type PresetKey = 'mvp' | 'standard' | 'enterprise'

export default function RiskPage() {
  const { accent, colors, lang } = useTheme()
  const { text: output, loading, error, run, stop } = useGenerate('/api/risk/analyze')
  const isNarrow = useMediaQuery('(max-width: 1023px)')

  // Form state
  const [teamSize, setTeamSize] = useState('5')
  const [duration, setDuration] = useState('12')
  const [backlogSize, setBacklogSize] = useState('50')
  const [seniority, setSeniority] = useState('mixed')
  const [projectType, setProjectType] = useState('web')
  const [externalDependencies, setExternalDependencies] = useState('2')
  const [showAdvanced, setShowAdvanced] = useState(false)

  const s = {
    tr: {
      title: 'Risk Analyzer',
      badge: 'AI',
      desc: 'Proje metriklerini girin, yapay zeka teslimat risklerini ve çözüm yollarını çıkarsın.',
      presets: 'HIZLI SENARYOLAR',
      mvp: 'MVP', standard: 'Standart', enterprise: 'Kurumsal',
      teamSize: 'Ekip Büyüklüğü', duration: 'Süre', backlogSize: 'Backlog',
      unitPeople: 'kişi', unitWeeks: 'hafta', unitTasks: 'görev',
      advanced: 'Gelişmiş Parametreler',
      seniority: 'Ekip Kıdem Seviyesi',
      seniorityOpts: [
        { value: 'junior', label: 'Junior ağırlıklı (yüksek risk)' },
        { value: 'mixed', label: 'Dengeli karma ekip' },
        { value: 'senior', label: 'Senior ağırlıklı (düşük risk)' },
      ],
      projectType: 'Proje Tipi',
      projectTypeOpts: [
        { value: 'web', label: 'Web ve mobil uygulama' },
        { value: 'fintech', label: 'Finans ve ödeme entegrasyonu' },
        { value: 'ai', label: 'Yapay zeka ve veri bilimi' },
        { value: 'migration', label: 'Eski sistem taşıma' },
      ],
      dependencies: 'Dış Bağımlılık Sayısı',
      submit: 'Riskleri Analiz Et',
      loading: 'AI riskleri analiz ediyor...',
      stopLabel: 'Durdur',
      resultTitle: 'Risk Değerlendirme Raporu',
      empty: 'Risk raporunuz burada görüntülenecek. Soldaki parametreleri doldurup analizi başlatın.',
      copy: 'Kopyala', copied: 'Kopyalandı',
      footer: 'Kurumsal teslimat standartları',
    },
    en: {
      title: 'Risk Analyzer',
      badge: 'AI',
      desc: 'Enter your project metrics and let AI surface delivery risks and mitigations.',
      presets: 'QUICK PRESETS',
      mvp: 'MVP', standard: 'Standard', enterprise: 'Enterprise',
      teamSize: 'Team Size', duration: 'Duration', backlogSize: 'Backlog',
      unitPeople: 'people', unitWeeks: 'weeks', unitTasks: 'tasks',
      advanced: 'Advanced Parameters',
      seniority: 'Team Seniority Profile',
      seniorityOpts: [
        { value: 'junior', label: 'Junior-heavy (high risk)' },
        { value: 'mixed', label: 'Balanced mixed team' },
        { value: 'senior', label: 'Senior-heavy (low risk)' },
      ],
      projectType: 'Project Category',
      projectTypeOpts: [
        { value: 'web', label: 'Web and mobile app' },
        { value: 'fintech', label: 'Finance and payment integration' },
        { value: 'ai', label: 'AI and data science' },
        { value: 'migration', label: 'Legacy system migration' },
      ],
      dependencies: 'External Dependencies',
      submit: 'Analyze Risks',
      loading: 'AI is analyzing risks...',
      stopLabel: 'Stop',
      resultTitle: 'Risk Assessment Report',
      empty: 'Your risk report will appear here. Fill in the parameters on the left to begin.',
      copy: 'Copy', copied: 'Copied',
      footer: 'Enterprise delivery standards',
    },
    de: {
      title: 'Risikoanalysator',
      badge: 'KI',
      desc: 'Geben Sie Projektmetriken ein, die KI ermittelt Lieferrisiken und Gegenmaßnahmen.',
      presets: 'SCHNELLSZENARIEN',
      mvp: 'MVP', standard: 'Standard', enterprise: 'Enterprise',
      teamSize: 'Teamgröße', duration: 'Dauer', backlogSize: 'Backlog',
      unitPeople: 'Personen', unitWeeks: 'Wochen', unitTasks: 'Aufgaben',
      advanced: 'Erweiterte Parameter',
      seniority: 'Team-Erfahrung',
      seniorityOpts: [
        { value: 'junior', label: 'Überwiegend Junior (hohes Risiko)' },
        { value: 'mixed', label: 'Ausgewogenes gemischtes Team' },
        { value: 'senior', label: 'Überwiegend Senior (geringes Risiko)' },
      ],
      projectType: 'Projekttyp',
      projectTypeOpts: [
        { value: 'web', label: 'Web- und mobile Anwendung' },
        { value: 'fintech', label: 'Finanz- und Zahlungsintegration' },
        { value: 'ai', label: 'KI und Data Science' },
        { value: 'migration', label: 'Migration von Altsystemen' },
      ],
      dependencies: 'Externe Abhängigkeiten',
      submit: 'Risiken Analysieren',
      loading: 'KI analysiert Risiken...',
      stopLabel: 'Stoppen',
      resultTitle: 'Risikobewertungsbericht',
      empty: 'Ihr Risikobericht erscheint hier. Füllen Sie links die Parameter aus.',
      copy: 'Kopieren', copied: 'Kopiert',
      footer: 'Enterprise-Lieferstandards',
    },
  }

  const t = s[lang as keyof typeof s] || s.tr

  const presets: Record<PresetKey, Record<string, string>> = {
    mvp: { teamSize: '3', duration: '4', backlogSize: '25', seniority: 'junior', projectType: 'web', externalDependencies: '1' },
    standard: { teamSize: '6', duration: '12', backlogSize: '75', seniority: 'mixed', projectType: 'web', externalDependencies: '3' },
    enterprise: { teamSize: '14', duration: '24', backlogSize: '240', seniority: 'senior', projectType: 'migration', externalDependencies: '8' },
  }

  function applyPreset(key: PresetKey) {
    const p = presets[key]
    setTeamSize(p.teamSize)
    setDuration(p.duration)
    setBacklogSize(p.backlogSize)
    setSeniority(p.seniority)
    setProjectType(p.projectType)
    setExternalDependencies(p.externalDependencies)
  }

  const valid = [teamSize, duration, backlogSize].every((v) => Number(v) > 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!valid || loading) return
    await run({
      teamSize: Number(teamSize),
      duration: Number(duration),
      backlogSize: Number(backlogSize),
      seniority,
      projectType,
      externalDependencies: Number(externalDependencies),
      lang,
    })
  }

  // Ortak inline stiller — hepsi tema renklerine bağlı, sabit renk yok.
  const panelStyle: React.CSSProperties = {
    background: colors.card,
    border: `1px solid ${colors.border}`,
    borderRadius: '12px',
    padding: '20px',
  }
  const fieldLabelStyle: React.CSSProperties = {
    display: 'block', marginBottom: '6px',
    fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em',
    color: colors.textMuted,
  }
  const controlStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: '8px',
    border: `1px solid ${colors.border}`, background: colors.bg, color: colors.text,
    outline: 'none', fontSize: 'var(--bai-dashboard-font-size, 13px)',
  }

  const presetButtons: { key: PresetKey; label: string; Icon: typeof Rocket }[] = [
    { key: 'mvp', label: t.mvp, Icon: Rocket },
    { key: 'standard', label: t.standard, Icon: Smartphone },
    { key: 'enterprise', label: t.enterprise, Icon: Building2 },
  ]

  const numberFields: { label: string; unit: string; value: string; set: (v: string) => void; Icon: typeof Users }[] = [
    { label: t.teamSize, unit: t.unitPeople, value: teamSize, set: setTeamSize, Icon: Users },
    { label: t.duration, unit: t.unitWeeks, value: duration, set: setDuration, Icon: CalendarDays },
    { label: t.backlogSize, unit: t.unitTasks, value: backlogSize, set: setBacklogSize, Icon: ListChecks },
  ]

  return (
    <div>
      <PageHeader title={t.title} badge={t.badge} desc={t.desc} icon={ShieldAlert} />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isNarrow ? '1fr' : '5fr 7fr',
          gap: '20px',
          alignItems: 'start',
        }}
      >
        {/* SOL: parametre paneli */}
        <form onSubmit={handleSubmit} style={{ ...panelStyle, display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <span style={fieldLabelStyle}>{t.presets}</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {presetButtons.map(({ key, label, Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => applyPreset(key)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    padding: '8px 6px', borderRadius: '8px',
                    border: `1px solid ${colors.border}`, background: colors.bg, color: colors.text,
                    fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.color = accent }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.color = colors.text }}
                >
                  <Icon size={14} aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {numberFields.map(({ label, unit, value, set, Icon }) => (
            <div key={label}>
              <label style={fieldLabelStyle}>{label}</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Icon size={15} color={colors.textMuted} aria-hidden="true" style={{ position: 'absolute', left: '12px' }} />
                <input
                  type="number"
                  min="1"
                  required
                  value={value}
                  onChange={(e) => set(e.target.value)}
                  style={{ ...controlStyle, paddingLeft: '36px', paddingRight: `${unit.length * 7 + 20}px` }}
                />
                <span style={{ position: 'absolute', right: '12px', fontSize: '11px', fontWeight: 600, color: colors.textMuted }}>
                  {unit}
                </span>
              </div>
            </div>
          ))}

          {/* Gelişmiş parametreler */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
                padding: '4px 0', background: 'transparent', border: 'none', cursor: 'pointer',
                fontSize: '12px', fontWeight: 700, color: accent,
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <SlidersHorizontal size={14} aria-hidden="true" />
                {t.advanced}
              </span>
              {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showAdvanced && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px', paddingTop: '14px', borderTop: `1px solid ${colors.border}` }}>
                <div>
                  <label style={fieldLabelStyle}>{t.seniority}</label>
                  <select value={seniority} onChange={(e) => setSeniority(e.target.value)} style={controlStyle}>
                    {t.seniorityOpts.map((o) => (
                      <option key={o.value} value={o.value} style={{ background: colors.card, color: colors.text }}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={fieldLabelStyle}>{t.projectType}</label>
                  <select value={projectType} onChange={(e) => setProjectType(e.target.value)} style={controlStyle}>
                    {t.projectTypeOpts.map((o) => (
                      <option key={o.value} value={o.value} style={{ background: colors.card, color: colors.text }}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={fieldLabelStyle}>{t.dependencies}</label>
                  <input
                    type="number"
                    min="0"
                    value={externalDependencies}
                    onChange={(e) => setExternalDependencies(e.target.value)}
                    style={controlStyle}
                  />
                </div>
              </div>
            )}
          </div>

          {error && (
            <div style={{
              padding: '10px 12px', borderRadius: '8px', fontSize: '12px',
              background: '#ef444418', border: '1px solid #ef444455', color: '#ef4444',
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="submit"
              disabled={!valid || loading}
              style={{
                flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                padding: '11px 16px', borderRadius: '8px', border: 'none',
                background: accent, color: '#fff', fontSize: '13px', fontWeight: 700,
                cursor: !valid || loading ? 'not-allowed' : 'pointer',
                opacity: !valid || loading ? 0.6 : 1, transition: 'opacity 0.2s',
              }}
            >
              {loading
                ? <><Loader2 size={15} className="animate-spin" aria-hidden="true" />{t.loading}</>
                : <><Zap size={15} aria-hidden="true" />{t.submit}</>}
            </button>
            {loading && (
              <button
                type="button"
                onClick={stop}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '11px 14px', borderRadius: '8px',
                  border: `1px solid ${colors.border}`, background: colors.card, color: colors.text,
                  fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                }}
              >
                <Square size={13} aria-hidden="true" />
                {t.stopLabel}
              </button>
            )}
          </div>
        </form>

        {/* SAĞ: rapor paneli */}
        <div style={{ ...panelStyle, display: 'flex', flexDirection: 'column', minHeight: '520px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
            paddingBottom: '14px', marginBottom: '14px', borderBottom: `1px solid ${colors.border}`,
          }}>
            <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: colors.text }}>
              {t.resultTitle}
            </h3>
            {output && <CopyButton getText={() => output} label={t.copy} copiedLabel={t.copied} />}
          </div>

          <div style={{ flex: 1 }}>
            {output
              ? <Prose>{output}</Prose>
              : <EmptyState icon={<ShieldAlert size={40} />} text={loading ? t.loading : t.empty} minHeight={380} />}
          </div>

          <div style={{
            marginTop: '16px', paddingTop: '12px', borderTop: `1px solid ${colors.border}`,
            fontSize: '10px', color: colors.textMuted, textAlign: 'right',
          }}>
            {t.footer}
          </div>
        </div>
      </div>
    </div>
  )
}
