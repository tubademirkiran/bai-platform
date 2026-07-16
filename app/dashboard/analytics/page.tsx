'use client'

import { useEffect, useState } from 'react'
import { useTheme } from '@/lib/theme-context'
import { getHistory } from '@/lib/history'

// LUCIDE ICONS
import { 
  Rocket, Briefcase, Zap, BatteryCharging, 
  ChevronDown, ChevronUp, Download, Sparkles, BarChart3, Filter
} from 'lucide-react'

// RECHARTS
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts'

type TimeFilter = 'today' | '7days' | '1month' | 'year' | 'all'

export default function AnalyticsPage() {
  const { accent, colors, lang, isDark } = useTheme()
  const [filter, setTimeFilter] = useState<TimeFilter>('1month')
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedCard, setExpandedCard] = useState<string | null>(null)

  // Parametreler
  const MANUAL_MIN_PER_ITEM = 120
  const AI_MIN_PER_ITEM = 5
  const COST_PER_MINUTE = 1.5

  useEffect(() => {
    fetchData()
  }, [filter])

  async function fetchData() {
    setLoading(true)
    const data = await getHistory()
    
    const now = new Date()
    let filteredData = data || []
    
    if (filter !== 'all') {
      filteredData = filteredData.filter(item => {
        const itemDate = new Date(item.created_at)
        const diffDays = (now.getTime() - itemDate.getTime()) / (1000 * 3600 * 24)
        if (filter === 'today') return diffDays < 1
        if (filter === '7days') return diffDays <= 7
        if (filter === '1month') return diffDays <= 30
        if (filter === 'year') return diffDays <= 365
        return true
      })
    }
    
    setHistory(filteredData)
    setLoading(false)
  }

  // --- TEMEL HESAPLAMALAR ---
  const totalItems = history.length
  const savedMinutes = totalItems * (MANUAL_MIN_PER_ITEM - AI_MIN_PER_ITEM)
  const savedHours = Math.floor(savedMinutes / 60)
  const totalSavingsTL = savedMinutes * COST_PER_MINUTE
  const manualHoursTotal = (totalItems * MANUAL_MIN_PER_ITEM) / 60
  const aiHoursTotal = (totalItems * AI_MIN_PER_ITEM) / 60

  // --- MODÜL DAĞILIMI ---
  const moduleCounts = history.reduce((acc: any, curr: any) => {
    acc[curr.module] = (acc[curr.module] || 0) + 1
    return acc
  }, {})

  let mostUsedModule = 'Yok'
  let maxCount = 0
  Object.entries(moduleCounts).forEach(([name, count]: any) => {
    if (count > maxCount) {
      maxCount = count
      mostUsedModule = name
    }
  })

  // --- AKILLI KOÇ TAVSİYESİ ---
  const getSmartAdvice = () => {
    if (totalItems === 0) return lang === 'tr' ? "Henüz analiz yapmaya başlamadınız. 'Requirement Generator' ile ilk gereksiniminizi üreterek başlayabilirsiniz." : "You haven't started analyzing yet. Begin by generating your first requirement with the 'Requirement Generator'."
    
    if (mostUsedModule.includes('Requirement')) return lang === 'tr' ? "Analizlerime göre 'Requirement Generator' modülünü yoğun kullanıyorsunuz. Yazılım ekibindeki hata oranını düşürmek için, ürettiğiniz bu gereksinimleri 'Test Case Generator' ile otomatik test senaryolarına dönüştürmenizi öneririm." : "Based on my analysis, you heavily use the 'Requirement Generator'. To reduce bug rates, I recommend transforming these requirements into automated test scenarios using the 'Test Case Generator'."
    if (mostUsedModule.includes('SQL')) return lang === 'tr' ? "Veritabanı işlemleri için 'SQL Generator' modülünü sıkça kullanıyorsunuz. Ürettiğiniz karmaşık sorguların veri güvenliğini teyit etmek için arada bir 'Risk Analyzer' modülüne danışabilirsiniz." : "You frequently use 'SQL Generator' for database operations. Consult the 'Risk Analyzer' occasionally to verify the data security of your complex queries."
    if (mostUsedModule.includes('Meeting')) return lang === 'tr' ? "Toplantı notlarını sürekli 'Meeting Analyzer' ile çözümlüyorsunuz. Çıkan aksiyon maddelerini (Action Items) önceliklendirmek için 'Prioritization Coach' modülünü kullanmak iş akışınızı hızlandıracaktır." : "You consistently analyze meeting notes with 'Meeting Analyzer'. Using 'Prioritization Coach' to prioritize resulting Action Items will speed up your workflow."
    if (mostUsedModule.includes('Wireframe')) return lang === 'tr' ? "Görsel üretimlere (Wireframe) odaklanmış durumdasınız. Bu tasarımların arkasındaki kullanıcı motivasyonunu sağlamlaştırmak için öncesinde 'Persona Generator'ı kullanmak UX kalitenizi %30 artırabilir." : "You are focused on visual generation (Wireframe). Using 'Persona Generator' beforehand to solidify user motivation behind these designs can increase UX quality by 30%."
    
    return lang === 'tr' ? `Son zamanlarda en çok '${mostUsedModule}' üzerine çalıştınız. Bu verimliliği diğer analiz süreçlerine de yaymak için farklı modülleri keşfedebilirsiniz.` : `Recently, you've worked most on '${mostUsedModule}'. Explore different modules to spread this productivity to other analysis processes.`
  }

  // --- HAFTALIK GRAFİK HESAPLAMASI ---
  const getLast7Days = () => {
    const days = []
    const dayNamesTR = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt']
    const dayNamesEN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const dayNames = lang === 'tr' ? dayNamesTR : dayNamesEN
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      days.push({
        dateStr: d.toISOString().split('T')[0],
        label: dayNames[d.getDay()],
        count: 0
      })
    }
    return days
  }

  const chartData = getLast7Days()

  history.forEach(item => {
    const itemDateStr = new Date(item.created_at).toISOString().split('T')[0]
    const dayObj = chartData.find(d => d.dateStr === itemDateStr)
    if (dayObj) {
      dayObj.count += 1
    }
  })

  const exportData = () => {
    const report = `
      BAI PLATFORM - STRATEJİK DEĞER VE ROI RAPORU
      --------------------------------------------
      Dönem: ${filter}
      Toplam Üretim: ${totalItems} Adet
      Kazanılan Net Zaman: ${savedHours} Saat
      Finansal Tasarruf: ${totalSavingsTL.toLocaleString('tr-TR')} TL
      En Çok Kullanılan Modül: ${mostUsedModule}
      
      Hesaplama Parametreleri:
      - Tahmini Manuel Efor: 120 dk / İş
      - AI Gerçekleşen Efor: 5 dk / İş
      - Uzman Kaynak Maliyeti: 1.5 TL / Dk
    `
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'Stratejik_ROI_Raporu.txt'
    a.click()
  }

  const KPICard = ({ id, title, value, icon, subValue, detailText, formula }: any) => {
    const isExpanded = expandedCard === id
    return (
      <div 
        style={{ 
          background: colors.card, 
          border: `1px solid ${isExpanded ? accent : colors.border}`,
          borderRadius: '16px', padding: '24px', transition: 'all 0.3s ease',
          cursor: 'pointer', position: 'relative', overflow: 'hidden',
          boxShadow: isExpanded && !isDark ? `0 8px 30px ${accent}15` : isDark ? 'none' : '0 2px 10px rgba(0,0,0,0.02)'
        }}
        onClick={() => setExpandedCard(isExpanded ? null : id)}
        onMouseEnter={e => {
          if (!isExpanded) {
            e.currentTarget.style.transform = 'translateY(-3px)'
            e.currentTarget.style.borderColor = accent + '66'
          }
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)'
          if (!isExpanded) e.currentTarget.style.borderColor = colors.border
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '13px', color: colors.textMuted, fontWeight: '700', marginBottom: '8px', letterSpacing: '0.02em' }}>{title}</div>
            <div style={{ fontSize: '32px', fontWeight: '800', color: colors.text, letterSpacing: '-0.02em' }}>{value}</div>
            <div style={{ fontSize: '12px', color: accent, fontWeight: '700', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: accent }}></span>
              {subValue}
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '12px', background: accent + '15', color: accent }}>
            {icon}
          </div>
        </div>

        {isExpanded && (
          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: `1px dashed ${colors.border}`, animation: 'fadeIn 0.3s' }}>
            <div style={{ fontSize: '13px', color: colors.textMuted, lineHeight: '1.6', marginBottom: '16px' }}>
              <strong style={{ color: colors.text, display: 'block', marginBottom: '6px' }}>{lang === 'tr' ? 'Stratejik Etki' : 'Strategic Impact'}</strong>
              {detailText}
            </div>
            <div style={{ background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', padding: '14px', borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace', color: colors.textMuted, border: `1px solid ${colors.border}` }}>
              <strong style={{ color: colors.text, marginBottom: '6px', display: 'block' }}>{lang === 'tr' ? 'Matematiksel Model:' : 'Mathematical Model:'}</strong>
              {formula}
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); exportData(); }}
              style={{ marginTop: '16px', width: '100%', background: accent, border: 'none', color: '#fff', padding: '10px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <Download size={16} /> {lang === 'tr' ? 'Raporu İndir' : 'Download Report'}
            </button>
          </div>
        )}
        
        <div style={{ position: 'absolute', right: '20px', bottom: '20px', color: colors.textMuted, opacity: isExpanded ? 1 : 0.4, transition: 'all 0.3s' }}>
          {isExpanded ? <ChevronUp size={20} color={accent} /> : <ChevronDown size={20} />}
        </div>
      </div>
    )
  }

  if (loading) {
     return (
       <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', color: colors.textMuted, flexDirection: 'column', gap: '16px' }}>
         <div style={{ animation: 'pulse 1.5s infinite' }}><BarChart3 size={32} color={accent} /></div>
         <div style={{ fontWeight: '600', fontSize: '14px' }}>{lang === 'tr' ? 'Metrikler Hesaplanıyor...' : 'Calculating Metrics...'}</div>
       </div>
     )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Üst Filtre ve Export Barı */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: colors.text, margin: 0, letterSpacing: '-0.02em' }}>
            {lang === 'tr' ? 'İstatistikler ve Değer Analizi' : 'Analytics & ROI Dashboard'}
          </h2>
          <p style={{ fontSize: '13px', color: colors.textMuted, margin: '6px 0 0' }}>
            {lang === 'tr' ? 'Yapay zekanın iş süreçlerinize kattığı operasyonel ve finansal değeri ölçümleyin.' : 'Measure the operational and financial value AI adds to your business processes.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* NATIVE SELECT YERİNE MODERN GÖRÜNÜMLÜ WRAPPER */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Filter size={14} color={colors.textMuted} style={{ position: 'absolute', left: '12px', pointerEvents: 'none' }} />
            <select 
              value={filter} 
              onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
              style={{ 
                appearance: 'none',
                background: colors.card, 
                color: colors.text, 
                border: `1px solid ${colors.border}`, 
                padding: '10px 36px 10px 36px', 
                borderRadius: '10px', 
                fontSize: '13px', 
                cursor: 'pointer', 
                outline: 'none', 
                fontWeight: '600', 
                boxShadow: isDark ? 'none' : '0 2px 8px rgba(0,0,0,0.03)',
                transition: 'all 0.2s ease'
              }}
              onFocus={e => e.currentTarget.style.borderColor = accent}
              onBlur={e => e.currentTarget.style.borderColor = colors.border}
            >
              <option value="today">{lang === 'tr' ? 'Bugün' : 'Today'}</option>
              <option value="7days">{lang === 'tr' ? 'Son 7 Gün' : 'Last 7 Days'}</option>
              <option value="1month">{lang === 'tr' ? 'Son 1 Ay' : 'Last 1 Month'}</option>
              <option value="year">{lang === 'tr' ? 'Bu Yıl' : 'This Year'}</option>
              <option value="all">{lang === 'tr' ? 'Tüm Zamanlar' : 'All Time'}</option>
            </select>
            <ChevronDown size={14} color={colors.textMuted} style={{ position: 'absolute', right: '12px', pointerEvents: 'none' }} />
          </div>

          <button 
            onClick={exportData}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: accent, color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', boxShadow: `0 4px 15px ${accent}44`, transition: 'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <Download size={16} /> {lang === 'tr' ? 'Yönetici Raporunu İndir' : 'Download Exec Report'}
          </button>
        </div>
      </div>

      {/* KPI GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', alignItems: 'flex-start' }}>
        <KPICard 
          id="time"
          title={lang === 'tr' ? "Kazanılan Net Zaman" : "Net Time Saved"}
          value={`${savedHours} ${lang === 'tr' ? 'Saat' : 'Hrs'}`}
          subValue={lang === 'tr' ? `~ ${(savedHours / 8).toFixed(1)} İş Günü Kazancı` : `~ ${(savedHours / 8).toFixed(1)} Work Days`}
          icon={<Rocket size={24} strokeWidth={1.5} />}
          detailText={
            lang === 'tr' ? <>Geleneksel yöntemlerle <strong>{manualHoursTotal.toFixed(1)} saat</strong> sürecek olan <strong>{totalItems} adet</strong> işi, BAI Platform ile sadece <strong>{aiHoursTotal.toFixed(1)} saatte</strong> tamamladınız. Kazanılan <strong>{savedHours} net saat</strong> ile inovasyona odaklanabilirsiniz.</> : <>Completed <strong>{totalItems} tasks</strong> in just <strong>{aiHoursTotal.toFixed(1)} hours</strong> with BAI Platform, which would normally take <strong>{manualHoursTotal.toFixed(1)} hours</strong>. Focus on innovation with <strong>{savedHours} net hours</strong> saved.</>
          }
          formula={`(${totalItems} İş × ${MANUAL_MIN_PER_ITEM}dk) - (${totalItems} İş × ${AI_MIN_PER_ITEM}dk) = ${savedMinutes} Dk`}
        />

        <KPICard 
          id="money"
          title={lang === 'tr' ? "Tahmini Finansal Tasarruf" : "Est. Financial Savings"}
          value={`${totalSavingsTL.toLocaleString('tr-TR')} TL`}
          subValue={lang === 'tr' ? "Maliyet Kaçınması (Cost Avoidance)" : "Cost Avoidance"}
          icon={<Briefcase size={24} strokeWidth={1.5} />}
          detailText={
            lang === 'tr' ? <>Kazanılan <strong>{savedMinutes} dakikalık</strong> eforun uzman maliyeti üzerinden karşılığı <strong>{totalSavingsTL.toLocaleString('tr-TR')} TL</strong>'dir. Kurumunuz manuel iş gücü maliyetinden büyük oranda tasarruf etmiştir.</> : <>The expert cost equivalent of <strong>{savedMinutes} minutes</strong> saved is <strong>{totalSavingsTL.toLocaleString('tr-TR')} TL</strong>. Massive savings on manual labor costs.</>
          }
          formula={`Kazanılan ${savedMinutes} Dk × ${COST_PER_MINUTE} TL/Dk = ${totalSavingsTL} TL`}
        />

        <KPICard 
          id="production"
          title={lang === 'tr' ? "Toplam İş Çıktısı" : "Total Output"}
          value={`${totalItems} ${lang === 'tr' ? 'Adet' : 'Items'}`}
          subValue="Uçtan Uca SDLC Kapsamı"
          icon={<Zap size={24} strokeWidth={1.5} />}
          detailText={
            lang === 'tr' ? <>Bugüne kadar toplam <strong>{totalItems} adet</strong> teknik ve analitik çıktı ürettiniz. Hızlı ve hatasız üretim gücünüz yazılım geliştirme yaşam döngünüzü hızlandırır.</> : <>Generated <strong>{totalItems}</strong> technical and analytical outputs. High-speed, error-free production accelerates your SDLC.</>
          }
          formula="Belirtilen tarih aralığındaki (History) toplam başarılı kayıt sayısı."
        />

        <KPICard 
          id="quality"
          title={lang === 'tr' ? "Kredi Verimliliği" : "Credit Efficiency"}
          value="%88"
          subValue={lang === 'tr' ? "İlk Seferde Başarı · Örnek veri" : "First Time Success · Sample Data"}
          icon={<BatteryCharging size={24} strokeWidth={1.5} />}
          detailText={
            lang === 'tr' ? <>Sisteme gönderdiğiniz isteklerin büyük bölümü ilk seferde başarıya ulaştı. Prompt mühendisliğindeki bu başarınız 'rework' maliyetlerini sıfırlar.</> : <>Most of your system requests succeeded on the first try. Your prompt engineering success eliminates rework costs.</>
          }
          formula="Kullanılan AI Token / Maksimum Başarı Endeksi (Simülasyon)"
        />
      </div>

      {/* Grafikler Alanı */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 2fr) minmax(300px, 1fr)', gap: '20px' }}>
        
        {/* Üretkenlik Ritmi */}
        <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
            <div>
              <div style={{ fontWeight: '800', color: colors.text, fontSize: '18px' }}>{lang === 'tr' ? 'Üretkenlik Ritmi' : 'Productivity Rhythm'}</div>
              <div style={{ fontSize: '13px', color: colors.textMuted, marginTop: '4px' }}>{lang === 'tr' ? 'Son 7 gündeki aktif doküman ve analiz üretimi' : 'Active document and analysis production in the last 7 days'}</div>
            </div>
            <div style={{ fontSize: '11px', color: accent, background: accent + '15', fontWeight: '700', padding: '6px 12px', borderRadius: '8px' }}>📊 {lang === 'tr' ? 'Günlük Aktivite' : 'Daily Activity'}</div>
          </div>
          
          <div style={{ flex: 1, minHeight: '260px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={accent} stopOpacity={1} />
                    <stop offset="100%" stopColor={accent} stopOpacity={0.1} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: colors.textMuted, fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: colors.textMuted }} allowDecimals={false} />
                
                <Tooltip
                  cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div style={{ background: isDark ? '#27272a' : '#ffffff', border: `1px solid ${colors.border}`, padding: '12px 16px', borderRadius: '10px', boxShadow: '0 8px 25px rgba(0,0,0,0.12)' }}>
                          <div style={{ fontSize: '10px', color: colors.textMuted, marginBottom: '4px', fontWeight: '800', letterSpacing: '0.05em' }}>{payload[0].payload.dateStr}</div>
                          <div style={{ fontSize: '18px', fontWeight: '800', color: accent, display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                            {payload[0].value} <span style={{fontSize:'11px', color:colors.textMuted, fontWeight: '600'}}>{lang === 'tr' ? 'Üretim' : 'Generations'}</span>
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                
                <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={36} animationDuration={1200}>
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.count > 0 ? "url(#barGradient)" : colors.border} 
                      fillOpacity={1} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Efor Dağılımı */}
        <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: '16px', padding: '24px' }}>
          <div style={{ fontWeight: '800', color: colors.text, fontSize: '18px', marginBottom: '4px' }}>{lang === 'tr' ? 'Efor Dağılımı' : 'Effort Distribution'}</div>
          <div style={{ fontSize: '13px', color: colors.textMuted, marginBottom: '32px' }}>{lang === 'tr' ? 'Modül bazlı kullanım yoğunluğu' : 'Module-based usage intensity'}</div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            {Object.keys(moduleCounts).length === 0 ? (
              <div style={{ fontSize: '13px', color: colors.textMuted, textAlign: 'center', padding: '30px 0', background: isDark ? '#18181b' : '#f8fafc', borderRadius: '12px' }}>{lang === 'tr' ? 'Henüz yeterli veri yok.' : 'Not enough data yet.'}</div>
            ) : (
              Object.entries(moduleCounts).sort((a:any, b:any) => b[1] - a[1]).slice(0, 5).map(([name, count]: any, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: colors.text }}>{name}</span>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: accent, background: accent + '15', padding: '4px 8px', borderRadius: '6px' }}>{count} {lang === 'tr' ? 'Çıktı' : 'Outputs'}</span>
                  </div>
                  <div style={{ height: '8px', background: isDark ? '#27272a' : '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(count/totalItems)*100}%`, background: accent, borderRadius: '4px', transition: 'width 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Akıllı Tavsiyeler */}
      <div style={{ 
        background: `linear-gradient(135deg, ${accent}15 0%, ${accent}05 100%)`, 
        border: `1px solid ${accent}33`, 
        borderRadius: '16px', 
        padding: '24px 32px', 
        display: 'flex', 
        gap: '24px', 
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: `0 10px 40px ${accent}15`
      }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: accent + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 10 }}>
          <Sparkles size={28} color={accent} />
        </div>
        <div style={{ flex: 1, zIndex: 10 }}>
          <div style={{ fontWeight: '800', color: accent, fontSize: '18px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            {lang === 'tr' ? 'Akıllı Sistem Koçu' : 'Smart System Coach'} 
            <span style={{ fontSize: '10px', background: accent, color: '#fff', padding: '3px 8px', borderRadius: '12px', letterSpacing: '0.05em' }}>AI INSIGHT</span>
          </div>
          <div style={{ fontSize: '14px', color: colors.text, lineHeight: '1.6', fontWeight: '500' }}>
            {getSmartAdvice()}
          </div>
        </div>
        
        <div style={{ position: 'absolute', right: '-20px', top: '-40px', opacity: 0.05, transform: 'rotate(-15deg)' }}>
          <Sparkles size={180} color={accent} />
        </div>
      </div>

    </div>
  )
}