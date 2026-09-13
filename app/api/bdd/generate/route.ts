import { NextRequest, NextResponse } from 'next/server'
import { guard } from '@/lib/api-guard'
import { callGroqJSON, GroqError } from '@/lib/groq'
import { saveHistoryServer } from '@/lib/history-server'

// 1. Katılaştırılmış ve Açıklamalı BDD Şeması (Strict Schema)
const BDD_SCHEMA = {
  type: 'object',
  properties: {
    story: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Kısa ve net hikaye başlığı' },
        asA: { type: 'string', description: 'Sadece yalın kullanıcı rolü (örn: Sistem Yöneticisi)' },
        iWantTo: { type: 'string', description: 'Sadece yapılmak istenen eylem (örn: raporları filtrelemek)' },
        soThat: { type: 'string', description: 'Sadece elde edilecek fayda (örn: verileri daha hızlı analiz edebileyim)' },
        priority: { type: 'string', enum: ['HIGH', 'MEDIUM', 'LOW'] },
        storyPoints: { type: 'number', enum: [1, 2, 3, 5, 8, 13] }, // Fibonacci kısıtlaması
        tags: { type: 'array', items: { type: 'string' } },
        acceptanceCriteria: { type: 'array', items: { type: 'string' } },
      },
      required: ['title', 'asA', 'iWantTo', 'soThat', 'priority', 'storyPoints', 'tags', 'acceptanceCriteria'],
      additionalProperties: false,
    },
    scenarios: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          type: { type: 'string', enum: ['Happy Path', 'Negative', 'Edge Case'] }, // Sıkı tip
          steps: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                keyword: { type: 'string', enum: ['Given', 'When', 'Then', 'And', 'But'] }, // Gherkin kısıtlaması
                text: { type: 'string' },
              },
              required: ['keyword', 'text'],
              additionalProperties: false,
            },
          },
        },
        required: ['title', 'type', 'steps'],
        additionalProperties: false,
      },
    },
  },
  required: ['story', 'scenarios'],
  additionalProperties: false,
} as const

// 2. Güçlendirilmiş Doğrulama (Validation)
function hasText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function validateBddResult(result: unknown): asserts result is Record<string, unknown> {
  const story = result && typeof result === 'object' ? (result as Record<string, unknown>).story : null
  const scenarios = result && typeof result === 'object' ? (result as Record<string, unknown>).scenarios : null
  
  if (!story || typeof story !== 'object' || !['title', 'asA', 'iWantTo', 'soThat'].every(key => hasText((story as Record<string, unknown>)[key]))) {
    throw new GroqError('Yapay zeka eksik veya hatalı bir User Story üretti. Lütfen tekrar deneyin.', 502)
  }
  
  if (!Array.isArray(scenarios) || scenarios.length < 3 || scenarios.some(s => {
    if (!s || typeof s !== 'object') return true
    const scenario = s as Record<string, unknown>
    return !hasText(scenario.title) || !Array.isArray(scenario.steps) || scenario.steps.length === 0
  })) {
    throw new GroqError('Yapay zeka eksik veya standart dışı Gherkin senaryosu üretti. Lütfen tekrar deneyin.', 502)
  }
}

export async function POST(req: NextRequest) {
  const gate = await guard('bdd')
  if (gate.error) return gate.error

  try {
    const { requirement, lang = 'tr' } = await req.json()

    if (!requirement || typeof requirement !== 'string' || !requirement.trim()) {
      return NextResponse.json({ error: 'Gereksinim alanı boş olamaz.' }, { status: 400 })
    }

    const langMap: Record<string, string> = { tr: 'Turkish', en: 'English', de: 'German' }
    const language = langMap[lang] || 'Turkish'

    // 3. Profesyonel ve Arayüze Tam Uyumlu Prompt
    const prompt = `You are an Elite Agile Product Owner and Lead QA Automation Engineer.
Your task is to analyze the user's business requirement and transform it into a highly professional, enterprise-grade User Story and BDD (Behavior-Driven Development) scenarios.

Input Requirement: "${requirement}"
Target Language for Content: ${language}

### INSTRUCTIONS & BEST PRACTICES:

1. **USER STORY (INVEST Principles & UI Harmony)**:
   - Your output will be displayed on a UI that already has the words "AS A", "I WANT TO", and "SO THAT" hardcoded.
   - **CRITICAL UI RULE**: DO NOT include words like "olarak", "istiyorum ki", "böylece" (or their english equivalents) in your JSON values. Provide ONLY the raw target text.
     * BAD asA: "Bir sistem yöneticisi olarak" -> GOOD asA: "Sistem yöneticisi"
     * BAD iWantTo: "raporları görmek istiyorum ki" -> GOOD iWantTo: "sistemdeki log raporlarını görüntülemek"
     * BAD soThat: "hataları bulabileyim böylece" -> GOOD soThat: "sistemdeki hataları hızlıca tespit edip çözebileyim"
   - **acceptanceCriteria**: Write 3 to 5 SMART (Specific, Measurable, Achievable, Relevant, Testable) business rules.

2. **GHERKIN SCENARIOS (Behavioral Focus)**:
   - Write **Declarative** (business behavior) steps, NOT **Imperative** (UI clicks like "click button X") steps. Focus on *what* the business rule is, not *how* the UI looks.
   - You MUST generate exactly 3 distinct scenarios:
     1. **Happy Path**: The standard, successful flow.
     2. **Negative**: A validation error, missing data, unauthorized access, or business rule violation.
     3. **Edge Case**: Boundary conditions, limits, or uncommon flows.

3. **STRICT FORMATTING RULES**:
   - The JSON keys ('asA', 'iWantTo', 'Given', etc.) MUST remain in English.
   - The actual content/values within the JSON MUST be written perfectly in ${language}, using appropriate corporate domain terminology.
   - Story points MUST be a valid Fibonacci number (1, 2, 3, 5, 8, 13).`

    const result = await callGroqJSON({
      user: prompt,
      maxTokens: 2500, // Kapsamlı senaryolar için token artırıldı
      temperature: 0.2, // Yaratıcılık kısıtlanarak tutarlılık (consistency) artırıldı
      jsonSchema: BDD_SCHEMA,
    })
    
    validateBddResult(result)
    
    await saveHistoryServer('BDD Studio', requirement, JSON.stringify(result))
    
    return NextResponse.json({ result })
  } catch (error) {
    if (error instanceof GroqError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('BDD Studio API Error:', error)
    return NextResponse.json({ error: 'Senaryolar oluşturulurken sunucu hatası oluştu.' }, { status: 500 })
  }
}