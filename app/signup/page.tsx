'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { authClient } from '@/lib/auth-client'
import { createChild } from '@/lib/db/children'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [childName, setChildName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    console.log('=== SIGNUP FORM SUBMITTED ===')
    console.log('Email:', email)
    console.log('Password length:', password.length)
    console.log('Child name:', childName)

    // Validation
    if (password !== confirmPassword) {
      console.log('ERROR: Passwords do not match')
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      console.log('ERROR: Password too short')
      setError('Password must be at least 8 characters')
      return
    }

    if (!childName.trim()) {
      console.log('ERROR: No child name')
      setError('Please enter a username')
      return
    }

    console.log('Validation passed, calling authClient.signUp.email...')
    setLoading(true)

    try {
      // Create user account
      console.log('Calling signUp.email with:', { email, name: email.split('@')[0] })
      const result = await authClient.signUp.email({
        email,
        password,
        name: email.split('@')[0], // Use email prefix as user name
      })

      console.log('SignUp result:', result)

      if (result.error) {
        console.error('SignUp error:', result.error)
        setError(result.error.message || 'Failed to create account')
        setLoading(false)
        return
      }

      console.log('Getting session...')
      // Get the newly created user
      const sessionResult = await authClient.getSession()
      const user = sessionResult.data?.user
      console.log('Session user:', user)

      if (!user) {
        console.error('No user in session after signup')
        setError('Account created but failed to sign in')
        setLoading(false)
        return
      }

      console.log('Creating child profile for user:', user.id)
      // Create first child profile
      await createChild(childName.trim())

      console.log('SUCCESS! Redirecting to /select-child')
      // Success! Redirect to select-child page
      router.push('/select-child')
    } catch (err: any) {
      console.error('CATCH ERROR:', err)
      console.error('Error message:', err.message)
      console.error('Error stack:', err.stack)
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
          <p className="text-bark/70">Create your account</p>
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
              minLength={8}
            />
            <p className="text-xs text-bark/60 mt-1">At least 8 characters</p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-bark mb-1">
              Confirm Password
            </label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
              className="w-full"
            />
          </div>

          <div className="border-t-2 border-bark/10 pt-4">
            <label htmlFor="childName" className="block text-sm font-medium text-bark mb-1">
              Username
            </label>
            <Input
              id="childName"
              type="text"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              placeholder="Emma"
              required
              disabled={loading}
              className="w-full"
            />
            <p className="text-xs text-bark/60 mt-1">You can add more children later</p>
          </div>

          {error && (
            <div className="bg-coral/10 border-2 border-coral text-bark p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <p className="text-xs text-bark/60 text-center">
            By creating an account, you agree to our{' '}
            <Link href="/terms" className="text-sky hover:underline">
              Terms of Service
            </Link>
          </p>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-sunshine hover:bg-sunshine/90 text-bark font-display text-lg"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-bark/70">
            Already have an account?{' '}
            <Link href="/login" className="text-sky hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
        </Card>
      </div>
    </div>
  )
}
