process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { requirement, platform, style, lang } = await req.json()

    const styleGuide = {
      wireframe: 'Black and white wireframe style. Use only borders, no colors. Gray backgrounds only. Simple placeholder boxes.',
      lowfi: 'Low fidelity. Basic HTML elements with minimal styling. Gray color palette. No decorative elements.',
      hifi: 'High fidelity corporate theme. Use these colors: primary #6366f1, bg #0f0f13, card #18181b, text #f1f5f9, border #27272a. Modern dark theme.',
    }

    const platformGuide = {
      web: 'Desktop web layout. Max width 600px centered.',
      mobile: 'Mobile layout. Max width 375px, touch-friendly large buttons minimum 44px height.',
      responsive: 'Responsive layout with media queries.',
    }

    const prompt = `You are a senior UI/UX designer. Convert this requirement into a wireframe/prototype.

Requirement: ${requirement}
Platform: ${platformGuide[platform as keyof typeof platformGuide]}
Style: ${styleGuide[style as keyof typeof styleGuide]}

Return a JSON with this EXACT structure:
{
  "screen_name": "Screen name",
  "components": [
    {"type": "input|button|link|text|group|digit_box|select|checkbox|image", "label": "Label", "placeholder": "...", "style": "primary|secondary|danger", "layout": "horizontal|vertical"}
  ],
  "wireframeHtml": "SIMPLE HTML showing the visual layout with inline styles. NO scripts. Just visual representation.",
  "htmlCode": "FULL interactive HTML with Tailwind CDN, working form elements, hover states, OTP box auto-focus logic if needed. Must be a complete standalone HTML file."
}

Rules for htmlCode:
- Include <html>, <head>, <body> tags - it will be shown in iframe
- Add Tailwind CDN: <script src="https://cdn.tailwindcss.com"></script>
- Make all buttons and inputs interactive
- If OTP/verification boxes: add JS for auto-focus next box on input
- For forgot password: show alert on click
- Language of all labels: ${lang === 'tr' ? 'Turkish' : lang === 'de' ? 'German' : 'English'}
- Return ONLY the JSON, no markdown backticks`

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
        temperature: 0.2,
      }),
    })

    const data = await response.json()
    if (!response.ok) return NextResponse.json({ error: data.error?.message }, { status: 500 })

    let text = data.choices[0].message.content
    text = text.replace(/```json/g, '').replace(/```/g, '').trim()

    const result = JSON.parse(text)
    return NextResponse.json({ result })

  } catch (error) {
    console.error('Wireframe error:', error)
    return NextResponse.json({ error: 'Sunucu hatasi' }, { status: 500 })
  }
}