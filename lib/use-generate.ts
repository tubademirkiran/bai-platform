'use client'

import { useState, useCallback, useRef } from 'react'

/** Oturum/limit gibi yaygın HTTP durumlarını anlaşılır Türkçe metne çevirir. */
function statusMessage(status: number, serverError?: string): string {
  if (status === 401) return 'Oturumunuz sona ermiş. Lütfen tekrar giriş yapın.'
  if (status === 429) return 'Çok fazla istek gönderildi. Lütfen bir dakika bekleyip tekrar deneyin.'
  if (status === 503) return 'Yapay zeka servisi şu anda yoğun. Lütfen birazdan tekrar deneyin.'
  return serverError || `İstek başarısız oldu (HTTP ${status}).`
}

/**
 * Streaming üretim modülleri için ortak hook.
 * fetch + loading + error + token-token akış okumayı tek yerde toplar.
 *
 * Kullanım:
 *   const { text: result, loading, error, run, stop } = useGenerate('/api/requirement/generate')
 *   await run({ idea, lang })
 *   stop() // devam eden üretimi iptal eder
 *
 * Route text/plain bir akış döndürür; hata durumunda JSON { error } döner (res.ok=false).
 */
export function useGenerate(endpoint: string) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Devam eden üretimi kullanıcı isteğiyle iptal eder.
  const stop = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const run = useCallback(
    async (body: unknown): Promise<string | null> => {
      // Önceki bir akış varsa iptal et, yenisini başlat.
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      setLoading(true)
      setError(null)
      setText('')
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal,
        })

        if (!res.ok || !res.body) {
          const data = await res.json().catch(() => null)
          throw new Error(statusMessage(res.status, data?.error))
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

        // Akış hatasız bitti ama tek bir token bile gelmedi (ör. model bütçesini
        // "düşünme"ye harcadı). Eskiden bu durumda ne metin ne hata gösteriliyordu;
        // sayfa sessizce başlangıç haline dönüyordu.
        if (!acc.trim()) {
          throw new Error('Yapay zeka boş yanıt döndürdü. Lütfen tekrar deneyin.')
        }
        return acc
      } catch (e) {
        // Kullanıcı iptal ettiyse hata gösterme — o ana kadar gelen metni koru.
        if (e instanceof DOMException && e.name === 'AbortError') {
          return null
        }
        const message =
          e instanceof TypeError
            ? 'Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.'
            : e instanceof Error
              ? e.message
              : 'Beklenmeyen bir hata oluştu.'
        setError(message)
        return null
      } finally {
        setLoading(false)
        abortRef.current = null
      }
    },
    [endpoint]
  )

  return { text, loading, error, run, stop, setText }
}
