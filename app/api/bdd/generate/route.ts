import { NextRequest, NextResponse } from 'next/server'
import { guard } from '@/lib/api-guard'
import { callGroqJSON, GroqError } from '@/lib/groq'
import { saveHistoryServer } from '@/lib/history-server'

const BDD_SCHEMA = {
  type: 'object',
  properties: {
    story: { type: 'object' },
    scenarios: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          type: { type: 'string' },
          steps: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                keyword: { type: 'string' },
                text: { type: 'string' },
              },
              required: ['keyword', 'text'],
              additionalProperties: false,
            },
          },
        },
        required: ['title', 'steps'],
      },
    },
  },
  required: ['story', 'scenarios'],
  additionalProperties: false,
} as const

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

    const prompt = `You are a senior Agile Business Analyst and BDD expert. Convert the following requirement into User Story and Gherkin format.

Requirement: ${requirement}

Return a JSON object with this EXACT structure:
{
  "story": {
    "title": "Short title for this user story",
    "asA": "user role (e.g. registered user, admin, guest)",
    "iWantTo": "action or feature description",
    "soThat": "business value or benefit",
    "priority": "HIGH" | "MEDIUM" | "LOW",
    "storyPoints": 1-13,
    "tags": ["tag1", "tag2"],
    "acceptanceCriteria": [
      "Criteria 1",
      "Criteria 2",
      "Criteria 3",
      "Criteria 4",
      "Criteria 5"
    ]
  },
  "scenarios": [
    {
      "title": "Scenario title",
      "type": "Happy Path" | "Negative" | "Edge Case",
      "steps": [
        { "keyword": "Given", "text": "step text" },
        { "keyword": "When", "text": "step text" },
        { "keyword": "Then", "text": "step text" },
        { "keyword": "And", "text": "step text" }
      ]
    }
  ]
}

Rules:
- Write ALL text content in ${language}
- Create at least 3 scenarios: 1 happy path, 1 negative, 1 edge case
- Use proper Gherkin keywords: Given, When, Then, And, But
- Make steps atomic and testable
- Story points: 1,2,3,5,8,13 (Fibonacci)
- Return ONLY the JSON, no explanation, no markdown backticks`

    const result = await callGroqJSON({
      user: prompt,
      maxTokens: 2000,
      temperature: 0.2,
      jsonSchema: BDD_SCHEMA,
    })
    await saveHistoryServer('BDD Studio', requirement, JSON.stringify(result))
    return NextResponse.json({ result })
  } catch (error) {
    if (error instanceof GroqError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('BDD error:', error)
    return NextResponse.json({ error: 'Sunucu hatası oluştu.' }, { status: 500 })
  }
}
