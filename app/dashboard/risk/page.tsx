'use client'

import { useState } from 'react'
import { useTheme } from '@/lib/theme-context'

export default function RiskPage() {
  const { lang } = useTheme()

  // Form State
  const [teamSize, setTeamSize] = useState<string>('5')
  const [duration, setDuration] = useState<string>('12')
  const [backlogSize, setBacklogSize] = useState<string>('50')
  const [seniority, setSeniority] = useState<string>('mixed')
  const [projectType, setProjectType] = useState<string>('web')
  const [externalDependencies, setExternalDependencies] = useState<string>('2')
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false)

  // Output & Loading State
  const [loading, setLoading] = useState<boolean>(false)
  const [output, setOutput] = useState<string>('')
  const [errorMsg, setErrorMsg] = useState<string>('')

  // Çoklu dil desteği
  const s = {
    tr: {
      title: 'AI Proje Risk Analizörü',
      desc: 'Projenizin metriklerini girin, yapay zeka teslimat risklerini ve çözüm yollarını çıkarsın.',
      presets: 'Hızlı Senaryolar',
      mvp: '🚀 MVP Projesi',
      standard: '📱 Standart App',
      enterprise: '🏢 Kurumsal Sistem',
      teamSize: 'Ekip Büyüklüğü',
      duration: 'Süre (Hafta)',
      backlogSize: 'Backlog (Görev)',
      advanced: 'Gelişmiş Parametreler',
      seniority: 'Ekip Kıdem Seviyesi',
      projectType: 'Proje Tipi',
      dependencies: 'Dış Bağımlılık Sayısı',
      submit: 'Riskleri Analiz Et',
      analyzing: 'Risk Analizi Yapılıyor...',
      resultTitle: 'Risk Değerlendirme Raporu',
      emptyOutput: 'Risk raporunuz burada görüntülenecek. Sol taraftaki parametreleri doldurup analizi başlatın.',
      copy: 'Raporu Kopyala',
      copied: 'Kopyalandı!',
    },
    en: {
      title: 'AI Project Risk Analyzer',
      desc: 'Enter project parameters to get AI-powered delivery risk assessments and mitigation strategies.',
      presets: 'Quick Presets',
      mvp: '🚀 Fast MVP',
      standard: '📱 Standard App',
      enterprise: '🏢 Enterprise System',
      teamSize: 'Team Size',
      duration: 'Duration (Weeks)',
      backlogSize: 'Backlog (Tasks)',
      advanced: 'Advanced Parameters',
      seniority: 'Team Seniority Profile',
      projectType: 'Project Category',
      dependencies: 'External Dependencies',
      submit: 'Analyze Risks',
      analyzing: 'Analyzing Risks...',
      resultTitle: 'Risk Assessment Report',
      emptyOutput: 'Your risk report will appear here. Fill out the parameters on the left to begin.',
      copy: 'Copy Report',
      copied: 'Copied!',
    },
    de: {
      title: 'KI Risikoanalysator',
      desc: 'Geben Sie Projektdaten ein, um KI-gestützte Risikobewertungen zu erhalten.',
      presets: 'Schnellszenarien',
      mvp: '🚀 Schnelles MVP',
      standard: '📱 Standard App',
      enterprise: '🏢 Enterprise System',
      teamSize: 'Teamgröße',
      duration: 'Dauer (Wochen)',
      backlogSize: 'Backlog (Aufgaben)',
      advanced: 'Erweiterte Parameter',
      seniority: 'Team-Erfahrung',
      projectType: 'Projekttyp',
      dependencies: 'Externe Abhängigkeiten',
      submit: 'Risiken Analysieren',
      analyzing: 'Analysiere Risiken...',
      resultTitle: 'Risikobewertungsbericht',
      emptyOutput: 'Ihr Risikobericht wird hier angezeigt.',
      copy: 'Kopieren',
      copied: 'Kopiert!',
    },
  }

  const t = s[lang as keyof typeof s] || s.tr
  const [copied, setCopied] = useState(false)

  // Preset seçimi
  const applyPreset = (type: 'mvp' | 'standard' | 'enterprise') => {
    if (type === 'mvp') {
      setTeamSize('3')
      setDuration('4')
      setBacklogSize('25')
      setSeniority('junior')
      setProjectType('web')
      setExternalDependencies('1')
    } else if (type === 'standard') {
      setTeamSize('6')
      setDuration('12')
      setBacklogSize('75')
      setSeniority('mixed')
      setProjectType('app')
      setExternalDependencies('3')
    } else {
      setTeamSize('14')
      setDuration('24')
      setBacklogSize('240')
      setSeniority('senior')
      setProjectType('migration')
      setExternalDependencies('8')
    }
  }

  // API İsteği & Streaming İşleme
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setOutput('')
    setErrorMsg('')

    try {
      const res = await fetch('/api/risk/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamSize: Number(teamSize),
          duration: Number(duration),
          backlogSize: Number(backlogSize),
          seniority,
          projectType,
          externalDependencies: Number(externalDependencies),
          lang,
        }),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'İstek başarısız oldu.')
      }

      if (!res.body) return

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        setOutput((prev) => prev + chunk)
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Bir hata oluştu.')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="border-b border-slate-800 pb-5">
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
            {t.title}
          </h1>
          <p className="text-slate-400 text-sm mt-1">{t.desc}</p>
        </div>

        {/* Main Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT FORM PANEL (5 Cols) */}
          <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-6 shadow-xl">
            
            {/* Presets */}
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                {t.presets}
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => applyPreset('mvp')}
                  className="px-3 py-2 text-xs bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-lg transition border border-slate-700/50 hover:border-emerald-500/50 truncate"
                >
                  {t.mvp}
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('standard')}
                  className="px-3 py-2 text-xs bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-lg transition border border-slate-700/50 hover:border-emerald-500/50 truncate"
                >
                  {t.standard}
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('enterprise')}
                  className="px-3 py-2 text-xs bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-lg transition border border-slate-700/50 hover:border-emerald-500/50 truncate"
                >
                  {t.enterprise}
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Team Size */}
              <div>
                <label className="text-xs font-medium text-slate-300 mb-1.5 block">
                  {t.teamSize}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                    👥
                  </span>
                  <input
                    type="number"
                    min="1"
                    value={teamSize}
                    onChange={(e) => setTeamSize(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-12 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-medium">
                    kişi
                  </span>
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="text-xs font-medium text-slate-300 mb-1.5 block">
                  {t.duration}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                    📅
                  </span>
                  <input
                    type="number"
                    min="1"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-14 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-medium">
                    hafta
                  </span>
                </div>
              </div>

              {/* Backlog */}
              <div>
                <label className="text-xs font-medium text-slate-300 mb-1.5 block">
                  {t.backlogSize}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                    📋
                  </span>
                  <input
                    type="number"
                    min="1"
                    value={backlogSize}
                    onChange={(e) => setBacklogSize(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-14 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-medium">
                    görev
                  </span>
                </div>
              </div>

              {/* Advanced Accordion Toggle */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center justify-between w-full text-xs font-medium text-emerald-400 hover:text-emerald-300 py-1 transition"
                >
                  <span>⚙️ {t.advanced}</span>
                  <span>{showAdvanced ? '▲' : '▼'}</span>
                </button>

                {showAdvanced && (
                  <div className="space-y-4 pt-3 mt-2 border-t border-slate-800/80 animate-fadeIn">
                    {/* Seniority */}
                    <div>
                      <label className="text-xs font-medium text-slate-400 mb-1 block">
                        {t.seniority}
                      </label>
                      <select
                        value={seniority}
                        onChange={(e) => setSeniority(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                      >
                        <option value="junior">Junior Ağırlıklı (Yüksek Risk)</option>
                        <option value="mixed">Dengeli Karma Ekip</option>
                        <option value="senior">Senior Ağırlıklı (Düşük Risk)</option>
                      </select>
                    </div>

                    {/* Project Type */}
                    <div>
                      <label className="text-xs font-medium text-slate-400 mb-1 block">
                        {t.projectType}
                      </label>
                      <select
                        value={projectType}
                        onChange={(e) => setProjectType(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                      >
                        <option value="web">Web & Mobil Uygulama</option>
                        <option value="fintech">Finans & Ödeme Entegrasyonu</option>
                        <option value="ai">Yapay Zeka & Veri Bilimi</option>
                        <option value="migration">Eski Sistem Taşıma (Migration)</option>
                      </select>
                    </div>

                    {/* Dependencies */}
                    <div>
                      <label className="text-xs font-medium text-slate-400 mb-1 block">
                        {t.dependencies}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={externalDependencies}
                        onChange={(e) => setExternalDependencies(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="p-3 bg-red-950/50 border border-red-800 text-red-300 text-xs rounded-xl">
                  {errorMsg}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-semibold rounded-xl text-sm transition-all shadow-lg shadow-emerald-950/40 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <span className="animate-spin">🌀</span>
                    <span>{t.analyzing}</span>
                  </>
                ) : (
                  <>
                    <span>⚡</span>
                    <span>{t.submit}</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* RIGHT DASHBOARD PANEL (7 Cols) */}
          <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm min-h-[520px] flex flex-col justify-between shadow-xl">
            <div>
              {/* Panel Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <span>📊</span> {t.resultTitle}
                </h2>
                {output && (
                  <button
                    onClick={copyToClipboard}
                    className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 transition"
                  >
                    {copied ? t.copied : t.copy}
                  </button>
                )}
              </div>

              {/* Output Content Area */}
              {!output && !loading && (
                <div className="h-80 flex flex-col items-center justify-center text-center p-6 text-slate-500">
                  <div className="text-4xl mb-3 opacity-40">🛡️</div>
                  <p className="text-sm max-w-sm">{t.emptyOutput}</p>
                </div>
              )}

              {loading && !output && (
                <div className="space-y-4 animate-pulse p-2">
                  <div className="h-6 bg-slate-800 rounded w-1/3"></div>
                  <div className="h-4 bg-slate-800/60 rounded w-3/4"></div>
                  <div className="h-20 bg-slate-800/40 rounded w-full"></div>
                  <div className="h-24 bg-slate-800/40 rounded w-full"></div>
                </div>
              )}

              {output && (
                <div className="prose prose-invert max-w-none text-xs leading-relaxed space-y-3 text-slate-300 whitespace-pre-wrap font-sans">
                  {output}
                </div>
              )}
            </div>

            {/* Panel Footer Tag */}
            <div className="mt-6 pt-3 border-t border-slate-800/60 text-[10px] text-slate-500 flex justify-between items-center">
              <span>Powered by Gemini & Groq AI</span>
              <span>Enterprise Delivery Standards</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}