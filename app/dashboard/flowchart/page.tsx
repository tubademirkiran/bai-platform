'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTheme } from '@/lib/theme-context'
import { Textarea } from '@/components/ui/textarea'
import { PageHeader } from '@/components/ui/page-header'
import { CopyButton } from '@/components/ui/copy-button'
import { GitMerge, Loader2, Download } from 'lucide-react'

function FlowchartPageInner() {
  const { accent, colors } = useTheme()
  const searchParams = useSearchParams()

  const [requirement, setRequirement] = useState('')
  const [mermaidCode, setMermaidCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [diagramType, setDiagramType] = useState<'flowchart' | 'sequence' | 'erDiagram'>('flowchart')
  const [rendered, setRendered] = useState(false)

  useEffect(() => {
    const incomingPrompt = searchParams.get('prompt')
    if (incomingPrompt) {
      setRequirement(incomingPrompt)
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
    { key: 'flowchart', label: 'Flowchart', desc: 'Akış Şeması' },
    { key: 'sequence', label: 'Sequence', desc: 'Sıralı Akış' },
    { key: 'erDiagram', label: 'ER Diagram', desc: 'Veritabanı' },
  ]

  return (
    <div>
      {/* Görev (a): PageHeader düzeltildi, icon eklendi */}
      <PageHeader 
        title="Flowchart Generator" 
        description="Gereksinim metnini yaz, AI otomatik akış şeması çizsin." 
        icon={GitMerge} 
      />

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
                {/* Görev (a): Mevcut CopyButton kontrol edildi */}
                <CopyButton getText={() => mermaidCode} label="Kopyala" copiedLabel="Kopyalandı" />
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
              <button onClick={handleDownload} style={{ ...btnStyle, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Download size={14} /> SVG İndir
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
              <GitMerge size={44} style={{ opacity: 0.3 }} />
              <div style={{ fontSize: '13px' }}>Gereksinim yazın ve diyagram oluşturun</div>
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
              <Loader2 size={36} style={{ animation: 'pulse 1.5s infinite' }} />
              <div style={{ fontSize: '13px' }}>AI diyagram oluşturuyor...</div>
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

export default function FlowchartPage() {
  return (
    <Suspense fallback={null}>
      <FlowchartPageInner />
    </Suspense>
  )
}