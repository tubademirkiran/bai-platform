process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { currentRule, newRule, context } = await req.json()

    const prompt = `You are a senior software architect and business analyst. Analyze the impact of changing a system rule.

CURRENT RULE: ${currentRule}
NEW RULE: ${newRule}
${context ? `SYSTEM CONTEXT:\n${context}` : ''}

Analyze and return a JSON object with this exact structure:
{
  "riskLevel": "KRITIK" | "YUKSEK" | "ORTA" | "DUSUK",
  "summary": "2-3 sentence summary of the change impact in Turkish",
  "affectedModules": [
    {
      "name": "Module name",
      "risk": "KRITIK" | "YUKSEK" | "ORTA",
      "reason": "Why this module is affected in Turkish"
    }
  ],
  "databaseImpact": [
    {
      "table": "table_name",
      "change": "What needs to change in this table in Turkish"
    }
  ],
  "testCases": [
    "Test case that needs to be updated or created - in Turkish"
  ],
  "recommendation": "AI recommendation for safe implementation in Turkish"
}

Return ONLY the JSON, no explanation, no markdown backticks.`

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1500,
        temperature: 0.1,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json({ error: data.error?.message }, { status: 500 })
    }

    let text = data.choices[0].message.content
    text = text.replace(/```json/g, '').replace(/```/g, '').trim()

    const result = JSON.parse(text)
    return NextResponse.json({ result })

  } catch (error) {
    console.error('Impact error:', error)
    return NextResponse.json({ error: 'Sunucu hatasi' }, { status: 500 })
  }
}