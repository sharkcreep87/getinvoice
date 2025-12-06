"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'
import { LoadingPage } from '@/components/ui/loading'

export default function VerifyEmailPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [processing, setProcessing] = useState(true)

  useEffect(() => {
    // Supabase may return confirmation info in query or hash fragments.
    // We don't need to exchange tokens here — just show a friendly message
    // and redirect the user to the login page.
    try {
      // If there's an access token in the hash we could store/set it,
      // but for the email confirmation flow we only need to navigate to login.
      const hash = typeof window !== 'undefined' ? window.location.hash : ''
      const query = typeof window !== 'undefined' ? window.location.search : ''

      const combined = `${query}${hash}`.toLowerCase()
      // Detect typical Supabase confirmation indicators
      const isConfirmed = combined.includes('type=signup') || combined.includes('verification') || combined.includes('confirm') || combined.includes('access_token')

      // Show a nice toast and redirect to login
      if (isConfirmed) {
        toast({ title: 'Email confirmed', description: 'Thanks — redirecting you to the sign in page.' })
      } else {
        // still show a gentle message
        toast({ title: 'Verification', description: 'Redirecting to the sign in page.' })
      }

      // Give users a moment to read the message
      setTimeout(() => {
        setProcessing(false)
        router.replace('/login')
      }, 1600)
    } catch (err) {
      console.error('verify handling failed', err)
      setProcessing(false)
      router.replace('/login')
    }
  }, [])

  if (processing) return <LoadingPage text="Confirming email…" />

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="max-w-lg w-full text-center">
        <h1 className="text-2xl font-semibold">Email confirmation</h1>
        <p className="text-sm text-muted-foreground mt-4">Redirecting you to the login page…</p>
        <p className="mt-6 text-xs text-muted-foreground">If you are not redirected automatically, <a className="text-primary underline" href="/login">click here to sign in</a>.</p>
      </div>
    </div>
  )
}
