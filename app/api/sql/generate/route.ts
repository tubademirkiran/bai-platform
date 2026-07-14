import { NextRequest, NextResponse } from 'next/server'
import { guard } from '@/lib/api-guard'
import { callGroqJSON, GroqError } from '@/lib/groq'
import { saveHistoryServer } from '@/lib/history-server'

export async function POST(req: NextRequest) {
  const gate = await guard('sql')
  if (gate.error) return gate.error

  try {
    const { query } = await req.json()

    if (!query || typeof query !== 'string' || !query.trim()) {
      return NextResponse.json({ error: 'Query alanı boş olamaz.' }, { status: 400 })
    }

    const prompt = `You are a senior Oracle SQL expert. Convert the following natural language query into an Oracle SQL query.
Use Oracle-specific syntax where appropriate.

You must respond ONLY with a JSON object containing exactly two keys:
"sql": "The clean Oracle SQL query string without markdown formatting",
"explanation": "Write a clear explanation of what the query does in flawless, natural Turkish language."

CRITICAL FOR "explanation":
- You MUST use standard Turkish alphabet characters ONLY (ç, ğ, ı, ö, ş, ü, Ç, Ğ, İ, Ö, Ş, Ü).
- Do NOT use or mix any foreign characters, Cyrillic letters (e.g., функци), Vietnamese diacritics (e.g., hệmin), or Spanish accents (e.g., función).
- Ensure perfect character encoding.

Natural language query: ${query}`

    const parsed = await callGroqJSON<{ sql: string; explanation: string }>({
      user: prompt,
      maxTokens: 1000,
    })

    await saveHistoryServer('SQL Generator', query, `${parsed.sql}\n\n-- ${parsed.explanation}`)
    return NextResponse.json({ sql: parsed.sql, explanation: parsed.explanation })
  } catch (error) {
    if (error instanceof GroqError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('SQL error:', error)
    return NextResponse.json({ error: 'Sunucu hatası oluştu.' }, { status: 500 })
  }
}
