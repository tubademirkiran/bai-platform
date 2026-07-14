import { NextRequest, NextResponse } from 'next/server'
import { guard } from '@/lib/api-guard'
import { callGroqJSON, GroqError } from '@/lib/groq'
import { saveHistoryServer } from '@/lib/history-server'

export async function POST(req: NextRequest) {
  const gate = await guard('pmi')
  if (gate.error) return gate.error

  try {
    const { projectName, summary, constraints, stakeholders, methodology, lang } = await req.json()

    if (!projectName || !summary) {
      return NextResponse.json(
        { error: 'Proje adı ve özet alanları zorunludur.' },
        { status: 400 }
      )
    }

    const prompt = `You are a PMP certified Senior Project Manager. Generate a professional project plan based on PMBOK v7 standards.

    Project Name: ${projectName}
    Summary/Goal: ${summary}
    Constraints: ${constraints}
    Key Stakeholders: ${stakeholders}
    Methodology: ${methodology}
    Language: ${lang === 'tr' ? 'Turkish' : 'English'}

    Return a valid JSON with this structure:
    {
      "scope": {
        "in": ["Requirement 1", "Requirement 2"],
        "out": ["Excluded 1", "Excluded 2"],
        "wbs": [
          {"phase": "Phase Name", "tasks": ["Subtask 1", "Subtask 2"]}
        ]
      },
      "schedule": {
        "milestones": [{"event": "Milestone Name", "date": "T+30 Days"}],
        "budget_breakdown": [{"category": "Name", "percent": 40}]
      },
      "stakeholders": {
        "roles": ["Role 1", "Role 2"],
        "raci": [
          {"task": "Task Name", "assignments": ["R", "A", "C", "I"]}
        ]
      },
      "risks": {
        "items": [{"risk": "Risk description", "mitigation": "How to prevent"}],
        "acceptance": ["Criteria 1", "Criteria 2"]
      }
    }

    Rules:
    - Assignments in RACI must match the number of roles exactly.
    - Be highly professional and specific to the project context.
    - Return ONLY raw JSON.`

    const result = await callGroqJSON({ user: prompt, maxTokens: 4000, temperature: 0.3 })
    await saveHistoryServer(
      'PMI Project Planner',
      `Proje: ${projectName}\nÖzet: ${summary}`,
      JSON.stringify(result)
    )
    return NextResponse.json({ result })
  } catch (error) {
    if (error instanceof GroqError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('PMI API Error:', error)
    return NextResponse.json({ error: 'Sunucu hatası oluştu.' }, { status: 500 })
  }
}
