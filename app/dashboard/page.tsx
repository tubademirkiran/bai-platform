'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/lib/theme-context'
import { 
  FileText, Database, ListChecks, LayoutTemplate, UserCircle, 
  AlertTriangle, Mic, GitBranch, Activity, Scale, 
  Ticket, Briefcase, Star, Clock, Sparkles, ArrowRight 
} from 'lucide-react'

// 1. MODÜL VERİ SETİ (Rotalar /dashboard/ altına alındı)
const MODULES = {
  uretim: [
    { id: 'req', title: 'Requirement Generator', desc: 'Fikirden otomatik gereksinim belgesi üret', badge: 'AI', Icon: FileText, route: '/dashboard/requirement' },
    { id: 'sql', title: 'SQL Generator', desc: 'Doğal dille Oracle SQL sorgusu yaz', badge: 'Oracle', Icon: Database, route: '/dashboard/sql-generator' },
    { id: 'test', title: 'Test Case Generator', desc: 'Gereksinimden test senaryosu üret', badge: 'QA', Icon: ListChecks, route: '/dashboard/test-case' },
    { id: 'wireframe', title: 'Wireframe & Prototip', desc: 'Gereksinimden otomatik ekran taslağı üret', badge: 'UI/UX', Icon: LayoutTemplate, route: '/dashboard/wireframe' },
    { id: 'persona', title: 'Persona Generator', desc: 'Hedef kitle personaları ve UX tavsiyeleri üret', badge: 'UX/BA', Icon: UserCircle, route: '/dashboard/persona' },
  ],
  analiz: [
    { id: 'risk', title: 'Risk Analyzer', desc: 'Proje risklerini analiz et', badge: 'PM', Icon: AlertTriangle, route: '/dashboard/risk-analyzer' },
    { id: 'meeting', title: 'Meeting Analyzer', desc: 'Toplantı notlarından aksiyon çıkar', badge: 'NLP', Icon: Mic, route: '/dashboard/meeting-analyzer' },
    { id: 'flowchart', title: 'Flowchart/Sequence', desc: 'Gereksinimden akış diyagramı üret', badge: 'QA', Icon: GitBranch, route: '/dashboard/flowchart' },
    { id: 'impact', title: 'Impact Analyzer', desc: 'Değişiklik etki analizi yap', badge: 'QA', Icon: Activity, route: '/dashboard/impact-analyzer' },
    { id: 'prioritization', title: 'Prioritization Coach', desc: 'Gereksinimleri iş hedefine göre akıllıca önceliklendir', badge: 'PO/PM', Icon: Scale, route: '/dashboard/prioritization' },
  ],
  yonetim: [
    { id: 'jira', title: 'AI Jira Issue Generator', desc: 'Ham talepleri teknik Jira biletlerine dönüştür', badge: 'Agile', Icon: Ticket, route: '/dashboard/jira' },
    { id: 'pmi', title: 'PMI Project Planner', desc: 'PMI standartlarında profesyonel proje planı üret', badge: 'PMP', Icon: Briefcase, route: '/dashboard/pmi' },
  ]
}

// 2. KART ALT BİLEŞENİ
function ModuleCard({ module, isFavorite, toggleFavorite, colors, accent }) {
  const [isHovered, setIsHovered] = useState(false)
  const router = useRouter()
  const IconComponent = module.Icon

  return (
    <div
      onClick={() => router.push(module.route)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: colors.card,
        border: `1px solid ${isHovered ? accent : colors.border}`,
        borderRadius: '12px',
        padding: '20px',
        cursor: 'pointer',
        position: 'relative',
        transition: 'all 0.3s ease',
        boxShadow: isHovered ? `0 4px 20px -2px ${accent}40` : 'none',
        transform: isHovered ? 'translateY(-2px)' : 'none'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div style={{ color: accent, transition: 'transform 0.3s ease', transform: isHovered ? 'scale(1.08)' : 'scale(1)' }}>
          <IconComponent size={26} strokeWidth={1.5} />
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '10px', background: `${colors.border}80`, color: colors.textMuted, padding: '4px 8px', borderRadius: '12px', fontWeight: '600' }}>
            {module.badge}
          </span>
          <button 
            onClick={(e) => { e.stopPropagation(); toggleFavorite(module.id); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
          >
            <Star size={18} color={isFavorite ? accent : colors.textMuted} fill={isFavorite ? accent : 'transparent'} style={{ transition: 'all 0.2s ease' }} />
          </button>
        </div>
      </div>
      <h3 style={{ fontSize: '14px', fontWeight: '700', color: colors.text, marginBottom: '6px' }}>{module.title}</h3>
      <p style={{ fontSize: '12px', color: colors.textMuted, lineHeight: '1.4' }}>{module.desc}</p>
    </div>
  )
}

// 3. ANA DASHBOARD BİLEŞENİ
export default function DashboardPage() {
  const { accent, colors } = useTheme()
  const router = useRouter()
  const [favorites, setFavorites] = useState<string[]>([]) 
  const [isLoaded, setIsLoaded] = useState(false) 
  const [omniboxQuery, setOmniboxQuery] = useState('') 

  const [recentActivity] = useState({
    title: 'Ödeme Modülü PRD',
    time: '2 saat önce',
    type: 'Requirement',
    route: '/dashboard/requirement' // Rota düzeltildi
  })

  useEffect(() => {
    const savedFavs = localStorage.getItem('bai_favorites')
    if (savedFavs) {
      setFavorites(JSON.parse(savedFavs))
    }
    setIsLoaded(true)
  }, [])

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const newFavorites = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
      localStorage.setItem('bai_favorites', JSON.stringify(newFavorites))
      return newFavorites
    })
  }

  // OMNIBOX YÖNLENDİRME MANTIĞI (Rotalar /dashboard/ yapısına uygun hale getirildi)
  const handleOmniboxSubmit = () => {
    if (!omniboxQuery.trim()) return

    const query = omniboxQuery.toLowerCase()
    let targetRoute = '/dashboard/requirement' 

    if (query.includes('çiz') || query.includes('şema') || query.includes('akış')) {
      targetRoute = '/dashboard/flowchart'
    } else if (query.includes('sql') || query.includes('sorgu') || query.includes('veri tabanı')) {
      targetRoute = '/dashboard/sql-generator'
    } else if (query.includes('test') || query.includes('senaryo') || query.includes('qa')) {
      targetRoute = '/dashboard/test-case'
    } else if (query.includes('risk') || query.includes('tehlike')) {
      targetRoute = '/dashboard/risk-analyzer'
    }

    router.push(`${targetRoute}?prompt=${encodeURIComponent(omniboxQuery)}`)
  }

  const allModules = [...MODULES.uretim, ...MODULES.analiz, ...MODULES.yonetim]
  const favoriteModules = allModules.filter(m => favorites.includes(m.id))

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '16px',
    marginBottom: '32px'
  }

  const sectionTitleStyle = {
    fontSize: '14px',
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: '16px',
    borderBottom: `1px solid ${colors.border}`,
    paddingBottom: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  }

  if (!isLoaded) return null

  return (
    <div style={{ paddingBottom: '40px' }}>
      
      {/* ÜST BİLGİ VE WIDGETLAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: colors.text, marginBottom: '4px' }}>Hoş geldin 👋</h1>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          
          {/* Kaldığın Yerden Devam Et Aksiyonu */}
          <div 
            onClick={() => router.push(recentActivity.route)}
            style={{ background: colors.card, border: `1px solid ${colors.border}`, padding: '8px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', transition: 'border 0.2s ease' }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = accent}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = colors.border}
          >
            <div style={{ background: `${accent}20`, padding: '8px', borderRadius: '6px', color: accent }}>
              <Clock size={18} />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: colors.textMuted, fontWeight: '600', marginBottom: '2px' }}>Kaldığın Yerden Devam Et</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '13px', color: colors.text, fontWeight: '700' }}>{recentActivity.title}</span>
                <span style={{ fontSize: '10px', background: `${colors.border}80`, color: colors.textMuted, padding: '2px 6px', borderRadius: '8px' }}>{recentActivity.time}</span>
              </div>
            </div>
          </div>

          <div style={{ background: `${accent}15`, border: `1px solid ${accent}30`, padding: '8px 16px', borderRadius: '8px', textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: colors.textMuted, fontWeight: '600' }}>Bu Hafta Tasarruf</div>
            <div style={{ fontSize: '16px', color: accent, fontWeight: '800' }}>+4 Saat</div>
          </div>
          
          <div style={{ background: colors.card, border: `1px solid ${colors.border}`, padding: '8px 16px', borderRadius: '8px', textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: colors.textMuted, fontWeight: '600' }}>Üretilen Analiz</div>
            <div style={{ fontSize: '16px', color: colors.text, fontWeight: '800' }}>12 Adet</div>
          </div>
        </div>
      </div>

      {/* AI OMNIBOX */}
      <div style={{ 
        background: colors.card, 
        border: `1px solid ${accent}50`, 
        borderRadius: '12px', 
        padding: '6px 14px',
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px', 
        marginBottom: '40px',
        boxShadow: `0 8px 30px -4px ${accent}20`,
        transition: 'all 0.3s ease'
      }}>
        <div style={{ background: `${accent}20`, padding: '6px', borderRadius: '8px', color: accent, display: 'flex' }}>
          <Sparkles size={18} /> 
        </div>
        
        <input 
          type="text" 
          value={omniboxQuery}
          onChange={(e) => setOmniboxQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleOmniboxSubmit()}
          placeholder="Bugün ne analiz etmek istiyorsun? (Örn: Şifre sıfırlama adımlarını çiz...)"
          style={{ 
            flex: 1, 
            background: 'transparent', 
            border: 'none', 
            color: colors.text, 
            fontSize: '13px', 
            outline: 'none',
            fontFamily: 'inherit'
          }}
        />

        <button 
          onClick={handleOmniboxSubmit}
          style={{ 
            background: accent, 
            color: '#fff', 
            border: 'none', 
            borderRadius: '8px', 
            padding: '6px 16px', 
            fontWeight: '600', 
            fontSize: '12px', 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px',
            transition: 'opacity 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
          Üret <ArrowRight size={14} />
        </button>
      </div>

      {/* DİNAMİK FAVORİLER ALANI */}
      {favoriteModules.length > 0 && (
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ ...sectionTitleStyle, color: accent, borderBottom: `1px solid ${accent}40` }}>
            <Star size={16} fill={accent} color={accent} /> Favori Modüllerim
          </h2>
          <div style={gridStyle}>
            {favoriteModules.map(module => (
              <ModuleCard key={`fav-${module.id}`} module={module} isFavorite={true} toggleFavorite={toggleFavorite} colors={colors} accent={accent} />
            ))}
          </div>
        </div>
      )}

      {/* KATEGORİ: ÜRETİM */}
      <div>
        <h2 style={sectionTitleStyle}>⚙️ Üretim Araçları</h2>
        <div style={gridStyle}>
          {MODULES.uretim.map(module => (
            <ModuleCard key={module.id} module={module} isFavorite={favorites.includes(module.id)} toggleFavorite={toggleFavorite} colors={colors} accent={accent} />
          ))}
        </div>
      </div>

      {/* KATEGORİ: ANALİZ */}
      <div>
        <h2 style={sectionTitleStyle}>📊 Analiz ve Doğrulama</h2>
        <div style={gridStyle}>
          {MODULES.analiz.map(module => (
            <ModuleCard key={module.id} module={module} isFavorite={favorites.includes(module.id)} toggleFavorite={toggleFavorite} colors={colors} accent={accent} />
          ))}
        </div>
      </div>

      {/* KATEGORİ: YÖNETİM & AGILE */}
      <div>
        <h2 style={sectionTitleStyle}>💼 Yönetim & Agile</h2>
        <div style={gridStyle}>
          {MODULES.yonetim.map(module => (
            <ModuleCard key={module.id} module={module} isFavorite={favorites.includes(module.id)} toggleFavorite={toggleFavorite} colors={colors} accent={accent} />
          ))}
        </div>
      </div>

      {/* API KULLANIM LİMİTİ BARI */}
      <div style={{ background: colors.card, border: `1px solid ${colors.border}`, padding: '20px', borderRadius: '12px', marginTop: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: '700', color: colors.text }}>AI Kullanım Limiti</span>
          <span style={{ fontSize: '13px', color: colors.textMuted }}>247 / 500 istek</span>
        </div>
        <div style={{ width: '100%', height: '8px', background: colors.bg, borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ width: '49%', height: '100%', background: accent, borderRadius: '4px' }}></div>
        </div>
        <div style={{ fontSize: '11px', color: colors.textMuted, marginTop: '8px' }}>Pro Plan · 253 istek kaldı</div>
      </div>

    </div>
  )
}