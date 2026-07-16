'use client'

import { GeneratorTool } from '@/components/generator-tool'

export default function RiskPage() {
  return (
    <GeneratorTool
      config={{
        title: 'Risk Analyzer',
        desc: 'Proje bilgilerini gir, AI riskleri analiz etsin.',
        endpoint: '/api/risk/analyze',
        fields: [
          { type: 'number', name: 'teamSize', label: 'Ekip Büyüklüğü', placeholder: '5' },
          { type: 'number', name: 'duration', label: 'Süre (hafta)', placeholder: '12' },
          { type: 'number', name: 'backlogSize', label: 'Backlog Büyüklüğü', placeholder: '50' },
        ],
        submitLabel: 'Riskleri Analiz Et',
        loadingLabel: 'AI analiz ediyor...',
        outputLabel: 'Risk Analizi',
        output: 'text',
        buildBody: (v) => ({ teamSize: v.teamSize, duration: v.duration, backlogSize: v.backlogSize }),
      }}
    />
  )
}
