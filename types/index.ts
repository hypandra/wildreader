export type GameType =
  | "letter-match"
  | "letter-hunt"
  | "letter-to-picture"
  | "picture-to-letter"
  | "starts-with"
  | "ends-with"
  | "word-match"
  | "picture-match"
  | "face-match"
  | "name-to-face"
  | "todays-sound"
  | "sight-word-splatter"
  | "freeplay-canvas"

export type Difficulty = "easy" | "medium" | "hard" | "expert"

export type DifficultyByGame = Partial<Record<GameType, Difficulty>>

export interface MasteryData {
  attempts: number
  correct: number
}

export interface VocabularyItem {
  id: string // UUID from Supabase
  word: string
  emoji: string
  mastery: Record<GameType, MasteryData>
}

export interface Letter {
  id: string // UUID from Supabase
  letter: string
  lowercase: string
  exampleWord: string
  exampleEmoji: string
  mastery: Record<GameType, MasteryData>
}

export interface SessionState {
  currentGame: GameType | null
  streak: number
  totalStars: number
  difficultyByGame?: DifficultyByGame
}

export interface RewardInstance {
  id: string
  date: string
  time: string
  transcript: string
  words: string[]
  imageUrl: string
  gameContext: {
    game: GameType
    streak: number
  }
}

export interface GameConfig {
  slug: GameType
  name: string
  description: string
  emoji: string
}

export interface ChildProfile {
  id: string
  user_id: string
  name: string
  avatar_emoji: string
  date_of_birth?: string | null
  created_at: string
  is_active: boolean
}

export interface Person {
  id: string
  name: string
  imagePath?: string | null
  imageUrl?: string // Signed URL from Supabase Storage
  isDistractor: boolean
  mastery: Record<GameType, MasteryData>
}

export interface Face {
  id: string
  name: string
  imagePath?: string | null
  imageUrl?: string
}

export * from "./audio-quizzes"
