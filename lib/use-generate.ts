'use client'

import { useState, useCallback } from 'react'

/**
 * Streaming üretim modülleri için ortak hook.
 * fetch + loading + error + token-token akış okumayı tek yerde toplar.
 *
 * Kullanım:
 *   const { text: result, loading, error, run } = useGenerate('/api/requirement/generate')
 *   await run({ idea, lang })
 *
 * Route text/plain bir akış döndürür; hata durumunda JSON { error } döner (res.ok=false).
 */
export function useGenerate(endpoint: string) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = useCallback(
    async (body: unknown): Promise<string | null> => {
      setLoading(true)
      setError(null)
      setText('')
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })

        if (!res.ok || !res.body) {
          const data = await res.json().catch(() => null)
          throw new Error(data?.error || 'İstek başarısız oldu.')
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let acc = ''
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          acc += decoder.decode(value, { stream: true })
          setText(acc)
        }
        return acc
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Beklenmeyen bir hata oluştu.'
        setError(message)
        return null
      } finally {
        setLoading(false)
      }
    },
    [endpoint]
  )

  return { text, loading, error, run, setText }
}
