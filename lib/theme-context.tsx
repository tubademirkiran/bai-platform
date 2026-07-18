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
export type FontSize = 'sm' | 'base' | 'lg'

interface ThemeContextType {
  theme: ThemeKey
  mode: Mode
  lang: Language
  fontSize: FontSize
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
  setFontSize: (size: FontSize) => void
  // Türkçe karakter hatalarını kökten çözen asistanlar
  utils: {
    toUpperCaseTr: (str: string) => string
    toLowerCaseTr: (str: string) => string
  }
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'purple',
  mode: 'dark',
  lang: 'tr',
  fontSize: 'base',
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
  setFontSize: () => {},
  utils: {
    toUpperCaseTr: (str) => str.toUpperCase(),
    toLowerCaseTr: (str) => str.toLowerCase(),
  }
})

export function ThemeProvider({
  children,
  theme: initialTheme = 'purple',
  mode: initialMode = 'dark',
  lang: initialLang = 'tr',
  fontSize: initialFontSize = 'base',
}: {
  children: ReactNode
  theme?: ThemeKey
  mode?: Mode
  lang?: Language
  fontSize?: FontSize
}) {
  const [theme, setTheme] = useState<ThemeKey>(initialTheme)
  const [mode, setMode] = useState<Mode>(initialMode)
  const [lang, setLang] = useState<Language>(initialLang)
  const [fontSize, setFontSize] = useState<FontSize>(initialFontSize)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('bai-theme') as ThemeKey
      const savedMode = localStorage.getItem('bai-mode') as Mode
      const savedLang = localStorage.getItem('bai-lang') as Language
      const savedFontSize = localStorage.getItem('bai-font-size') as FontSize

      if (savedTheme && Object.keys(themes).includes(savedTheme)) setTheme(savedTheme)
      if (savedMode && (savedMode === 'dark' || savedMode === 'light')) setMode(savedMode)
      if (savedLang && ['tr', 'en', 'de'].includes(savedLang)) setLang(savedLang)
      if (savedFontSize && ['sm', 'base', 'lg'].includes(savedFontSize)) setFontSize(savedFontSize)
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
      localStorage.setItem('bai-font-size', fontSize)
    }
  }, [theme, mode, lang, fontSize, mounted])

  // DÜZELTME 2: GÜVENLİK ÖNLEMİ
  const safeThemeKey = themes[theme] ? theme : 'purple'
  const tData = themes[safeThemeKey]
  
  const isDark = mode === 'dark'
  const safeLang = translations[lang] ? lang : 'tr'

  // Ekran okuyucular ve tarayıcı için <html lang> değerini seçili dile bağla.
  useEffect(() => {
    document.documentElement.lang = safeLang
  }, [safeLang])

  // Türkçe karakter büyüteç/küçülteç dönüştürücüleri (ı-I ve i-İ hatalarını engeller)
  const utils = useMemo(() => ({
    toUpperCaseTr: (str: string) => {
      if (!str) return ''
      return str.replace(/i/g, 'İ').replace(/ı/g, 'I').toUpperCase()
    },
    toLowerCaseTr: (str: string) => {
      if (!str) return ''
      return str.replace(/İ/g, 'i').replace(/I/g, 'ı').toLowerCase()
    }
  }), [])

  // Yazı boyutu piksel haritası
  const fontSizeMap = {
    sm: '13px',
    base: '15px',
    lg: '17px'
  }

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

  const contextValue = {
    theme: safeThemeKey, 
    mode, 
    lang: safeLang,
    fontSize,
    accent: tData.accent, 
    soft: tData.soft, 
    isDark, 
    t: translations[safeLang], 
    colors,
    setTheme, 
    setMode, 
    setLang,
    setFontSize,
    utils
  }

  // Yazı boyutunun tüm uygulamada senkronize ve akıcı değişmesi için geçişli inline style
  // Next.js yönlendirmelerinde ezilmemesi adına CSS Değişkeni (--bai-dashboard-font-size) eklendi.
  const wrapperStyle = {
    '--bai-dashboard-font-size': fontSizeMap[fontSize],
    fontSize: fontSizeMap[fontSize],
    transition: 'font-size 0.2s ease',
    width: '100%',
    height: '100%'
  } as React.CSSProperties

  if (!mounted) {
    return (
      <ThemeContext.Provider value={contextValue}>
        <div style={{ fontSize: '15px', width: '100%', height: '100%' }}>
          {children}
        </div>
      </ThemeContext.Provider>
    )
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      <div style={wrapperStyle}>
        {children}
      </div>
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}