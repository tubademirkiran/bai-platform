'use client'

import { useState, useEffect } from 'react'

/**
 * SSR-güvenli media query hook'u. İlk render'da false döner (server ile uyumlu),
 * mount sonrası gerçek eşleşmeye geçer.
 *
 *   const isMobile = useMediaQuery('(max-width: 1023px)')
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia(query)
    const update = () => setMatches(mql.matches)
    update()
    mql.addEventListener('change', update)
    return () => mql.removeEventListener('change', update)
  }, [query])

  return matches
}
