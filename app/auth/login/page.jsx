"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError(authError.message)
        setLoading(false)
        return
      }

      // Wait a moment for session to be established in cookies
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Verify session is established and get user
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !currentUser) {
        setError("Failed to establish session. Please try again.")
        setLoading(false)
        return
      }

      // Check if user is admin and redirect accordingly
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, first_name, last_name, email")
        .eq("id", currentUser.id)
        .single()
      
      if (profileError) {
        console.error("Profile fetch error:", profileError)
      }
      
      // Check if profile is incomplete
      const isProfileIncomplete = !profile || 
        !profile.first_name || 
        !profile.last_name || 
        !profile.email
      
      // Use router.replace to avoid back button issues
      if (profile?.role === "admin") {
        router.replace("/admin/dashboard")
      } else if (isProfileIncomplete) {
        // Redirect to profile page to complete setup
        router.replace("/protected/profile?setup=true")
      } else {
        router.replace("/protected/dashboard")
      }
    } catch (err) {
      console.error("Login error:", err)
      setError("An unexpected error occurred")
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <div className="p-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome Back</h1>
        <p className="text-slate-600 mb-8">Sign in to your account</p>

        {error && <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600">
          Don't have an account?{" "}
          <Link href="/auth/sign-up" className="text-blue-600 hover:underline font-semibold">
            Sign up here
          </Link>
        </div>
      </div>
    </Card>
  )
}
