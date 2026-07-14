import { NextRequest, NextResponse } from 'next/server'
import { guard } from '@/lib/api-guard'
import { callGroq, GroqError } from '@/lib/groq'
import { saveHistoryServer } from '@/lib/history-server'

export async function POST(req: NextRequest) {
  const gate = await guard('flowchart')
  if (gate.error) return gate.error

  try {
    const { requirement, diagramType } = await req.json()

    if (!requirement || typeof requirement !== 'string' || !requirement.trim()) {
      return NextResponse.json({ error: 'Gereksinim alanı boş olamaz.' }, { status: 400 })
    }

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

    const raw = await callGroq({
      user: prompts[diagramType] || prompts.flowchart,
      maxTokens: 1000,
      temperature: 0.2,
    })

    const result = raw.replace(/```mermaid/g, '').replace(/```/g, '').trim()
    await saveHistoryServer('Flowchart', `${diagramType || 'flowchart'}: ${requirement}`, result)
    return NextResponse.json({ result })
  } catch (error) {
    if (error instanceof GroqError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Flowchart error:', error)
    return NextResponse.json({ error: 'Sunucu hatası oluştu.' }, { status: 500 })
  }
}
