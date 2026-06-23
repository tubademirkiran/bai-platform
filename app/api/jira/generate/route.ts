process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { project, issueType, squad, owner, requirement, lang } = await req.json()

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

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 4000,
        temperature: 0.3, // Düşük tutuyoruz ki yaratıcılıktan çok net mühendislik analizi yapsın
      }),
    })

    const data = await response.json()
    
    if (!response.ok) {
        return NextResponse.json({ error: data.error?.message }, { status: 500 })
    }

    let text = data.choices[0].message.content.replace(/```json/g, '').replace(/```/g, '').trim()
    return NextResponse.json({ result: JSON.parse(text) })
    
  } catch (error) {
    console.error('Jira Generator API Error:', error)
    return NextResponse.json({ error: 'Server Error' }, { status: 500 })
  }
}