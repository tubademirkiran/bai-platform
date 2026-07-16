'use client'

import { useEffect, useState } from 'react'
import { useTheme } from '@/lib/theme-context'
import { useToast } from '@/components/ui/toast'
import { getHistory, toggleFavorite, deleteHistory } from '@/lib/history'
import {
  FileText, Database, AlertTriangle, Mic, CheckSquare, GitMerge, Activity,
  TerminalSquare, Layout, UserCircle, Scale, Ticket, Briefcase,
  Clock, Star, Trash2, ChevronDown, Inbox, Loader2,
} from 'lucide-react'

type Tab = 'all' | 'favorites'

export default function HistoryPage() {
  const { accent, colors, lang, isDark } = useTheme()
  const { toast, confirm } = useToast()
  const [activeTab, setActiveTab] = useState<Tab>('all')
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Sayfa yüklendiğinde verileri çek
  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const data = await getHistory()
      setHistory(data || [])
    } catch (error) {
      console.error('History fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Favoriye ekle/çıkar (Optimistic UI Update ile anında tepki verir)
  async function handleToggleFavorite(e: React.MouseEvent, id: string, currentStatus: boolean) {
    e.stopPropagation() // Kartın açılıp kapanmasını engeller

    // UI'ı anında güncelle
    setHistory(prev => prev.map(item =>
      item.id === id ? { ...item, is_favorite: !currentStatus } : item
    ))

    // Arka planda DB'yi güncelle
    await toggleFavorite(id, currentStatus)
  }

  // Geçmişten sil — native confirm yerine ürünle uyumlu onay diyaloğu + toast
  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    const ok = await confirm({
      title: lang === 'tr' ? 'Kaydı sil' : 'Delete record',
      message: lang === 'tr'
        ? 'Bu kaydı kalıcı olarak silmek istediğinize emin misiniz?'
        : 'Are you sure you want to permanently delete this record?',
      confirmText: lang === 'tr' ? 'Sil' : 'Delete',
      cancelText: lang === 'tr' ? 'Vazgeç' : 'Cancel',
      danger: true,
    })
    if (!ok) return

    setHistory(prev => prev.filter(item => item.id !== id))
    await deleteHistory(id)
    toast(lang === 'tr' ? 'Kayıt silindi' : 'Record deleted', 'success')
  }

  // Kartı genişlet / daralt
  function toggleExpand(id: string) {
    setExpandedId(prev => prev === id ? null : id)
  }

  // Modül isimlerine göre ikon belirleme (lucide — platform bağımsız, kurumsal)
// Modül isimlerine göre ikon belirleme (lucide — platform bağımsız, kurumsal)
  const getModuleIcon = (moduleName: string) => {
    const name = moduleName.toLowerCase()
    const p = { size: 20 }
    if (name.includes('atlas') || name.includes('bmad')) return <TerminalSquare {...p} /> // <--- BURASI EKLENDİ
    if (name.includes('requirement')) return <FileText {...p} />
    if (name.includes('sql')) return <Database {...p} />
    if (name.includes('risk')) return <AlertTriangle {...p} />
    if (name.includes('meeting')) return <Mic {...p} />
    if (name.includes('test')) return <CheckSquare {...p} />
    if (name.includes('flowchart') || name.includes('sequence')) return <GitMerge {...p} />
    if (name.includes('impact')) return <Activity {...p} />
    if (name.includes('bdd') || name.includes('gherkin')) return <TerminalSquare {...p} />
    if (name.includes('wireframe')) return <Layout {...p} />
    if (name.includes('persona')) return <UserCircle {...p} />
    if (name.includes('prioritization')) return <Scale {...p} />
    if (name.includes('jira')) return <Ticket {...p} />
    if (name.includes('pmi') || name.includes('project')) return <Briefcase {...p} />
    return <FileText {...p} />
  }

  // Aktif sekmeye göre listeyi filtrele
  const filteredHistory = history.filter(item =>
    activeTab === 'favorites' ? item.is_favorite : true
  )

  const btnStyle = {
    padding: '8px 16px', borderRadius: '8px',
    fontSize: '12px', fontWeight: '600', cursor: 'pointer',
    transition: 'all 0.2s ease', border: 'none',
    display: 'inline-flex', alignItems: 'center', gap: '6px',
  } as const

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Üst Başlık Alanı */}
      <div style={{ marginBottom: '24px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: colors.text, margin: 0 }}>
            {lang === 'tr' ? 'Geçmiş & Favoriler' : 'History & Favorites'}
          </h2>
          <span style={{ fontSize: '10px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px', background: accent + '22', color: accent }}>Workspace</span>
        </div>
        <p style={{ fontSize: '13px', color: colors.textMuted, margin: 0 }}>
          {lang === 'tr' ? 'Önceki AI üretimlerinize göz atın veya beğendiklerinizi favorileyin.' : 'Browse your previous AI generations or favorite the best ones.'}
        </p>
      </div>

      {/* Sekmeler (Tabs) */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexShrink: 0 }}>
        <button
          onClick={() => setActiveTab('all')}
          style={{
            ...btnStyle,
            background: activeTab === 'all' ? accent : colors.card,
            color: activeTab === 'all' ? '#fff' : colors.textMuted,
            border: `1px solid ${activeTab === 'all' ? accent : colors.border}`
          }}
        >
          <Clock size={14} /> {lang === 'tr' ? 'Tüm Geçmiş' : 'All History'}
        </button>
        <button
          onClick={() => setActiveTab('favorites')}
          style={{
            ...btnStyle,
            background: activeTab === 'favorites' ? accent : colors.card,
            color: activeTab === 'favorites' ? '#fff' : colors.textMuted,
            border: `1px solid ${activeTab === 'favorites' ? accent : colors.border}`
          }}
        >
          <Star size={14} /> {lang === 'tr' ? 'Favoriler' : 'Favorites'}
        </button>
      </div>

      {/* İçerik Alanı (Kaydırılabilir) */}
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px', paddingBottom: '20px' }}>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', gap: '16px' }}>
            <Loader2 size={28} color={accent} style={{ animation: 'pulse 1.5s infinite' }} />
            <div style={{ color: colors.textMuted, fontSize: '13px', fontWeight: '600' }}>{lang === 'tr' ? 'Kayıtlar yükleniyor...' : 'Loading records...'}</div>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div style={{ background: colors.card, border: `1px dashed ${colors.border}`, borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', gap: '12px' }}>
            {activeTab === 'favorites'
              ? <Star size={44} color={colors.textMuted} style={{ opacity: 0.4 }} />
              : <Inbox size={44} color={colors.textMuted} style={{ opacity: 0.4 }} />}
            <div style={{ color: colors.textMuted, fontSize: '14px', fontWeight: '600' }}>
              {activeTab === 'favorites'
                ? (lang === 'tr' ? 'Henüz favoriye eklenmiş bir kayıt yok.' : 'No favorites added yet.')
                : (lang === 'tr' ? 'Geçmişiniz tertemiz. Henüz bir üretim yapmadınız.' : 'Your history is clean. No generations yet.')}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredHistory.map((item) => {
              const isExpanded = expandedId === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => toggleExpand(item.id)}
                  style={{
                    background: colors.card,
                    border: `1px solid ${isExpanded ? accent : colors.border}`,
                    borderRadius: '12px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isExpanded && !isDark ? `0 4px 20px ${accent}15` : 'none'
                  }}
                >
                  {/* Kart Başlığı (Daima Görünür) */}
                  <div style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                      <div style={{ background: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc', color: accent, width: '40px', height: '40px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {getModuleIcon(item.module)}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: colors.text, marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.module}
                        </div>
                        <div style={{ fontSize: '11px', color: colors.textMuted }}>
                          {new Date(item.created_at).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>

                    {/* Aksiyon Butonları (Yıldız ve Çöp Kutusu) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={(e) => handleToggleFavorite(e, item.id, item.is_favorite)}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', transition: 'transform 0.2s', transform: item.is_favorite ? 'scale(1.1)' : 'scale(1)' }}
                        title={lang === 'tr' ? 'Favori' : 'Favorite'}
                        aria-label={lang === 'tr' ? 'Favori' : 'Favorite'}
                      >
                        <Star size={18} color={item.is_favorite ? '#f59e0b' : colors.textMuted} fill={item.is_favorite ? '#f59e0b' : 'transparent'} />
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, item.id)}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', color: '#ef4444', opacity: 0.7 }}
                        title={lang === 'tr' ? 'Sil' : 'Delete'}
                        aria-label={lang === 'tr' ? 'Sil' : 'Delete'}
                        onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                        onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}
                      >
                        <Trash2 size={16} />
                      </button>
                      {/* Genişletme İkonu */}
                      <div style={{ color: colors.textMuted, marginLeft: '8px', display: 'flex', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}>
                        <ChevronDown size={18} />
                      </div>
                    </div>
                  </div>

                  {/* Kart Detayı (Tıklanınca Açılır) */}
                  {isExpanded && (
                    <div style={{ borderTop: `1px solid ${colors.border}`, padding: '16px', background: isDark ? 'rgba(0,0,0,0.2)' : '#f8fafc', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                      {/* Girdi Alanı */}
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: '800', color: colors.textMuted, letterSpacing: '0.05em', marginBottom: '6px' }}>
                          {lang === 'tr' ? 'GİRDİ (PROMPT)' : 'INPUT (PROMPT)'}
                        </div>
                        <div style={{ fontSize: '13px', color: colors.text, background: colors.bg, padding: '12px', borderRadius: '8px', border: `1px solid ${colors.border}`, whiteSpace: 'pre-wrap', wordWrap: 'break-word', maxHeight: '150px', overflowY: 'auto' }}>
                          {item.input}
                        </div>
                      </div>

                      {/* Çıktı Alanı */}
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: '800', color: accent, letterSpacing: '0.05em', marginBottom: '6px' }}>
                          {lang === 'tr' ? 'AI ÇIKTISI' : 'AI OUTPUT'}
                        </div>
                        <div style={{ fontSize: '12px', color: colors.text, background: isDark ? '#0d0d0f' : '#f1f5f9', padding: '12px', borderRadius: '8px', border: `1px solid ${colors.border}`, whiteSpace: 'pre-wrap', wordWrap: 'break-word', fontFamily: 'monospace', maxHeight: '300px', overflowY: 'auto' }}>
                          {item.output}
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
