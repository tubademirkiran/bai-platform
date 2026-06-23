import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json()

    if (!query) {
      return NextResponse.json({ error: 'Query alanı boş olamaz.' }, { status: 400 })
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        response_format: { type: "json_object" }, 
        messages: [
          {
            role: 'user',
            content: `You are a senior Oracle SQL expert. Convert the following natural language query into an Oracle SQL query. 
            Use Oracle-specific syntax where appropriate. 
            
            You must respond ONLY with a JSON object containing exactly two keys:
            "sql": "The clean Oracle SQL query string without markdown formatting",
            "explanation": "Write a clear explanation of what the query does in flawless, natural Turkish language."

            CRITICAL FOR "explanation": 
            - You MUST use standard Turkish alphabet characters ONLY (ç, ğ, ı, ö, ş, ü, Ç, Ğ, İ, Ö, Ş, Ü).
            - Do NOT use or mix any foreign characters, Cyrillic letters (e.g., функци), Vietnamese diacritics (e.g., hệmin), or Spanish accents (e.g., función). 
            - Ensure perfect character encoding.

            Natural language query: ${query}`
          }
        ],
        max_tokens: 1000,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Groq error:', data) 
      return NextResponse.json({ error: data.error?.message || 'Groq API hatası' }, { status: 500 })
    }

    const aiResponseString = data.choices[0].message.content

    try {
      const parsedData = JSON.parse(aiResponseString)
      return NextResponse.json({ 
        sql: parsedData.sql, 
        explanation: parsedData.explanation 
      })
    } catch (parseError) {
      console.error('JSON PARSE HATASI:', parseError)
      return NextResponse.json({ error: 'Yapay zeka veriyi düzgün formatta gönderemedi.' }, { status: 500 })
    }

  } catch (error) {
    console.error('SUNUCU SİSTEM HATASI:', error)
    return NextResponse.json({ error: 'Sunucu hatası oluştu.' }, { status: 500 })
  }
}