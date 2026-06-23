process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { requirement, lang = 'tr' } = await req.json()

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

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000,
        temperature: 0.2,
      }),
    })

    const data = await response.json()
    if (!response.ok) return NextResponse.json({ error: data.error?.message }, { status: 500 })

    let text = data.choices[0].message.content
    text = text.replace(/```json/g, '').replace(/```/g, '').trim()
    const result = JSON.parse(text)

    return NextResponse.json({ result })

  } catch (error) {
    console.error('BDD error:', error)
    return NextResponse.json({ error: 'Sunucu hatasi' }, { status: 500 })
  }
}