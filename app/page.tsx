import { redirect } from 'next/navigation'

// Kök URL: oturum durumuna göre yönlendir.
// /dashboard client tarafında auth guard'a sahip; oturum yoksa /login'e düşürür.
export default function Home() {
  redirect('/dashboard')
}
