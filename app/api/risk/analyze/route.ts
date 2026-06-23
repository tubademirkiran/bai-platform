process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { teamSize, duration, backlogSize } = await req.json()

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'user',
            content: `You are a senior project manager. Analyze the risks of the following project and provide a mitigation plan in Turkish.

Project details:
- Team size: ${teamSize} people
- Project duration: ${duration} weeks
- Backlog size: ${backlogSize} tasks

Provide:
1. RISK SCORE (Low/Medium/High)
2. TOP 5 RISKS with probability and impact
3. MITIGATION STRATEGIES for each risk
4. OVERALL RECOMMENDATION`
          }
        ],
        max_tokens: 1000,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json({ error: data.error?.message }, { status: 500 })
    }

    const result = data.choices[0].message.content
    return NextResponse.json({ result })

  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Sunucu hatasi' }, { status: 500 })
  }
}