'use client'

import { useTheme } from '@/lib/theme-context'
import { GeneratorTool } from '@/components/generator-tool'

export default function RiskPage() {
  const { lang } = useTheme()

  // Çoklu dil (i18n) destekli metinler
  const s = {
    tr: {
      title: 'Risk Analyzer',
      desc: 'Proje bilgilerini gir, AI riskleri analiz etsin.',
      teamSize: 'Ekip Büyüklüğü',
      duration: 'Süre (hafta)',
      backlogSize: 'Backlog Büyüklüğü',
      submit: 'Riskleri Analiz Et',
      loading: 'AI analiz ediyor...',
      output: 'Risk Analizi'
    },
    en: {
      title: 'Risk Analyzer',
      desc: 'Enter project details, let AI analyze the risks.',
      teamSize: 'Team Size',
      duration: 'Duration (weeks)',
      backlogSize: 'Backlog Size',
      submit: 'Analyze Risks',
      loading: 'AI is analyzing...',
      output: 'Risk Analysis'
    },
    de: {
      title: 'Risk Analyzer',
      desc: 'Geben Sie Projektdetails ein, KI analysiert die Risiken.',
      teamSize: 'Teamgröße',
      duration: 'Dauer (Wochen)',
      backlogSize: 'Backlog-Größe',
      submit: 'Risiken Analysieren',
      loading: 'KI analysiert...',
      output: 'Risikoanalyse'
    }
  }

  const t = s[lang as keyof typeof s] || s.tr

  return (
    <GeneratorTool
      config={{
        title: t.title,
        desc: t.desc,
        endpoint: '/api/risk/analyze',
        fields: [
          { type: 'number', name: 'teamSize', label: t.teamSize, placeholder: '5' },
          { type: 'number', name: 'duration', label: t.duration, placeholder: '12' },
          { type: 'number', name: 'backlogSize', label: t.backlogSize, placeholder: '50' },
        ],
        submitLabel: t.submit,
        loadingLabel: t.loading,
        outputLabel: t.output,
        output: 'text',
        // lang parametresini de API'ye gönderiyoruz
        buildBody: (v) => ({ 
          teamSize: v.teamSize, 
          duration: v.duration, 
          backlogSize: v.backlogSize,
          lang 
        }),
      }}
    />
  )
}