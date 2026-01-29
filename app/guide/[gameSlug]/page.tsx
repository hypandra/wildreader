"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Target, Brain, Database, Code, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GAME_CONFIGS } from "@/lib/games"
import { MobileNav } from "@/components/MobileNav"
import type { GameType } from "@/types"

// Detailed game documentation
const GAME_DETAILS: Record<GameType, {
  overview: string
  uiElements: {
    question: string
    optionsCount: number
    optionsSource: string
  }
  correctBehavior: string[]
  incorrectBehavior: string[]
  dataSource: string
  masteryTracking: string
  implementation: string[]
}> = {
  "letter-match": {
    overview: "Child sees an uppercase letter and must identify the matching lowercase letter from 4 options.",
    uiElements: {
      question: "Large uppercase letter displayed at top (e.g., 'A')",
      optionsCount: 4,
      optionsSource: "4 lowercase letters: 1 correct match + 3 random distractors from alphabet"
    },
    correctBehavior: [
      "Green checkmark animation appears",
      "Letter card pulses with success animation",
      "Streak counter increments by 1",
      "Total stars increment by 1",
      "Mastery score for this letter pair increases",
      "New question loads after 1 second delay"
    ],
    incorrectBehavior: [
      "Red X animation appears on clicked card",
      "Card shakes with error animation",
      "Streak resets to 0",
      "No stars awarded",
      "Mastery score for this letter pair decreases",
      "Same question remains (child can try again)"
    ],
    dataSource: "All 26 letters loaded from lib/game-data.ts getLetters()",
    masteryTracking: "Letters with lower mastery scores are shown more frequently using weighted random selection",
    implementation: [
      "Game logic: lib/games.ts → generateLetterMatchQuestion()",
      "Selects random uppercase letter using selectWeightedRandom() based on mastery",
      "Generates 3 random lowercase distractors that don't match the target",
      "Shuffles options array so correct answer isn't always in same position",
      "Returns question object with target letter and 4 options"
    ]
  },
  "letter-hunt": {
    overview: "Child sees a target letter and must tap all instances of that letter in a 4x4 grid of mixed letters.",
    uiElements: {
      question: "Target letter shown at top with instruction 'Tap all the [X]s'",
      optionsCount: 16,
      optionsSource: "4x4 grid containing 4-6 instances of target letter + random filler letters"
    },
    correctBehavior: [
      "Tapped letter turns green and becomes disabled",
      "Correct tap sound/animation",
      "When ALL target letters are found:",
      "  - Success animation across entire grid",
      "  - Streak increments by 1",
      "  - Total stars increment by 1",
      "  - Mastery increases",
      "  - New question loads"
    ],
    incorrectBehavior: [
      "Tapped letter flashes red",
      "Letter remains clickable (not disabled)",
      "Shake animation on incorrect letter",
      "Streak resets to 0",
      "Game continues - child can keep trying",
      "Mastery decreases for this letter"
    ],
    dataSource: "All 26 letters from lib/game-data.ts getLetters()",
    masteryTracking: "Letters practiced less (lower mastery) appear as targets more often",
    implementation: [
      "Game logic: lib/games.ts → generateLetterHuntQuestion()",
      "Select target letter via weighted random",
      "Generate 4x4 grid with 4-6 instances of target letter",
      "Fill remaining slots with random letters (excluding target)",
      "Track which positions contain target letter",
      "Client tracks which have been tapped correctly"
    ]
  },
  "letter-to-picture": {
    overview: "Child sees a letter and must find a picture of something that starts with that letter's sound.",
    uiElements: {
      question: "Single letter displayed at top (e.g., 'B')",
      optionsCount: 4,
      optionsSource: "4 picture cards: 1 word starting with target letter + 3 random words"
    },
    correctBehavior: [
      "Green checkmark on selected picture",
      "Picture card enlarges with success animation",
      "Streak increments",
      "Stars increment",
      "Mastery increases for both letter AND word",
      "New question after 1s delay"
    ],
    incorrectBehavior: [
      "Red X on selected picture",
      "Picture shakes",
      "Streak resets to 0",
      "No stars",
      "Mastery decreases for letter",
      "Same question remains"
    ],
    dataSource: "Vocabulary words from lib/game-data.ts getVocabulary(). Each word has .word and .emoji properties",
    masteryTracking: "Letters with low mastery selected more often. Words are selected randomly from those starting with target letter",
    implementation: [
      "Game logic: lib/games.ts → generateLetterToPictureQuestion()",
      "Select target letter via weighted random",
      "Filter vocabulary to words starting with that letter",
      "Select 1 correct word from filtered list",
      "Select 3 random distractor words (not starting with target letter)",
      "Shuffle and return as picture options"
    ]
  },
  "picture-to-letter": {
    overview: "Child sees a picture and must identify which letter the word starts with.",
    uiElements: {
      question: "Single picture (emoji) displayed at top with word label",
      optionsCount: 4,
      optionsSource: "4 letter cards: correct first letter + 3 random letters"
    },
    correctBehavior: [
      "Green checkmark on selected letter",
      "Letter card pulses",
      "Streak increments",
      "Stars increment",
      "Mastery increases for word and letter",
      "New question after 1s"
    ],
    incorrectBehavior: [
      "Red X on selected letter",
      "Letter shakes",
      "Streak resets",
      "No stars",
      "Mastery decreases for word",
      "Same question remains"
    ],
    dataSource: "Vocabulary words from lib/game-data.ts getVocabulary()",
    masteryTracking: "Words with lower mastery scores are selected more frequently as targets",
    implementation: [
      "Game logic: lib/games.ts → generatePictureToLetterQuestion()",
      "Select target word via weighted random based on mastery",
      "Get first letter of word as correct answer",
      "Generate 3 random letter distractors",
      "Shuffle options",
      "Return with word emoji and label"
    ]
  },
  "starts-with": {
    overview: "Child sees a target word and must find other words that start with the same sound.",
    uiElements: {
      question: "Target word shown at top with emoji",
      optionsCount: 4,
      optionsSource: "4 words: 1 starting with same letter + 3 starting with different letters"
    },
    correctBehavior: [
      "Green checkmark on selected word",
      "Word card enlarges",
      "Streak increments",
      "Stars increment",
      "Mastery increases for both words",
      "New question after 1s"
    ],
    incorrectBehavior: [
      "Red X on selected word",
      "Word shakes",
      "Streak resets",
      "No stars",
      "Mastery decreases for both words",
      "Same question remains"
    ],
    dataSource: "Vocabulary words from lib/game-data.ts getVocabulary()",
    masteryTracking: "Target words selected via weighted random. Option words selected randomly from filtered lists",
    implementation: [
      "Game logic: lib/games.ts → generateStartsWithQuestion()",
      "Select target word via weighted random",
      "Get first letter of target word",
      "Filter vocabulary for words starting with same letter (excluding target)",
      "Select 1 matching word",
      "Select 3 words starting with different letters",
      "Shuffle and return"
    ]
  },
  "ends-with": {
    overview: "Child sees a target word and must find other words that end with the same sound.",
    uiElements: {
      question: "Target word shown at top with emoji",
      optionsCount: 4,
      optionsSource: "4 words: 1 ending with same letter + 3 ending with different letters"
    },
    correctBehavior: [
      "Green checkmark on selected word",
      "Word card enlarges",
      "Streak increments",
      "Stars increment",
      "Mastery increases for both words",
      "New question after 1s"
    ],
    incorrectBehavior: [
      "Red X on selected word",
      "Word shakes",
      "Streak resets",
      "No stars",
      "Mastery decreases",
      "Same question remains"
    ],
    dataSource: "Vocabulary words from lib/game-data.ts getVocabulary()",
    masteryTracking: "Target words with lower mastery appear more frequently",
    implementation: [
      "Game logic: lib/games.ts → generateEndsWithQuestion()",
      "Select target word via weighted random",
      "Get last letter of target word",
      "Filter vocabulary for words ending with same letter (excluding target)",
      "Select 1 matching word",
      "Select 3 words ending with different letters",
      "Shuffle and return"
    ]
  },
  "word-match": {
    overview: "Child sees a written word and must find the matching picture.",
    uiElements: {
      question: "Written word displayed at top (text only, no emoji)",
      optionsCount: 4,
      optionsSource: "4 picture cards: correct emoji + 3 random word emojis"
    },
    correctBehavior: [
      "Green checkmark on selected picture",
      "Picture enlarges",
      "Streak increments",
      "Stars increment",
      "Mastery increases for word",
      "New question after 1s"
    ],
    incorrectBehavior: [
      "Red X on selected picture",
      "Picture shakes",
      "Streak resets",
      "No stars",
      "Mastery decreases",
      "Same question remains"
    ],
    dataSource: "Vocabulary words from lib/game-data.ts getVocabulary()",
    masteryTracking: "Words with lower mastery scores selected more often as targets",
    implementation: [
      "Game logic: lib/games.ts → generateWordMatchQuestion()",
      "Select target word via weighted random",
      "Use target word's emoji as correct answer",
      "Select 3 random distractor words for their emojis",
      "Shuffle emoji options",
      "Return with word text and emoji options"
    ]
  },
  "picture-match": {
    overview: "Child sees a picture and must find the matching written word.",
    uiElements: {
      question: "Single emoji displayed at top (no word label)",
      optionsCount: 4,
      optionsSource: "4 word cards: correct word + 3 random words"
    },
    correctBehavior: [
      "Green checkmark on selected word",
      "Word card pulses",
      "Streak increments",
      "Stars increment",
      "Mastery increases",
      "New question after 1s"
    ],
    incorrectBehavior: [
      "Red X on selected word",
      "Word shakes",
      "Streak resets",
      "No stars",
      "Mastery decreases",
      "Same question remains"
    ],
    dataSource: "Vocabulary words from lib/game-data.ts getVocabulary()",
    masteryTracking: "Words with lower mastery appear as targets more frequently",
    implementation: [
      "Game logic: lib/games.ts → generatePictureMatchQuestion()",
      "Select target word via weighted random",
      "Use target emoji as question image",
      "Use target word as correct text answer",
      "Select 3 random distractor words",
      "Shuffle word options",
      "Return with emoji and word options"
    ]
  },
  "face-match": {
    overview: "Child sees a photo of a person they know and must identify who it is from name options.",
    uiElements: {
      question: "Photo of a person displayed at top",
      optionsCount: 4,
      optionsSource: "4 name buttons: correct name + 3 distractor names (from other people or static list)"
    },
    correctBehavior: [
      "Green checkmark on selected name",
      "Name button pulses with success animation",
      "Streak increments",
      "Stars increment",
      "Mastery increases for this person",
      "New question after 1s"
    ],
    incorrectBehavior: [
      "Red X on selected name",
      "Name button shakes",
      "Streak resets",
      "No stars",
      "Mastery decreases for this person",
      "New question loads"
    ],
    dataSource: "People from lib/game-data.ts getPeople() - photos stored in Supabase Storage (private)",
    masteryTracking: "People with lower mastery appear as targets more frequently using weighted random selection",
    implementation: [
      "Game logic: lib/games.ts → generateFaceMatchQuestion()",
      "Select target person via weighted random based on mastery",
      "Use signed URL for private photo from Supabase Storage",
      "Build options from other people's names + static distractor names",
      "Shuffle name options",
      "Returns null if no people with photos (redirects to setup)"
    ]
  },
  "name-to-face": {
    overview: "Child sees a person's name and must find the matching face from photo options. Reverse of face-match game.",
    uiElements: {
      question: "Name displayed prominently at top",
      optionsCount: 4,
      optionsSource: "4 photo buttons: correct person's photo + 3 other people's photos"
    },
    correctBehavior: [
      "Green border on selected photo",
      "Photo pulses with success animation",
      "Audio: 'Yes, [name]!'",
      "Streak increments",
      "Stars increment",
      "Mastery increases for this person",
      "New question after 1.5s"
    ],
    incorrectBehavior: [
      "Red border on selected photo",
      "Photo shakes",
      "Audio: 'That's [wrong name], look for [correct name]'",
      "Streak resets",
      "No stars",
      "Mastery decreases for this person",
      "Same question remains (can try again)"
    ],
    dataSource: "People from lib/game-data.ts getPeople() - photos stored in Supabase Storage (private)",
    masteryTracking: "People with lower mastery appear as targets more frequently using weighted random selection",
    implementation: [
      "Game logic: lib/games.ts → generateNameToFaceQuestion()",
      "Select target person via weighted random based on mastery",
      "Use signed URLs for private photos from Supabase Storage",
      "Build photo options from other people with photos",
      "Shuffle photo options",
      "Returns null if no people with photos (redirects to setup)"
    ]
  },
  "todays-sound": {
    overview: "Collaborative brainstorming game where kids (with parents) think of words starting with today's letter or digraph. Day of month determines the sound: days 1-26 are A-Z, days 27-31 are digraphs (th soft, th hard, sh, ch, ph).",
    uiElements: {
      question: "Today's letter/digraph displayed prominently with example words",
      optionsCount: 0,
      optionsSource: "User types words into an input field - no pre-set options"
    },
    correctBehavior: [
      "Word added to list if it starts with today's letter",
      "No streak tracking for this game",
      "On submit, shows which words match vocabulary",
      "Compares to previous attempts (earlier today, last month)",
      "Shows full vocabulary list for discovery"
    ],
    incorrectBehavior: [
      "Error message if word doesn't start with today's letter",
      "User can remove and re-enter words",
      "No penalties - purely exploratory",
      "Words not in vocabulary still count as 'entered'"
    ],
    dataSource: "Vocabulary filtered by today's letter from lib/games.ts getTodaysVocabulary(). Attempts saved to wr_todays_sound_attempts table.",
    masteryTracking: "No mastery tracking - this is an exploratory activity. Progress tracked via saved attempts for comparison over time.",
    implementation: [
      "Helper functions: lib/games.ts → getTodaysLetterOrDigraph(), getTodaysVocabulary(), wordStartsWithTodaysLetter()",
      "Database: lib/db/todays-sound.ts for saving/loading attempts",
      "Three phases: intro → brainstorm → results",
      "Day 1-26: Letters A-Z based on day of month",
      "Day 27-31: Digraphs (th-soft, th-hard, sh, ch, ph)",
      "Soft/hard th differentiated via hardcoded word lists"
    ]
  },
  "freeplay-canvas": {
    overview: "Open-ended creative drawing canvas where children can freely express themselves. No right or wrong answers - purely for creative exploration and motor skill development.",
    uiElements: {
      question: "Blank canvas with drawing tools",
      optionsCount: 0,
      optionsSource: "Color palette and brush size options"
    },
    correctBehavior: [
      "No correct/incorrect - freeform creativity",
      "Drawing appears on canvas in real-time",
      "Can change colors and brush sizes",
      "Option to save or clear canvas"
    ],
    incorrectBehavior: [
      "No incorrect behavior - all actions are valid",
      "Undo available for accidental marks"
    ],
    dataSource: "No external data - purely local canvas state",
    masteryTracking: "No mastery tracking - this is a creative activity",
    implementation: [
      "Canvas element with touch/mouse event handlers",
      "Color palette selection",
      "Brush size controls",
      "Clear and save functionality"
    ]
  },
  "sight-word-splatter": {
    overview: "Full-screen immersive game where child hears a sight word spoken aloud and must click the matching word to make it 'splat' with a colorful explosion animation. Highly engaging with dramatic visual feedback for correct answers.",
    uiElements: {
      question: "Target word displayed at top with 'Hear again' button for audio replay",
      optionsCount: 5,
      optionsSource: "Difficulty-based distractor count: easy=4, medium=6, hard=8, expert=10 word buttons"
    },
    correctBehavior: [
      "Explosive particle animation with emojis flying across screen",
      "Screen shake effect for dramatic impact",
      "Button pops with celebration animation",
      "Streak increments (reward at 5 correct)",
      "Stars increment",
      "Mastery increases for word",
      "New question after 1.2s"
    ],
    incorrectBehavior: [
      "Button shakes with error animation",
      "Audio: 'Sorry. That word is [clicked]. Please click [target] to make it splat.'",
      "No streak reset until question completes",
      "Child can try again on same question",
      "Mastery tracked based on whether mistakes were made"
    ],
    dataSource: "Vocabulary words from lib/game-data.ts getVocabulary()",
    masteryTracking: "Words with lower mastery scores selected more often as targets via weighted random selection",
    implementation: [
      "Game logic: lib/games.ts → generateSightWordSplatterQuestion(difficulty)",
      "Select target word via weighted random based on mastery",
      "Generate difficulty-based number of distractor words",
      "Shuffle options and return with correct index",
      "Full-screen layout with custom CSS animations for explosions",
      "Streak target is 5 (higher than default 3) for more challenge"
    ]
  }
}

export default function GameDetailPage() {
  const params = useParams()
  const gameSlug = params.gameSlug as string

  const config = GAME_CONFIGS[gameSlug as GameType]
  const details = GAME_DETAILS[gameSlug as GameType]

  if (!config || !details) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-display font-bold text-bark mb-4">Game not found</h1>
          <Link href="/guide">
            <Button>Back to Guide</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative">
      {/* Mobile navigation bar */}
      <MobileNav />

      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[10%] right-[5%] text-3xl animate-float-slow opacity-30">{config.emoji}</div>
        <div className="absolute bottom-[20%] left-[3%] text-2xl animate-twinkle delay-400 opacity-25">✨</div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8 pt-16 sm:pt-8">
        {/* Header */}
        <header className="mb-8 animate-slide-up">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/guide">
              <Button
                variant="ghost"
                size="icon"
                className="h-12 w-12 rounded-2xl hover:bg-coral/10 hover:text-coral transition-all duration-200"
              >
                <ArrowLeft className="h-6 w-6" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="text-5xl">{config.emoji}</div>
              <div>
                <h1 className="text-3xl md:text-4xl font-display font-bold text-bark">
                  {config.name}
                </h1>
                <p className="text-lg text-muted-foreground">{config.description}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Overview */}
        <section className="mb-8">
          <div className="bg-gradient-to-r from-lavender/10 via-sage/5 to-sky/10 rounded-3xl border-2 border-border shadow-soft p-6">
            <h2 className="text-2xl font-display font-bold text-bark mb-3 flex items-center gap-2">
              <Target className="h-6 w-6 text-lavender" />
              Overview
            </h2>
            <p className="text-lg text-bark leading-relaxed">{details.overview}</p>
          </div>
        </section>

        {/* UI Elements */}
        <section className="mb-8">
          <div className="bg-card/80 backdrop-blur-sm rounded-3xl border-2 border-border shadow-soft p-6">
            <h2 className="text-2xl font-display font-bold text-bark mb-4 flex items-center gap-2">
              <Code className="h-6 w-6 text-sky" />
              UI Elements
            </h2>
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-bark mb-1">Question Display:</h3>
                <p className="text-bark bg-sky/5 px-4 py-2 rounded-xl border border-sky/20">
                  {details.uiElements.question}
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-bark mb-1">Number of Options:</h3>
                <p className="text-bark bg-sky/5 px-4 py-2 rounded-xl border border-sky/20">
                  {details.uiElements.optionsCount} clickable options
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-bark mb-1">Options Source:</h3>
                <p className="text-bark bg-sky/5 px-4 py-2 rounded-xl border border-sky/20">
                  {details.uiElements.optionsSource}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Behavior sections in grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Correct Answer */}
          <div className="bg-card/80 backdrop-blur-sm rounded-3xl border-2 border-sage/30 shadow-soft p-6">
            <h2 className="text-xl font-display font-bold text-bark mb-4 flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-sage" />
              When Answer is Correct
            </h2>
            <ul className="space-y-2">
              {details.correctBehavior.map((item, i) => (
                <li key={i} className="flex gap-2 text-bark">
                  <span className="text-sage font-bold">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Incorrect Answer */}
          <div className="bg-card/80 backdrop-blur-sm rounded-3xl border-2 border-coral/30 shadow-soft p-6">
            <h2 className="text-xl font-display font-bold text-bark mb-4 flex items-center gap-2">
              <XCircle className="h-6 w-6 text-coral" />
              When Answer is Incorrect
            </h2>
            <ul className="space-y-2">
              {details.incorrectBehavior.map((item, i) => (
                <li key={i} className="flex gap-2 text-bark">
                  <span className="text-coral font-bold">✗</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Data & Mastery */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Data Source */}
          <div className="bg-card/80 backdrop-blur-sm rounded-3xl border-2 border-border shadow-soft p-6">
            <h2 className="text-xl font-display font-bold text-bark mb-3 flex items-center gap-2">
              <Database className="h-5 w-5 text-lavender" />
              Data Source
            </h2>
            <p className="text-bark leading-relaxed">{details.dataSource}</p>
          </div>

          {/* Mastery Tracking */}
          <div className="bg-card/80 backdrop-blur-sm rounded-3xl border-2 border-border shadow-soft p-6">
            <h2 className="text-xl font-display font-bold text-bark mb-3 flex items-center gap-2">
              <Brain className="h-5 w-5 text-coral" />
              Mastery Tracking
            </h2>
            <p className="text-bark leading-relaxed">{details.masteryTracking}</p>
          </div>
        </div>

        {/* Technical Implementation */}
        <section className="mb-8">
          <div className="bg-card/80 backdrop-blur-sm rounded-3xl border-2 border-border shadow-soft p-6">
            <h2 className="text-2xl font-display font-bold text-bark mb-4 flex items-center gap-2">
              <Code className="h-6 w-6 text-sky" />
              Technical Implementation
            </h2>
            <div className="space-y-2">
              {details.implementation.map((item, i) => (
                <div key={i} className="text-bark">
                  {item.includes("→") ? (
                    <code className="bg-bark/5 px-3 py-1 rounded text-sm font-mono block">
                      {item}
                    </code>
                  ) : (
                    <p className="leading-relaxed">{item}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="flex gap-4">
          <Link href="/guide" className="flex-1">
            <Button variant="outline" className="w-full h-12 rounded-xl font-semibold">
              Back to Guide
            </Button>
          </Link>
          <Link href={`/game/${gameSlug}`} className="flex-1">
            <Button className="w-full h-12 rounded-xl font-semibold bg-gradient-to-r from-coral to-rose-500 text-white">
              Play This Game
            </Button>
          </Link>
        </footer>
      </div>
    </div>
  )
}
