// app/api/prioritization/generate/route.ts
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { goal, requirements, method, lang } = await req.json()

    // Metodolojiye göre JSON formatı ve kuralları belirliyoruz
    let methodRules = ''
    if (method === 'value_effort') {
      methodRules = `
      Evaluate based on "Value vs Effort" matrix.
      Scores must be strictly between 1 and 10.
      Include these exact keys for each item:
      - "value_score": (1-10)
      - "effort_score": (1-10)
      - "category": Choose one -> "Quick Win", "Major Project", "Fill In", "Time Sink"
      `
    } else if (method === 'moscow') {
      methodRules = `
      Evaluate based on "MoSCoW" method.
      Include this exact key for each item:
      - "category": Choose one -> "Must Have", "Should Have", "Could Have", "Won't Have"
      `
    } else if (method === 'rice') {
      methodRules = `
      Evaluate based on "RICE" scoring.
      Include these exact keys for each item:
      - "reach": (estimated number, e.g., 1000)
      - "impact": (3=massive, 2=high, 1=medium, 0.5=low, 0.25=minimal)
      - "confidence": (percentage as decimal, e.g., 0.8 for 80%)
      - "effort": (person-months, e.g., 2)
      - "score": (calculated: (Reach * Impact * Confidence) / Effort)
      - "category": "High Priority" if score is high, "Low Priority" if low.
      `
    }

    const prompt = `You are an expert Agile Coach and Senior Product Manager.
    Your task is to prioritize a list of requirements based on the chosen methodology.
    
    Context / Business Goal: ${goal || 'General product improvement'}
    Methodology: ${method}
    Language: ${lang === 'tr' ? 'Turkish' : lang === 'de' ? 'German' : 'English'}
    
    Requirements List:
    ${requirements}
    
    ${methodRules}
    
    Return a valid JSON with this EXACT structure:
    {
      "summary": "A 2-3 sentence overall coach advice about this backlog considering the main goal.",
      "items": [
        {
          "id": "1",
          "requirement": "The requirement text",
          "coach_advice": "1 short sentence of strong PO advice/defense for this item",
          // ... include the methodology specific keys defined above here
        }
      ]
    }
    
    Rules:
    - Return ONLY the JSON, no markdown backticks, no extra text.
    - Be realistic with your scores. Do not give everything high priority.
    - The "coach_advice" must be practical, direct, and written in ${lang === 'tr' ? 'Turkish' : 'English'}.`

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 3000,
        temperature: 0.3,
      }),
    })

    const data = await response.json()
    if (!response.ok) return NextResponse.json({ error: data.error?.message }, { status: 500 })

    let text = data.choices[0].message.content
    text = text.replace(/```json/g, '').replace(/```/g, '').trim()

    const result = JSON.parse(text)
    
    // RICE skoruna göre sıralama (eğer RICE seçilmişse)
    if (method === 'rice' && result.items) {
      result.items.sort((a: any, b: any) => b.score - a.score)
    }

    return NextResponse.json({ result })

  } catch (error) {
    console.error('Prioritization error:', error)
    return NextResponse.json({ error: 'Sunucu hatasi' }, { status: 500 })
  }
}