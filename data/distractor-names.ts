// Static distractor names for face-match game
// Used as wrong answers when the child doesn't have enough people added

export type NameCategory = "common" | "pet" | "character" | "unusual"
export type Difficulty = "easy" | "medium" | "hard" | "expert"

interface DistractorName {
  name: string
  category: NameCategory
}

// Common first names
const commonNames: DistractorName[] = [
  { name: "Mom", category: "common" },
  { name: "Dad", category: "common" },
  { name: "Grandma", category: "common" },
  { name: "Grandpa", category: "common" },
  { name: "Nana", category: "common" },
  { name: "Papa", category: "common" },
  { name: "Emma", category: "common" },
  { name: "Liam", category: "common" },
  { name: "Olivia", category: "common" },
  { name: "Noah", category: "common" },
  { name: "Ava", category: "common" },
  { name: "Oliver", category: "common" },
  { name: "Sophia", category: "common" },
  { name: "Elijah", category: "common" },
  { name: "Charlotte", category: "common" },
  { name: "James", category: "common" },
  { name: "Amelia", category: "common" },
  { name: "William", category: "common" },
  { name: "Mia", category: "common" },
  { name: "Benjamin", category: "common" },
  { name: "Harper", category: "common" },
  { name: "Lucas", category: "common" },
  { name: "Evelyn", category: "common" },
  { name: "Henry", category: "common" },
  { name: "Abigail", category: "common" },
  { name: "Alexander", category: "common" },
  { name: "Emily", category: "common" },
  { name: "Mason", category: "common" },
  { name: "Ella", category: "common" },
  { name: "Michael", category: "common" },
  { name: "Elizabeth", category: "common" },
  { name: "Daniel", category: "common" },
  { name: "Sofia", category: "common" },
  { name: "Jacob", category: "common" },
  { name: "Avery", category: "common" },
  { name: "Logan", category: "common" },
  { name: "Scarlett", category: "common" },
  { name: "Jackson", category: "common" },
  { name: "Grace", category: "common" },
  { name: "Aiden", category: "common" },
  { name: "Chloe", category: "common" },
  { name: "Jack", category: "common" },
  { name: "Riley", category: "common" },
  { name: "Owen", category: "common" },
  { name: "Lily", category: "common" },
  { name: "Samuel", category: "common" },
  { name: "Zoey", category: "common" },
  { name: "Ryan", category: "common" },
  { name: "Hannah", category: "common" },
  { name: "Nathan", category: "common" },
]

// Pet names
const petNames: DistractorName[] = [
  { name: "Buddy", category: "pet" },
  { name: "Max", category: "pet" },
  { name: "Charlie", category: "pet" },
  { name: "Bella", category: "pet" },
  { name: "Lucy", category: "pet" },
  { name: "Daisy", category: "pet" },
  { name: "Rocky", category: "pet" },
  { name: "Luna", category: "pet" },
  { name: "Cooper", category: "pet" },
  { name: "Molly", category: "pet" },
  { name: "Duke", category: "pet" },
  { name: "Sadie", category: "pet" },
  { name: "Bear", category: "pet" },
  { name: "Maggie", category: "pet" },
  { name: "Tucker", category: "pet" },
  { name: "Sophie", category: "pet" },
  { name: "Bailey", category: "pet" },
  { name: "Coco", category: "pet" },
  { name: "Murphy", category: "pet" },
  { name: "Penny", category: "pet" },
  { name: "Milo", category: "pet" },
  { name: "Rosie", category: "pet" },
  { name: "Oscar", category: "pet" },
  { name: "Ruby", category: "pet" },
  { name: "Leo", category: "pet" },
  { name: "Lola", category: "pet" },
  { name: "Teddy", category: "pet" },
  { name: "Zoe", category: "pet" },
  { name: "Winston", category: "pet" },
  { name: "Stella", category: "pet" },
]

// Character names
const characterNames: DistractorName[] = [
  { name: "Elsa", category: "character" },
  { name: "Anna", category: "character" },
  { name: "Mickey", category: "character" },
  { name: "Minnie", category: "character" },
  { name: "Elmo", category: "character" },
  { name: "Bluey", category: "character" },
  { name: "Bingo", category: "character" },
  { name: "Peppa", category: "character" },
  { name: "George", category: "character" },
  { name: "Dora", category: "character" },
  { name: "Diego", category: "character" },
  { name: "Moana", category: "character" },
  { name: "Maui", category: "character" },
  { name: "Ariel", category: "character" },
  { name: "Belle", category: "character" },
  { name: "Jasmine", category: "character" },
  { name: "Rapunzel", category: "character" },
  { name: "Woody", category: "character" },
  { name: "Buzz", category: "character" },
  { name: "Nemo", category: "character" },
  { name: "Dory", category: "character" },
  { name: "Simba", category: "character" },
  { name: "Chase", category: "character" },
  { name: "Marshall", category: "character" },
  { name: "Skye", category: "character" },
  { name: "Batman", category: "character" },
  { name: "Superman", category: "character" },
]

// Unusual names
const unusualNames: DistractorName[] = [
  { name: "Bartholomew", category: "unusual" },
  { name: "Cornelius", category: "unusual" },
  { name: "Gertrude", category: "unusual" },
  { name: "Archibald", category: "unusual" },
  { name: "Penelope", category: "unusual" },
  { name: "Reginald", category: "unusual" },
  { name: "Beatrice", category: "unusual" },
  { name: "Ferdinand", category: "unusual" },
  { name: "Millicent", category: "unusual" },
  { name: "Theodore", category: "unusual" },
  { name: "Clementine", category: "unusual" },
  { name: "Augustus", category: "unusual" },
  { name: "Cordelia", category: "unusual" },
  { name: "Leopold", category: "unusual" },
  { name: "Guinevere", category: "unusual" },
  { name: "Maximilian", category: "unusual" },
  { name: "Persephone", category: "unusual" },
  { name: "Sebastian", category: "unusual" },
  { name: "Evangeline", category: "unusual" },
  { name: "Montgomery", category: "unusual" },
]

// All distractor names combined
export const allDistractorNames: DistractorName[] = [
  ...commonNames,
  ...petNames,
  ...characterNames,
  ...unusualNames,
]

// Names organized by first letter for "medium" difficulty (same first letter)
const namesByFirstLetter: Record<string, string[]> = {
  A: ["Ava", "Amelia", "Abigail", "Alexander", "Aiden", "Avery", "Anna", "Ariel", "Augustus", "Archibald"],
  B: ["Benjamin", "Bella", "Buddy", "Bear", "Bailey", "Belle", "Buzz", "Bingo", "Bluey", "Bartholomew", "Beatrice", "Batman"],
  C: ["Charlotte", "Chloe", "Charlie", "Cooper", "Coco", "Chase", "Cornelius", "Clementine", "Cordelia"],
  D: ["Daniel", "Dad", "Daddy", "Daisy", "Duke", "Dora", "Diego", "Dory"],
  E: ["Emma", "Elijah", "Emily", "Ella", "Elizabeth", "Evelyn", "Elsa", "Elmo", "Evangeline"],
  F: ["Ferdinand"],
  G: ["Grandma", "Grandpa", "Grace", "George", "Gertrude", "Guinevere"],
  H: ["Henry", "Harper", "Hannah"],
  J: ["James", "Jacob", "Jackson", "Jack", "Jasmine"],
  L: ["Liam", "Lucas", "Logan", "Lily", "Lucy", "Luna", "Lola", "Leo", "Leopold"],
  M: ["Mom", "Mia", "Mason", "Michael", "Max", "Molly", "Maggie", "Murphy", "Milo", "Mickey", "Minnie", "Moana", "Maui", "Marshall", "Millicent", "Maximilian", "Montgomery"],
  N: ["Noah", "Nana", "Nathan", "Nemo"],
  O: ["Oliver", "Olivia", "Owen", "Oscar"],
  P: ["Papa", "Penny", "Peppa", "Penelope", "Persephone"],
  R: ["Ryan", "Riley", "Rocky", "Rosie", "Ruby", "Rapunzel", "Reginald"],
  S: ["Sophia", "Sofia", "Scarlett", "Samuel", "Sadie", "Sophie", "Stella", "Simba", "Skye", "Superman", "Sebastian"],
  T: ["Tucker", "Teddy", "Theodore"],
  W: ["William", "Winston", "Woody"],
  Z: ["Zoey", "Zoe"],
}

/**
 * Generate typos for a name (for expert difficulty)
 * Creates plausible misspellings that a child might confuse
 */
export function generateTypos(name: string, count: number = 3): string[] {
  if (name.length < 2) return []

  const typos: Set<string> = new Set()
  const chars = name.split('')

  // Strategy 1: Swap adjacent letters (e.g., "Mom" -> "Mmo")
  for (let i = 0; i < chars.length - 1 && typos.size < count * 2; i++) {
    const swapped = [...chars]
    ;[swapped[i], swapped[i + 1]] = [swapped[i + 1], swapped[i]]
    const result = swapped.join('')
    if (result !== name) typos.add(result)
  }

  // Strategy 2: Double a letter (e.g., "Dad" -> "Dadd")
  for (let i = 0; i < chars.length && typos.size < count * 2; i++) {
    const doubled = [...chars]
    doubled.splice(i, 0, chars[i])
    typos.add(doubled.join(''))
  }

  // Strategy 3: Remove a letter (only for names 4+ chars) (e.g., "Grandma" -> "Granda")
  if (name.length >= 4) {
    for (let i = 1; i < chars.length - 1 && typos.size < count * 2; i++) {
      const removed = chars.filter((_, idx) => idx !== i)
      typos.add(removed.join(''))
    }
  }

  // Strategy 4: Common letter substitutions
  const substitutions: Record<string, string[]> = {
    'a': ['e', 'o'],
    'e': ['a', 'i'],
    'i': ['e', 'y'],
    'o': ['a', 'u'],
    'u': ['o'],
    'b': ['d', 'p'],
    'd': ['b'],
    'p': ['b', 'q'],
    'q': ['p'],
    'm': ['n'],
    'n': ['m'],
    'c': ['k'],
    'k': ['c'],
  }

  for (let i = 0; i < chars.length && typos.size < count * 2; i++) {
    const lower = chars[i].toLowerCase()
    const subs = substitutions[lower]
    if (subs) {
      for (const sub of subs) {
        const substituted = [...chars]
        // Preserve case
        substituted[i] = chars[i] === chars[i].toUpperCase() ? sub.toUpperCase() : sub
        typos.add(substituted.join(''))
      }
    }
  }

  // Convert to array, filter out the original name, shuffle, and return requested count
  return shuffleArray(Array.from(typos).filter(t => t.toLowerCase() !== name.toLowerCase()))
    .slice(0, count)
}

/**
 * Get names that start with the same letter as the target
 */
export function getSameLetterNames(targetName: string, count: number, exclude: string[] = []): string[] {
  const firstLetter = targetName[0].toUpperCase()
  const excludeLower = new Set(exclude.map(n => n.toLowerCase()))

  const candidates = namesByFirstLetter[firstLetter] || []
  const available = candidates.filter(n => !excludeLower.has(n.toLowerCase()))

  if (available.length >= count) {
    return shuffleArray(available).slice(0, count)
  }

  // If not enough same-letter names, fill with random names
  const remaining = count - available.length
  const fillerNames = getRandomDistractors(remaining, [...exclude, ...available, targetName])
  return shuffleArray([...available, ...fillerNames]).slice(0, count)
}

/**
 * Get random distractor names for face-match game
 * @param count Number of distractors needed
 * @param exclude Names to exclude (e.g., the correct answer and child's existing people)
 * @param options Additional options for difficulty-based selection
 */
export function getRandomDistractors(
  count: number,
  exclude: string[] = [],
  options?: {
    difficulty?: Difficulty
    targetName?: string // Required for medium/expert difficulty
  }
): string[] {
  const { difficulty, targetName } = options || {}

  // Expert: Generate typos of the correct name
  if (difficulty === "expert" && targetName) {
    const typos = generateTypos(targetName, count)
    if (typos.length >= count) {
      return typos.slice(0, count)
    }
    // If not enough typos, fill with same-letter names
    const remaining = count - typos.length
    const sameLetterFill = getSameLetterNames(targetName, remaining, [...exclude, ...typos])
    return shuffleArray([...typos, ...sameLetterFill]).slice(0, count)
  }

  // Hard: Same first letter names
  if (difficulty === "hard" && targetName) {
    return getSameLetterNames(targetName, count, exclude)
  }

  // Medium: Mix of same letter and different (weighted towards same letter)
  if (difficulty === "medium" && targetName) {
    const sameLetterCount = Math.ceil(count / 2) // Half same letter
    const differentCount = count - sameLetterCount

    const sameLetter = getSameLetterNames(targetName, sameLetterCount, exclude)
    const different = getRandomDistractorsSimple(differentCount, [...exclude, ...sameLetter, targetName])

    return shuffleArray([...sameLetter, ...different])
  }

  // Easy: Different first letters (default behavior)
  return getRandomDistractorsSimple(count, exclude, targetName)
}

/**
 * Simple random distractor selection (different first letters preferred)
 */
function getRandomDistractorsSimple(
  count: number,
  exclude: string[] = [],
  targetName?: string
): string[] {
  const excludeLower = new Set(exclude.map(n => n.toLowerCase()))
  const targetFirstLetter = targetName?.[0]?.toUpperCase()

  // Filter out excluded names and optionally same-letter names
  let available = allDistractorNames.filter(d => {
    if (excludeLower.has(d.name.toLowerCase())) return false
    // For easy mode, prefer different first letters
    if (targetFirstLetter && d.name[0].toUpperCase() === targetFirstLetter) return false
    return true
  })

  // If not enough different-letter names, include same-letter ones
  if (available.length < count) {
    available = allDistractorNames.filter(d => !excludeLower.has(d.name.toLowerCase()))
  }

  return shuffleArray(available)
    .slice(0, count)
    .map(d => d.name)
}

// Fisher-Yates shuffle
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}
