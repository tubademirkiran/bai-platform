'use client'

import { useState } from 'react'
import { useTheme } from '@/lib/theme-context'

export default function RiskPage() {
  const { accent, colors } = useTheme()
  const [teamSize, setTeamSize] = useState('')
  const [duration, setDuration] = useState('')
  const [backlogSize, setBacklogSize] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleAnalyze() {
    if (!teamSize || !duration || !backlogSize) return
    setLoading(true)
    setResult('')
    const response = await fetch('/api/risk/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamSize, duration, backlogSize }),
    })
    const data = await response.json()
    setResult(data.result)
    setLoading(false)
  }

  const inputStyle = { width: '100%', padding: '8px 12px', borderRadius: '8px', border: `0.5px solid ${colors.border}`, background: colors.bg, color: colors.text, fontSize: '13px', outline: 'none' }
  const labelStyle = { fontSize: '12px', fontWeight: '600', color: colors.textMuted, marginBottom: '6px', display: 'block' }

  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: '800', color: colors.text, marginBottom: '4px' }}>Risk Analyzer</h2>
      <p style={{ fontSize: '13px', color: colors.textMuted, marginBottom: '24px' }}>Proje bilgilerini gir, AI riskleri analiz etsin.</p>

      <div style={{ background: colors.card, border: `0.5px solid ${colors.border}`, borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
        <div style={{ fontSize: '12px', fontWeight: '600', color: colors.textMuted, marginBottom: '16px' }}>Proje Bilgileri</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div>
            <label style={labelStyle}>Ekip Buyuklugu</label>
            <input type="number" placeholder="5" style={inputStyle} value={teamSize} onChange={(e) => setTeamSize(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Sure (hafta)</label>
            <input type="number" placeholder="12" style={inputStyle} value={duration} onChange={(e) => setDuration(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Backlog Buyuklugu</label>
            <input type="number" placeholder="50" style={inputStyle} value={backlogSize} onChange={(e) => setBacklogSize(e.target.value)} />
          </div>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={loading}
          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: 'none', background: accent, color: '#fff', fontWeight: '600', fontSize: '13px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'AI analiz ediyor...' : 'Riskleri Analiz Et'}
        </button>
      </div>

      {result && (
        <div style={{ background: colors.card, border: `0.5px solid ${colors.border}`, borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: colors.textMuted, marginBottom: '12px' }}>Risk Analizi</div>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '13px', color: colors.text, lineHeight: '1.7' }}>{result}</pre>
        </div>
      )}
    </div>
  )
}