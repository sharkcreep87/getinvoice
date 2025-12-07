'use client'

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"

function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [unconfirmedEmail, setUnconfirmedEmail] = useState("")
  const [resendingEmail, setResendingEmail] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    // Check if user was redirected after email verification
    if (searchParams.get('verified') === 'true') {
      toast({
        title: "✓ Email verified successfully!",
        description: "Your account is now active. Please sign in to continue.",
        // @ts-ignore - success variant added to toast component
        variant: "success",
      })
      // Clean up URL
      router.replace('/login')
    }
  }, [searchParams, toast, router])

  const handleResendConfirmation = async () => {
    setResendingEmail(true)
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: unconfirmedEmail,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
        },
      })

      if (error) throw error

      toast({
        title: "Email sent!",
        description: "Check your inbox for the confirmation link.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to resend confirmation email",
        variant: "destructive",
      })
    } finally {
      setResendingEmail(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        // Check if error is due to unconfirmed email
        if (error.message.toLowerCase().includes('email not confirmed') ||
            error.message.toLowerCase().includes('confirm your email')) {
          setUnconfirmedEmail(email)
          return
        }
        throw error
      }

      toast({
        title: "Success",
        description: "Logged in successfully!",
      })

      router.push("/dashboard")
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to login",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Show email confirmation reminder if user's email is not confirmed
  if (unconfirmedEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/10 to-white px-4 py-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center space-x-2 mb-4">
              <FileText className="h-10 w-10 text-primary" />
              <span className="text-3xl font-bold text-gray-900">GetInvoice</span>
            </Link>
          </div>
          <Card className="border-2 border-amber-200 bg-amber-50/50">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-4 w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <CardTitle className="text-2xl text-amber-800">Email Not Confirmed</CardTitle>
              <CardDescription className="text-base mt-2 text-amber-700">
                Please confirm your email address before signing in
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="font-semibold text-lg text-gray-900">{unconfirmedEmail}</p>

              <div className="bg-amber-100/50 border border-amber-200 rounded-lg p-4 text-left space-y-2">
                <p className="text-sm font-medium text-amber-900">What to do:</p>
                <ol className="text-sm text-amber-800 space-y-1 ml-4 list-decimal">
                  <li>Check your email inbox for the confirmation link</li>
                  <li>Click the link to verify your email address</li>
                  <li>Return here to sign in</li>
                </ol>
              </div>

              <div className="border-t border-amber-200 pt-4 space-y-3">
                <p className="text-xs text-amber-700">
                  Didn't receive the email? Check your spam folder.
                </p>
                <Button
                  onClick={handleResendConfirmation}
                  disabled={resendingEmail}
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 hover:shadow-lg hover:shadow-amber/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {resendingEmail ? "Sending..." : "Resend Confirmation Email"}
                </Button>
                <Button
                  onClick={() => setUnconfirmedEmail("")}
                  variant="outline"
                  className="w-full border-2 border-amber-300 text-amber-800 hover:bg-amber-100 hover:border-amber-400 transition-all duration-200"
                >
                  Back to Login
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/10 to-white px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-4">
            <FileText className="h-10 w-10 text-primary" />
            <span className="text-3xl font-bold text-gray-900">GetInvoice</span>
          </Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>Sign in to your account to continue</CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-primary to-secondary text-white hover:from-primary/90 hover:to-secondary/90 hover:shadow-lg hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign in"}
              </Button>
              <p className="text-sm text-gray-600 text-center">
                Don't have an account?{" "}
                <Link href="/register" className="text-primary hover:underline font-medium transition-colors">
                  Sign up
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/10 to-white px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center space-x-2 mb-4">
              <FileText className="h-10 w-10 text-primary" />
              <span className="text-3xl font-bold text-gray-900">GetInvoice</span>
            </Link>
          </div>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-gray-600">Loading...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
