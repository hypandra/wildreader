"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { PlusCircle, Headphones } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSession } from "@/lib/auth-client"
import { listAudioQuizzes } from "@/lib/db/audio-quizzes"
import type { AudioQuizSummary } from "@/types"

export default function AudioQuizzesPage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const [loading, setLoading] = useState(true)
  const [quizzes, setQuizzes] = useState<AudioQuizSummary[]>([])

  useEffect(() => {
    if (isPending) return
    if (!session?.user) {
      router.push("/login")
      return
    }

    async function load() {
      try {
        const data = await listAudioQuizzes()
        setQuizzes(data)
      } catch (error) {
        console.error("Failed to load audio quizzes:", error)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [isPending, session, router])

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream via-white to-sky/10">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky/30">
              <Headphones className="h-6 w-6 text-sky" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold text-bark">Audio Quizzes</h1>
              <p className="text-muted-foreground">Audiobooks that pause for questions.</p>
            </div>
          </div>
          <Link href="/parents/audio-quizzes/new">
            <Button className="rounded-2xl">
              <PlusCircle className="mr-2 h-5 w-5" />
              New quiz
            </Button>
          </Link>
        </header>

        <section className="mt-10">
          {loading ? (
            <div className="rounded-3xl border-2 border-border bg-card/80 p-6 shadow-soft">
              <p className="text-muted-foreground">Loading quizzes...</p>
            </div>
          ) : quizzes.length === 0 ? (
            <div className="rounded-3xl border-2 border-border bg-card/80 p-8 text-center shadow-soft">
              <div className="text-4xl mb-3">🎧</div>
              <p className="text-lg font-semibold text-bark">No quizzes yet</p>
              <p className="text-muted-foreground mt-2">Create your first listen-and-think story.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {quizzes.map((quiz) => (
                <Link key={quiz.id} href={`/parents/audio-quizzes/${quiz.id}`}>
                  <div className="rounded-3xl border-2 border-border bg-card/80 p-6 shadow-soft transition hover:-translate-y-0.5 hover:shadow-soft-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">{quiz.storyTitle}</p>
                        <h2 className="text-xl font-semibold text-bark">{quiz.title}</h2>
                      </div>
                      <div className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        quiz.status === "ready"
                          ? "bg-sage/20 text-sage"
                          : "bg-sunshine/20 text-sunshine"
                      }`}>
                        {quiz.status}
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">Created {new Date(quiz.createdAt).toLocaleDateString()}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
