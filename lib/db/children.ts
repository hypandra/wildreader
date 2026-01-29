import type { ChildProfile } from '@/types'

let childrenCache: ChildProfile[] | null = null
let childrenPromise: Promise<ChildProfile[]> | null = null

export async function getChildren(options?: { force?: boolean }): Promise<ChildProfile[]> {
  const force = options?.force === true
  if (!force) {
    if (childrenCache) return childrenCache
    if (childrenPromise) return childrenPromise
  } else {
    childrenCache = null
    childrenPromise = null
  }

  childrenPromise = (async () => {
    const response = await fetch('/api/children')
    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string }
      const error = new Error(payload.error || 'Failed to load children') as Error & {
        status?: number
      }
      error.status = response.status
      throw error
    }

    const payload = (await response.json()) as { children?: ChildProfile[] }
    childrenCache = payload.children || []
    return childrenCache
  })()

  try {
    return await childrenPromise
  } finally {
    childrenPromise = null
  }
}

export async function createChild(
  name: string,
  avatarEmoji: string = '👶'
): Promise<ChildProfile> {
  const response = await fetch('/api/children', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, avatarEmoji }),
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string }
    throw new Error(payload.error || 'Failed to create child')
  }

  const payload = (await response.json()) as { child?: ChildProfile }
  if (!payload.child) {
    throw new Error('Failed to create child')
  }

  return payload.child
}

export async function updateChild(
  childId: string,
  updates: Partial<Pick<ChildProfile, 'name' | 'avatar_emoji' | 'date_of_birth'>>
): Promise<void> {
  const body: Record<string, unknown> = {}
  if (updates.name) body.name = updates.name
  if (updates.avatar_emoji) body.avatarEmoji = updates.avatar_emoji
  if (updates.date_of_birth) body.dateOfBirth = updates.date_of_birth

  const response = await fetch(`/api/children/${childId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string }
    throw new Error(payload.error || 'Failed to update child')
  }
}

export async function deleteChild(childId: string): Promise<void> {
  const response = await fetch(`/api/children/${childId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string }
    throw new Error(payload.error || 'Failed to delete child')
  }
}
