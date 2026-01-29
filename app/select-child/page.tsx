'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, authClient } from '@/lib/auth-client'
import { useChild } from '@/lib/contexts/ChildContext'
import { createChild } from '@/lib/db/children'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'

export default function SelectChildPage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const { children, activeChildId, setActiveChildId, loadChildren } = useChild()
  const [showAddChild, setShowAddChild] = useState(false)
  const [newChildName, setNewChildName] = useState('')
  const [newChildEmoji, setNewChildEmoji] = useState('👶')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isPending && !session) {
      router.push('/login')
      return
    }

    if (session) {
      loadChildren()
    }
  }, [session, isPending, loadChildren, router])

  const handleSelectChild = (childId: string) => {
    setActiveChildId(childId)
    router.push('/')
  }

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session?.user) return

    setError(null)
    setLoading(true)

    try {
      await createChild(newChildName.trim(), newChildEmoji)
      await loadChildren({ force: true })
      setShowAddChild(false)
      setNewChildName('')
      setNewChildEmoji('👶')
    } catch (err: any) {
      setError(err.message || 'Failed to add child')
    } finally {
      setLoading(false)
    }
  }

  if (isPending) {
    return <LoadingSkeleton />
  }

  if (!session) {
    return null
  }

  const emojiOptions = ['👶', '👧', '👦', '🧒', '👨', '👩', '🦊', '🐱', '🐶', '🐻', '🦁', '🐼']

  return (
    <div className="min-h-screen bg-cream p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-display font-bold text-bark mb-2">
            📚 Wild Reader
          </h1>
          <p className="text-xl text-bark/70">Who&apos;s learning today?</p>
        </div>

        {/* Child Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {children.map((child) => (
            <Card
              key={child.id}
              onClick={() => handleSelectChild(child.id)}
              className="p-6 bg-white border-4 border-bark hover:border-sunshine cursor-pointer transition-all hover:scale-105 hover:shadow-xl"
            >
              <div className="text-center">
                <div className="text-6xl mb-3">{child.avatar_emoji}</div>
                <h3 className="text-2xl font-display font-bold text-bark">
                  {child.name}
                </h3>
              </div>
            </Card>
          ))}

          {/* Add New Child Card */}
          {!showAddChild && (
            <Card
              onClick={() => setShowAddChild(true)}
              className="p-6 bg-white border-4 border-dashed border-bark/30 hover:border-sky cursor-pointer transition-all hover:scale-105"
            >
              <div className="text-center">
                <div className="text-6xl mb-3">➕</div>
                <h3 className="text-2xl font-display font-bold text-bark/70">
                  Add Child
                </h3>
              </div>
            </Card>
          )}
        </div>

        {/* Add Child Form */}
        {showAddChild && (
          <Card className="p-6 bg-white border-4 border-bark shadow-lg">
            <h3 className="text-2xl font-display font-bold text-bark mb-4">
              Add a New Child
            </h3>

            <form onSubmit={handleAddChild} className="space-y-4">
              <div>
                <label htmlFor="childName" className="block text-sm font-medium text-bark mb-1">
                  Username
                </label>
                <Input
                  id="childName"
                  type="text"
                  value={newChildName}
                  onChange={(e) => setNewChildName(e.target.value)}
                  placeholder="Enter name"
                  required
                  disabled={loading}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-bark mb-2">
                  Choose an Avatar
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {emojiOptions.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setNewChildEmoji(emoji)}
                      className={`text-4xl p-2 rounded-lg border-2 transition-all ${
                        newChildEmoji === emoji
                          ? 'border-sunshine bg-sunshine/20 scale-110'
                          : 'border-bark/20 hover:border-bark/50'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="bg-coral/10 border-2 border-coral text-bark p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-sage hover:bg-sage/90 text-white font-display"
                >
                  {loading ? 'Adding...' : 'Add Child'}
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setShowAddChild(false)
                    setNewChildName('')
                    setError(null)
                  }}
                  disabled={loading}
                  variant="outline"
                  className="flex-1 border-2 border-bark font-display"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Logout Button */}
        <div className="mt-8 text-center">
          <Button
            onClick={async () => {
              await authClient.signOut()
              router.push('/login')
            }}
            variant="outline"
            className="border-2 border-bark/30 text-bark/70 hover:border-bark/50"
          >
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  )
}
