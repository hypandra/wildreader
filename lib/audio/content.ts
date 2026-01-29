/**
 * Content definitions for pre-generated TTS audio
 */

// Game instruction templates (for pre-generation reference)
export const GAME_INSTRUCTION_TEMPLATES = [
  "Find the lowercase letter",
  "Tap all the letters",
  "Which picture starts with",
  "Which letter does start with",
  "Find the words that start like",
  "Find the words that end like",
  "Find the picture for",
  "Find the word for this picture",
  "Who is this person",
  "How many words can you think of",
]

// Encouragement phrases for correct answers
export const CORRECT_PHRASES = [
  "Great job!",
  "You got it!",
  "Excellent!",
  "Perfect!",
  "Way to go!",
  "Awesome!",
  "You're doing great!",
  "Nice work!",
  "That's right!",
  "Wonderful!",
]

// Neutral redirect phrases for incorrect answers
export const INCORRECT_PHRASES = ["No", "Not quite", "Incorrect"]

// Hint templates for wrong answers
export const HINT_TEMPLATES = [
  "Look for the same shape, just smaller",
  "Keep looking! Some letters look similar",
  "Think about the sound this letter makes",
  "Listen to the first sound in the word",
  "Listen to the beginning sound",
  "Listen to the ending sound",
  "Say the word for the picture out loud",
  "Think about what this word means",
  "Look at their face carefully",
  "Try again! You can do it",
]

// All content to pre-generate
export function getAllPreGenerateContent(): {
  text: string
  speed: number
}[] {
  const content: { text: string; speed: number }[] = []

  // Letters (a-z, A-Z)
  for (const letter of "abcdefghijklmnopqrstuvwxyz") {
    content.push({ text: letter, speed: 1.0 })
    content.push({ text: letter.toUpperCase(), speed: 1.0 })
  }

  // Game instruction templates
  for (const template of GAME_INSTRUCTION_TEMPLATES) {
    content.push({ text: template, speed: 1.0 })
  }

  // Feedback phrases
  for (const phrase of CORRECT_PHRASES) {
    content.push({ text: phrase, speed: 1.0 })
  }
  for (const phrase of INCORRECT_PHRASES) {
    content.push({ text: phrase, speed: 1.0 })
  }

  // Hint templates (slower speed for emphasis)
  for (const hint of HINT_TEMPLATES) {
    content.push({ text: hint, speed: 0.85 })
  }

  return content
}
