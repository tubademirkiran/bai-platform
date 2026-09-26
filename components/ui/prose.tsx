'use client'

import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useTheme } from '@/lib/theme-context'

/**
 * Model, tablo hücrelerinde satır sonu için <br> kullanır — GFM tablolarında
 * gerçek satır sonu kullanılamadığı için tek yol budur. react-markdown ham HTML'i
 * güvenlik gereği render etmez, bu yüzden hücrelerde "1. Adım.<br>2. Adım." diye
 * GÖRÜNÜR metin kalıyor ve adımlar tek satıra yapışıyordu.
 *
 * Çözüm: rehype-raw ile tüm HTML'i açmak yerine yalnızca <br> etiketini gerçek
 * satır sonuna çeviriyoruz. Diğer her etiket kaçışlı metin olarak kalır.
 */
function withLineBreaks(children: ReactNode): ReactNode {
  return Children.map(children, (child) => {
    if (typeof child === 'string') {
      const parts = child.split(/<br\s*\/?>/gi)
      if (parts.length === 1) return child
      return parts.flatMap((part, i) => (i === 0 ? [part] : [<br key={i} />, part]))
    }
    if (isValidElement(child)) {
      const el = child as ReactElement<{ children?: ReactNode }>
      if (el.props.children == null) return child
      return cloneElement(el, undefined, withLineBreaks(el.props.children))
    }
    return child
  })
}

/**
 * react-markdown her bileşene kendi `node` prop'unu geçirir. Bu prop DOM'a
 * sızarsa <th node="[object Object]"> gibi geçersiz nitelikler ve React uyarısı
 * oluşur; aşağıdaki yardımcı yayılımdan (spread) önce onu ayıklar.
 */
function domProps<T extends { node?: unknown }>(props: T): Omit<T, 'node'> {
  const rest = { ...props }
  delete rest.node
  return rest
}

/**
 * Temaya duyarlı Markdown renderer. Önceden requirement sayfasında inline
 * tanımlıydı; artık tüm markdown çıktıları buradan geçer.
 *
 * NOT: Tablo sütun genişlikleri inline style ile verilemiyor (nth-child gerekli),
 * o kısım globals.css içindeki `.md-table` kurallarında.
 */
export function Prose({ children }: { children: string }) {
  const { accent, colors } = useTheme()
  return (
    <div style={{ fontSize: '13px', color: colors.text, lineHeight: '1.7' }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table: (p) => <div style={{ overflowX: 'auto', marginBottom: '16px' }}><table className="md-table" style={{ marginTop: '8px' }} {...domProps(p)} /></div>,
          thead: (p) => <thead style={{ backgroundColor: colors.bg }} {...domProps(p)} />,
          th: ({ children: c, ...p }) => <th style={{ border: `0.5px solid ${colors.border}`, padding: '8px 12px', fontWeight: 700, textAlign: 'left', fontSize: '12px', color: colors.textMuted }} {...domProps(p)}>{withLineBreaks(c)}</th>,
          td: ({ children: c, ...p }) => <td style={{ border: `0.5px solid ${colors.border}`, padding: '8px 12px', fontSize: '12px' }} {...domProps(p)}>{withLineBreaks(c)}</td>,
          h1: (p) => <h1 style={{ fontSize: '18px', fontWeight: 800, marginTop: '20px', marginBottom: '10px', color: accent }} {...domProps(p)} />,
          h2: (p) => <h2 style={{ fontSize: '14px', fontWeight: 700, marginTop: '16px', marginBottom: '8px', color: colors.text, borderBottom: `0.5px solid ${colors.border}`, paddingBottom: '4px' }} {...domProps(p)} />,
          h3: (p) => <h3 style={{ fontSize: '13px', fontWeight: 700, marginTop: '12px', marginBottom: '4px', color: accent }} {...domProps(p)} />,
          p: ({ children: c, ...p }) => <p style={{ marginBottom: '10px', color: colors.text }} {...domProps(p)}>{withLineBreaks(c)}</p>,
          ul: (p) => <ul style={{ paddingLeft: '20px', marginBottom: '12px', listStyleType: 'disc' }} {...domProps(p)} />,
          li: ({ children: c, ...p }) => <li style={{ marginBottom: '4px' }} {...domProps(p)}>{withLineBreaks(c)}</li>,
          strong: (p) => <strong style={{ fontWeight: 700, color: accent }} {...domProps(p)} />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
