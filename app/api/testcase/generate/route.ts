import { NextRequest, NextResponse } from 'next/server'
import { guard } from '@/lib/api-guard'
import { streamGroq, captureStream, GroqError } from '@/lib/groq'
import { saveHistoryServer } from '@/lib/history-server'

const SYSTEM_PROMPT = `Sen kıdemli bir QA Mühendisi ve Test Analistisin.

Görevin: verilen gereksinimi analiz ederek eksiksiz, profesyonel test senaryoları üretmek.

KURALLAR:
- TÜM çıktıyı Türkçe yaz ve Türkçe karakterleri (ç, ğ, ı, ö, ş, ü) doğru kullan.
- Yalnızca verilen gereksinime dayan; özellik uydurma. Eksik bilgi varsa "Belirtilmedi" yaz.
- Pozitif, negatif ve sınır (edge-case) senaryolarını mutlaka kapsa.
- Her test senaryosu net, ölçülebilir ve tekrar edilebilir olmalı.`

export async function POST(req: NextRequest) {
  const gate = await guard('testcase')
  if (gate.error) return gate.error

  try {
    const { requirement } = await req.json()

    if (!requirement || typeof requirement !== 'string' || !requirement.trim()) {
      return NextResponse.json({ error: 'Gereksinim alanı boş olamaz.' }, { status: 400 })
    }

    const userPrompt = `Aşağıdaki gereksinim için kapsamlı test senaryoları üret:

[GEREKSİNİM]
${requirement}

Çıktıyı aşağıdaki yapıda, Markdown formatında üret:

## 1. Test Özeti
- Test edilecek özelliğin kısa açıklaması ve test kapsamı.

## 2. Ön Koşullar (Preconditions)
- Testin çalışması için gereken hazırlıklar / veriler.

## 3. Test Senaryoları
Her senaryoyu şu tablo formatında listele:

| ID | Senaryo | Tip (Pozitif/Negatif/Sınır) | Adımlar | Beklenen Sonuç |
| --- | ------- | --------------------------- | ------- | -------------- |

- En az 6-8 senaryo üret: happy path, hatalı girdi, yetki/güvenlik, sınır değer ve iptal/rollback senaryolarını kapsa.

## 4. Gherkin Kabul Kriterleri
En kritik 2-3 senaryo için Given / When / Then formatında yaz.

## 5. Kenar Durumlar ve Riskler
- Gözden kaçabilecek uç durumlar ve dikkat edilmesi gerekenler.`

    const stream = await streamGroq({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.15,
      maxTokens: 4000,
    })
    const captured = captureStream(stream, (full) => saveHistoryServer('Test Case', requirement, full))
    return new Response(captured, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    if (error instanceof GroqError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('TestCase error:', error)
    return NextResponse.json({ error: 'Sunucu hatası oluştu.' }, { status: 500 })
  }
}
