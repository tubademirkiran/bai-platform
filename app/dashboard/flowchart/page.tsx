'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation' // 🌟 YENİ EKLENDİ
import { useTheme } from '@/lib/theme-context'
import { Textarea } from '@/components/ui/textarea'

export default function FlowchartPage() {
  const { accent, colors } = useTheme()
  const searchParams = useSearchParams() // 🌟 URL DİNLEYİCİSİ ÇAĞRILDI

  const [requirement, setRequirement] = useState('')
  const [mermaidCode, setMermaidCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [diagramType, setDiagramType] = useState<'flowchart' | 'sequence' | 'erDiagram'>('flowchart')
  const [rendered, setRendered] = useState(false)

  // 🌟 OMNIBOX'TAN GELEN PROMPTU YAKALA VE KUTUYA YAZDIR
  useEffect(() => {
    const incomingPrompt = searchParams.get('prompt')
    if (incomingPrompt) {
      setRequirement(incomingPrompt)
      
      // Opsiyonel Harika UX: Eğer Dashboard'dan dolu bir prompt ile gelindiyse,
      // Kullanıcıyı bekletmeden 500ms sonra üretimi otomatik başlat!
      // Eğer bu otomatik üretimi istemiyorsan, aşağıdaki satırı silebilirsin.
      // setTimeout(() => handleGenerate(incomingPrompt), 500) 
    }
  }, [searchParams])

  useEffect(() => {
    if (mermaidCode) {
      renderDiagram()
    }
  }, [mermaidCode])

  async function renderDiagram() {
    try {
      const mermaid = (await import('mermaid')).default
      mermaid.initialize({
        startOnLoad: false,
        theme: 'neutral',
        flowchart: { curve: 'basis' },
      })
      const id = 'diagram-' + Date.now()
      const { svg } = await mermaid.render(id, mermaidCode)
      const container = document.getElementById('diagram-container')
      if (container) {
        container.innerHTML = svg
        setRendered(true)
      }
    } catch (e) {
      console.error('Mermaid render error:', e)
    }
  }

  // handleGenerate fonksiyonuna parametre eklendi (otomatik tetikleme için)
  async function handleGenerate(autoPrompt?: string) {
    const textToProcess = autoPrompt || requirement
    if (!textToProcess.trim()) return
    
    setLoading(true)
    setMermaidCode('')
    setRendered(false)
    const container = document.getElementById('diagram-container')
    if (container) container.innerHTML = ''

    const response = await fetch('/api/flowchart/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requirement: textToProcess, diagramType }),
    })
    const data = await response.json()
    setMermaidCode(data.result)
    setLoading(false)
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(mermaidCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleDownload() {
    const svg = document.getElementById('diagram-container')?.innerHTML
    if (!svg) return
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'diagram.svg'
    a.click()
  }

  const btnStyle = {
    padding: '7px 14px',
    borderRadius: '8px',
    border: `0.5px solid ${colors.border}`,
    background: colors.card,
    color: colors.text,
    fontSize: '12px',
    fontWeight: '600' as const,
    cursor: 'pointer',
  }

  const types = [
    { key: 'flowchart', label: 'Flowchart', desc: 'Akış Şemasi' },
    { key: 'sequence', label: 'Sequence', desc: 'Sıralı Akış' },
    { key: 'erDiagram', label: 'ER Diagram', desc: 'Veritabanı' },
  ]

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '800', color: colors.text, marginBottom: '4px' }}>
          Flowchart Generator
        </h2>
        <p style={{ fontSize: '13px', color: colors.textMuted }}>
          Gereksinim metnini yaz, AI otomatik akis semasi cizsin.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ background: colors.card, border: `0.5px solid ${colors.border}`, borderRadius: '12px', padding: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: colors.textMuted, marginBottom: '12px' }}>
              DIAGRAM TİPİ
            </div>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
              {types.map(type => (
                <button
                  key={type.key}
                  onClick={() => setDiagramType(type.key as any)}
                  style={{
                    flex: 1,
                    padding: '8px 6px',
                    borderRadius: '8px',
                    border: diagramType === type.key ? `2px solid ${accent}` : `0.5px solid ${colors.border}`,
                    background: diagramType === type.key ? accent + '22' : 'transparent',
                    color: diagramType === type.key ? accent : colors.textMuted,
                    fontSize: '11px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    textAlign: 'center' as const,
                  }}
                >
                  <div>{type.label}</div>
                  <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '2px' }}>{type.desc}</div>
                </button>
              ))}
            </div>

            <div style={{ fontSize: '12px', fontWeight: '600', color: colors.textMuted, marginBottom: '8px' }}>
              GEREKSİNİM METNİ
            </div>
            <Textarea
              placeholder="Örnek: Kullanıcı login sayfasına gelir, email ve şifre girer. Bilgiler doğru ise dashboard'a yönlendirilir, yanlış ise hata mesajı gösterilir ve 3 hatadan sonra hesap kilitlenir..."
              style={{
                minHeight: '180px',
                background: colors.bg,
                color: colors.text,
                borderColor: colors.border,
                fontSize: '13px',
              }}
              value={requirement}
              onChange={(e) => setRequirement(e.target.value)}
            />
            <button
              onClick={() => handleGenerate()}
              disabled={loading}
              style={{
                marginTop: '12px',
                width: '100%',
                padding: '11px',
                borderRadius: '8px',
                border: 'none',
                background: accent,
                color: '#fff',
                fontWeight: '700',
                fontSize: '13px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'AI diagram oluşturuyor...' : 'Diagram Oluştur'}
            </button>
          </div>

          {mermaidCode && (
            <div style={{ background: colors.card, border: `0.5px solid ${colors.border}`, borderRadius: '12px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: colors.textMuted }}>MERMAID KODU</div>
                <button onClick={handleCopy} style={btnStyle}>
                  {copied ? '✅ Kopyalandi' : '📋 Kopyala'}
                </button>
              </div>
              <pre style={{
                whiteSpace: 'pre-wrap',
                fontSize: '11px',
                color: accent,
                lineHeight: '1.6',
                background: colors.bg,
                padding: '12px',
                borderRadius: '8px',
                maxHeight: '200px',
                overflowY: 'auto',
                fontFamily: 'monospace',
              }}>
                {mermaidCode}
              </pre>
            </div>
          )}
        </div>

        <div style={{ background: colors.card, border: `0.5px solid ${colors.border}`, borderRadius: '12px', padding: '20px', minHeight: '400px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: colors.textMuted }}>DIAGRAM ÖNİZLEME</div>
            {rendered && (
              <button onClick={handleDownload} style={btnStyle}>
                📥 SVG Indir
              </button>
            )}
          </div>

          {!mermaidCode && !loading && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '300px',
              color: colors.textMuted,
              gap: '12px',
            }}>
              <div style={{ fontSize: '48px', opacity: 0.3 }}>🔷</div>
              <div style={{ fontSize: '13px' }}>Gereksinim yazın ve diagram oluşturun</div>
            </div>
          )}

          {loading && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '300px',
              color: colors.textMuted,
              gap: '16px',
            }}>
              <div style={{ fontSize: '40px' }}>⚙️</div>
              <div style={{ fontSize: '13px' }}>AI diagram olusturuyor...</div>
              <div style={{ width: '120px', height: '3px', background: colors.border, borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: '40%',
                  background: accent,
                  borderRadius: '2px',
                  animation: 'slide 1s infinite',
                }}></div>
              </div>
            </div>
          )}

          <div
            id="diagram-container"
            style={{
              width: '100%',
              overflowX: 'auto',
              display: 'flex',
              justifyContent: 'center',
            }}
          />
        </div>
      </div>
    </div>
  )
}