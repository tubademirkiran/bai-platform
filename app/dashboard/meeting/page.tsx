'use client'

import { useTheme } from '@/lib/theme-context'
import { GeneratorTool } from '@/components/generator-tool'

export default function MeetingPage() {
  const { lang } = useTheme()

  // i18n (Çoklu Dil) Destekli Metinler
  const s = {
    tr: {
      title: 'Meeting Analyzer',
      desc: 'Toplantı notlarını yapıştır, AI aksiyon maddelerini çıkarsın.',
      label: 'Toplantı Notları',
      placeholder: 'Toplantı notlarını (veya deşifreyi) buraya yapıştır...',
      submit: 'Toplantıyı Analiz Et',
      loading: 'AI analiz ediyor...',
      output: 'Analiz Sonucu'
    },
    en: {
      title: 'Meeting Analyzer',
      desc: 'Paste meeting notes, let AI extract action items and summaries.',
      label: 'Meeting Transcript / Notes',
      placeholder: 'Paste the meeting notes or transcript here...',
      submit: 'Analyze Meeting',
      loading: 'AI is analyzing...',
      output: 'Analysis Result'
    },
    de: {
      title: 'Meeting Analyzer',
      desc: 'Fügen Sie Besprechungsnotizen ein, KI extrahiert Aktionspunkte.',
      label: 'Besprechungsnotizen',
      placeholder: 'Fügen Sie die Besprechungsnotizen hier ein...',
      submit: 'Besprechung analysieren',
      loading: 'KI analysiert...',
      output: 'Analyseergebnis'
    }
  }

  const t = s[lang as keyof typeof s] || s.tr

  return (
    <GeneratorTool
      config={{
        title: t.title,
        desc: t.desc,
        endpoint: '/api/meeting/analyze',
        fields: [{ 
          type: 'textarea', 
          name: 'transcript', 
          label: t.label, 
          placeholder: t.placeholder, 
          minHeight: 160 
        }],
        submitLabel: t.submit,
        loadingLabel: t.loading,
        outputLabel: t.output,
        output: 'text',
        // lang parametresini de API'ye gönderiyoruz ki AI o dilde cevap versin
        buildBody: (v) => ({ transcript: v.transcript, lang }),
      }}
    />
  )
}