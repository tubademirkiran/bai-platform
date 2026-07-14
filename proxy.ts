import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Kimlik doğrulaması gerektiren yollar.
const PROTECTED_PREFIXES = ['/dashboard']
// Oturum açıkken erişilmemesi gereken (login sonrası) yollar.
const AUTH_PAGES = ['/login', '/register']

// Next.js 16: eski "middleware" konvansiyonunun yerini "proxy" aldı. Aynı işlev.
export async function proxy(request: NextRequest) {
  // getUser() cookie tazelemesi yazabilsin diye response'u burada oluşturuyoruz.
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getUser() sunucuda token'ı doğrular (getSession()'dan daha güvenli).
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))
  const isAuthPage = AUTH_PAGES.some((p) => pathname.startsWith(p))

  // Yetkisiz kullanıcı korumalı sayfaya erişemez.
  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirectedFrom', pathname)
    return NextResponse.redirect(url)
  }

  // Oturum açık kullanıcı login/register görmesin.
  if (isAuthPage && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  // Statik dosyalar, image optimizasyonu ve favicon hariç tüm yollar.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
}
