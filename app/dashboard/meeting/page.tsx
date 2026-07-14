'use client'

import { useState } from 'react'
import { useTheme } from '@/lib/theme-context'
import { Textarea } from '@/components/ui/textarea'
import { useGenerate } from '@/lib/use-generate'

export default function MeetingPage() {
  const { accent, colors } = useTheme()
  const [transcript, setTranscript] = useState('')
  const { text: result, loading, error, run } = useGenerate('/api/meeting/analyze')

  async function handleAnalyze() {
    if (!transcript.trim()) return
    await run({ transcript })
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

      {error && (
        <div style={{ background: '#ef444415', border: '1px solid #ef444455', color: '#ef4444', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', fontSize: '13px' }}>
          {error}
        </div>
      )}

      {result && (
        <div style={{ background: colors.card, border: `0.5px solid ${colors.border}`, borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: colors.textMuted, marginBottom: '12px' }}>Analiz Sonucu</div>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '13px', color: colors.text, lineHeight: '1.7' }}>{result}</pre>
        </div>
      )}
    </div>
  )
}