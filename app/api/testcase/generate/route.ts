process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    // Arayüzden gelen tüm verileri alıyoruz
    const { project, issueType, squad, owner, requirement } = await req.json()

    const response = await fetch('[https://api.groq.com/openai/v1/chat/completions](https://api.groq.com/openai/v1/chat/completions)', {
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
            content: `Sen kıdemli bir Business Analyst, Product Owner ve Scrum Master'sın.

Görevin, verilen gereksinimi analiz ederek profesyonel Jira çıktıları oluşturmaktır.

KURALLAR:
* Yalnızca verilen gereksinimi kullan.
* Özellik uydurma.
* Türkçe karakterleri doğru kullan.
* Agile ve Scrum prensiplerine uygun yaz.
* Jira'da doğrudan kullanılabilecek içerik üret.
* Gereksinimi mantıksal iş parçalarına böl.
* Her çıktı açık, ölçülebilir ve uygulanabilir olsun.
* Acceptance Criteria'lar test edilebilir olmalıdır.
* Gereksinim eksikse bunu belirt.

Önceliklendirme Kuralları:
P0 = Kritik iş etkisi
P1 = Yüksek öncelik
P2 = Normal öncelik
P3 = Düşük öncelik`.trim(),
          },
          {
            role: 'user',
            content: `Aşağıdaki gereksinimi analiz et:

[PROJE BAĞLAMI]
Proje: ${project}
İş Tipi: ${issueType}
Takım (Squad): ${squad}
İş Sahipliği: ${owner}

[GEREKSİNİM]
${requirement}

Aşağıdaki formatta çıktı üret:

=========================================
1. İŞ ANALİZİ ÖZETİ
=========================================
* Gereksinimin amacı
* İş değeri
* Kullanıcıya etkisi

=========================================
2. EPIC
=======
* Epic Başlığı
* Epic Açıklaması
* İş Hedefi

=========================================
3. USER STORYLER
================
Her User Story için:

User Story ID:
Başlık:

As a [rol]
I want [istek]
So that [iş değeri]

Açıklama:
Öncelik:
Story Point Tahmini:

Acceptance Criteria:
* ...

Bağımlılıklar:
* ...

=========================================
4. TASKLAR
==========
Her Task için:
* Başlık
* Açıklama
* Öncelik
* Tahmini Efor
* Bağlı Olduğu User Story

=========================================
5. SUB-TASKLAR
==============
Her Task için gerekli alt işler.

=========================================
6. ACCEPTANCE CRITERIA
======================
Gherkin formatında yaz:
Given ...
When ...
Then ...

=========================================
7. TEKNİK ANALİZ
================
* Backend etkileri
* Frontend etkileri
* Veritabanı etkileri
* Entegrasyon etkileri
* Güvenlik gereksinimleri

=========================================
8. RİSKLER
==========
* Risk
* Etki Seviyesi (High / Medium / Low)
* Önerilen Aksiyon

=========================================
9. RELEASE NOTLARI
==================
Son kullanıcıya yönelik kısa release note oluştur.

=========================================
10. JIRA IMPORT HAZIR ÖZET
==========================
| Tür | Başlık | Öncelik | Bağlı Kayıt |
| --- | ------ | ------- | ----------- |

Çıktının tamamını Türkçe üret.`.trim(),
          },
        ],
        temperature: 0.1,
        max_tokens: 4000, // Çıktı çok uzun olacağı için token limitini yüksek tutmalıyız
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.error?.message || 'API error' },
        { status: 500 }
      )
    }

    const result = data?.choices?.[0]?.message?.content || ''

    return NextResponse.json({ result })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    )
  }
}