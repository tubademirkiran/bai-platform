'use client'

import { useState, useRef, useEffect } from 'react'
import { useTheme } from '@/lib/theme-context'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function ChatAssistant() {
  const { accent, colors } = useTheme()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Merhaba! Ben BAI asistaniyim. Gereksinim analizi, SQL, proje riskleri veya test senaryolari hakkinda sorularini yanıtlayabilirim.' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    const historySnapshot = messages
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, history: historySnapshot }),
      })

      if (!response.ok || !response.body) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || 'İstek başarısız')
      }

      // Boş bir asistan balonu ekle ve akışı içine yaz.
      setMessages(prev => [...prev, { role: 'assistant', content: '' }])
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let acc = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        acc += decoder.decode(value, { stream: true })
        setMessages(prev => {
          const next = [...prev]
          next[next.length - 1] = { role: 'assistant', content: acc }
          return next
        })
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Bir hata olustu, tekrar deneyin.' }])
    }
    setLoading(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          background: accent,
          border: 'none',
          cursor: 'pointer',
          fontSize: '22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          zIndex: 1000,
          transition: 'transform 0.2s',
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
      >
        {open ? '✕' : '🤖'}
      </button>

      {open && (
        <div style={{
          position: 'fixed',
          bottom: '88px',
          right: '24px',
          width: '360px',
          height: '480px',
          background: colors.card,
          border: `0.5px solid ${colors.border}`,
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 999,
          boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
          overflow: 'hidden',
        }}>
          <div style={{ padding: '14px 16px', borderBottom: `0.5px solid ${colors.border}`, display: 'flex', alignItems: 'center', gap: '10px', background: accent }}>
            <div style={{ fontSize: '20px' }}>🤖</div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>BAI Asistan</div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)' }}>AI Business Analyst</div>
            </div>
            <div style={{ marginLeft: 'auto', width: '8px', height: '8px', borderRadius: '50%', background: '#4ade80' }}></div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '80%',
                  padding: '10px 12px',
                  borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  background: msg.role === 'user' ? accent : colors.bg,
                  color: msg.role === 'user' ? '#fff' : colors.text,
                  fontSize: '12px',
                  lineHeight: '1.6',
                  border: msg.role === 'assistant' ? `0.5px solid ${colors.border}` : 'none',
                }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ padding: '10px 14px', borderRadius: '12px 12px 12px 2px', background: colors.bg, border: `0.5px solid ${colors.border}`, fontSize: '18px' }}>
                  ···
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div style={{ padding: '12px', borderTop: `0.5px solid ${colors.border}`, display: 'flex', gap: '8px' }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Soru sor..."
              style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: `0.5px solid ${colors.border}`, background: colors.bg, color: colors.text, fontSize: '12px', outline: 'none' }}
            />
            <button
              onClick={handleSend}
              disabled={loading}
              style={{ padding: '8px 14px', borderRadius: '8px', background: accent, border: 'none', color: '#fff', fontSize: '12px', fontWeight: '600', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}
            >
              Gonder
            </button>
          </div>
        </div>
      )}
    </>
  )
}