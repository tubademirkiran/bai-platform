process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json()

    const messages = [
      {
        role: 'system',
        content: `You are BAI Assistant, a senior business analyst AI. You help users with:
- Writing requirements, user stories, acceptance criteria
- SQL queries and database design
- Project risk analysis
- Meeting notes and action items
- Test case generation
Always respond in the same language the user writes in. Be concise and practical.`
      },
      ...history.map((m: any) => ({ role: m.role, content: m.content })),
      { role: 'user', content: message }
    ]

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        max_tokens: 800,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json({ error: data.error?.message }, { status: 500 })
    }

    const result = data.choices[0].message.content
    return NextResponse.json({ result })

  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json({ error: 'Sunucu hatasi' }, { status: 500 })
  }
}