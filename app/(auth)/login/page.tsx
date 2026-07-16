'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin() {
    setLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        // Ağ hatası ile gerçek kimlik hatasını ayır
        if (error.name === 'AuthRetryableFetchError' || /fetch/i.test(error.message)) {
          setError('Sunucuya ulaşılamıyor. İnternet bağlantınızı / VPN / reklam engelleyiciyi kontrol edin.')
        } else {
          setError('Email veya şifre hatalı')
        }
        setLoading(false)
      } else {
        router.push('/dashboard')
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('Sunucuya ulaşılamıyor (ağ hatası). Bağlantınızı kontrol edin.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-gradient-to-b from-slate-50 to-slate-100 px-4 py-10">
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#7c3aed] text-lg font-extrabold text-white shadow-lg shadow-[#7c3aed]/30">
          B
        </div>
        <div className="text-center">
          <div className="text-lg font-extrabold tracking-tight text-slate-900">BAI Platform</div>
          <div className="text-xs font-medium text-slate-500">AI Business Analyst</div>
        </div>
      </div>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Giriş Yap</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              placeholder="ornek@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Şifre</Label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button className="w-full" onClick={handleLogin} disabled={loading}>
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </Button>
          <p className="text-center text-sm text-gray-500">
            Hesabın yok mu?{' '}
            <Link href="/register" className="font-medium text-[#7c3aed] hover:underline">
              Kayıt ol
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}