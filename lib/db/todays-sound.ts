export interface TodaysSoundAttempt {
  id: string
  date: string
  letterOrDigraph: string
  wordsEntered: string[]
  matchedVocabulary: string[]
  totalAvailable: number
  createdAt: string
}

export interface PreviousAttempts {
  earlierToday?: TodaysSoundAttempt
  lastMonth?: TodaysSoundAttempt
  best?: TodaysSoundAttempt
}

export async function saveTodaysSoundAttempt(
  childId: string,
  letterOrDigraph: string,
  wordsEntered: string[],
  matchedVocabulary: string[],
  totalAvailable: number
): Promise<TodaysSoundAttempt> {
  const response = await fetch(`/api/children/${childId}/todays-sound`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      letterOrDigraph,
      wordsEntered,
      matchedVocabulary,
      totalAvailable,
    }),
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string }
    throw new Error(payload.error || "Failed to save attempt")
  }

  const data = await response.json()
  return data.attempt
}

export async function getTodaysSoundAttempts(
  childId: string,
  letterOrDigraph: string
): Promise<TodaysSoundAttempt[]> {
  const response = await fetch(
    `/api/children/${childId}/todays-sound?letter=${encodeURIComponent(letterOrDigraph)}`
  )

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string }
    throw new Error(payload.error || "Failed to load attempts")
  }

  const data = await response.json()
  return data.attempts || []
}

export async function getPreviousAttempts(
  childId: string,
  letterOrDigraph: string
): Promise<PreviousAttempts> {
  const attempts = await getTodaysSoundAttempts(childId, letterOrDigraph)

  const today = new Date().toISOString().split("T")[0]
  const todayDate = new Date().getDate()

  // Find attempts from earlier today
  const todayAttempts = attempts.filter((a) => a.date === today)
  const earlierToday = todayAttempts.length > 1 ? todayAttempts[1] : undefined

  // Find attempt from same day last month
  const lastMonth = attempts.find((a) => {
    const attemptDate = new Date(a.date)
    const attemptDay = attemptDate.getDate()
    const monthsDiff =
      (new Date().getFullYear() - attemptDate.getFullYear()) * 12 +
      (new Date().getMonth() - attemptDate.getMonth())
    return attemptDay === todayDate && monthsDiff === 1
  })

  // Find best attempt (most matched words)
  const best = attempts.reduce<TodaysSoundAttempt | undefined>((best, current) => {
    if (!best) return current
    return current.matchedVocabulary.length > best.matchedVocabulary.length
      ? current
      : best
  }, undefined)

  return { earlierToday, lastMonth, best }
}
