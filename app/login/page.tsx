'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const result = await authClient.signIn.email({
        email,
        password,
      })

      if (result.error) {
        setError(result.error.message || 'Failed to sign in')
        setLoading(false)
        return
      }

      // Success! Redirect to child selection or home
      router.push('/select-child')
    } catch (err: any) {
      setError(err.message || 'An error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <header className="flex items-center justify-between mb-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">📚</span>
            <span className="text-xl font-display font-bold text-bark">Wild Reader</span>
          </Link>
          <Link href="/login">
            <Button
              variant="outline"
              className="h-10 rounded-xl border-2 border-bark/30 text-bark/80 hover:border-bark/60"
            >
              Sign In
            </Button>
          </Link>
        </header>
        <Card className="w-full p-8 bg-white border-4 border-bark shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-display font-bold text-bark mb-2">
            📚 Wild Reader
          </h1>
          <p className="text-bark/70">Welcome back!</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-bark mb-1">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="parent@example.com"
              required
              disabled={loading}
              className="w-full"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-bark mb-1">
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
              className="w-full"
            />
          </div>

          {error && (
            <div className="bg-coral/10 border-2 border-coral text-bark p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-sunshine hover:bg-sunshine/90 text-bark font-display text-lg"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-bark/70">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-sky hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </div>
        </Card>
      </div>
    </div>
  )
}
