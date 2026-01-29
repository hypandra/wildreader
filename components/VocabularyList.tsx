import Link from "next/link"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface VocabularyListProps {
  words: string[]
}

// Simple part-of-speech categorization for common words
const NOUNS = new Set([
  "apple", "ball", "bat", "bear", "bed", "bird", "boat", "book", "box", "boy", "bug",
  "cake", "cap", "car", "cat", "chair", "cow", "cup", "dog", "door", "duck", "egg",
  "farm", "fish", "flower", "flowers", "fox", "frog", "gate", "girl", "goat", "hat",
  "hen", "hill", "horse", "house", "ice", "jar", "jet", "jug", "kite", "lamb", "leaf",
  "lion", "man", "moon", "nest", "net", "owl", "pan", "pen", "pig", "rain", "rat",
  "ring", "road", "rock", "roof", "rope", "rose", "rug", "sack", "seal", "seed", "ship",
  "shop", "sock", "star", "sun", "tent", "toad", "tree", "van", "vest", "web", "well",
  "wolf", "yard", "zoo", "monster", "picture", "day", "night", "sky", "water", "fire"
])

const VERBS = new Set([
  "run", "jump", "play", "eat", "eating", "sleep", "walk", "talk", "look", "see", "hear",
  "go", "come", "sit", "stand", "fly", "swim", "climb", "read", "write", "draw", "sing",
  "dance", "kick", "throw", "catch", "ride", "drive", "build", "break", "open", "close",
  "push", "pull", "cut", "cook", "wash", "clean", "help", "work", "rest", "wait", "watch",
  "laugh", "cry", "smile", "love", "like", "want", "need", "make", "take", "give", "get"
])

const ADJECTIVES = new Set([
  "big", "small", "little", "tall", "short", "long", "wide", "thin", "fat", "heavy",
  "light", "hot", "cold", "warm", "cool", "wet", "dry", "clean", "dirty", "old", "new",
  "young", "happy", "sad", "angry", "scary", "brave", "kind", "mean", "good", "bad",
  "nice", "pretty", "ugly", "beautiful", "fast", "slow", "loud", "quiet", "soft", "hard",
  "bright", "dark", "red", "blue", "green", "yellow", "black", "white", "brown", "orange",
  "purple", "pink", "gray", "colorful", "shiny", "fuzzy", "smooth", "rough", "sharp", "dull"
])

const FUNCTION_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "with", "on", "in", "at", "to", "for", "of",
  "from", "by", "about", "as", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "should", "could",
  "can", "may", "might", "must", "shall", "my", "your", "his", "her", "its", "our", "their"
])

function getWordCategory(word: string): "noun" | "verb" | "adjective" | "function" | "other" {
  const lower = word.toLowerCase()
  if (NOUNS.has(lower)) return "noun"
  if (VERBS.has(lower)) return "verb"
  if (ADJECTIVES.has(lower)) return "adjective"
  if (FUNCTION_WORDS.has(lower)) return "function"
  return "other"
}

function getCategoryColor(category: "noun" | "verb" | "adjective" | "function" | "other"): string {
  switch (category) {
    case "noun":
      return "from-sky/20 to-blue-100 text-blue-900" // Blue - objects/things
    case "verb":
      return "from-coral/20 to-rose-100 text-rose-900" // Coral - actions
    case "adjective":
      return "from-sage/20 to-emerald-100 text-emerald-900" // Green - descriptions
    case "function":
      return "from-amber/20 to-yellow-100 text-yellow-900" // Yellow - structure words
    default:
      return "from-lavender/20 to-purple-100 text-purple-900" // Purple - unknown
  }
}

export function VocabularyList({ words }: VocabularyListProps) {
  if (words.length === 0) {
    return (
      <div className="bg-card/80 backdrop-blur-sm rounded-3xl border-2 border-border shadow-soft p-12 text-center animate-pop-in">
        <div className="text-6xl mb-4">📖</div>
        <p className="text-xl text-muted-foreground font-medium mb-2">
          No vocabulary words yet!
        </p>
        <p className="text-muted-foreground">
          Play games and earn rewards to build your vocabulary list.
        </p>
        <Link href="/" className="inline-block mt-6">
          <Button className="h-12 px-6 rounded-xl font-semibold bg-gradient-to-r from-sunshine to-amber-400 text-bark hover:shadow-md">
            Start Playing
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="mb-4 space-y-2">
        <p className="text-lg font-semibold text-muted-foreground">
          {words.length} unique words from picture descriptions
        </p>
        <p className="text-sm text-muted-foreground">
          These are the words your child used when creating AI pictures
        </p>
        <div className="flex flex-wrap items-center gap-3 text-sm mt-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gradient-to-br from-sky/20 to-blue-100" />
            <span className="text-muted-foreground">Nouns</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gradient-to-br from-coral/20 to-rose-100" />
            <span className="text-muted-foreground">Verbs</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gradient-to-br from-sage/20 to-emerald-100" />
            <span className="text-muted-foreground">Adjectives</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gradient-to-br from-amber/20 to-yellow-100" />
            <span className="text-muted-foreground">Function words</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gradient-to-br from-lavender/20 to-purple-100" />
            <span className="text-muted-foreground">Other</span>
          </div>
        </div>
      </div>
      <div className="bg-card/80 backdrop-blur-sm rounded-3xl border-2 border-border shadow-soft p-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {words.map((word, i) => {
            const category = getWordCategory(word)
            return (
              <div
                key={i}
                className={cn(
                  "px-4 py-3 rounded-2xl text-center font-semibold text-base",
                  "bg-gradient-to-br shadow-sm",
                  "transition-transform duration-200 hover:scale-105",
                  "animate-pop-in",
                  getCategoryColor(category)
                )}
                style={{ animationDelay: `${i * 0.02}s` }}
                title={`${word} (${category})`}
              >
                {word}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
