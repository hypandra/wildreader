import type { StorySegmentDraft } from "@/lib/wr/segmenter"

export interface GeneratedQuestion {
  questionText: string
  correctAnswer: string
  distractors: [string, string]
}

export interface QuizQuestionWithChoices {
  questionText: string
  correctAnswer: string
  answerA: string
  answerB: string
  answerC: string
}

const DEFAULT_MIN_QUESTIONS = 4
const DEFAULT_MAX_QUESTIONS = 6

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function normalizeQuestion(raw: GeneratedQuestion): GeneratedQuestion | null {
  const questionText = raw?.questionText?.trim()
  const correctAnswer = raw?.correctAnswer?.trim()
  const distractors = Array.isArray(raw?.distractors) ? raw.distractors : []
  const cleanedDistractors = distractors.map((d) => String(d).trim()).filter(Boolean)

  if (!questionText || !correctAnswer || cleanedDistractors.length < 2) {
    return null
  }

  return {
    questionText,
    correctAnswer,
    distractors: [cleanedDistractors[0], cleanedDistractors[1]],
  }
}

function formatQuestionPrompt(storyText: string, minQuestions: number, maxQuestions: number) {
  return `You are writing comprehension questions for a children's audiobook.\n\nRules:\n- Write ${minQuestions}-${maxQuestions} questions.\n- Each question must be multiple-choice with exactly 1 correct answer and 2 plausible distractors.\n- Keep language simple and kid-friendly.\n- Do NOT reveal the answer in the question.\n- Return JSON only (no markdown).\n\nReturn JSON array with objects shaped like:\n[{"questionText":"...","correctAnswer":"...","distractors":["...","..."]}]\n\nStory:\n${storyText}`
}

async function fetchQuestionsFromOpenRouter(
  storyText: string,
  minQuestions: number,
  maxQuestions: number
): Promise<GeneratedQuestion[]> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY not configured")
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "anthropic/claude-3-haiku",
      messages: [
        { role: "system", content: "You create safe, kid-friendly comprehension questions." },
        { role: "user", content: formatQuestionPrompt(storyText, minQuestions, maxQuestions) },
      ],
      max_tokens: 700,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenRouter error: ${response.status} ${errorText}`)
  }

  const data = await response.json()
  const content = data?.choices?.[0]?.message?.content
  const rawText = typeof content === "string" ? content : Array.isArray(content)
    ? content.map((part: any) => part?.text || "").join(" ")
    : ""

  const jsonMatch = rawText.match(/\[[\s\S]*\]/)
  if (!jsonMatch) {
    throw new Error("OpenRouter response missing JSON array")
  }

  const parsed = JSON.parse(jsonMatch[0])
  if (!Array.isArray(parsed)) {
    throw new Error("OpenRouter response not an array")
  }

  return parsed
    .map((item) => normalizeQuestion(item))
    .filter(Boolean) as GeneratedQuestion[]
}

function buildFallbackQuestions(storyText: string, targetCount: number): GeneratedQuestion[] {
  const safeTitle = storyText.split(/\n|\./)[0]?.slice(0, 80).trim() || "the story"
  const fallback: GeneratedQuestion[] = []
  const prompts: GeneratedQuestion[] = [
    {
      questionText: `What is this story mostly about?`,
      correctAnswer: safeTitle,
      distractors: ["A math puzzle", "A weather report"],
    },
    {
      questionText: "How does the story make you feel?",
      correctAnswer: "Curious",
      distractors: ["Confused", "Bored"],
    },
    {
      questionText: "What should you do after hearing the story?",
      correctAnswer: "Think about what happened",
      distractors: ["Forget it", "Yell loudly"],
    },
    {
      questionText: "Why did the characters keep going?",
      correctAnswer: "They wanted to finish their adventure",
      distractors: ["They were lost", "They were asleep"],
    },
    {
      questionText: "What is one good lesson from the story?",
      correctAnswer: "Be kind and keep trying",
      distractors: ["Give up quickly", "Never listen"],
    },
  ]

  for (const prompt of prompts) {
    if (fallback.length >= targetCount) break
    fallback.push(prompt)
  }

  return fallback
}

export async function generateQuestions(params: {
  storyText: string
  segments: StorySegmentDraft[]
  minQuestions?: number
  maxQuestions?: number
}): Promise<GeneratedQuestion[]> {
  const maxQuestions = params.maxQuestions ?? DEFAULT_MAX_QUESTIONS
  const maxPossible = Math.min(maxQuestions, params.segments.length)
  const minQuestions = Math.min(params.minQuestions ?? DEFAULT_MIN_QUESTIONS, maxPossible || 1)
  const adjustedMax = Math.max(minQuestions, maxPossible)
  const targetCount = Math.max(1, adjustedMax)

  const clippedStory = params.storyText.slice(0, 6000)

  try {
    const questions = await fetchQuestionsFromOpenRouter(clippedStory, minQuestions, adjustedMax)
    if (questions.length >= minQuestions) {
      return questions.slice(0, targetCount)
    }
  } catch (error) {
    console.warn("Question generation failed, using fallback:", error)
  }

  return buildFallbackQuestions(clippedStory, targetCount)
}

export function applyAnswerShuffle(question: GeneratedQuestion): QuizQuestionWithChoices {
  const choices = shuffle([question.correctAnswer, ...question.distractors])

  return {
    questionText: question.questionText,
    correctAnswer: question.correctAnswer,
    answerA: choices[0],
    answerB: choices[1],
    answerC: choices[2],
  }
}
