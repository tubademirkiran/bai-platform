process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { requirement, diagramType } = await req.json()

    const prompts: Record<string, string> = {
      flowchart: `You are a software architect. Convert the following requirement into a Mermaid.js FLOWCHART diagram.

Rules:
- Start with: flowchart TD
- Use clear node labels in Turkish
- Use decision diamonds for conditions (Yes/No)
- Use rectangles for actions
- Use rounded rectangles for start/end
- Add colors with style commands
- Max 15 nodes for clarity
- Return ONLY the Mermaid code, no explanation, no markdown backticks

Requirement: ${requirement}`,

      sequence: `You are a software architect. Convert the following requirement into a Mermaid.js SEQUENCE diagram.

Rules:
- Start with: sequenceDiagram
- Use clear actor names (User, System, Database, API etc.)
- Show all interactions step by step
- Use alt/else for conditions
- Return ONLY the Mermaid code, no explanation, no markdown backticks

Requirement: ${requirement}`,

      erDiagram: `You are a database architect. Convert the following requirement into a Mermaid.js ER DIAGRAM.

Rules:
- Start with: erDiagram
- Identify all entities from the requirement
- Define relationships (one-to-many, many-to-many etc.)
- Add key attributes to each entity
- Return ONLY the Mermaid code, no explanation, no markdown backticks

Requirement: ${requirement}`,
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompts[diagramType] || prompts.flowchart }],
        max_tokens: 1000,
        temperature: 0.2,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json({ error: data.error?.message }, { status: 500 })
    }

    let result = data.choices[0].message.content

    result = result
      .replace(/```mermaid/g, '')
      .replace(/```/g, '')
      .trim()

    return NextResponse.json({ result })

  } catch (error) {
    console.error('Flowchart error:', error)
    return NextResponse.json({ error: 'Sunucu hatasi' }, { status: 500 })
  }
}