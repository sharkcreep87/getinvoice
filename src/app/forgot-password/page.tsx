'use client'

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, ArrowLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Use window.location.origin to get the current URL (works in dev and production)
      const redirectUrl = `${window.location.origin}/reset-password`

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      })

      if (error) throw error

      setEmailSent(true)
      toast({
        title: "Email sent!",
        description: "Check your inbox for the password reset link.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset email",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/10 to-white px-4 py-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center space-x-2 mb-4">
              <FileText className="h-10 w-10 text-primary" />
              <span className="text-3xl font-bold text-slate-900">GetInvoice</span>
            </Link>
          </div>
          <Card className="border-2 border-primary/20">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <CardTitle className="text-2xl text-primary">Check Your Email!</CardTitle>
              <CardDescription className="text-base mt-2">
                We've sent a password reset link to
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="font-semibold text-lg text-slate-900">{email}</p>

              <div className="bg-primary/5 rounded-lg p-4 text-left space-y-2">
                <p className="text-sm font-medium text-slate-900">Next steps:</p>
                <ol className="text-sm text-slate-700 space-y-1 ml-4 list-decimal">
                  <li>Open your email inbox</li>
                  <li>Click the password reset link in the email</li>
                  <li>Enter your new password</li>
                  <li>Sign in with your new password</li>
                </ol>
              </div>

              <div className="border-t pt-4">
                <p className="text-xs text-slate-600 mb-3">
                  Didn't receive the email? Check your spam folder or wait a few minutes.
                </p>
                <div className="space-y-2">
                  <Button
                    onClick={() => setEmailSent(false)}
                    variant="outline"
                    className="w-full border-2 border-primary/30 text-primary hover:bg-primary hover:text-white hover:border-primary hover:shadow-md active:scale-[0.98] transition-all duration-200"
                  >
                    Try Different Email
                  </Button>
                  <Link href="/login">
                    <Button
                      variant="ghost"
                      className="w-full text-slate-600 hover:text-primary hover:bg-primary/5"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Login
                    </Button>
                  </Link>
                </div>
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
            <span className="text-3xl font-bold text-slate-900">GetInvoice</span>
          </Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Forgot Password?</CardTitle>
            <CardDescription>
              Enter your email address and we'll send you a link to reset your password
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleResetPassword}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <p className="text-xs text-slate-600">
                  We'll send a password reset link to this email address
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-primary to-secondary text-white hover:from-primary/90 hover:to-secondary/90 hover:shadow-lg hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
              <Link href="/login" className="w-full">
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-slate-600 hover:text-primary hover:bg-primary/5"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Login
                </Button>
              </Link>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
