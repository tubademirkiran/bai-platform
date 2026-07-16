'use client'

import { useTheme } from '@/lib/theme-context'
import { GeneratorTool } from '@/components/generator-tool'
import { CheckSquare } from 'lucide-react'

export default function TestCasePage() {
  const { lang } = useTheme()

  // i18n (Çoklu Dil) Sözlüğü
  const s = {
    tr: {
      title: 'Test Case Studio',
      desc: 'Gereksinimleri detaylı adım-adım test senaryolarına ve kabul kriterlerine dönüştürün.',
      inputLabel: 'GEREKSİNİM VEYA ÖZELLİK',
      placeholder: 'Örn: Kullanıcı şifremi unuttum butonuna basınca e-posta gönderilmeli...',
      submit: 'Test Senaryosu Üret',
      loading: 'AI senaryoları yazıyor...',
      output: 'Üretilen Test Senaryoları',
      templates: [
        { label: 'Form Gönderimi', text: 'Kullanıcı iletişim formundaki tüm alanları doldurup "Gönder" butonuna bastığında başarı mesajı görmeli ve e-posta gitmeli.' },
        { label: 'Hata Yönetimi', text: 'Kullanıcı yanlış şifre girdiğinde "Hatalı şifre" uyarısı almalı ve 5 denemeden sonra hesap kilitlenmeli.' },
        { label: 'Veri Listeleme', text: 'Arama kutusuna en az 3 karakter girildiğinde sonuçlar anlık olarak listelenmeli.' }
      ]
    },
    en: {
      title: 'Test Case Studio',
      desc: 'Convert requirements into detailed step-by-step test cases and acceptance criteria.',
      inputLabel: 'REQUIREMENT OR FEATURE',
      placeholder: 'E.g: When user clicks "forgot password", an email should be sent...',
      submit: 'Generate Test Cases',
      loading: 'AI writing cases...',
      output: 'Generated Test Cases',
      templates: [
        { label: 'Form Submission', text: 'When the user fills all fields in the contact form and clicks "Send", they should see a success message and an email should be triggered.' },
        { label: 'Error Handling', text: 'When the user enters a wrong password, they should see "Wrong password" warning and account should lock after 5 attempts.' },
        { label: 'Data Listing', text: 'Results should be listed instantly when at least 3 characters are entered in the search box.' }
      ]
    },
    de: {
      title: 'Testfall-Studio',
      desc: 'Wandeln Sie Anforderungen in detaillierte Testfälle und Akzeptanzkriterien um.',
      inputLabel: 'ANFORDERUNG ODER FUNKTION',
      placeholder: 'Z.B.: Wenn der Benutzer auf "Passwort vergessen" klickt, sollte eine E-Mail gesendet werden...',
      submit: 'Testfälle Generieren',
      loading: 'KI schreibt Testfälle...',
      output: 'Generierte Testfälle',
      templates: [
        { label: 'Formularübermittlung', text: 'Wenn der Benutzer alle Felder im Kontaktformular ausfüllt...' }
      ]
    }
  }

  const t = s[lang as keyof typeof s] || s.tr

  return (
    <GeneratorTool
      config={{
        title: t.title,
        desc: t.desc,
        endpoint: '/api/testcase/generate',
        fields: [{ 
          type: 'textarea', 
          name: 'requirement', 
          label: t.inputLabel, 
          placeholder: t.placeholder, 
          minHeight: 150 
        }],
        templates: t.templates,
        submitLabel: t.submit,
        loadingLabel: t.loading,
        outputLabel: t.output,
        output: 'markdown', // Test case'leri markdown tablosu olarak almak çok daha şıktır
        download: { filename: 'test-cases.md' },
        buildBody: (v) => ({ requirement: v.requirement, lang }),
      }}
    />
  )
}