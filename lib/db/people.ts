import type { Person, GameType, MasteryData } from '@/types'

const ALL_GAME_TYPES: GameType[] = [
  'letter-match',
  'letter-hunt',
  'letter-to-picture',
  'picture-to-letter',
  'starts-with',
  'ends-with',
  'word-match',
  'picture-match',
  'face-match',
]

export async function getPeopleWithMastery(childId: string): Promise<Person[]> {
  const response = await fetch(`/api/children/${childId}/people`)
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string }
    throw new Error(payload.error || 'Failed to load people')
  }

  const payload = (await response.json()) as { people?: any[] }
  const data = payload.people || []

  return data.map((person: any) => {
    const mastery: Record<GameType, MasteryData> = {} as any

    // Ensure all game types have mastery data (default to 0 attempts/correct)
    ALL_GAME_TYPES.forEach((gameType) => {
      mastery[gameType] = person.mastery?.[gameType] || { attempts: 0, correct: 0 }
    })

    return {
      id: person.id,
      name: person.name,
      imagePath: person.imagePath,
      imageUrl: person.imageUrl,
      isDistractor: person.isDistractor,
      mastery,
    }
  })
}

export async function addPerson(
  childId: string,
  name: string,
  photo?: File,
  isDistractor: boolean = false
): Promise<Person> {
  const formData = new FormData()
  formData.append('name', name)
  formData.append('isDistractor', String(isDistractor))
  if (photo) {
    formData.append('photo', photo)
  }

  const response = await fetch(`/api/children/${childId}/people`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string }
    throw new Error(payload.error || 'Failed to add person')
  }

  const payload = (await response.json()) as { person: any }
  const person = payload.person

  const mastery: Record<GameType, MasteryData> = {} as any
  ALL_GAME_TYPES.forEach((gameType) => {
    mastery[gameType] = person.mastery?.[gameType] || { attempts: 0, correct: 0 }
  })

  return {
    id: person.id,
    name: person.name,
    imagePath: person.imagePath,
    imageUrl: person.imageUrl,
    isDistractor: person.isDistractor,
    mastery,
  }
}

export async function linkPersonToChild(childId: string, faceId: string): Promise<Person> {
  const formData = new FormData()
  formData.append('faceId', faceId)

  const response = await fetch(`/api/children/${childId}/people`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string }
    throw new Error(payload.error || 'Failed to add person to child')
  }

  const payload = (await response.json()) as { person: any }
  const person = payload.person

  const mastery: Record<GameType, MasteryData> = {} as any
  ALL_GAME_TYPES.forEach((gameType) => {
    mastery[gameType] = person.mastery?.[gameType] || { attempts: 0, correct: 0 }
  })

  return {
    id: person.id,
    name: person.name,
    imagePath: person.imagePath,
    imageUrl: person.imageUrl,
    isDistractor: person.isDistractor,
    mastery,
  }
}

export async function deletePerson(childId: string, personId: string): Promise<void> {
  const response = await fetch(`/api/children/${childId}/people`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ personId }),
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string }
    throw new Error(payload.error || 'Failed to delete person')
  }
}
