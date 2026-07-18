'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useTheme, FontSize } from '@/lib/theme-context'
import { Language } from '@/lib/i18n'
import { MODULES, modulesByCategory, moduleTitle } from '@/lib/modules'
import { useMediaQuery } from '@/lib/use-media-query'
import ChatAssistant from '@/components/ui/chat-assistant'

// UI (navigasyon dışı) ikonlar — modül ikonları artık lib/modules.ts'ten gelir.
import {
  ChevronDown, ChevronRight, Search, X, Menu,
  Settings, User, Palette, CreditCard, LogOut, CheckCircle2, Type,
} from 'lucide-react'

const themes = {
  purple: { accent: '#7c3aed', soft: '#f5f3ff', name: 'Mor' },
  green:  { accent: '#059669', soft: '#f0fdf4', name: 'Zümrüt' },
  orange: { accent: '#ea580c', soft: '#fff7ed', name: 'Turuncu' },
}

const langNames = { tr: 'TR', en: 'EN', de: 'DE' }

function DashboardContent({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)

  // ARAMA MODALI STATE'LERİ
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  // AYARLAR VE PROFİL MODALI STATE'LERİ
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [activeSettingsTab, setActiveSettingsTab] = useState<'profile' | 'appearance' | 'billing'>('profile')

  // PROFİL KAYDETME STATE'LERİ
  const [fullName, setFullName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  // RESPONSIVE: mobil menü (drawer) durumu
  const isMobile = useMediaQuery('(max-width: 1023px)')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    uretim: true,
    analiz: true,
    yonetim: true,
  })

  const router = useRouter()
  const pathname = usePathname()

  // useTheme genişletilmiş özellikleri entegre edildi
  const { theme, mode, lang, fontSize, setTheme, setMode, setLang, setFontSize, utils, isDark, colors: c, accent } = useTheme()

  // KLAVYE KISAYOLU (Cmd+K) VE ESCAPE DİNLEYİCİSİ
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setIsSearchOpen(true)
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false)
        setIsSettingsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (isSearchOpen) {
      setSearchQuery('')
      if (searchInputRef.current) {
        setTimeout(() => searchInputRef.current?.focus(), 50)
      }
    }
  }, [isSearchOpen])

  // Sayfa değişince mobil drawer'ı kapat
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/login')
      else {
        setUser(data.user)
        const meta = data.user.user_metadata as { full_name?: string } | undefined
        if (meta?.full_name) setFullName(meta.full_name)
      }
    })
  }, [router])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }))
  }

  const handleSearchSelect = (href: string) => {
    setIsSearchOpen(false)
    setSearchQuery('')
    router.push(href)
  }

  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ data: { full_name: fullName } })
      if (error) throw error
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (err) {
      console.error('Profil kaydedilemedi:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const tTheme = themes[theme as keyof typeof themes] || themes.purple

  const layoutColors = {
    sidebar: isDark ? '#0a0a0e' : '#0f0f13',
    sidebarBorder: isDark ? '#1f1f23' : '#1e1e22',
    content: isDark ? '#0f0f13' : '#f8fafc',
  }

  // --- MENÜ VERİ YAPISI ---
  const generalItems = modulesByCategory('general')
  const moduleGroups = [
    { id: 'uretim', title: lang === 'tr' ? 'ÜRETİM' : 'PRODUCTION', items: modulesByCategory('uretim') },
    { id: 'analiz', title: lang === 'tr' ? 'ANALİZ' : 'ANALYSIS', items: modulesByCategory('analiz') },
    { id: 'yonetim', title: lang === 'tr' ? 'YÖNETİM & AGILE' : 'MANAGEMENT', items: modulesByCategory('yonetim') },
  ]
  const otherItems = modulesByCategory('other')

  const allSearchItems = MODULES
  const filteredItems = allSearchItems.filter(item =>
    utils.toLowerCaseTr(moduleTitle(item, lang)).includes(utils.toLowerCaseTr(searchQuery))
  )
  const activeModule = allSearchItems.find(m => m.href === pathname)

  // Marka renkleri Turbopack derleme hatasına karşı tırnaklı (string literal) anahtarlar haline getirildi.
  const brandVars = {
    '--primary': accent,
    '--primary-foreground': '#ffffff',
    '--ring': accent,
    '--sidebar-primary': accent,
    '--sidebar-ring': accent,
    '--background': c.bg,
    '--card': c.card,
    '--popover': c.card,
    '--border': c.border,
    '--input': c.border,
    '--foreground': c.text,
    '--card-foreground': c.text,
    '--popover-foreground': c.text,
    '--muted-foreground': c.textMuted,
  } as React.CSSProperties

  const sidebarWidth = 220

  // Yazı boyutuna göre taban font-size eşleşme tablosu
  const fontSizeMap = {
    sm: '13px',
    base: '15px',
    lg: '17px'
  }

  return (
    <div
      className={isDark ? 'dark' : undefined}
      style={{ 
        ...brandVars, 
        display: 'flex', 
        height: '100vh', 
        width: '100vw', 
        overflow: 'hidden', 
        background: layoutColors.content,
        fontSize: fontSizeMap[fontSize], // Global taban yazı boyutu eşleşmesi sağlandı
        transition: 'font-size 0.2s ease'
      }}
    >

      {/* MOBİL OVERLAY */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 55 }}
        />
      )}

      {/* SOL MENÜ (SIDEBAR) — mobilde drawer */}
      <div
        style={{
          width: `${sidebarWidth}px`,
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          height: '100%',
          background: layoutColors.sidebar,
          borderRight: `1px solid ${layoutColors.sidebarBorder}`,
          zIndex: 60,
          transform: isMobile && !sidebarOpen ? `translateX(-${sidebarWidth}px)` : 'translateX(0)',
          transition: 'transform 0.25s ease',
        }}
      >

        <div style={{ padding: '16px 14px', borderBottom: `1px solid ${layoutColors.sidebarBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
            <div style={{ width: '32px', height: '32px', background: accent, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '800', fontSize: '14px' }}>B</div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#f1f5f9', letterSpacing: '-0.02em' }}>BAI Platform</div>
              <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '500' }}>AI Business Analyst</div>
            </div>
          </div>
          {isMobile && (
            <button onClick={() => setSidebarOpen(false)} aria-label="Menüyü kapat" style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px', display: 'flex' }}>
              <X size={20} />
            </button>
          )}
        </div>

        <nav style={{ flex: 1, padding: '16px 0', overflowY: 'auto' }}>

          <div style={{ fontSize: '10px', fontWeight: '800', color: '#475569', padding: '0 20px 8px', letterSpacing: '0.1em' }}>
            {utils.toUpperCaseTr(lang === 'tr' ? 'GENEL' : 'GENERAL')}
          </div>
          {generalItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: isActive ? '600' : '500', textDecoration: 'none', margin: '2px 8px', background: isActive ? accent : 'transparent', color: isActive ? '#fff' : '#94a3b8', transition: 'all 0.2s' }}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><item.icon size={18} /></span>{moduleTitle(item, lang)}
              </Link>
            )
          })}

          <div style={{ marginTop: '16px' }}>
            {moduleGroups.map((group) => (
              <div key={group.id} style={{ marginBottom: '4px' }}>
                <div
                  onClick={() => toggleGroup(group.id)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10px', fontWeight: '800', color: '#475569', padding: '8px 20px', letterSpacing: '0.1em', cursor: 'pointer', userSelect: 'none' }}
                >
                  <span>{utils.toUpperCaseTr(group.title)}</span>
                  <span style={{ color: '#64748b', display: 'flex', alignItems: 'center' }}>
                    {expandedGroups[group.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </span>
                </div>

                {expandedGroups[group.id] && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                    {group.items.map((item) => {
                      const isActive = pathname === item.href
                      return (
                        <Link key={item.href} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: isActive ? '600' : '500', textDecoration: 'none', margin: '0 8px', background: isActive ? accent : 'transparent', color: isActive ? '#fff' : '#94a3b8', transition: 'all 0.2s' }}>
                          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><item.icon size={18} /></span>{moduleTitle(item, lang)}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ fontSize: '10px', fontWeight: '800', color: '#475569', padding: '16px 20px 8px', letterSpacing: '0.1em' }}>
            {utils.toUpperCaseTr(lang === 'tr' ? 'DİĞER' : 'OTHER')}
          </div>
          {otherItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: isActive ? '600' : '500', textDecoration: 'none', margin: '2px 8px', background: isActive ? accent : 'transparent', color: isActive ? '#fff' : '#94a3b8', transition: 'all 0.2s' }}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><item.icon size={18} /></span>{moduleTitle(item, lang)}
              </Link>
            )
          })}

        </nav>

        {/* ERİŞİLEBİLİRLİK HIZLI PANEL */}
        <div style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: '6px', borderTop: `1px solid ${layoutColors.sidebarBorder}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.7 }}>
            <Type size={12} color="#64748b" />
            <span style={{ fontSize: '9px', fontWeight: '800', color: '#475569', letterSpacing: '0.04em' }}>
              {lang === 'tr' ? 'ERİŞİLEBİLİRLİK' : 'ACCESSIBILITY'}
            </span>
          </div>
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', padding: '2px', borderRadius: '6px', border: `1px solid ${layoutColors.sidebarBorder}` }}>
            {(['sm', 'base', 'lg'] as const).map((sz) => (
              <button
                key={sz}
                onClick={() => setFontSize(sz)}
                style={{
                  flex: 1, padding: '3px 0', fontSize: '10px', fontWeight: '700', borderRadius: '4px', border: 'none', cursor: 'pointer',
                  background: fontSize === sz ? accent + '25' : 'transparent',
                  color: fontSize === sz ? accent : '#64748b',
                  transition: 'all 0.15s ease'
                }}
              >
                {sz.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* ALT PROFİL BUTONU */}
        <div style={{ padding: '12px 16px 16px' }}>
          <div
            onClick={() => setIsSettingsOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '8px', borderRadius: '8px', transition: 'all 0.2s', background: 'rgba(255,255,255,0.03)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
          >
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px', fontWeight: '800' }}>
              {user?.email?.[0]?.toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.email}
              </div>
              <div style={{ fontSize: '11px', color: accent, fontWeight: '700' }}>Pro Plan</div>
            </div>
            <Settings size={16} color="#64748b" />
          </div>
        </div>
      </div>

      {/* SAĞ TARAF: TOPBAR VE SAYFA İÇERİĞİ */}
      <div style={{ flex: 1, marginLeft: isMobile ? 0 : `${sidebarWidth}px`, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', width: isMobile ? '100vw' : undefined }}>
        <div style={{
          position: 'sticky', top: 0, zIndex: 30, padding: isMobile ? '12px 16px' : '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: isDark ? 'rgba(15, 15, 19, 0.8)' : 'rgba(248, 250, 252, 0.8)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`, flexShrink: 0, gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            {isMobile && (
              <button onClick={() => setSidebarOpen(true)} aria-label="Menüyü aç" style={{ background: 'transparent', border: 'none', color: c.text, cursor: 'pointer', padding: '4px', display: 'flex', flexShrink: 0 }}>
                <Menu size={22} />
              </button>
            )}
            <div style={{ width: '4px', height: '24px', background: accent, borderRadius: '4px', flexShrink: 0 }} />
            <div style={{ fontWeight: '800', fontSize: isMobile ? '16px' : '20px', color: c.text, letterSpacing: '-0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {activeModule ? moduleTitle(activeModule, lang) : 'Dashboard'}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '24px', flexShrink: 0 }}>
            <button
              onClick={() => setIsSearchOpen(true)}
              aria-label={lang === 'tr' ? 'Modül ara' : 'Search'}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', background: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`, padding: isMobile ? '8px' : '8px 16px', borderRadius: '10px', cursor: 'text', color: c.textMuted, transition: 'all 0.2s' }}
            >
              <Search size={16} />
              {!isMobile && (
                <>
                  <span style={{ fontSize: '13px', marginRight: '40px', fontWeight: '500' }}>{lang === 'tr' ? 'Modül Ara...' : 'Search...'}</span>
                  <span style={{ fontSize: '10px', background: isDark ? 'rgba(255,255,255,0.1)' : '#cbd5e1', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>Cmd K</span>
                </>
              )}
            </button>

            {!isMobile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '700', padding: '8px 16px', borderRadius: '24px', background: tTheme.soft, color: accent, border: `1px solid ${accent}44`, boxShadow: `0 0 15px ${accent}25` }}>
                <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: accent, animation: 'pulse 2s infinite' }}></span>
                {lang === 'tr' ? 'AI Aktif' : 'AI Active'}
              </div>
            )}
          </div>
        </div>

        <div style={{ padding: isMobile ? '16px' : '32px', background: c.bg, flex: 1, overflowY: 'auto', color: c.text }}>
          {children}
        </div>
      </div>

      <ChatAssistant />

      {/* ------------------------------------------------------------- */}
      {/* 1. AYARLAR VE PROFİL MODALI (İçerik Scroll & Header Sabit) */}
      {/* ------------------------------------------------------------- */}
      {isSettingsOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ width: '100%', maxWidth: '850px', height: isMobile ? 'auto' : '550px', maxHeight: 'calc(100vh - 32px)', background: isDark ? '#121216' : '#ffffff', borderRadius: '20px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', display: 'flex', flexDirection: isMobile ? 'column' : 'row', overflow: 'hidden', border: `1px solid ${isDark ? '#27272a' : '#e2e8f0'}` }}>

            {/* Modal Sol Menü (Sekmeler) */}
            <div style={{ width: isMobile ? '100%' : '240px', flexShrink: 0, background: isDark ? '#18181b' : '#f8fafc', borderRight: isMobile ? 'none' : `1px solid ${isDark ? '#27272a' : '#e2e8f0'}`, borderBottom: isMobile ? `1px solid ${isDark ? '#27272a' : '#e2e8f0'}` : 'none', padding: isMobile ? '16px' : '24px 16px', display: 'flex', flexDirection: 'column' }}>
              {!isMobile && (
                <div style={{ fontSize: '18px', fontWeight: '800', color: c.text, padding: '0 12px', marginBottom: '24px', letterSpacing: '-0.02em' }}>
                  {lang === 'tr' ? 'Ayarlar' : 'Settings'}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: isMobile ? 'row' : 'column', gap: '6px', flex: 1, overflowX: isMobile ? 'auto' : 'visible' }}>
                <button onClick={() => setActiveSettingsTab('profile')} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '10px', background: activeSettingsTab === 'profile' ? accent + '15' : 'transparent', color: activeSettingsTab === 'profile' ? accent : c.textMuted, fontWeight: activeSettingsTab === 'profile' ? '700' : '500', fontSize: '13px', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
                  <User size={18} /> {lang === 'tr' ? 'Hesabım' : 'My Account'}
                </button>
                <button onClick={() => setActiveSettingsTab('appearance')} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '10px', background: activeSettingsTab === 'appearance' ? accent + '15' : 'transparent', color: activeSettingsTab === 'appearance' ? accent : c.textMuted, fontWeight: activeSettingsTab === 'appearance' ? '700' : '500', fontSize: '13px', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
                  <Palette size={18} /> {lang === 'tr' ? 'Görünüm ve Tema' : 'Appearance'}
                </button>
                <button onClick={() => setActiveSettingsTab('billing')} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '10px', background: activeSettingsTab === 'billing' ? accent + '15' : 'transparent', color: activeSettingsTab === 'billing' ? accent : c.textMuted, fontWeight: activeSettingsTab === 'billing' ? '700' : '500', fontSize: '13px', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
                  <CreditCard size={18} /> {lang === 'tr' ? 'Plan ve Faturalandırma' : 'Plan & Billing'}
                </button>
              </div>

              {!isMobile && (
                <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '10px', background: isDark ? 'rgba(255,255,255,0.03)' : '#f1f5f9', color: '#ef4444', fontWeight: '600', fontSize: '13px', border: 'none', cursor: 'pointer', textAlign: 'left', marginTop: 'auto', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#ef444422'} onMouseLeave={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.03)' : '#f1f5f9'}>
                  <LogOut size={18} /> {lang === 'tr' ? 'Güvenli Çıkış Yap' : 'Sign Out'}
                </button>
              )}
            </div>

            {/* Modal Sağ İçerik Alanı (Başlıklar sabit panel haline getirildi, alt alan scroll ediliyor) */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
              
              {/* SABİT PANEL: Başlık ve Kapatma Butonu */}
              <div style={{ padding: isMobile ? '20px 20px 12px' : '32px 32px 16px', borderBottom: `1px solid ${isDark ? '#27272a' : '#e2e8f0'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <h3 style={{ fontSize: '1.25em', fontWeight: '800', color: c.text, margin: 0 }}>
                  {activeSettingsTab === 'profile' && (lang === 'tr' ? 'Profil Bilgileri' : 'Profile Information')}
                  {activeSettingsTab === 'appearance' && (lang === 'tr' ? 'Görünüm Ayarları' : 'Appearance Settings')}
                  {activeSettingsTab === 'billing' && (lang === 'tr' ? 'Plan ve Kullanım' : 'Plan & Usage')}
                </h3>
                <button onClick={() => setIsSettingsOpen(false)} aria-label="Kapat" style={{ background: 'transparent', border: 'none', color: c.textMuted, cursor: 'pointer', padding: '4px', display: 'flex' }}>
                  <X size={24} />
                </button>
              </div>

              {/* YALNIZCA SEKMELERİN İÇERİĞİNİ SCROLL EDEN ALAN */}
              <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '16px 20px' : '24px 32px' }}>

                {/* SEKME 1: HESABIM */}
                {activeSettingsTab === 'profile' && (
                  <div style={{ animation: 'fadeIn 0.3s', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px', paddingBottom: '32px', borderBottom: `1px solid ${isDark ? '#27272a' : '#e2e8f0'}` }}>
                      <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '32px', fontWeight: '800', boxShadow: `0 8px 25px ${accent}44`, flexShrink: 0 }}>
                        {user?.email?.[0]?.toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '0.9em', color: c.textMuted, fontWeight: '600', marginBottom: '4px' }}>E-Posta Adresi</div>
                        <div style={{ fontSize: '1.1em', color: c.text, fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gap: '20px', maxWidth: '400px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85em', fontWeight: '600', color: c.textMuted, marginBottom: '8px' }}>{lang === 'tr' ? 'Ad Soyad' : 'Full Name'}</label>
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="İsminizi girin"
                          style={{ width: '100%', background: isDark ? '#18181b' : '#f8fafc', border: `1px solid ${isDark ? '#27272a' : '#cbd5e1'}`, padding: '12px 16px', borderRadius: '10px', color: c.text, fontSize: '0.95em', outline: `1px solid transparent`, transition: 'all 0.2s' }}
                          onFocus={e => e.currentTarget.style.outlineColor = accent}
                          onBlur={e => e.currentTarget.style.outlineColor = 'transparent'}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85em', fontWeight: '600', color: c.textMuted, marginBottom: '8px' }}>{lang === 'tr' ? 'Şifre Değiştir' : 'Change Password'}</label>
                        <button style={{ width: '100%', background: 'transparent', border: `1px solid ${isDark ? '#27272a' : '#cbd5e1'}`, color: c.text, padding: '12px 16px', borderRadius: '10px', fontSize: '0.95em', fontWeight: '600', cursor: 'pointer', textAlign: 'left' }}>
                          {lang === 'tr' ? 'Şifre sıfırlama e-postası gönder' : 'Send reset password email'}
                        </button>
                      </div>
                    </div>

                    <div style={{ marginTop: 'auto', paddingTop: '32px', display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                      {isMobile && (
                        <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderRadius: '10px', background: '#ef444415', color: '#ef4444', fontWeight: '600', fontSize: '0.85em', border: 'none', cursor: 'pointer' }}>
                          <LogOut size={16} /> {lang === 'tr' ? 'Çıkış Yap' : 'Sign Out'}
                        </button>
                      )}
                      <button
                        onClick={handleSaveProfile}
                        disabled={isSaving || showSuccess}
                        style={{
                          background: showSuccess ? '#10b981' : accent,
                          color: '#fff',
                          border: 'none',
                          padding: '12px 24px',
                          borderRadius: '10px',
                          fontSize: '0.95em',
                          fontWeight: '700',
                          cursor: isSaving || showSuccess ? 'default' : 'pointer',
                          transition: 'all 0.3s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginLeft: 'auto',
                        }}
                      >
                        {isSaving ? (
                          <span style={{ animation: 'pulse 1s infinite' }}>{lang === 'tr' ? 'Kaydediliyor...' : 'Saving...'}</span>
                        ) : showSuccess ? (
                          <> <CheckCircle2 size={18} /> {lang === 'tr' ? 'Başarıyla Kaydedildi' : 'Successfully Saved'} </>
                        ) : (
                          lang === 'tr' ? 'Değişiklikleri Kaydet' : 'Save Changes'
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* SEKME 2: GÖRÜNÜM VE TEMA */}
                {activeSettingsTab === 'appearance' && (
                  <div style={{ animation: 'fadeIn 0.3s' }}>
                    <div style={{ marginBottom: '24px' }}>
                      <p style={{ fontSize: '0.85em', color: c.textMuted, margin: 0 }}>Görünüm değişiklikleri anında (otomatik) kaydedilir ve tüm cihazlarınızda eşzamanlanır.</p>
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                      <label style={{ display: 'block', fontSize: '0.9em', fontWeight: '700', color: c.text, marginBottom: '12px' }}>{lang === 'tr' ? 'Uygulama Teması' : 'Application Theme'}</label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                        {(Object.entries(themes) as any[]).map(([key, val]: any) => (
                          <div key={key} onClick={() => setTheme(key as any)} style={{ border: theme === key ? `2px solid ${val.accent}` : `1px solid ${isDark ? '#27272a' : '#e2e8f0'}`, borderRadius: '12px', padding: '16px', cursor: 'pointer', background: theme === key ? val.accent + '11' : isDark ? '#18181b' : '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: val.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {theme === key && <CheckCircle2 size={16} color="#fff" />}
                            </div>
                            <span style={{ fontSize: '0.85em', fontWeight: '600', color: c.text }}>{val.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* AKTİF YAZI BOYUTU (ERİŞİLEBİLİRLİK) SEÇİM ALANI */}
                    <div style={{ marginBottom: '24px' }}>
                      <label style={{ display: 'block', fontSize: '0.9em', fontWeight: '700', color: c.text, marginBottom: '12px' }}>
                        {lang === 'tr' ? 'Metin Yazı Boyutu (Erişilebilirlik)' : 'Text Font Size'}
                      </label>
                      <div style={{ display: 'flex', background: isDark ? '#18181b' : '#f1f5f9', padding: '6px', borderRadius: '12px', gap: '6px', maxWidth: '300px' }}>
                        {(['sm', 'base', 'lg'] as const).map((sz) => (
                          <button
                            key={sz}
                            onClick={() => setFontSize(sz)}
                            style={{
                              flex: 1, padding: '10px', borderRadius: '8px', border: 'none', fontWeight: '600', fontSize: '0.85em', cursor: 'pointer',
                              background: fontSize === sz ? (isDark ? '#27272a' : '#ffffff') : 'transparent',
                              color: fontSize === sz ? c.text : '#64748b',
                              boxShadow: fontSize === sz ? '0 2px 10px rgba(0,0,0,0.1)' : 'none',
                              transition: 'all 0.2s'
                            }}
                          >
                            {sz === 'sm' ? (lang === 'tr' ? 'Küçük' : 'Small') : sz === 'base' ? (lang === 'tr' ? 'Normal' : 'Normal') : (lang === 'tr' ? 'Büyük' : 'Large')}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                      <label style={{ display: 'block', fontSize: '0.9em', fontWeight: '700', color: c.text, marginBottom: '12px' }}>{lang === 'tr' ? 'Karanlık / Aydınlık Mod' : 'Dark / Light Mode'}</label>
                      <div style={{ display: 'flex', background: isDark ? '#18181b' : '#f1f5f9', padding: '6px', borderRadius: '12px', gap: '6px', maxWidth: '300px' }}>
                        <button onClick={() => setMode('light')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: mode === 'light' ? '#ffffff' : 'transparent', color: mode === 'light' ? '#0f172a' : '#64748b', fontWeight: '600', fontSize: '0.85em', cursor: 'pointer', boxShadow: mode === 'light' ? '0 2px 10px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}>☀️ Light</button>
                        <button onClick={() => setMode('dark')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: mode === 'dark' ? '#27272a' : 'transparent', color: mode === 'dark' ? '#ffffff' : '#64748b', fontWeight: '600', fontSize: '0.85em', cursor: 'pointer', boxShadow: mode === 'dark' ? '0 2px 10px rgba(0,0,0,0.2)' : 'none', transition: 'all 0.2s' }}>🌙 Dark</button>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.9em', fontWeight: '700', color: c.text, marginBottom: '12px' }}>{lang === 'tr' ? 'Arayüz Dili' : 'Interface Language'}</label>
                      <div style={{ display: 'flex', gap: '12px', maxWidth: '300px' }}>
                        {(Object.entries(langNames) as [Language, string][]).map(([key, name]) => (
                          <button key={key} onClick={() => setLang(key)} style={{ flex: 1, padding: '10px', borderRadius: '10px', fontWeight: '700', fontSize: '0.85em', cursor: 'pointer', transition: 'all 0.2s', border: lang === key ? `2px solid ${accent}` : `1px solid ${isDark ? '#27272a' : '#e2e8f0'}`, background: lang === key ? accent + '11' : isDark ? '#18181b' : '#f8fafc', color: lang === key ? accent : c.textMuted }}>
                            {name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* SEKME 3: PLAN VE FATURALANDIRMA */}
                {activeSettingsTab === 'billing' && (
                  <div style={{ animation: 'fadeIn 0.3s' }}>
                    <div style={{ background: `linear-gradient(135deg, ${accent}15 0%, ${accent}05 100%)`, border: `1px solid ${accent}44`, borderRadius: '16px', padding: '24px', marginBottom: '32px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', gap: '12px' }}>
                        <div>
                          <div style={{ fontSize: '1.5em', fontWeight: '800', color: accent, marginBottom: '4px' }}>Pro Plan</div>
                          <div style={{ fontSize: '0.9em', color: c.textMuted, fontWeight: '500' }}>Tüm premium yapay zeka analiz özelliklerine erişim.</div>
                        </div>
                        <div style={{ background: accent, color: '#fff', padding: '6px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '800', whiteSpace: 'nowrap' }}>AKTİF YÖNETİCİ</div>
                      </div>

                      <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '0.85em', fontWeight: '600', color: c.text }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          AI Kullanım Limiti
                          <span style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.04em', textTransform: 'uppercase', padding: '2px 6px', borderRadius: '6px', background: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0', color: c.textMuted }}>Örnek veri</span>
                        </span>
                        <span>247 / 500 Token</span>
                      </div>
                      <div style={{ height: '8px', background: isDark ? 'rgba(0,0,0,0.3)' : '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: '49.4%', background: accent, borderRadius: '4px' }}></div>
                      </div>
                      <div style={{ marginTop: '12px', fontSize: '0.8em', color: c.textMuted }}>Kullanım hakkınız her ayın 1'inde sıfırlanır.</div>
                    </div>

                    <button style={{ background: isDark ? '#ffffff' : '#0f172a', color: isDark ? '#000000' : '#ffffff', border: 'none', padding: '12px 24px', borderRadius: '10px', fontSize: '0.95em', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }}>
                      Planı Yükselt (Enterprise)
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. GLOBAL SEARCH MODAL (CMD+K) */}
      {/* ------------------------------------------------------------- */}
      {isSearchOpen && (
        <div onClick={() => setIsSearchOpen(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: isMobile ? '8vh' : '12vh', paddingLeft: '16px', paddingRight: '16px' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '550px', background: isDark ? '#18181b' : '#ffffff', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', overflow: 'hidden', border: `1px solid ${isDark ? '#27272a' : '#e2e8f0'}` }}>
            <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: `1px solid ${isDark ? '#27272a' : '#e2e8f0'}` }}>
              <Search size={20} color={accent} style={{ marginRight: '12px' }} />
              <input ref={searchInputRef} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={lang === 'tr' ? 'Hangi modülü arıyorsunuz?' : 'What module are you looking for?'} style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: '16px', color: isDark ? '#f8fafc' : '#0f172a' }} />
              <button onClick={() => setIsSearchOpen(false)} aria-label="Kapat" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}><X size={20} /></button>
            </div>
            <div style={{ maxHeight: '350px', overflowY: 'auto', padding: '8px' }}>
              {filteredItems.length > 0 ? (
                filteredItems.map(item => (
                  <div key={item.href} onClick={() => handleSearchSelect(item.href)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', cursor: 'pointer', color: isDark ? '#cbd5e1' : '#334155', transition: 'all 0.1s' }} onMouseEnter={e => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc'; e.currentTarget.style.color = accent }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = isDark ? '#cbd5e1' : '#334155' }}>
                    <span style={{ opacity: 0.7, display: 'flex' }}><item.icon size={18} /></span><span style={{ fontSize: '14px', fontWeight: '500' }}>{moduleTitle(item, lang)}</span>
                  </div>
                ))
              ) : (
                <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>Aramanızla eşleşen modül bulunamadı.</div>
              )}
            </div>
            <div style={{ padding: '10px 16px', borderTop: `1px solid ${isDark ? '#27272a' : '#e2e8f0'}`, fontSize: '10px', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
              <span>Yönlendirmek için tıklayın</span><span>ESC kapatır</span>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

import { ThemeProvider as Provider } from '@/lib/theme-context'
import { ToastProvider } from '@/components/ui/toast'
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Provider>
      <ToastProvider>
        <DashboardContent>{children}</DashboardContent>
      </ToastProvider>
    </Provider>
  )
}