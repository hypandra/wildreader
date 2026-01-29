import type { SessionState, GameType } from '@/types'

export async function getSession(childId: string): Promise<SessionState> {
  const response = await fetch(`/api/children/${childId}/session`)
  if (!response.ok) {
    return { currentGame: null, streak: 0, totalStars: 0, difficultyByGame: {} }
  }

  const payload = (await response.json()) as { session?: SessionState }
  if (!payload.session) {
    // Return default if not found
    return { currentGame: null, streak: 0, totalStars: 0, difficultyByGame: {} }
  }

  return payload.session
}

export async function updateSession(
  childId: string,
  updates: Partial<SessionState>
): Promise<void> {
  const response = await fetch(`/api/children/${childId}/session`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string }
    throw new Error(payload.error || 'Failed to update session')
  }
}

export async function resetSession(childId: string): Promise<void> {
  await updateSession(childId, {
    currentGame: null,
    streak: 0
  })
}
