'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/lib/theme-context'
import { getHistory } from '@/lib/history'
import {
  modulesByCategory, moduleCardTitle, moduleDesc, MODULE_ROUTES,
  type ModuleDef,
} from '@/lib/modules'
import type { Language } from '@/lib/i18n'
import { Star, Clock, Sparkles, ArrowRight, Settings, BarChart3, Briefcase } from 'lucide-react'

// KART ALT BİLEŞENİ — veri tek kaynaktan (lib/modules.ts) gelir
function ModuleCard({
  module, isFavorite, toggleFavorite, colors, accent, lang,
}: {
  module: ModuleDef
  isFavorite: boolean
  toggleFavorite: (id: string) => void
  colors: any
  accent: string
  lang: Language
}) {
  const [isHovered, setIsHovered] = useState(false)
  const router = useRouter()
  const Icon = module.icon

  return (
    <div
      onClick={() => router.push(module.href)}
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
        transform: isHovered ? 'translateY(-2px)' : 'none',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div style={{ color: accent, transition: 'transform 0.3s ease', transform: isHovered ? 'scale(1.08)' : 'scale(1)' }}>
          <Icon size={26} strokeWidth={1.5} />
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {module.badge && (
            <span style={{ fontSize: '10px', background: `${colors.border}80`, color: colors.textMuted, padding: '4px 8px', borderRadius: '12px', fontWeight: '600' }}>
              {module.badge}
            </span>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); toggleFavorite(module.id) }}
            aria-label="Favori"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
          >
            <Star size={18} color={isFavorite ? accent : colors.textMuted} fill={isFavorite ? accent : 'transparent'} style={{ transition: 'all 0.2s ease' }} />
          </button>
        </div>
      </div>
      <h3 style={{ fontSize: '14px', fontWeight: '700', color: colors.text, marginBottom: '6px' }}>{moduleCardTitle(module, lang)}</h3>
      <p style={{ fontSize: '12px', color: colors.textMuted, lineHeight: '1.4' }}>{moduleDesc(module, lang)}</p>
    </div>
  )
}

// created_at → "2 saat önce" gibi göreli zaman.
function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'az önce'
  if (min < 60) return `${min} dk önce`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} saat önce`
  const day = Math.floor(hr / 24)
  return `${day} gün önce`
}

export default function DashboardPage() {
  const { accent, colors, lang } = useTheme()
  const router = useRouter()
  const [favorites, setFavorites] = useState<string[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [omniboxQuery, setOmniboxQuery] = useState('')

  const [stats, setStats] = useState({ total: 0, thisWeek: 0 })
  const [recentActivity, setRecentActivity] = useState<{ title: string; time: string; route: string } | null>(null)

  const uretim = modulesByCategory('uretim')
  const analiz = modulesByCategory('analiz')
  const yonetim = modulesByCategory('yonetim')
  const cardModules = [...uretim, ...analiz, ...yonetim]

  useEffect(() => {
    const savedFavs = localStorage.getItem('bai_favorites')
    if (savedFavs) {
      setFavorites(JSON.parse(savedFavs))
    }
    setIsLoaded(true)

    getHistory().then((history) => {
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
      const thisWeek = history.filter((h) => new Date(h.created_at).getTime() >= weekAgo).length
      setStats({ total: history.length, thisWeek })

      const latest = history[0]
      if (latest) {
        setRecentActivity({
          title: latest.module,
          time: relativeTime(latest.created_at),
          route: MODULE_ROUTES[latest.module] || '/dashboard/history',
        })
      }
    })
  }, [])

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const newFavorites = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
      localStorage.setItem('bai_favorites', JSON.stringify(newFavorites))
      return newFavorites
    })
  }

  // OMNIBOX YÖNLENDİRME MANTIĞI
  const handleOmniboxSubmit = () => {
    if (!omniboxQuery.trim()) return

    const query = omniboxQuery.toLowerCase()
    let targetRoute = '/dashboard/requirement'

    if (query.includes('çiz') || query.includes('şema') || query.includes('akış')) {
      targetRoute = '/dashboard/flowchart'
    } else if (query.includes('sql') || query.includes('sorgu') || query.includes('veri tabanı')) {
      targetRoute = '/dashboard/sql'
    } else if (query.includes('test') || query.includes('senaryo') || query.includes('qa')) {
      targetRoute = '/dashboard/testcase'
    } else if (query.includes('risk') || query.includes('tehlike')) {
      targetRoute = '/dashboard/risk'
    } else if (query.includes('mimar') || query.includes('atlas') || query.includes('bmad') || query.includes('kapsam')) {
      targetRoute = '/dashboard/bmad-studio'
    }

    router.push(`${targetRoute}?prompt=${encodeURIComponent(omniboxQuery)}`)
  }

  const favoriteModules = cardModules.filter(m => favorites.includes(m.id))

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '16px',
    marginBottom: '32px',
  } as const

  const sectionTitleStyle = {
    fontSize: '14px',
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: '16px',
    borderBottom: `1px solid ${colors.border}`,
    paddingBottom: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  } as const

  if (!isLoaded) return null

  return (
    <div style={{ paddingBottom: '40px' }}>

      {/* ÜST BİLGİ VE WIDGETLAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: colors.text, marginBottom: '4px' }}>Hoş geldin 👋</h1>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>

          {recentActivity && (
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
          )}

          <div style={{ background: `${accent}15`, border: `1px solid ${accent}30`, padding: '8px 16px', borderRadius: '8px', textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: colors.textMuted, fontWeight: '600' }}>Bu Hafta Üretilen</div>
            <div style={{ fontSize: '16px', color: accent, fontWeight: '800' }}>{stats.thisWeek} Adet</div>
          </div>

          <div style={{ background: colors.card, border: `1px solid ${colors.border}`, padding: '8px 16px', borderRadius: '8px', textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: colors.textMuted, fontWeight: '600' }}>Toplam Üretilen Analiz</div>
            <div style={{ fontSize: '16px', color: colors.text, fontWeight: '800' }}>{stats.total} Adet</div>
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
        transition: 'all 0.3s ease',
      }}>
        <div style={{ background: `${accent}20`, padding: '6px', borderRadius: '8px', color: accent, display: 'flex' }}>
          <Sparkles size={18} />
        </div>

        <input
          type="text"
          value={omniboxQuery}
          onChange={(e) => setOmniboxQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleOmniboxSubmit()}
          placeholder="Bugün ne analiz etmek istiyorsun? (Örn: Hastane sistemi için BMAD mimarisi oluştur...)"
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            color: colors.text,
            fontSize: '13px',
            outline: 'none',
            fontFamily: 'inherit',
            minWidth: 0,
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
            transition: 'opacity 0.2s ease',
            flexShrink: 0,
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
              <ModuleCard key={`fav-${module.id}`} module={module} isFavorite={true} toggleFavorite={toggleFavorite} colors={colors} accent={accent} lang={lang} />
            ))}
          </div>
        </div>
      )}

      {/* KATEGORİ: ÜRETİM */}
      <div>
        <h2 style={sectionTitleStyle}><Settings size={16} /> Üretim Araçları</h2>
        <div style={gridStyle}>
          {uretim.map(module => (
            <ModuleCard key={module.id} module={module} isFavorite={favorites.includes(module.id)} toggleFavorite={toggleFavorite} colors={colors} accent={accent} lang={lang} />
          ))}
        </div>
      </div>

      {/* KATEGORİ: ANALİZ */}
      <div>
        <h2 style={sectionTitleStyle}><BarChart3 size={16} /> Analiz ve Doğrulama</h2>
        <div style={gridStyle}>
          {analiz.map(module => (
            <ModuleCard key={module.id} module={module} isFavorite={favorites.includes(module.id)} toggleFavorite={toggleFavorite} colors={colors} accent={accent} lang={lang} />
          ))}
        </div>
      </div>

      {/* KATEGORİ: YÖNETİM & AGILE */}
      <div>
        <h2 style={sectionTitleStyle}><Briefcase size={16} /> Yönetim & Agile</h2>
        <div style={gridStyle}>
          {yonetim.map(module => (
            <ModuleCard key={module.id} module={module} isFavorite={favorites.includes(module.id)} toggleFavorite={toggleFavorite} colors={colors} accent={accent} lang={lang} />
          ))}
        </div>
      </div>

      {/* API KULLANIM LİMİTİ BARI */}
      <div style={{ background: colors.card, border: `1px solid ${colors.border}`, padding: '20px', borderRadius: '12px', marginTop: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: '700', color: colors.text, display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            AI Kullanım Limiti
            <span style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.04em', textTransform: 'uppercase', padding: '2px 6px', borderRadius: '6px', background: `${colors.border}`, color: colors.textMuted }}>Örnek veri</span>
          </span>
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
