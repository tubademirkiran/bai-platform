'use client'

import { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from 'react'
import { useTheme } from '@/lib/theme-context'
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  type: ToastType
  message: string
}

interface ConfirmOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
  confirm: (opts: ConfirmOptions) => Promise<boolean>
}

const ToastContext = createContext<ToastContextValue>({
  toast: () => {},
  confirm: async () => false,
})

const typeConfig: Record<ToastType, { color: string; Icon: typeof Info }> = {
  success: { color: '#10b981', Icon: CheckCircle2 },
  error: { color: '#ef4444', Icon: AlertTriangle },
  info: { color: '#3b82f6', Icon: Info },
}

/**
 * Uygulama geneli bildirim (toast) ve onay (confirm) sistemi.
 * window.alert/confirm yerine ürünle uyumlu, temaya duyarlı tek kanal.
 *
 *   const { toast, confirm } = useToast()
 *   toast('Kaydedildi', 'success')
 *   if (await confirm({ message: 'Silinsin mi?', danger: true })) { ... }
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const { colors, accent, isDark } = useTheme()
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [confirmState, setConfirmState] = useState<{ opts: ConfirmOptions; resolve: (v: boolean) => void } | null>(null)
  const idRef = useRef(0)

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++idRef.current
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500)
  }, [])

  const confirm = useCallback(
    (opts: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        setConfirmState({ opts, resolve })
      }),
    []
  )

  const resolveConfirm = useCallback(
    (val: boolean) => {
      confirmState?.resolve(val)
      setConfirmState(null)
    },
    [confirmState]
  )

  // Escape → onay iptali
  useEffect(() => {
    if (!confirmState) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') resolveConfirm(false)
      if (e.key === 'Enter') resolveConfirm(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [confirmState, resolveConfirm])

  const o = confirmState?.opts

  return (
    <ToastContext.Provider value={{ toast, confirm }}>
      {children}

      {/* TOAST YIĞINI */}
      <div
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 10001,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxWidth: '360px',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((t) => {
          const { color, Icon } = typeConfig[t.type]
          return (
            <div
              key={t.id}
              role="status"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: colors.card,
                border: `1px solid ${colors.border}`,
                borderLeft: `3px solid ${color}`,
                borderRadius: '10px',
                padding: '12px 14px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.18)',
                color: colors.text,
                fontSize: '13px',
                fontWeight: 500,
                animation: 'fadeIn 0.2s ease',
                pointerEvents: 'auto',
              }}
            >
              <Icon size={18} color={color} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{t.message}</span>
            </div>
          )
        })}
      </div>

      {/* ONAY (CONFIRM) DIALOG */}
      {o && (
        <div
          onClick={() => resolveConfirm(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(4px)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-label={o.title || 'Onay'}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '420px',
              background: isDark ? '#18181b' : '#ffffff',
              border: `1px solid ${colors.border}`,
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: colors.text, margin: 0 }}>
                {o.title || 'Emin misiniz?'}
              </h3>
              <button
                onClick={() => resolveConfirm(false)}
                aria-label="Kapat"
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: colors.textMuted, padding: '2px' }}
              >
                <X size={20} />
              </button>
            </div>
            <p style={{ fontSize: '14px', color: colors.textMuted, lineHeight: 1.6, margin: '0 0 24px' }}>{o.message}</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => resolveConfirm(false)}
                style={{
                  padding: '9px 16px',
                  borderRadius: '9px',
                  border: `1px solid ${colors.border}`,
                  background: 'transparent',
                  color: colors.text,
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {o.cancelText || 'Vazgeç'}
              </button>
              <button
                autoFocus
                onClick={() => resolveConfirm(true)}
                style={{
                  padding: '9px 16px',
                  borderRadius: '9px',
                  border: 'none',
                  background: o.danger ? '#ef4444' : accent,
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {o.confirmText || 'Onayla'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
