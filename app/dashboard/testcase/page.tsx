'use client'

import { useState } from 'react'
import { useTheme } from '@/lib/theme-context'
import { Textarea } from '@/components/ui/textarea'

export default function TestCasePage() {
  const { accent, colors } = useTheme()
  const [requirement, setRequirement] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleGenerate() {
    if (!requirement.trim()) return
    setLoading(true)
    setResult('')
    const response = await fetch('/api/testcase/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requirement }),
    })
    const data = await response.json()
    setResult(data.result)
    setLoading(false)
  }

  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: '800', color: colors.text, marginBottom: '4px' }}>Test Case Generator</h2>
      <p style={{ fontSize: '13px', color: colors.textMuted, marginBottom: '24px' }}>Gereksinimi yaz, AI test senaryolarını üretsin.</p>

      <div style={{ background: colors.card, border: `0.5px solid ${colors.border}`, borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
        <div style={{ fontSize: '12px', fontWeight: '600', color: colors.textMuted, marginBottom: '10px' }}>Gereksinim veya User Story</div>
        <Textarea
          placeholder="Gereksinim yazın..."
          style={{ minHeight: '120px', background: colors.bg, color: colors.text, borderColor: colors.border }}
          value={requirement}
          onChange={(e) => setRequirement(e.target.value)}
        />
        <button
          onClick={handleGenerate}
          disabled={loading}
          style={{ marginTop: '12px', width: '100%', padding: '10px', borderRadius: '8px', border: 'none', background: accent, color: '#fff', fontWeight: '600', fontSize: '13px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'AI uretiyor...' : 'Test Senaryoları Üret'}
        </button>
      </div>

      {result && (
        <div style={{ background: colors.card, border: `0.5px solid ${colors.border}`, borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: colors.textMuted, marginBottom: '12px' }}>Test Senaryoları</div>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '13px', color: colors.text, lineHeight: '1.7' }}>{result}</pre>
        </div>
      )}
    </div>
  )
}