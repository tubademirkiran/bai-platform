import { NextRequest, NextResponse } from 'next/server'
import { guard } from '@/lib/api-guard'
import { streamGroq, captureStream, GroqError } from '@/lib/groq'
import { saveHistoryServer } from '@/lib/history-server'

const SYSTEM_PROMPT = `
Sen kıdemli bir Proje Yöneticisi ve İş Analistisin.

Görevin: toplantı notlarını analiz etmek ve profesyonel, düzenli bir rapor üretmek.

KURALLAR:
- TÜM çıktıyı Türkçe yaz.
- Türkçe karakterleri MUTLAKA kullan: (ç, ğ, ı, i, ö, ş, ü).
- Asla İngilizce karakterlerle Türkçe yazma (c, g, i, o, s, u gibi dönüşümler yapma).
- Bilgi uydurma.
- Eksik bilgi varsa "Belirtilmedi" yaz.
- Gereksiz konuşmaları çıkar.
- Profesyonel ve iş dili kullan.
`.trim()

export async function POST(req: NextRequest) {
  const gate = await guard('meeting')
  if (gate.error) return gate.error

  try {
    const { transcript } = await req.json()

    if (!transcript || typeof transcript !== 'string' || !transcript.trim()) {
      return NextResponse.json({ error: 'Toplantı notu boş olamaz.' }, { status: 400 })
    }

    const userPrompt = `
Aşağıdaki toplantı notlarını analiz et ve yapılandırılmış bir rapor oluştur:

${transcript}

FORMAT:

TOPLANTI ÖZETİ:
- 3-5 cümle

ANA KONULAR:
- ...

ALINAN KARARLAR:
- ...

AKSİYON MADDELERİ:
| Görev | Sorumlu | Deadline |
|------|----------|----------|

RİSKLER / BLOKAJLAR:
- ...

AÇIK SORULAR:
- ...

GEREKSİNİMLER:
- ...
`.trim()

    const stream = await streamGroq({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      maxTokens: 1200,
    })
    const captured = captureStream(stream, (full) => saveHistoryServer('Meeting Analyzer', transcript, full))
    return new Response(captured, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    if (error instanceof GroqError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Meeting error:', error)
    return NextResponse.json({ error: 'Sunucu hatası oluştu.' }, { status: 500 })
  }
}
