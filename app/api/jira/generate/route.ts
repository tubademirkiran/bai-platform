import { NextRequest, NextResponse } from 'next/server'
import { guard } from '@/lib/api-guard'
import { callGroqJSON, GroqError } from '@/lib/groq'
import { saveHistoryServer } from '@/lib/history-server'

export async function POST(req: NextRequest) {
  const gate = await guard('jira')
  if (gate.error) return gate.error

  try {
    const { project, issueType, squad, owner, requirement, lang } = await req.json()

    if (!requirement || typeof requirement !== 'string' || !requirement.trim()) {
      return NextResponse.json({ error: 'Gereksinim alanı boş olamaz.' }, { status: 400 })
    }

    const prompt = `You are an Expert Agile Product Owner and Senior Technical Business Analyst.
    Your task is to convert a raw user requirement into a highly detailed, "Developer-Ready" Jira Issue ticket.

    Context Info:
    - Project Code: ${project}
    - Issue Type: ${issueType}
    - Squad: ${squad}
    - Business Owner: ${owner}

    Raw Requirement:
    "${requirement}"

    You MUST generate the output in a highly technical and professional manner.
    Pay extreme attention to the "technical_notes" and "out_of_scope" sections. Developers rely on these sections to not make architectural mistakes.
    Provide a realistic "story_point" estimation using Fibonacci sequence (1, 2, 3, 5, 8, 13) based on the implicit complexity, and provide a short technical justification.

    Return ONLY a valid JSON with the following EXACT structure. Language: ${lang === 'tr' ? 'Turkish' : 'English'}:
    {
      "summary": "A short, actionable ticket title",
      "user_story": "As a [User], I want to [Action] so that [Benefit/Value]",
      "acceptance_criteria": [
        "Clear and testable condition 1",
        "Clear and testable condition 2"
      ],
      "technical_notes": "Very detailed architectural assumptions, potential DB/API impacts, payload structures if necessary, frontend-backend integration hints.",
      "out_of_scope": "What developers should STRICTLY NOT do in this ticket. Boundary definitions.",
      "story_point": 5,
      "sp_reason": "Short technical justification for this story point (e.g. 'Requires new API endpoint creation and complex UI state management').",
      "priority": "High, Medium, or Low",
      "labels": ["api", "db", "ui-change"]
    }

    Rule: Return ONLY the JSON object. Do not wrap with markdown code blocks like \`\`\`json.`

    const result = await callGroqJSON({ user: prompt, maxTokens: 4000, temperature: 0.3 })
    await saveHistoryServer(
      'Jira Issue Generator',
      `Proje: ${project} | Squad: ${squad}\nTalep: ${requirement}`,
      JSON.stringify(result)
    )
    return NextResponse.json({ result })
  } catch (error) {
    if (error instanceof GroqError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Jira Generator API Error:', error)
    return NextResponse.json({ error: 'Sunucu hatası oluştu.' }, { status: 500 })
  }
}
