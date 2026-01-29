import type { AudioQuizDetail, AudioQuizManifest, AudioQuizSummary } from "@/types"

export async function listAudioQuizzes(): Promise<AudioQuizSummary[]> {
  const response = await fetch("/api/audio-quizzes")
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string }
    throw new Error(payload.error || "Failed to load audio quizzes")
  }

  const payload = (await response.json()) as { quizzes?: any[] }
  return (payload.quizzes ?? []).map((quiz) => ({
    id: quiz.id,
    title: quiz.title,
    status: quiz.status,
    createdAt: quiz.created_at,
    storyTitle: quiz.story_title,
  }))
}

export async function createAudioQuiz(params: {
  storySourceId?: string
  storyText?: string
  title?: string
  provider?: "openai"
  voice?: "alloy" | "echo" | "fable" | "nova" | "onyx" | "shimmer"
}): Promise<{ quizId: string }> {
  const response = await fetch("/api/audio-quizzes/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string }
    throw new Error(payload.error || "Failed to create audio quiz")
  }

  return (await response.json()) as { quizId: string }
}

export async function getAudioQuiz(quizId: string): Promise<AudioQuizDetail> {
  const response = await fetch(`/api/audio-quizzes/${quizId}`)
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string }
    throw new Error(payload.error || "Failed to load quiz")
  }

  const payload = (await response.json()) as { quiz?: any }
  if (!payload.quiz) {
    throw new Error("Quiz not found")
  }

  return {
    id: payload.quiz.id,
    title: payload.quiz.title,
    status: payload.quiz.status,
    storyTitle: payload.quiz.story_title,
    createdAt: payload.quiz.created_at,
  }
}

export async function getAudioQuizManifest(quizId: string): Promise<AudioQuizManifest> {
  const response = await fetch(`/api/audio-quizzes/manifest?quizId=${quizId}`)
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string }
    throw new Error(payload.error || "Failed to load manifest")
  }

  return (await response.json()) as AudioQuizManifest
}
