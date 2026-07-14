import { NextRequest, NextResponse } from 'next/server'
import { guard } from '@/lib/api-guard'
import { callGroqJSON, GroqError } from '@/lib/groq'
import { saveHistoryServer } from '@/lib/history-server'

export async function POST(req: NextRequest) {
  const gate = await guard('persona')
  if (gate.error) return gate.error

  try {
    const { product, audience, count, lang } = await req.json()

    if (!product || typeof product !== 'string' || !product.trim()) {
      return NextResponse.json({ error: 'Ürün/modül açıklaması boş olamaz.' }, { status: 400 })
    }

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

    const result = await callGroqJSON({ user: prompt, maxTokens: 4000, temperature: 0.7 })
    await saveHistoryServer('Persona', product, JSON.stringify(result))
    return NextResponse.json({ result })
  } catch (error) {
    if (error instanceof GroqError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Persona Generator error:', error)
    return NextResponse.json({ error: 'Sunucu hatası oluştu.' }, { status: 500 })
  }
}
