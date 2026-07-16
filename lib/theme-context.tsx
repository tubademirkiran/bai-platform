'use client'

import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react'
// DÜZELTME 1: './i18n' yerine kesin yol olan '@/lib/i18n' kullanıyoruz.
import { translations, Language } from '@/lib/i18n'

const themes = {
  purple: { accent: '#7c3aed', soft: '#f5f3ff', name: 'Mor' },
  green:  { accent: '#059669', soft: '#f0fdf4', name: 'Zumrut' },
  orange: { accent: '#ea580c', soft: '#fff7ed', name: 'Turuncu' },
}

type ThemeKey = 'purple' | 'green' | 'orange'
type Mode = 'light' | 'dark'

interface ThemeContextType {
  theme: ThemeKey
  mode: Mode
  lang: Language
  accent: string
  soft: string
  isDark: boolean
  t: typeof translations.tr
  colors: {
    bg: string
    card: string
    border: string
    text: string
    textMuted: string
  }
  setTheme: (theme: ThemeKey) => void
  setMode: (mode: Mode) => void
  setLang: (lang: Language) => void
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'purple',
  mode: 'dark',
  lang: 'tr',
  accent: '#7c3aed',
  soft: '#f5f3ff',
  isDark: true,
  t: translations.tr,
  colors: {
    bg: '#0f0f13',
    card: '#18181b',
    border: '#27272a',
    text: '#f1f5f9',
    textMuted: '#64748b',
  },
  setTheme: () => {},
  setMode: () => {},
  setLang: () => {},
})

export function ThemeProvider({
  children,
  theme: initialTheme = 'purple',
  mode: initialMode = 'dark',
  lang: initialLang = 'tr',
}: {
  children: ReactNode
  theme?: ThemeKey
  mode?: Mode
  lang?: Language
}) {
  const [theme, setTheme] = useState<ThemeKey>(initialTheme)
  const [mode, setMode] = useState<Mode>(initialMode)
  const [lang, setLang] = useState<Language>(initialLang)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('bai-theme') as ThemeKey
      const savedMode = localStorage.getItem('bai-mode') as Mode
      const savedLang = localStorage.getItem('bai-lang') as Language

      if (savedTheme && Object.keys(themes).includes(savedTheme)) setTheme(savedTheme)
      if (savedMode && (savedMode === 'dark' || savedMode === 'light')) setMode(savedMode)
      if (savedLang && ['tr', 'en', 'de'].includes(savedLang)) setLang(savedLang)
    } catch (error) {
      console.warn("LocalStorage okunamadı, varsayılan ayarlara dönülüyor.")
    }
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('bai-theme', theme)
      localStorage.setItem('bai-mode', mode)
      localStorage.setItem('bai-lang', lang)
    }
  }, [theme, mode, lang, mounted])

  // DÜZELTME 2: GÜVENLİK ÖNLEMİ (Eski kırık veriler sistemi çökertmesin diye)
  const safeThemeKey = themes[theme] ? theme : 'purple'
  const t = themes[safeThemeKey]
  
  const isDark = mode === 'dark'
  const safeLang = translations[lang] ? lang : 'tr'

  // Ekran okuyucular ve tarayıcı için <html lang> değerini seçili dile bağla.
  useEffect(() => {
    document.documentElement.lang = safeLang
  }, [safeLang])
  // Not: dark sınıfı ve marka CSS değişkenleri dashboard wrapper'ına scoped
  // uygulanır (bkz. dashboard/layout.tsx) — auth sayfalarına sızmaması için.

  // textMuted artık moda duyarlı — WCAG AA kontrastı için koyulaştırıldı.
  // (Önceki sabit #64748b koyu kart üzerinde ~3.5:1 ile AA altındaydı.)
  const colors = useMemo(
    () => ({
      bg: isDark ? '#0f0f13' : '#f8fafc',
      card: isDark ? '#18181b' : '#ffffff',
      border: isDark ? '#27272a' : '#e2e8f0',
      text: isDark ? '#f1f5f9' : '#0f172a',
      textMuted: isDark ? '#94a3b8' : '#475569',
    }),
    [isDark]
  )

  if (!mounted) {
    return (
      <ThemeContext.Provider value={{
        theme: safeThemeKey, 
        mode, 
        lang: safeLang, 
        accent: t.accent, 
        soft: t.soft, 
        isDark, 
        t: translations[safeLang], 
        colors,
        setTheme, setMode, setLang
      }}>
        {children}
      </ThemeContext.Provider>
    )
  }

  return (
    <ThemeContext.Provider value={{
      theme: safeThemeKey, 
      mode, 
      lang: safeLang,
      accent: t.accent,
      soft: t.soft,
      isDark,
      t: translations[safeLang],
      colors,
      setTheme, setMode, setLang
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}