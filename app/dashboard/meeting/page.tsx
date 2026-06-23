'use client'

import { useState } from 'react'
import { useTheme } from '@/lib/theme-context'
import { Textarea } from '@/components/ui/textarea'

export default function MeetingPage() {
  const { accent, colors } = useTheme()
  const [transcript, setTranscript] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleAnalyze() {
    if (!transcript.trim()) return
    setLoading(true)
    setResult('')
    const response = await fetch('/api/meeting/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript }),
    })
    const data = await response.json()
    setResult(data.result)
    setLoading(false)
  }

  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: '800', color: colors.text, marginBottom: '4px' }}>Meeting Analyzer</h2>
      <p style={{ fontSize: '13px', color: colors.textMuted, marginBottom: '24px' }}>Toplantı notlarını yapıştır, AI aksiyon maddelerini çıkarsın.</p>

      <div style={{ background: colors.card, border: `0.5px solid ${colors.border}`, borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
        <div style={{ fontSize: '12px', fontWeight: '600', color: colors.textMuted, marginBottom: '10px' }}>Toplantı Notları</div>
        <Textarea
          placeholder="Toplantı notlarını buraya yapıştır..."
          style={{ minHeight: '160px', background: colors.bg, color: colors.text, borderColor: colors.border }}
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
        />
        <button
          onClick={handleAnalyze}
          disabled={loading}
          style={{ marginTop: '12px', width: '100%', padding: '10px', borderRadius: '8px', border: 'none', background: accent, color: '#fff', fontWeight: '600', fontSize: '13px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'AI analiz ediyor...' : 'Toplantıyı Analiz Et'}
        </button>
      </div>

      {result && (
        <div style={{ background: colors.card, border: `0.5px solid ${colors.border}`, borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: colors.textMuted, marginBottom: '12px' }}>Analiz Sonucu</div>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '13px', color: colors.text, lineHeight: '1.7' }}>{result}</pre>
        </div>
      )}
    </div>
  )
}