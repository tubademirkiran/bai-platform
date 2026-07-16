'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useTheme } from '@/lib/theme-context'

/**
 * Temaya duyarlı Markdown renderer. Önceden requirement sayfasında inline
 * tanımlıydı; artık tüm markdown çıktıları buradan geçer.
 */
export function Prose({ children }: { children: string }) {
  const { accent, colors } = useTheme()
  return (
    <div style={{ fontSize: '13px', color: colors.text, lineHeight: '1.7' }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table: ({ ...props }) => <div style={{ overflowX: 'auto', marginBottom: '16px' }}><table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '8px' }} {...props} /></div>,
          thead: ({ ...props }) => <thead style={{ backgroundColor: colors.bg }} {...props} />,
          th: ({ ...props }) => <th style={{ border: `0.5px solid ${colors.border}`, padding: '8px 12px', fontWeight: 700, textAlign: 'left', fontSize: '12px', color: colors.textMuted }} {...props} />,
          td: ({ ...props }) => <td style={{ border: `0.5px solid ${colors.border}`, padding: '8px 12px', fontSize: '12px' }} {...props} />,
          h1: ({ ...props }) => <h1 style={{ fontSize: '18px', fontWeight: 800, marginTop: '20px', marginBottom: '10px', color: accent }} {...props} />,
          h2: ({ ...props }) => <h2 style={{ fontSize: '14px', fontWeight: 700, marginTop: '16px', marginBottom: '8px', color: colors.text, borderBottom: `0.5px solid ${colors.border}`, paddingBottom: '4px' }} {...props} />,
          h3: ({ ...props }) => <h3 style={{ fontSize: '13px', fontWeight: 700, marginTop: '12px', marginBottom: '4px', color: accent }} {...props} />,
          p: ({ ...props }) => <p style={{ marginBottom: '10px', color: colors.text }} {...props} />,
          ul: ({ ...props }) => <ul style={{ paddingLeft: '20px', marginBottom: '12px', listStyleType: 'disc' }} {...props} />,
          li: ({ ...props }) => <li style={{ marginBottom: '4px' }} {...props} />,
          strong: ({ ...props }) => <strong style={{ fontWeight: 700, color: accent }} {...props} />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
