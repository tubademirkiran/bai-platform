'use client'

import { useState } from 'react'
import { useTheme } from '@/lib/theme-context'
import { Textarea } from '@/components/ui/textarea'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { CopyButton } from '@/components/ui/copy-button'
import { Loader2, Ticket, Bug, Zap, Tag, User, CheckCircle2, Settings, Ban, Rocket } from 'lucide-react'
// Geçmişe kayıt server tarafında (API route) yapılıyor.

export default function JiraGeneratorPage() {
  const { accent, colors, lang, isDark } = useTheme()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [copied, setCopied] = useState(false)

  // Form State
  const [form, setForm] = useState({
    project: 'HIS',
    issueType: 'Story',
    squad: 'Atom',
    owner: 'All',
    requirement: ''
  })

  async function handleGenerate() {
    if (!form.requirement.trim()) return
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/jira/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, lang }),
      })
      const data = await response.json()
      setResult(data.result)
      // Geçmişe kayıt server tarafında yapılıyor.
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const buildJiraText = () => {
    if (!result) return ''
    return `h2. Özet\n${result.summary}\n\nh2. User Story\n${result.user_story}\n\nh2. Kabul Kriterleri (Acceptance Criteria)\n${result.acceptance_criteria.map((c: string) => `* ${c}`).join('\n')}\n\nh2. Teknik Notlar & Varsayımlar\n${result.technical_notes}\n\nh2. Kapsam Dışı (Out of Scope)\n${result.out_of_scope}\n\n**Story Point:** ${result.story_point} (${result.sp_reason})\n**Önerilen Etiketler:** ${result.labels.join(', ')}`
  }

  const inputStyle = {
    width: '100%', padding: '10px 12px', borderRadius: '8px',
    border: `1px solid ${colors.border}`, background: colors.bg,
    color: colors.text, fontSize: '12px', outline: 'none', marginBottom: '14px', fontWeight: '500'
  }

  const getPriorityColor = (priority: string) => {
    if (priority.includes('High')) return '#ef4444'
    if (priority.includes('Medium')) return '#f59e0b'
    return '#3b82f6'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
      <PageHeader
        title="AI Jira Issue Generator"
        badge="Agile/Scrum"
        desc={lang === 'tr' ? 'Ham talepleri Developer-Ready (Geliştirmeye Hazır) teknik Jira biletlerine dönüştürün.' : 'Convert raw requests into Developer-Ready technical Jira tickets.'}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '16px', alignItems: 'start', flex: 1 }}>
        
        {/* SOL PANEL: GİRDİ FORMU */}
        <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: '12px', padding: '18px', position: 'sticky', top: '0' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '700', color: colors.textMuted, marginBottom: '6px', display: 'block' }}>PROJE (PROJECT)</label>
              <select style={inputStyle} value={form.project} onChange={e => setForm({...form, project: e.target.value})}>
                <option value="HIS">HIS</option>
                <option value="HISNEXT">HISNEXT</option>
                <option value="WEB">WEB</option>
                <option value="MOB">MOB</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '700', color: colors.textMuted, marginBottom: '6px', display: 'block' }}>İŞ TİPİ (ISSUE TYPE)</label>
              <select style={inputStyle} value={form.issueType} onChange={e => setForm({...form, issueType: e.target.value})}>
                <option value="Story">Story</option>
                <option value="Task">Task</option>
                <option value="Bug">Bug</option>
                <option value="Epic">Epic</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '700', color: colors.textMuted, marginBottom: '6px', display: 'block' }}>SQUAD (TAKIM)</label>
              <select style={inputStyle} value={form.squad} onChange={e => setForm({...form, squad: e.target.value})}>
                <option value="Atom">Atom</option>
                <option value="Thirdparty">Thirdparty</option>
                <option value="700cent">700cent</option>
                <option value="Clinic">Clinic</option>
                <option value="Core">Core</option>
                <option value="Frontend">Frontend</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '700', color: colors.textMuted, marginBottom: '6px', display: 'block' }}>İŞ SAHİPLİĞİ</label>
              <select style={inputStyle} value={form.owner} onChange={e => setForm({...form, owner: e.target.value})}>
                <option value="All">All</option>
                <option value="Pazarlama">Pazarlama</option>
                <option value="Ürün Yönetimi">Ürün Yönetimi</option>
                <option value="Müşteri İlişkileri">Müşteri İlişkileri</option>
                <option value="Yönetim">Yönetim</option>
              </select>
            </div>
          </div>

          <label style={{ fontSize: '11px', fontWeight: '700', color: colors.textMuted, marginBottom: '6px', display: 'block' }}>GEREKSİNİM / HAM TALEP</label>
          <Textarea 
            style={{ ...inputStyle, minHeight: '160px', resize: 'vertical' }} 
            value={form.requirement}
            onChange={e => setForm({...form, requirement: e.target.value})}
            placeholder="Kullanıcıdan veya paydaştan gelen ham metni buraya yapıştırın. Yapay zeka bu metni analiz edip teknik detaylara bölecektir..." 
          />

          <button
            onClick={handleGenerate}
            disabled={loading || !form.requirement.trim()}
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'none', background: !form.requirement.trim() ? colors.border : accent, color: '#fff', fontWeight: '700', cursor: (loading || !form.requirement.trim()) ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Bilet Oluşturuluyor...' : 'Jira Bileti Üret'}
          </button>
        </div>

        {/* SAĞ PANEL: JIRA TICKET MOCKUP */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          {loading && (
            <EmptyState minHeight={500} icon={<Loader2 size={40} style={{ animation: 'pulse 1.5s infinite' }} />} text="Mimari ve teknik detaylar analiz ediliyor..." />
          )}

          {!result && !loading && (
            <EmptyState minHeight={500} icon={<Ticket size={56} />} text="Developer'ların seveceği, teknik derinliği olan Jira biletleri üretin." />
          )}

          {result && !loading && (
            <div style={{ background: isDark ? '#161b22' : '#ffffff', border: `1px solid ${colors.border}`, borderRadius: '12px', overflow: 'hidden', boxShadow: isDark ? 'none' : '0 4px 20px rgba(0,0,0,0.05)' }}>
              
              {/* TICKET HEADER */}
              <div style={{ padding: '16px 24px', borderBottom: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isDark ? '#0d1117' : '#f8fafc' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ background: form.issueType === 'Bug' ? '#ef4444' : form.issueType === 'Epic' ? '#8b5cf6' : '#10b981', color: '#fff', padding: '4px', borderRadius: '4px', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {form.issueType === 'Bug' ? <Bug size={14} /> : form.issueType === 'Epic' ? <Zap size={14} /> : <Tag size={14} />}
                  </div>
                  <div style={{ fontSize: '14px', color: colors.textMuted, fontWeight: '500' }}>
                    {form.project}-<span style={{ color: colors.text, fontWeight: '700' }}>{Math.floor(Math.random() * 8999 + 1000)}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <CopyButton getText={buildJiraText} />
                  <button style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: '#0052CC', color: '#fff', fontSize: '12px', fontWeight: '600', cursor: 'not-allowed', opacity: 0.7, display: 'inline-flex', alignItems: 'center', gap: '6px' }} title="Jira entegrasyonu yakında eklenecektir.">
                    <Rocket size={13} /> Jira&apos;ya Aktar (Yakında)
                  </button>
                </div>
              </div>

              {/* TICKET BODY */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px' }}>
                
                {/* Main Content (Description) */}
                <div style={{ padding: '24px', borderRight: `1px solid ${colors.border}` }}>
                  <h1 style={{ fontSize: '20px', fontWeight: '700', color: colors.text, margin: '0 0 24px 0', lineHeight: '1.4' }}>
                    {result.summary}
                  </h1>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: colors.textMuted, marginBottom: '8px' }}>Description</div>
                      <div style={{ background: isDark ? 'rgba(0,0,0,0.2)' : '#f1f5f9', padding: '16px', borderRadius: '8px', fontSize: '13px', color: colors.text, border: `1px solid ${colors.border}` }}>
                        
                        <div style={{ marginBottom: '16px' }}>
                          <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: colors.text }}>👤 User Story</h3>
                          <p style={{ margin: 0, fontStyle: 'italic' }}>"{result.user_story}"</p>
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                          <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: colors.text }}>✅ Kabul Kriterleri (Acceptance Criteria)</h3>
                          <ul style={{ margin: 0, paddingLeft: '20px' }}>
                            {result.acceptance_criteria.map((c: string, i: number) => <li key={i} style={{ marginBottom: '4px' }}>{c}</li>)}
                          </ul>
                        </div>

                        <div style={{ marginBottom: '16px', padding: '12px', background: isDark ? 'rgba(59, 130, 246, 0.1)' : '#eff6ff', borderLeft: '3px solid #3b82f6', borderRadius: '0 6px 6px 0' }}>
                          <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#3b82f6' }}>⚙️ Teknik Notlar & Varsayımlar</h3>
                          <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{result.technical_notes}</div>
                        </div>

                        <div style={{ padding: '12px', background: isDark ? 'rgba(239, 68, 68, 0.05)' : '#fef2f2', borderLeft: '3px solid #ef4444', borderRadius: '0 6px 6px 0' }}>
                          <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#ef4444' }}>🚫 Kapsam Dışı (Out of Scope)</h3>
                          <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{result.out_of_scope}</div>
                        </div>

                      </div>
                    </div>
                  </div>
                </div>

                {/* Sidebar (Details) */}
                <div style={{ padding: '24px', background: isDark ? '#0d1117' : '#f8fafc', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  {/* Priority & Story Point */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: colors.textMuted, marginBottom: '6px' }}>Priority</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '600', color: colors.text }}>
                        <span style={{ color: getPriorityColor(result.priority) }}>●</span> {result.priority}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: colors.textMuted, marginBottom: '6px' }}>Story Point</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ background: '#0052CC', color: '#fff', fontSize: '12px', fontWeight: '800', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {result.story_point}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Efor Gerekçesi (SP Reason) */}
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: colors.textMuted, marginBottom: '6px' }}>Efor Gerekçesi (SP Reason)</div>
                    <div style={{ fontSize: '11px', color: colors.textMuted, lineHeight: '1.5', background: isDark ? '#161b22' : '#fff', padding: '8px', borderRadius: '6px', border: `1px solid ${colors.border}` }}>
                      {result.sp_reason}
                    </div>
                  </div>

                  {/* Standard Fields */}
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: colors.textMuted, marginBottom: '6px' }}>Squad</div>
                    <div style={{ fontSize: '12px', color: colors.text, fontWeight: '500' }}>{form.squad}</div>
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: colors.textMuted, marginBottom: '6px' }}>İş Sahipliği</div>
                    <div style={{ fontSize: '12px', color: colors.text, fontWeight: '500' }}>{form.owner}</div>
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: colors.textMuted, marginBottom: '6px' }}>Labels</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {result.labels.map((label: string, i: number) => (
                        <span key={i} style={{ background: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0', color: colors.text, fontSize: '10px', padding: '2px 8px', borderRadius: '12px', fontWeight: '600' }}>
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>

                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  )
}