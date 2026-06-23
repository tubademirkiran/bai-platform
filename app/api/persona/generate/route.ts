process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { product, audience, count, lang } = await req.json()

    const prompt = `You are an Expert UX Researcher and Senior Business Analyst. 
    Your task is to generate realistic user personas based on the product description provided.

    Product/Module to be built: ${product}
    Target Audience/Industry (if any): ${audience || 'General/Unspecified'}
    Number of Personas to Generate: ${count}
    Language: ${lang === 'tr' ? 'Turkish' : lang === 'de' ? 'German' : 'English'}

    Return a valid JSON with this EXACT structure:
    {
      "personas": [
        {
          "avatar": "A single suitable emoji (e.g. 👨‍💼, 👩‍💻, 👷‍♂️)",
          "name": "Full name of the persona",
          "age": 35,
          "role": "Job title or role",
          "tech_level": "Choose one: Low, Medium, High (Translate to target language)",
          "bio": "2-3 sentences explaining their daily routine and why they would use this product.",
          "goals": ["Goal 1", "Goal 2"],
          "pain_points": ["Frustration 1", "Frustration 2"],
          "golden_advice": "1-2 sentences of actionable advice for the Business Analyst/Developer on what MUST be included or avoided in the UI/UX for this specific user."
        }
      ]
    }

    Rules:
    - Return ONLY the JSON. No markdown backticks or explanations.
    - Make the personas realistic and distinct from each other.
    - The golden_advice should be highly actionable (e.g., 'Since they are tech-illiterate, use large buttons and avoid nested menus').`

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 4000,
        temperature: 0.7,
      }),
    })

    const data = await response.json()
    if (!response.ok) return NextResponse.json({ error: data.error?.message }, { status: 500 })

    let text = data.choices[0].message.content
    text = text.replace(/```json/g, '').replace(/```/g, '').trim()

    const result = JSON.parse(text)
    return NextResponse.json({ result })

  } catch (error) {
    console.error('Persona Generator error:', error)
    return NextResponse.json({ error: 'Sunucu hatasi' }, { status: 500 })
  }
}