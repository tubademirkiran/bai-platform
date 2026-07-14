import { NextRequest, NextResponse } from 'next/server'
import { guard } from '@/lib/api-guard'
import { streamGroq, captureStream, GroqError } from '@/lib/groq'
import { saveHistoryServer } from '@/lib/history-server'

export async function POST(req: NextRequest) {
  const gate = await guard('risk')
  if (gate.error) return gate.error

  try {
    const { teamSize, duration, backlogSize } = await req.json()

    if (!teamSize || !duration || !backlogSize) {
      return NextResponse.json(
        { error: 'Ekip büyüklüğü, süre ve backlog sayısı zorunludur.' },
        { status: 400 }
      )
    }

    const prompt = `You are a senior project manager. Analyze the risks of the following project and provide a mitigation plan in Turkish.

Project details:
- Team size: ${teamSize} people
- Project duration: ${duration} weeks
- Backlog size: ${backlogSize} tasks

Provide:
1. RISK SCORE (Low/Medium/High)
2. TOP 5 RISKS with probability and impact
3. MITIGATION STRATEGIES for each risk
4. OVERALL RECOMMENDATION`

    const stream = await streamGroq({ user: prompt, maxTokens: 1000 })
    const captured = captureStream(stream, (full) =>
      saveHistoryServer(
        'Risk Analyzer',
        `Ekip: ${teamSize} kişi | Süre: ${duration} hafta | Backlog: ${backlogSize} görev`,
        full
      )
    )
    return new Response(captured, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    if (error instanceof GroqError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Risk error:', error)
    return NextResponse.json({ error: 'Sunucu hatası oluştu.' }, { status: 500 })
  }
}
