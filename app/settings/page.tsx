"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, BarChart3, BookOpen, Settings2, HelpCircle, Volume2, Users, Trash2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { useSession, authClient } from "@/lib/auth-client"
import { useChild } from "@/lib/contexts/ChildContext"
import { useAudio } from "@/lib/contexts/AudioContext"
import { MobileNav } from "@/components/MobileNav"
import { getVocabularyWithMastery } from "@/lib/db/vocabulary"
import { getLettersWithMastery } from "@/lib/db/letters"
import { getRewards, clearRewards } from "@/lib/db/rewards"

export default function SettingsPage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const { activeChildId } = useChild()
  const { audioEnabled, setAudioEnabled } = useAudio()

  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    vocabulary: 0,
    letters: 0,
    rewards: 0,
  })

  // Delete confirmations
  const [showClearRewardsConfirm, setShowClearRewardsConfirm] = useState(false)
  const [clearingRewards, setClearingRewards] = useState(false)
  const [showDeleteAccountConfirm, setShowDeleteAccountConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deletingAccount, setDeletingAccount] = useState(false)

  useEffect(() => {
    async function loadSettings() {
      if (isPending) return

      if (!session?.user) {
        router.push('/login')
        return
      }

      try {
        // Load stats (child-scoped)
        if (activeChildId) {
          const [vocab, letters, rewards] = await Promise.all([
            getVocabularyWithMastery(activeChildId),
            getLettersWithMastery(activeChildId),
            getRewards(activeChildId)
          ])

          setStats({
            vocabulary: vocab.length,
            letters: letters.length,
            rewards: rewards.length
          })
        }
      } catch (error) {
        console.error('Failed to load settings:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [session, activeChildId, isPending, router])

  const handleClearRewards = async () => {
    if (!activeChildId) return
    setClearingRewards(true)
    try {
      await clearRewards(activeChildId)
      setStats(prev => ({ ...prev, rewards: 0 }))
      setShowClearRewardsConfirm(false)
    } catch (error) {
      console.error('Failed to clear rewards:', error)
    } finally {
      setClearingRewards(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return
    setDeletingAccount(true)
    try {
      const response = await fetch('/api/account', { method: 'DELETE' })
      if (!response.ok) {
        throw new Error('Failed to delete account')
      }
      await authClient.signOut()
      router.push('/')
    } catch (error) {
      console.error('Failed to delete account:', error)
      setDeletingAccount(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl animate-bounce-soft mb-4">⚙️</div>
          <p className="text-2xl font-display text-bark">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative">
      {/* Mobile navigation bar */}
      <MobileNav showSettings={false} />

      {/* Subtle decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[10%] right-[5%] text-2xl animate-float-slow opacity-30">⚙️</div>
        <div className="absolute bottom-[20%] left-[5%] text-xl animate-twinkle delay-300 opacity-25">✨</div>
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8 pt-16 sm:pt-8">
        {/* Header */}
        <header className="flex items-center gap-4 mb-8 animate-slide-up">
          <Link href="/">
            <Button
              variant="ghost"
              size="icon"
              className="h-12 w-12 rounded-2xl hover:bg-coral/10 hover:text-coral transition-all duration-200"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Settings2 className="h-8 w-8 text-coral" />
            <h1 className="text-3xl md:text-4xl font-display font-bold text-bark">
              Settings
            </h1>
          </div>
        </header>

        <div className="space-y-6">
          {/* Audio Settings */}
          <div className="bg-card/80 backdrop-blur-sm rounded-3xl border-2 border-border shadow-soft overflow-hidden animate-pop-in">
            <div className="bg-gradient-to-r from-lavender/20 to-purple-50 px-6 py-4 border-b border-border flex items-center gap-3">
              <div className="p-2 bg-lavender/30 rounded-xl">
                <Volume2 className="h-5 w-5 text-lavender" />
              </div>
              <h2 className="text-xl font-display font-bold text-bark">Audio Settings</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <label className="text-base font-semibold text-bark block mb-1">
                    Enable Audio Instructions
                  </label>
                  <p className="text-sm text-muted-foreground">
                    Play audio instructions and feedback during games to support pre-readers
                  </p>
                </div>
                <Switch
                  checked={audioEnabled}
                  onCheckedChange={setAudioEnabled}
                  className="ml-4"
                />
              </div>
              {audioEnabled && (
                <div className="bg-sage/10 border-2 border-sage/20 rounded-2xl p-4 mt-4 animate-pop-in">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">🔊</div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-sage mb-1">Audio Features Active</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Speaker button on each question</li>
                        <li>• Click letters/words to hear them spoken</li>
                        <li>• Encouraging audio feedback for answers</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Statistics */}
          <div className="bg-card/80 backdrop-blur-sm rounded-3xl border-2 border-border shadow-soft overflow-hidden animate-pop-in delay-100">
            <div className="bg-gradient-to-r from-sage/20 to-emerald-50 px-6 py-4 border-b border-border flex items-center gap-3">
              <div className="p-2 bg-sage/30 rounded-xl">
                <BarChart3 className="h-5 w-5 text-sage" />
              </div>
              <h2 className="text-xl font-display font-bold text-bark">Statistics</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-sunshine/10 rounded-2xl">
                  <div className="text-3xl font-display font-bold text-sunshine mb-1">
                    {stats.vocabulary}
                  </div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Words
                  </div>
                </div>
                <div className="text-center p-4 bg-coral/10 rounded-2xl">
                  <div className="text-3xl font-display font-bold text-coral mb-1">
                    {stats.letters}
                  </div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Letters
                  </div>
                </div>
                <div className="text-center p-4 bg-lavender/20 rounded-2xl">
                  <div className="text-3xl font-display font-bold text-lavender mb-1">
                    {stats.rewards}
                  </div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Rewards
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Vocabulary Log */}
          <div className="bg-card/80 backdrop-blur-sm rounded-3xl border-2 border-border shadow-soft overflow-hidden animate-pop-in delay-200">
            <div className="bg-gradient-to-r from-lavender/20 to-purple-50 px-6 py-4 border-b border-border flex items-center gap-3">
              <div className="p-2 bg-lavender/30 rounded-xl">
                <BookOpen className="h-5 w-5 text-lavender" />
              </div>
              <h2 className="text-xl font-display font-bold text-bark">Vocabulary Log</h2>
            </div>
            <div className="p-6">
              <Link href="/vocabulary">
                <Button
                  variant="outline"
                  className="w-full h-12 rounded-xl border-2 hover:border-lavender hover:bg-lavender/10 font-semibold transition-all duration-200"
                >
                  <BookOpen className="h-5 w-5 mr-2" />
                  View Vocabulary Log
                </Button>
              </Link>
            </div>
          </div>

          {/* Face Match Settings */}
          <div className="bg-card/80 backdrop-blur-sm rounded-3xl border-2 border-border shadow-soft overflow-hidden animate-pop-in delay-300">
            <div className="bg-gradient-to-r from-coral/20 to-rose-50 px-6 py-4 border-b border-border flex items-center gap-3">
              <div className="p-2 bg-coral/30 rounded-xl">
                <Users className="h-5 w-5 text-coral" />
              </div>
              <h2 className="text-xl font-display font-bold text-bark">Face Match</h2>
            </div>
            <div className="p-6">
              <p className="text-bark mb-4">
                Add photos of family members, friends, and pets for personalized recognition practice.
              </p>
              <Link href="/settings/faces">
                <Button
                  variant="outline"
                  className="w-full h-12 rounded-xl border-2 hover:border-coral hover:bg-coral/10 font-semibold transition-all duration-200"
                >
                  <Users className="h-5 w-5 mr-2" />
                  Manage Faces
                </Button>
              </Link>
            </div>
          </div>

          {/* Parent Guide */}
          <div className="bg-card/80 backdrop-blur-sm rounded-3xl border-2 border-border shadow-soft overflow-hidden animate-pop-in delay-400">
            <div className="bg-gradient-to-r from-coral/20 to-rose-50 px-6 py-4 border-b border-border flex items-center gap-3">
              <div className="p-2 bg-coral/30 rounded-xl">
                <HelpCircle className="h-5 w-5 text-coral" />
              </div>
              <h2 className="text-xl font-display font-bold text-bark">Parent Guide</h2>
            </div>
            <div className="p-6">
              <p className="text-bark mb-4">
                Learn how all the games work, understand the Science of Reading principles, and get tips for supporting your child.
              </p>
              <Link href="/guide">
                <Button
                  className="w-full h-12 rounded-xl font-semibold bg-gradient-to-r from-coral to-rose-500 text-white hover:shadow-md transition-all duration-200"
                >
                  <HelpCircle className="h-5 w-5 mr-2" />
                  Read Parent Guide
                </Button>
              </Link>
            </div>
          </div>

          {/* Data Management */}
          <div className="bg-card/80 backdrop-blur-sm rounded-3xl border-2 border-border shadow-soft overflow-hidden animate-pop-in delay-500">
            <div className="bg-gradient-to-r from-amber-100 to-orange-50 px-6 py-4 border-b border-border flex items-center gap-3">
              <div className="p-2 bg-amber-200 rounded-xl">
                <Trash2 className="h-5 w-5 text-amber-700" />
              </div>
              <h2 className="text-xl font-display font-bold text-bark">Data Management</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-bark mb-3">
                  Clear all AI-generated reward images for this learner. Vocabulary and progress data will be kept.
                </p>
                {!showClearRewardsConfirm ? (
                  <Button
                    variant="outline"
                    onClick={() => setShowClearRewardsConfirm(true)}
                    disabled={stats.rewards === 0}
                    className="w-full h-12 rounded-xl border-2 border-amber-300 hover:border-amber-400 hover:bg-amber-50 font-semibold transition-all duration-200"
                  >
                    <Trash2 className="h-5 w-5 mr-2" />
                    Clear All Rewards ({stats.rewards})
                  </Button>
                ) : (
                  <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 space-y-3">
                    <p className="text-sm text-bark font-medium">
                      Are you sure? This will delete all {stats.rewards} reward images. This cannot be undone.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleClearRewards}
                        disabled={clearingRewards}
                        className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
                      >
                        {clearingRewards ? 'Clearing...' : 'Yes, clear all'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowClearRewardsConfirm(false)}
                        disabled={clearingRewards}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Danger Zone - Account Deletion */}
          <div className="bg-card/80 backdrop-blur-sm rounded-3xl border-2 border-red-200 shadow-soft overflow-hidden animate-pop-in delay-600">
            <div className="bg-gradient-to-r from-red-100 to-rose-50 px-6 py-4 border-b border-red-200 flex items-center gap-3">
              <div className="p-2 bg-red-200 rounded-xl">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <h2 className="text-xl font-display font-bold text-red-800">Danger Zone</h2>
            </div>
            <div className="p-6">
              <p className="text-bark mb-4">
                Permanently delete your account and all associated data including all learner profiles, progress, vocabulary, and reward images.
              </p>
              {!showDeleteAccountConfirm ? (
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteAccountConfirm(true)}
                  className="w-full h-12 rounded-xl border-2 border-red-300 text-red-600 hover:border-red-400 hover:bg-red-50 font-semibold transition-all duration-200"
                >
                  <Trash2 className="h-5 w-5 mr-2" />
                  Delete Account
                </Button>
              ) : (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 space-y-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-red-800 font-semibold mb-1">
                        This action cannot be undone
                      </p>
                      <p className="text-sm text-red-700">
                        All your data will be permanently deleted including all learner profiles, progress, vocabulary words, and reward images.
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-red-800 mb-2">
                      Type DELETE to confirm
                    </label>
                    <Input
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="DELETE"
                      className="w-full border-red-200 focus:border-red-400"
                      disabled={deletingAccount}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleDeleteAccount}
                      disabled={deleteConfirmText !== 'DELETE' || deletingAccount}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                    >
                      {deletingAccount ? 'Deleting...' : 'Delete my account'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowDeleteAccountConfirm(false)
                        setDeleteConfirmText('')
                      }}
                      disabled={deletingAccount}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
