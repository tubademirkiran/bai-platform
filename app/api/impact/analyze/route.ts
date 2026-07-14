import { NextRequest, NextResponse } from 'next/server'
import { guard } from '@/lib/api-guard'
import { callGroqJSON, GroqError } from '@/lib/groq'
import { saveHistoryServer } from '@/lib/history-server'

export async function POST(req: NextRequest) {
  const gate = await guard('impact')
  if (gate.error) return gate.error

  try {
    const { currentRule, newRule, context } = await req.json()

    if (!currentRule || !newRule) {
      return NextResponse.json(
        { error: 'Mevcut kural ve yeni kural alanları zorunludur.' },
        { status: 400 }
      )
    }

    const prompt = `You are a senior software architect and business analyst. Analyze the impact of changing a system rule.

CURRENT RULE: ${currentRule}
NEW RULE: ${newRule}
${context ? `SYSTEM CONTEXT:\n${context}` : ''}

Analyze and return a JSON object with this exact structure:
{
  "riskLevel": "KRITIK" | "YUKSEK" | "ORTA" | "DUSUK",
  "summary": "2-3 sentence summary of the change impact in Turkish",
  "affectedModules": [
    {
      "name": "Module name",
      "risk": "KRITIK" | "YUKSEK" | "ORTA",
      "reason": "Why this module is affected in Turkish"
    }
  ],
  "databaseImpact": [
    {
      "table": "table_name",
      "change": "What needs to change in this table in Turkish"
    }
  ],
  "testCases": [
    "Test case that needs to be updated or created - in Turkish"
  ],
  "recommendation": "AI recommendation for safe implementation in Turkish"
}

Return ONLY the JSON, no explanation, no markdown backticks.`

    const result = await callGroqJSON({ user: prompt, maxTokens: 1500, temperature: 0.1 })
    await saveHistoryServer('Impact Analyzer', `${currentRule} → ${newRule}`, JSON.stringify(result))
    return NextResponse.json({ result })
  } catch (error) {
    if (error instanceof GroqError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Impact error:', error)
    return NextResponse.json({ error: 'Sunucu hatası oluştu.' }, { status: 500 })
  }
}
