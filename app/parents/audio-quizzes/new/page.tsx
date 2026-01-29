"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useSession } from "@/lib/auth-client"
import { createAudioQuiz } from "@/lib/db/audio-quizzes"

interface StorySourceOption {
  id: string
  title: string
}

const VOICES = ["alloy", "echo", "fable", "nova", "onyx", "shimmer"] as const

export default function NewAudioQuizPage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()

  const [sources, setSources] = useState<StorySourceOption[]>([])
  const [storySourceId, setStorySourceId] = useState("")
  const [title, setTitle] = useState("")
  const [storyText, setStoryText] = useState("")
  const [voice, setVoice] = useState<(typeof VOICES)[number]>("nova")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isPending) return
    if (!session?.user) {
      router.push("/login")
      return
    }

    async function loadSources() {
      try {
        const response = await fetch("/api/story-sources")
        if (!response.ok) return
        const payload = (await response.json()) as { sources?: any[] }
        setSources(
          (payload.sources ?? []).map((source) => ({
            id: source.id,
            title: source.title,
          }))
        )
      } catch (err) {
        console.error("Failed to load story sources:", err)
      }
    }

    loadSources()
  }, [isPending, session, router])

  const handleSubmit = async () => {
    setError(null)
    if (!storySourceId && !storyText.trim()) {
      setError("Choose a story or paste one below.")
      return
    }

    setLoading(true)
    try {
      const result = await createAudioQuiz({
        storySourceId: storySourceId || undefined,
        storyText: storyText.trim() || undefined,
        title: title.trim() || undefined,
        voice,
        provider: "openai",
      })

      router.push(`/parents/audio-quizzes/${result.quizId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create quiz")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream via-white to-lavender/10">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <header className="flex items-center gap-4">
          <Link href="/parents/audio-quizzes">
            <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl">
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-display font-bold text-bark">Create Audio Quiz</h1>
            <p className="text-muted-foreground">Choose a story, pick a voice, then generate.</p>
          </div>
        </header>

        <div className="mt-8 space-y-6">
          <div className="rounded-3xl border-2 border-border bg-card/80 p-6 shadow-soft">
            <h2 className="text-lg font-semibold text-bark">Story Title</h2>
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Bedtime adventure"
              className="mt-3 h-12 rounded-2xl"
            />
          </div>

          <div className="rounded-3xl border-2 border-border bg-card/80 p-6 shadow-soft">
            <h2 className="text-lg font-semibold text-bark">Pick a Story Source</h2>
            <p className="text-sm text-muted-foreground">Use a saved story or paste a new one.</p>
            <select
              value={storySourceId}
              onChange={(event) => setStorySourceId(event.target.value)}
              className="mt-3 w-full rounded-2xl border-2 border-border bg-white px-4 py-3 text-sm"
            >
              <option value="">Choose a saved story</option>
              {sources.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.title}
                </option>
              ))}
            </select>

            <div className="mt-5">
              <label className="text-sm font-semibold text-bark">Or paste a new story</label>
              <textarea
                value={storyText}
                onChange={(event) => setStoryText(event.target.value)}
                rows={6}
                className="mt-2 w-full rounded-2xl border-2 border-border bg-white p-4 text-sm"
                placeholder="Once upon a time..."
              />
            </div>
          </div>

          <div className="rounded-3xl border-2 border-border bg-card/80 p-6 shadow-soft">
            <h2 className="text-lg font-semibold text-bark">Voice</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {VOICES.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setVoice(option)}
                  className={`rounded-2xl border-2 px-4 py-3 text-sm font-semibold transition ${
                    voice === option
                      ? "border-sunshine bg-sunshine/20 text-bark"
                      : "border-border bg-white text-muted-foreground hover:border-sunshine/50"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="rounded-2xl border-2 border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              Audio generation can take a minute. We will reuse existing segments when possible.
            </div>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="rounded-2xl"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              {loading ? "Generating..." : "Generate quiz"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
