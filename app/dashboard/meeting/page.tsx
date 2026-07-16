'use client'

import { GeneratorTool } from '@/components/generator-tool'

export default function MeetingPage() {
  return (
    <GeneratorTool
      config={{
        title: 'Meeting Analyzer',
        desc: 'Toplantı notlarını yapıştır, AI aksiyon maddelerini çıkarsın.',
        endpoint: '/api/meeting/analyze',
        fields: [{ type: 'textarea', name: 'transcript', label: 'Toplantı Notları', placeholder: 'Toplantı notlarını buraya yapıştır...', minHeight: 160 }],
        submitLabel: 'Toplantıyı Analiz Et',
        loadingLabel: 'AI analiz ediyor...',
        outputLabel: 'Analiz Sonucu',
        output: 'text',
        buildBody: (v) => ({ transcript: v.transcript }),
      }}
    />
  )
}
