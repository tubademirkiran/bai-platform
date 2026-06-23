'use client'

import { useState } from 'react'
import { useTheme } from '@/lib/theme-context'
import { Textarea } from '@/components/ui/textarea'

type TechLevel = 'Düşük' | 'Orta' | 'Yüksek' | 'Low' | 'Medium' | 'High'

interface Persona {
  avatar: string
  name: string
  age: number
  role: string
  tech_level: TechLevel
  bio: string
  goals: string[]
  pain_points: string[]
  golden_advice: string
}

export default function PersonaPage() {
  const { accent, colors, lang, isDark } = useTheme()
  const [product, setProduct] = useState('')
  const [audience, setAudience] = useState('')
  const [count, setCount] = useState<1 | 2 | 3>(2)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ personas: Persona[] } | null>(null)
  const [copied, setCopied] = useState(false)

  async function handleGenerate() {
    if (!product.trim()) return
    setLoading(true)
    setResult(null)
    
    try {
      const response = await fetch('/api/persona/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product, audience, count, lang }),
      })
      const data = await response.json()
      setResult(data.result)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyExport = () => {
    if (!result) return
    let text = `# HEDEF KİTLE PERSONA ANALİZİ\n\n**Ürün/Modül:** ${product}\n\n---\n\n`
    
    result.personas.forEach((p, idx) => {
      text += `## ${p.avatar} Persona ${idx + 1}: ${p.name} (${p.age} - ${p.role})\n`
      text += `- **Teknoloji Yatkınlığı:** ${p.tech_level}\n`
      text += `- **Biyografi:** ${p.bio}\n\n`
      text += `### 🎯 Hedefler & Motivasyonlar\n`
      p.goals.forEach(g => text += `- ${g}\n`)
      text += `\n### 💔 Acı Noktaları (Pain Points)\n`
      p.pain_points.forEach(pp => text += `- ${pp}\n`)
      text += `\n### 💡 Tasarım / Analiz Tavsiyesi\n> ${p.golden_advice}\n\n---\n\n`
    })

    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const btnStyle = {
    padding: '6px 12px', borderRadius: '8px',
    border: `0.5px solid ${colors.border}`,
    background: colors.card, color: colors.text,
    fontSize: '11px', fontWeight: '600' as const, cursor: 'pointer',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ marginBottom: '20px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: colors.text, margin: 0 }}>
            {lang === 'tr' ? 'Persona Generator' : 'Persona Generator'}
          </h2>
          <span style={{ fontSize: '10px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px', background: accent + '22', color: accent }}>PO/BA/UX</span>
        </div>
        <p style={{ fontSize: '13px', color: colors.textMuted, margin: 0 }}>
          {lang === 'tr' ? 'Gereksinimleriniz için hedef kitle profilleri ve UX tavsiyeleri üretin.' : 'Generate target audience profiles and UX advice for your requirements.'}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px minmax(0, 1fr)', gap: '16px', alignItems: 'start', flex: 1, minHeight: 0 }}>
        
        {/* Sol Panel: Girdiler */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', position: 'sticky', top: '0' }}>
          <div style={{ background: colors.card, border: `0.5px solid ${colors.border}`, borderRadius: '12px', padding: '18px' }}>
            
            <div style={{ fontSize: '11px', fontWeight: '700', color: colors.textMuted, marginBottom: '8px', letterSpacing: '0.06em' }}>
              {lang === 'tr' ? 'NE GELİŞTİRİYORUZ?' : 'WHAT ARE WE BUILDING?'}
            </div>
            <Textarea
              placeholder={lang === 'tr'
                ? 'Örn: Şirket içi masraf giriş ve onaylama mobil uygulaması. Kullanıcılar fiş fotoğrafı çekip gönderecek...'
                : 'E.g: Internal expense entry and approval mobile app. Users will take photos of receipts...'}
              style={{ minHeight: '120px', background: colors.bg, color: colors.text, borderColor: colors.border, fontSize: '12px', marginBottom: '14px' }}
              value={product}
              onChange={e => setProduct(e.target.value)}
            />

            <div style={{ fontSize: '11px', fontWeight: '700', color: colors.textMuted, marginBottom: '8px', letterSpacing: '0.06em' }}>
              {lang === 'tr' ? 'HEDEF KİTLE / ENDÜSTRİ (Opsiyonel)' : 'TARGET AUDIENCE / INDUSTRY (Optional)'}
            </div>
            <input
              placeholder={lang === 'tr' ? 'Örn: Saha satış personeli ve finans departmanı' : 'E.g: Field sales staff and finance department'}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: `0.5px solid ${colors.border}`, background: colors.bg, color: colors.text, fontSize: '12px', outline: 'none', marginBottom: '14px' }}
              value={audience}
              onChange={e => setAudience(e.target.value)}
            />

            <div style={{ fontSize: '11px', fontWeight: '700', color: colors.textMuted, marginBottom: '8px', letterSpacing: '0.06em' }}>
              {lang === 'tr' ? 'ÜRETİLECEK PERSONA SAYISI' : 'NUMBER OF PERSONAS'}
            </div>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '18px' }}>
              {[1, 2, 3].map((num) => (
                <button key={num} onClick={() => setCount(num as 1|2|3)}
                  style={{ flex: 1, padding: '8px 4px', borderRadius: '8px', border: count === num ? `2px solid ${accent}` : `1px solid ${colors.border}`, background: count === num ? accent + '22' : colors.bg, color: count === num ? accent : colors.textMuted, fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                  {num} {lang === 'tr' ? 'Kişi' : 'Person'}
                </button>
              ))}
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading || !product.trim()}
              style={{ width: '100%', padding: '11px', borderRadius: '8px', border: 'none', background: !product.trim() ? colors.border : accent, color: '#fff', fontWeight: '700', fontSize: '13px', cursor: (loading || !product.trim()) ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? (lang === 'tr' ? '🎭 Personalar Üretiliyor...' : '🎭 Generating Personas...') : (lang === 'tr' ? '🎭 Personaları Yarat' : '🎭 Generate Personas')}
            </button>
          </div>
        </div>

        {/* Sağ Panel: Çıktılar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%', overflowY: 'auto', paddingRight: '4px', paddingBottom: '20px' }}>
          
          {loading && (
            <div style={{ background: colors.card, border: `0.5px solid ${colors.border}`, borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '500px', gap: '20px' }}>
              <div style={{ fontSize: '48px', animation: 'pulse 2s infinite' }}>🎭</div>
              <div style={{ fontSize: '15px', fontWeight: '600', color: colors.text }}>
                {lang === 'tr' ? 'Hedef kitle analizi yapılıyor...' : 'Analyzing target audience...'}
              </div>
            </div>
          )}

          {!result && !loading && (
            <div style={{ background: colors.card, border: `0.5px solid ${colors.border}`, borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '500px', gap: '16px', padding: '40px', textAlign: 'center' }}>
              <div style={{ fontSize: '64px', opacity: 0.15 }}>👥</div>
              <div style={{ fontSize: '15px', fontWeight: '600', color: colors.textMuted }}>
                {lang === 'tr' ? 'Ürün detaylarını girin, gerçekçi kullanıcı senaryoları oluşsun.' : 'Enter product details to create realistic user scenarios.'}
              </div>
            </div>
          )}

          {result && !loading && (
            <>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '4px' }}>
                 <button onClick={handleCopyExport} style={{ ...btnStyle, color: copied ? '#10b981' : colors.text, borderColor: copied ? '#10b981' : colors.border, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {copied ? '✅ Kopyalandı' : '📋 Jira / Markdown Kopyala'}
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: result.personas.length > 1 ? 'repeat(2, 1fr)' : '1fr', gap: '16px' }}>
                {result.personas.map((persona, idx) => (
                  <div key={idx} style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    
                    {/* Persona Header */}
                    <div style={{ background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', padding: '20px', borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ fontSize: '42px', background: isDark ? '#1f1f23' : '#fff', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${colors.border}` }}>
                        {persona.avatar}
                      </div>
                      <div>
                        <div style={{ fontSize: '18px', fontWeight: '800', color: colors.text }}>{persona.name}, {persona.age}</div>
                        <div style={{ fontSize: '13px', color: accent, fontWeight: '600', marginTop: '2px' }}>{persona.role}</div>
                      </div>
                    </div>

                    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      
                      {/* Tech Level & Bio */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontSize: '11px', fontWeight: '700', color: colors.textMuted, letterSpacing: '0.05em' }}>BİYOGRAFİ</span>
                          <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '12px', background: colors.bg, border: `1px solid ${colors.border}`, color: colors.text }}>
                            💻 Teknoloji: <span style={{ color: persona.tech_level.includes('Low') || persona.tech_level.includes('Düşük') ? '#ef4444' : persona.tech_level.includes('High') || persona.tech_level.includes('Yüksek') ? '#10b981' : '#f59e0b' }}>{persona.tech_level}</span>
                          </span>
                        </div>
                        <p style={{ fontSize: '12px', color: colors.text, lineHeight: '1.6', margin: 0, fontStyle: 'italic' }}>"{persona.bio}"</p>
                      </div>

                      {/* Goals & Pain Points */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                        <div style={{ background: isDark ? 'rgba(16, 185, 129, 0.05)' : '#ecfdf5', padding: '12px', borderRadius: '8px', border: `1px solid ${isDark ? 'rgba(16, 185, 129, 0.1)' : '#d1fae5'}` }}>
                          <div style={{ fontSize: '11px', fontWeight: '700', color: '#10b981', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>🎯 HEDEFLER & MOTİVASYON</div>
                          <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: colors.text, lineHeight: '1.5' }}>
                            {persona.goals.map((g, i) => <li key={i} style={{ marginBottom: '4px' }}>{g}</li>)}
                          </ul>
                        </div>

                        <div style={{ background: isDark ? 'rgba(239, 68, 68, 0.05)' : '#fef2f2', padding: '12px', borderRadius: '8px', border: `1px solid ${isDark ? 'rgba(239, 68, 68, 0.1)' : '#fee2e2'}` }}>
                          <div style={{ fontSize: '11px', fontWeight: '700', color: '#ef4444', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>💔 ACI NOKTALARI (FRUSTRATIONS)</div>
                          <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: colors.text, lineHeight: '1.5' }}>
                            {persona.pain_points.map((p, i) => <li key={i} style={{ marginBottom: '4px' }}>{p}</li>)}
                          </ul>
                        </div>
                      </div>

                      {/* Golden Advice */}
                      <div style={{ background: accent + '11', padding: '16px', borderRadius: '8px', borderLeft: `3px solid ${accent}` }}>
                        <div style={{ fontSize: '11px', fontWeight: '800', color: accent, marginBottom: '6px', letterSpacing: '0.05em' }}>💡 TASARIM & ANALİZ TAVSİYESİ</div>
                        <div style={{ fontSize: '12px', color: colors.text, lineHeight: '1.6', fontWeight: '500' }}>
                          {persona.golden_advice}
                        </div>
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}