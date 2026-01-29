import type { VocabularyItem, Letter, Person } from "@/types"

// Global data cache for game generation
let vocabularyCache: VocabularyItem[] = []
let lettersCache: Letter[] = []
let peopleCache: Person[] = []

export function setGameData(vocabulary: VocabularyItem[], letters: Letter[]) {
  vocabularyCache = vocabulary
  lettersCache = letters
}

export function setPeopleData(people: Person[]) {
  peopleCache = people
}

export function getVocabulary(): VocabularyItem[] {
  return vocabularyCache
}

export function getLetters(): Letter[] {
  return lettersCache
}

export function getPeople(): Person[] {
  return peopleCache
}
