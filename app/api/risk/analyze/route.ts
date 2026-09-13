import { NextRequest, NextResponse } from 'next/server'
import { guard } from '@/lib/api-guard'
import { streamGroq, captureStream, GroqError } from '@/lib/groq'
import { saveHistoryServer } from '@/lib/history-server'

export async function POST(req: NextRequest) {
  const gate = await guard('risk')
  if (gate.error) return gate.error

  try {
    const body = await req.json()
    const {
      teamSize,
      duration,
      backlogSize,
      seniority = 'mixed',
      projectType = 'web',
      externalDependencies = 0,
      lang = 'tr',
    } = body

    if (!teamSize || !duration || !backlogSize) {
      return NextResponse.json(
        { error: 'Ekip büyüklüğü, süre ve backlog sayısı zorunludur.' },
        { status: 400 }
      )
    }

    // Türetilmiş metrik hesaplama
    const totalPersonWeeks = Number(teamSize) * Number(duration)
    const tasksPerPersonPerWeek =
      totalPersonWeeks > 0 ? (Number(backlogSize) / totalPersonWeeks).toFixed(1) : '0'

    const langNames: Record<string, string> = {
      tr: 'Turkish',
      en: 'English',
      de: 'German',
    }
    const outputLanguage = langNames[lang] || 'Turkish'

    const prompt = `You are an elite Agile PMO Director and Senior Project Risk Officer.
Analyze the following software project metrics and generate a detailed, actionable Risk Assessment Report in ${outputLanguage}.

### INPUT METRICS & CONTEXT
- Team Size: ${teamSize} people
- Project Duration: ${duration} weeks (${totalPersonWeeks} total person-weeks)
- Backlog Size: ${backlogSize} tasks
- Derived Workload Index: ~${tasksPerPersonPerWeek} tasks per person/week
- Team Seniority Profile: ${seniority}
- Project Domain/Category: ${projectType}
- External API / Supplier Dependencies: ${externalDependencies}

### REQUIRED REPORT STRUCTURE (Use Markdown)

# 📊 EXECUTIVE SUMMARY & RISK SCORE
- **Overall Risk Level:** [🔴 High / 🟡 Medium / 🟢 Low] (Risk Score: X/10)
- **Velocity Assessment:** Evaluate if ~${tasksPerPersonPerWeek} tasks/person/week is realistic considering the ${seniority} team structure and ${projectType} scope.

# ⚡ KEY RISK MATRIX (Categorized)
Provide detailed risk analysis under 4 headers:
1. 👥 **Human Resources & Experience Risk** (Seniority impact)
2. ⏱️ **Schedule & Velocity Risk** (Deadlines vs Scope)
3. ⚙️ **Technical & Domain Risk** (${projectType} complexity)
4. 🔗 **External Dependency Risk** (${externalDependencies} integration bottlenecks)

# 🛡️ MITIGATION & ACTION ROADMAP
- Actionable step-by-step solutions to reduce identified risks.

# 💡 PMO STRATEGIC RECOMMENDATIONS
- 3 high-leverage strategic suggestions for delivery success.`

    const stream = await streamGroq({ user: prompt, maxTokens: 1500 })
    const captured = captureStream(stream, (full) =>
      saveHistoryServer(
        'Risk Analyzer',
        `Ekip: ${teamSize} | Süre: ${duration}h | Backlog: ${backlogSize} | Kıdem: ${seniority}`,
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