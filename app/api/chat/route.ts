import { NextRequest, NextResponse } from 'next/server'
import { guard } from '@/lib/api-guard'
import { streamGroq, GroqError, type ChatMessage } from '@/lib/groq'

const SYSTEM_PROMPT = `You are BAI Assistant, a senior business analyst AI. You help users with:
- Writing requirements, user stories, acceptance criteria
- SQL queries and database design
- Project risk analysis
- Meeting notes and action items
- Test case generation
Always respond in the same language the user writes in. Be concise and practical.`

export async function POST(req: NextRequest) {
  const gate = await guard('chat', 40)
  if (gate.error) return gate.error

  try {
    const { message, history } = await req.json()

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'Mesaj boş olamaz.' }, { status: 400 })
    }

    const priorMessages: ChatMessage[] = Array.isArray(history)
      ? history
          .filter((m) => m && typeof m.content === 'string' && (m.role === 'user' || m.role === 'assistant'))
          .map((m) => ({ role: m.role, content: m.content }))
      : []

    const messages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...priorMessages,
      { role: 'user', content: message },
    ]

    const stream = await streamGroq({ messages, maxTokens: 800 })
    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    if (error instanceof GroqError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Chat error:', error)
    return NextResponse.json({ error: 'Sunucu hatası oluştu.' }, { status: 500 })
  }
}
