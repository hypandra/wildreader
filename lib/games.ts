import type {
  GameType,
  GameConfig,
  VocabularyItem,
  Letter,
  Difficulty,
  Person,
} from "@/types"
import { selectWeightedRandom } from "./mastery"
import { getVocabulary, getLetters, getPeople } from "./game-data"
import { getRandomDistractors } from "@/data/distractor-names"

export const GAME_CONFIGS: Record<GameType, GameConfig> = {
  "letter-match": {
    slug: "letter-match",
    name: "Letter Match",
    description: "Match uppercase to lowercase",
    emoji: "🔤",
  },
  "letter-hunt": {
    slug: "letter-hunt",
    name: "Letter Hunt",
    description: "Find all matching letters",
    emoji: "🔍",
  },
  "letter-to-picture": {
    slug: "letter-to-picture",
    name: "Letter to Picture",
    description: "Which picture starts with this letter?",
    emoji: "📝",
  },
  "picture-to-letter": {
    slug: "picture-to-letter",
    name: "Picture to Letter",
    description: "Which letter does this start with?",
    emoji: "🎯",
  },
  "starts-with": {
    slug: "starts-with",
    name: "Starts With",
    description: "Find words that start the same",
    emoji: "🚀",
  },
  "ends-with": {
    slug: "ends-with",
    name: "Ends With",
    description: "Find words that end the same",
    emoji: "🏁",
  },
  "word-match": {
    slug: "word-match",
    name: "Word Match",
    description: "Match the word to the picture",
    emoji: "📖",
  },
  "sight-word-splatter": {
    slug: "sight-word-splatter",
    name: "Sight Word Splatter",
    description: "Splatter the correct sight word",
    emoji: "💥",
  },
  "freeplay-canvas": {
    slug: "freeplay-canvas",
    name: "Freeplay Canvas",
    description: "Finger paint and explore colors",
    emoji: "🎨",
  },
  "picture-match": {
    slug: "picture-match",
    name: "Picture Match",
    description: "Match the picture to the word",
    emoji: "🖼️",
  },
  "face-match": {
    slug: "face-match",
    name: "Face Match",
    description: "Who is this person?",
    emoji: "👤",
  },
  "name-to-face": {
    slug: "name-to-face",
    name: "Name to Face",
    description: "Find the matching face",
    emoji: "🔍",
  },
  "todays-sound": {
    slug: "todays-sound",
    name: "Today's Sound",
    description: "Brainstorm words with today's letter",
    emoji: "📅",
  },
}

const CONFUSING_PAIRS: Record<string, string[]> = {
  b: ["b", "d", "p", "q"],
  d: ["b", "d", "p", "q"],
  p: ["b", "d", "p", "q"],
  q: ["b", "d", "p", "q"],
  m: ["m", "w", "n", "u"],
  w: ["m", "w", "n", "u"],
  n: ["m", "w", "n", "u"],
  u: ["m", "w", "n", "u"],
}

function getConfusingOptions(letter: string): string[] {
  const lower = letter.toLowerCase()
  const confusingSet = CONFUSING_PAIRS[lower]

  if (confusingSet) {
    return [...confusingSet]
  }

  // Generate unique random letters for non-confusing pairs
  const options = new Set<string>([lower])
  while (options.size < 4) {
    const randomLetter = String.fromCharCode(97 + Math.floor(Math.random() * 26))
    options.add(randomLetter)
  }

  return Array.from(options)
}

export function generateLetterMatchQuestion(): {
  target: Letter
  options: string[]
  correctIndex: number
} {
  const letters = getLetters()

  if (!letters || letters.length === 0) {
    throw new Error("Letters data not loaded")
  }

  const target = selectWeightedRandom(letters, "letter-match")

  if (!target || !target.letter) {
    throw new Error("Invalid letter selected")
  }

  const options = getConfusingOptions(target.letter)

  // Shuffle the options
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[options[i], options[j]] = [options[j], options[i]]
  }

  const correctIndex = options.indexOf(target.lowercase)
  return { target, options, correctIndex }
}

export function generateLetterHuntQuestion(
  difficulty: Difficulty = "medium"
): {
  target: Letter
  letters: string[]
  targetCount: number
} {
  const letters = getLetters()

  if (!letters || letters.length === 0) {
    throw new Error("Letters data not loaded")
  }

  const target = selectWeightedRandom(letters, "letter-hunt")

  if (!target || !target.letter) {
    throw new Error("Invalid letter selected")
  }

  const configs: Record<Difficulty, { total: number; targets: number }> = {
    easy: { total: 10, targets: 2 },
    medium: { total: 15, targets: 3 },
    hard: { total: 20, targets: 4 },
    expert: { total: 25, targets: 5 },
  }

  const config = configs[difficulty]
  const allLetters: string[] = []
  const otherLetters = letters.filter((l) => l && l.letter !== target.letter)

  for (let i = 0; i < config.targets; i++) {
    allLetters.push(target.letter)
  }

  while (allLetters.length < config.total) {
    const randomLetter =
      otherLetters[Math.floor(Math.random() * otherLetters.length)]
    allLetters.push(randomLetter.letter)
  }

  for (let i = allLetters.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[allLetters[i], allLetters[j]] = [allLetters[j], allLetters[i]]
  }

  return {
    target,
    letters: allLetters,
    targetCount: config.targets,
  }
}

export function generateLetterToPictureQuestion(): {
  target: Letter
  options: VocabularyItem[]
  correctIndex: number
} {
  const letters = getLetters()
  const vocabulary = getVocabulary()

  if (!vocabulary || vocabulary.length === 0) {
    throw new Error("Vocabulary data not loaded")
  }

  const target = selectWeightedRandom(letters, "letter-to-picture")

  const matchingWords = vocabulary.filter(
    (v) => v && v.word && v.word[0].toLowerCase() === target.lowercase
  )

  const otherWords = vocabulary.filter(
    (v) => v && v.word && v.word[0].toLowerCase() !== target.lowercase
  )

  if (matchingWords.length === 0) {
    throw new Error(`No vocabulary words found starting with letter: ${target.letter}`)
  }

  const options: VocabularyItem[] = [matchingWords[0]]
  while (options.length < 4 && otherWords.length > 0) {
    const randomWord =
      otherWords[Math.floor(Math.random() * otherWords.length)]
    if (randomWord && !options.includes(randomWord)) {
      options.push(randomWord)
    }
  }

  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[options[i], options[j]] = [options[j], options[i]]
  }

  const correctIndex = options.findIndex(
    (v) => v && v.word && v.word[0].toLowerCase() === target.lowercase
  )

  return { target, options, correctIndex }
}

export function generatePictureToLetterQuestion(): {
  target: VocabularyItem
  options: Letter[]
  correctIndex: number
} {
  const vocabulary = getVocabulary()
  const letters = getLetters()

  if (!vocabulary || vocabulary.length === 0) {
    throw new Error("Vocabulary data not loaded")
  }

  const target = selectWeightedRandom(vocabulary, "picture-to-letter")

  if (!target || !target.word) {
    throw new Error("Invalid vocabulary item selected")
  }

  const correctLetter = letters.find(
    (l) => l.lowercase === target.word[0].toLowerCase()
  )

  if (!correctLetter) {
    throw new Error(`No letter found for: ${target.word[0]}`)
  }

  const otherLetters = letters.filter(
    (l) => l.lowercase !== target.word[0].toLowerCase()
  )

  const options: Letter[] = [correctLetter]
  while (options.length < 4 && otherLetters.length > 0) {
    const randomLetter =
      otherLetters[Math.floor(Math.random() * otherLetters.length)]
    if (randomLetter && !options.find((l) => l.letter === randomLetter.letter)) {
      options.push(randomLetter)
    }
  }

  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[options[i], options[j]] = [options[j], options[i]]
  }

  const correctIndex = options.findIndex(
    (l) => l.lowercase === target.word[0].toLowerCase()
  )

  return { target, options, correctIndex }
}

export function generateStartsWithQuestion(stage: 1 | 2 = 1): {
  target: VocabularyItem
  options: VocabularyItem[]
  correctIndices: number[]
} {
  const vocabulary = getVocabulary()

  if (!vocabulary || vocabulary.length === 0) {
    throw new Error("Vocabulary data not loaded")
  }

  const target = selectWeightedRandom(vocabulary, "starts-with")

  if (!target || !target.word) {
    throw new Error("Invalid vocabulary item selected")
  }

  const matchingWords = vocabulary.filter(
    (v) => v && v.word && v.id !== target.id && v.word[0].toLowerCase() === target.word[0].toLowerCase()
  )

  const otherWords = vocabulary.filter(
    (v) => v && v.word && v.id !== target.id && v.word[0].toLowerCase() !== target.word[0].toLowerCase()
  )

  const correctIndices: number[] = []
  const options: VocabularyItem[] = []

  if (stage === 1) {
    if (matchingWords.length > 0) {
      options.push(matchingWords[0])
      correctIndices.push(0)
    }
    while (options.length < 4 && otherWords.length > 0) {
      const randomWord =
        otherWords[Math.floor(Math.random() * otherWords.length)]
      if (!options.includes(randomWord)) {
        options.push(randomWord)
      }
    }
  } else {
    const numCorrect = Math.min(2, matchingWords.length)
    for (let i = 0; i < numCorrect; i++) {
      options.push(matchingWords[i])
      correctIndices.push(options.length - 1)
    }
    while (options.length < 4 && otherWords.length > 0) {
      const randomWord =
        otherWords[Math.floor(Math.random() * otherWords.length)]
      if (!options.includes(randomWord)) {
        options.push(randomWord)
      }
    }
  }

  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const oldCorrect = correctIndices.map((idx) => options[idx])
    ;[options[i], options[j]] = [options[j], options[i]]
    correctIndices.length = 0
    options.forEach((opt, idx) => {
      if (oldCorrect.includes(opt)) {
        correctIndices.push(idx)
      }
    })
  }

  return { target, options, correctIndices }
}

export function generateEndsWithQuestion(stage: 1 | 2 = 1): {
  target: VocabularyItem
  options: VocabularyItem[]
  correctIndices: number[]
} {
  const vocabulary = getVocabulary()

  if (!vocabulary || vocabulary.length === 0) {
    throw new Error("Vocabulary data not loaded")
  }

  const target = selectWeightedRandom(vocabulary, "ends-with")

  if (!target || !target.word) {
    throw new Error("Invalid vocabulary item selected")
  }

  const matchingWords = vocabulary.filter(
    (v) =>
      v && v.word &&
      v.id !== target.id &&
      v.word[v.word.length - 1].toLowerCase() ===
        target.word[target.word.length - 1].toLowerCase()
  )

  const otherWords = vocabulary.filter(
    (v) =>
      v && v.word &&
      v.id !== target.id &&
      v.word[v.word.length - 1].toLowerCase() !==
        target.word[target.word.length - 1].toLowerCase()
  )

  const correctIndices: number[] = []
  const options: VocabularyItem[] = []

  if (stage === 1) {
    if (matchingWords.length > 0) {
      options.push(matchingWords[0])
      correctIndices.push(0)
    }
    while (options.length < 4 && otherWords.length > 0) {
      const randomWord =
        otherWords[Math.floor(Math.random() * otherWords.length)]
      if (!options.includes(randomWord)) {
        options.push(randomWord)
      }
    }
  } else {
    const numCorrect = Math.min(2, matchingWords.length)
    for (let i = 0; i < numCorrect; i++) {
      options.push(matchingWords[i])
      correctIndices.push(options.length - 1)
    }
    while (options.length < 4 && otherWords.length > 0) {
      const randomWord =
        otherWords[Math.floor(Math.random() * otherWords.length)]
      if (!options.includes(randomWord)) {
        options.push(randomWord)
      }
    }
  }

  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const oldCorrect = correctIndices.map((idx) => options[idx])
    ;[options[i], options[j]] = [options[j], options[i]]
    correctIndices.length = 0
    options.forEach((opt, idx) => {
      if (oldCorrect.includes(opt)) {
        correctIndices.push(idx)
      }
    })
  }

  return { target, options, correctIndices }
}

export function generateWordMatchQuestion(): {
  target: VocabularyItem
  options: VocabularyItem[]
  correctIndex: number
} {
  const vocabulary = getVocabulary()

  if (!vocabulary || vocabulary.length === 0) {
    throw new Error("Vocabulary data not loaded")
  }

  const target = selectWeightedRandom(vocabulary, "word-match")

  if (!target || !target.word) {
    throw new Error("Invalid vocabulary item selected")
  }

  const otherWords = vocabulary.filter((v) => v && v.id !== target.id)

  const options: VocabularyItem[] = [target]
  while (options.length < 4 && otherWords.length > 0) {
    const randomWord =
      otherWords[Math.floor(Math.random() * otherWords.length)]
    if (randomWord && !options.includes(randomWord)) {
      options.push(randomWord)
    }
  }

  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[options[i], options[j]] = [options[j], options[i]]
  }

  const correctIndex = options.findIndex((v) => v && v.id === target.id)

  return { target, options, correctIndex }
}

export function generatePictureMatchQuestion(): {
  target: VocabularyItem
  options: VocabularyItem[]
  correctIndex: number
} {
  const vocabulary = getVocabulary()

  if (!vocabulary || vocabulary.length === 0) {
    throw new Error("Vocabulary data not loaded")
  }

  const target = selectWeightedRandom(vocabulary, "picture-match")

  if (!target || !target.word) {
    throw new Error("Invalid vocabulary item selected")
  }

  const otherWords = vocabulary.filter((v) => v && v.id !== target.id)

  const options: VocabularyItem[] = [target]
  while (options.length < 4 && otherWords.length > 0) {
    const randomWord =
      otherWords[Math.floor(Math.random() * otherWords.length)]
    if (randomWord && !options.includes(randomWord)) {
      options.push(randomWord)
    }
  }

  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[options[i], options[j]] = [options[j], options[i]]
  }

  const correctIndex = options.findIndex((v) => v.id === target.id)

  return { target, options, correctIndex }
}

export function generateSightWordSplatterQuestion(
  difficulty: Difficulty = "easy"
): {
  target: VocabularyItem
  options: VocabularyItem[]
  correctIndex: number
  distractorCount: number
} {
  const vocabulary = getVocabulary()

  if (!vocabulary || vocabulary.length === 0) {
    throw new Error("Vocabulary data not loaded")
  }

  const target = selectWeightedRandom(vocabulary, "sight-word-splatter")

  if (!target || !target.word) {
    throw new Error("Invalid vocabulary item selected")
  }

  const configs: Record<Difficulty, number> = {
    easy: 4,
    medium: 6,
    hard: 8,
    expert: 10,
  }

  const distractorCount = configs[difficulty]
  const options: VocabularyItem[] = [target]
  const available = vocabulary.filter((v) => v && v.id !== target.id)

  while (options.length < distractorCount + 1 && available.length > 0) {
    const index = Math.floor(Math.random() * available.length)
    const [candidate] = available.splice(index, 1)
    if (candidate && !options.includes(candidate)) {
      options.push(candidate)
    }
  }

  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[options[i], options[j]] = [options[j], options[i]]
  }

  const correctIndex = options.findIndex((v) => v.id === target.id)

  return { target, options, correctIndex, distractorCount }
}

export function generateFaceMatchQuestion(
  difficulty: Difficulty = "easy"
): {
  target: Person
  options: string[]
  correctIndex: number
} | null {
  const people = getPeople()

  // Filter to only people with photos (not distractors)
  const peopleWithPhotos = people.filter((p) => p.imageUrl && !p.isDistractor)

  if (peopleWithPhotos.length === 0) {
    return null // No people with photos available
  }

  // Select target using weighted random based on mastery
  const target = selectWeightedRandom(peopleWithPhotos, "face-match")

  if (!target || !target.name) {
    return null
  }

  // Build options: correct name + distractors
  const options: string[] = [target.name]

  // Get other people's names (excluding target)
  const otherPeopleNames = people
    .filter((p) => p.id !== target.id)
    .map((p) => p.name)

  // Add other people's names as options first (unless expert/hard where we want typos/same-letter)
  if (difficulty === "easy" || difficulty === "medium") {
    const shuffledOtherNames = [...otherPeopleNames].sort(() => Math.random() - 0.5)
    for (const name of shuffledOtherNames) {
      if (options.length >= 4) break
      if (!options.includes(name)) {
        options.push(name)
      }
    }
  }

  // Fill remaining options with difficulty-based distractors
  if (options.length < 4) {
    const distractors = getRandomDistractors(
      4 - options.length,
      options, // Exclude names already in options
      { difficulty, targetName: target.name }
    )
    options.push(...distractors)
  }

  // Shuffle options
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[options[i], options[j]] = [options[j], options[i]]
  }

  const correctIndex = options.indexOf(target.name)

  return { target, options, correctIndex }
}

export function generateNameToFaceQuestion(): {
  targetName: string
  targetId: string
  options: Person[]
  correctIndex: number
} | null {
  const people = getPeople()

  // Filter to only people with photos (not distractors)
  const peopleWithPhotos = people.filter((p) => p.imageUrl && !p.isDistractor)

  if (peopleWithPhotos.length === 0) {
    return null // No people with photos available
  }

  // Select target using weighted random based on mastery
  const target = selectWeightedRandom(peopleWithPhotos, "name-to-face")

  if (!target || !target.name) {
    return null
  }

  // Build options: target person + other people with photos
  const options: Person[] = [target]

  // Get other people with photos (excluding target)
  const otherPeople = peopleWithPhotos.filter((p) => p.id !== target.id)

  // Shuffle and take up to 3 more
  const shuffledOthers = [...otherPeople].sort(() => Math.random() - 0.5)
  for (const person of shuffledOthers) {
    if (options.length >= 4) break
    options.push(person)
  }

  // Shuffle options
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[options[i], options[j]] = [options[j], options[i]]
  }

  const correctIndex = options.findIndex((p) => p.id === target.id)

  return { targetName: target.name, targetId: target.id, options, correctIndex }
}

// Hardcoded lists for soft/hard th differentiation
const SOFT_TH_WORDS = [
  "the", "this", "that", "they", "them", "there", "then", "than", "though",
  "other", "mother", "father", "brother", "weather", "together", "either",
  "neither", "feather", "leather", "breathe", "soothe", "bathe"
]

const HARD_TH_WORDS = [
  "think", "thank", "thanks", "three", "thing", "thumb", "thin", "thick",
  "through", "throw", "thread", "thermometer", "therapy", "theater", "theme",
  "theory", "thunder", "thirsty", "thirteen", "thirty", "thousand", "throat",
  "throne", "thrill", "thrive", "thump", "thursday"
]

export function getTodaysLetterOrDigraph(): { display: string; filter: string } {
  const dayOfMonth = new Date().getDate() // 1-31

  if (dayOfMonth <= 26) {
    // Days 1-26: A-Z
    const letterIndex = dayOfMonth - 1
    const letter = String.fromCharCode(97 + letterIndex)
    return { display: letter.toUpperCase(), filter: letter }
  }

  // Days 27-31: Digraphs
  const digraphs = [
    { display: "TH (soft)", filter: "th-soft" },  // day 27: this, that, they
    { display: "TH (hard)", filter: "th-hard" },  // day 28: think, thank, three
    { display: "SH", filter: "sh" },              // day 29: ship, shell, fish
    { display: "CH", filter: "ch" },              // day 30: chair, cheese
    { display: "PH", filter: "ph" },              // day 31: phone, photo
  ]
  return digraphs[dayOfMonth - 27] || digraphs[0]
}

export function getTodaysVocabulary(): VocabularyItem[] {
  const { filter } = getTodaysLetterOrDigraph()
  const vocabulary = getVocabulary()

  // Handle soft/hard th separately
  if (filter === "th-soft" || filter === "th-hard") {
    return vocabulary.filter((v) => {
      if (!v?.word) return false
      const word = v.word.toLowerCase()
      if (!word.startsWith("th")) return false

      if (filter === "th-soft") {
        return SOFT_TH_WORDS.includes(word)
      } else {
        return HARD_TH_WORDS.includes(word)
      }
    })
  }

  // Standard filtering for letters and other digraphs
  return vocabulary.filter((v) => {
    if (!v?.word) return false
    return v.word.toLowerCase().startsWith(filter)
  })
}

export function wordStartsWithTodaysLetter(word: string): boolean {
  const { filter } = getTodaysLetterOrDigraph()
  const normalizedWord = word.toLowerCase().trim()

  if (!normalizedWord) return false

  // Handle th variants
  if (filter === "th-soft" || filter === "th-hard") {
    return normalizedWord.startsWith("th")
  }

  return normalizedWord.startsWith(filter)
}
