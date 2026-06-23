process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { transcript } = await req.json()

    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',

          messages: [
            {
              role: 'system',
              content: `
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
              `.trim(),
            },
            {
              role: 'user',
              content: `
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
              `.trim(),
            },
          ],

          temperature: 0.2,
          max_tokens: 1200,
        }),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error?.message || 'API error' },
        { status: 500 }
      )
    }

    const result = data.choices?.[0]?.message?.content

    return NextResponse.json({ result })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json(
      { error: 'Sunucu hatasi' },
      { status: 500 }
    )
  }
}