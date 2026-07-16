'use client'

import { useTheme } from '@/lib/theme-context'
import { GeneratorTool } from '@/components/generator-tool'

const templatesByLang = {
  tr: [
    { label: 'Login Modulu', text: 'Kullanici email ve sifre ile sisteme giris yapabilmeli.' },
    { label: 'Odeme Sistemi', text: 'Kullanici kredi karti ile odeme yapabilmeli. 3D secure desteklenmeli.' },
    { label: 'Bildirim', text: 'Sistem kullaniciya email ve push notification gonderebilmeli.' },
    { label: 'Rapor', text: 'Kullanici tarih araligina gore satis raporlarini PDF olarak indirebilmeli.' },
  ],
  en: [
    { label: 'Login Module', text: 'Users should be able to log in with email and password.' },
    { label: 'Payment System', text: 'Users should be able to pay with credit card. 3D secure must be supported.' },
    { label: 'Notifications', text: 'System should send email and push notifications to users.' },
    { label: 'Reports', text: 'Users should be able to download sales reports as PDF by date range.' },
  ],
  de: [
    { label: 'Login Modul', text: 'Benutzer sollen sich mit E-Mail und Passwort anmelden können.' },
    { label: 'Zahlungssystem', text: 'Benutzer sollen mit Kreditkarte zahlen können. 3D Secure muss unterstützt werden.' },
    { label: 'Benachrichtigungen', text: 'Das System soll E-Mail und Push-Benachrichtigungen senden.' },
    { label: 'Berichte', text: 'Benutzer sollen Verkaufsberichte als PDF herunterladen können.' },
  ],
}

export default function RequirementPage() {
  const { t, lang } = useTheme()
  const templates = templatesByLang[lang] || templatesByLang.tr

  return (
    <GeneratorTool
      config={{
        title: t.reqTitle,
        desc: t.reqDesc,
        endpoint: '/api/requirement/generate',
        fields: [{ type: 'textarea', name: 'idea', label: t.reqInput, placeholder: t.reqPlaceholder, minHeight: 120 }],
        templates,
        submitLabel: t.reqBtn,
        loadingLabel: t.reqLoading,
        outputLabel: t.reqOutput,
        output: 'markdown',
        download: { filename: 'requirement.txt' },
        labels: { copy: t.copy, copied: t.copied, templates: t.templates },
        buildBody: (v) => ({ idea: v.idea, lang }),
      }}
    />
  )
}
