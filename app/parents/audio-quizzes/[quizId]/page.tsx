"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, DownloadCloud } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSession } from "@/lib/auth-client"
import { getAudioQuiz } from "@/lib/db/audio-quizzes"
import type { AudioQuizDetail } from "@/types"
import { AudioQuizPlayer } from "@/components/AudioQuizPlayer"

export default function AudioQuizDetailPage() {
  const router = useRouter()
  const params = useParams<{ quizId: string }>()
  const quizId = params.quizId

  const { data: session, isPending } = useSession()
  const [quiz, setQuiz] = useState<AudioQuizDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isPending) return
    if (!session?.user) {
      router.push("/login")
      return
    }

    async function loadQuiz() {
      try {
        const data = await getAudioQuiz(quizId)
        setQuiz(data)
      } catch (error) {
        console.error("Failed to load quiz:", error)
      } finally {
        setLoading(false)
      }
    }

    loadQuiz()
  }, [isPending, session, router, quizId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading quiz...</p>
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Quiz not found.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream via-white to-sage/10">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Link href="/parents/audio-quizzes">
              <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl">
                <ArrowLeft className="h-6 w-6" />
              </Button>
            </Link>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{quiz.storyTitle}</p>
              <h1 className="text-3xl font-display font-bold text-bark">{quiz.title}</h1>
            </div>
          </div>
          <a href={`/api/audio-quizzes/download?quizId=${quiz.id}`}>
            <Button variant="secondary" className="rounded-2xl">
              <DownloadCloud className="mr-2 h-5 w-5" />
              Download manifest
            </Button>
          </a>
        </header>

        <div className="mt-8">
          {quiz.status !== "ready" ? (
            <div className="rounded-3xl border-2 border-border bg-card/80 p-6 shadow-soft">
              <p className="text-muted-foreground">This quiz is still generating. Refresh in a moment.</p>
            </div>
          ) : (
            <AudioQuizPlayer quizId={quiz.id} />
          )}
        </div>
      </div>
    </div>
  )
}
