import type { SupabaseClient } from "@supabase/supabase-js"
import { segmentStory } from "@/lib/wr/segmenter"
import { checksumForText } from "@/lib/wr/checksum"
import { applyAnswerShuffle, generateQuestions, type QuizQuestionWithChoices } from "@/lib/wr/questions"
import { checksumForTTS, synthesizeClip, type TTSProvider } from "@/lib/wr/tts"
import type { TTSVoice } from "@/lib/audio/generate"
import { getTTSModel } from "@/lib/audio/generate"

const MAX_STORY_CHARS = 8000
const MAX_SEGMENTS = 80
const MAX_QUESTIONS = 6

export async function ensureStorySegments(
  supabase: SupabaseClient,
  storySourceId: string
) {
  const { data: existing, error: existingError } = await supabase
    .from("wr_story_segments")
    .select("id, segment_index, segment_text, pause_ms, checksum")
    .eq("story_source_id", storySourceId)
    .order("segment_index")

  if (existingError) {
    throw existingError
  }

  if (existing && existing.length > 0) {
    return existing
  }

  const { data: source, error: sourceError } = await supabase
    .from("wr_story_sources")
    .select("source_text")
    .eq("id", storySourceId)
    .single()

  if (sourceError) {
    throw sourceError
  }

  const storyText = (source?.source_text ?? "").slice(0, MAX_STORY_CHARS)
  const segmentsDraft = segmentStory(storyText)
    .slice(0, MAX_SEGMENTS)

  const insertRows = segmentsDraft.map((segment, index) => ({
    story_source_id: storySourceId,
    segment_index: index,
    segment_text: segment.segmentText,
    pause_ms: segment.pauseMs,
    checksum: checksumForText(segment.segmentText),
  }))

  if (insertRows.length === 0) {
    return []
  }

  const { data: inserted, error: insertError } = await supabase
    .from("wr_story_segments")
    .upsert(insertRows, { onConflict: "story_source_id,segment_index" })
    .select("id, segment_index, segment_text, pause_ms, checksum")
    .order("segment_index")

  if (insertError) {
    throw insertError
  }

  return inserted || []
}

export async function createQuiz(
  supabase: SupabaseClient,
  params: { userId: string; storySourceId: string; title: string; provider: string; voice: string }
) {
  const { data, error } = await supabase
    .from("wr_audio_quizzes")
    .insert({
      user_id: params.userId,
      story_source_id: params.storySourceId,
      title: params.title,
      provider: params.provider,
      voice: params.voice,
      status: "generating",
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function insertQuestions(
  supabase: SupabaseClient,
  quizId: string,
  questions: QuizQuestionWithChoices[]
) {
  const rows = questions.map((question, index) => ({
    quiz_id: quizId,
    order_index: index,
    question_text: question.questionText,
    correct_answer: question.correctAnswer,
    answer_a: question.answerA,
    answer_b: question.answerB,
    answer_c: question.answerC,
  }))

  if (rows.length === 0) {
    return []
  }

  const { data, error } = await supabase
    .from("wr_audio_quiz_questions")
    .insert(rows)
    .select("id, order_index, question_text, answer_a, answer_b, answer_c")
    .order("order_index")

  if (error) {
    throw error
  }

  return data || []
}

export function buildTimelineItems(params: {
  segmentIds: { id: string; pause_ms: number }[]
  questionIds: { id: string }[]
}) {
  const timeline: {
    order_index: number
    item_type: "story_segment" | "question"
    item_ref_id: string
    pause_ms: number | null
  }[] = []

  const segmentCount = params.segmentIds.length
  const questionCount = params.questionIds.length
  const segmentInterval = Math.max(1, Math.floor(segmentCount / (questionCount + 1)))

  let questionCursor = 0
  let segmentCounter = 0

  params.segmentIds.forEach((segment, index) => {
    timeline.push({
      order_index: timeline.length,
      item_type: "story_segment",
      item_ref_id: segment.id,
      pause_ms: segment.pause_ms ?? 0,
    })

    segmentCounter += 1
    const shouldInsertQuestion =
      questionCursor < questionCount && segmentCounter >= segmentInterval * (questionCursor + 1)

    if (shouldInsertQuestion) {
      timeline.push({
        order_index: timeline.length,
        item_type: "question",
        item_ref_id: params.questionIds[questionCursor].id,
        pause_ms: 800,
      })
      questionCursor += 1
    }
  })

  while (questionCursor < questionCount) {
    timeline.push({
      order_index: timeline.length,
      item_type: "question",
      item_ref_id: params.questionIds[questionCursor].id,
      pause_ms: 800,
    })
    questionCursor += 1
  }

  return timeline
}

export async function saveTimeline(
  supabase: SupabaseClient,
  quizId: string,
  timelineItems: {
    order_index: number
    item_type: "story_segment" | "question"
    item_ref_id: string
    pause_ms: number | null
  }[]
) {
  const rows = timelineItems.map((item) => ({
    quiz_id: quizId,
    order_index: item.order_index,
    item_type: item.item_type,
    item_ref_id: item.item_ref_id,
    pause_ms: item.pause_ms,
  }))

  const { error } = await supabase
    .from("wr_audio_quiz_timeline")
    .insert(rows)

  if (error) {
    throw error
  }
}

export async function generateQuizQuestions(params: {
  storyText: string
  segments: { segment_text: string }[]
}) {
  const segmentDraft = params.segments.map((segment) => ({
    segmentText: segment.segment_text,
    pauseMs: 800,
  }))

  const rawQuestions = await generateQuestions({
    storyText: params.storyText,
    segments: segmentDraft,
  })

  const cappedQuestions = rawQuestions.slice(0, MAX_QUESTIONS)
  return cappedQuestions.map((question) => applyAnswerShuffle(question))
}

export async function ensureClipsForTimeline(params: {
  supabase: SupabaseClient
  quizId: string
  provider: TTSProvider
  voice: TTSVoice
}) {
  const { data: timeline, error: timelineError } = await params.supabase
    .from("wr_audio_quiz_timeline")
    .select("item_type, item_ref_id, order_index")
    .eq("quiz_id", params.quizId)
    .order("order_index")

  if (timelineError) {
    throw timelineError
  }

  const segmentIds = timeline
    .filter((item) => item.item_type === "story_segment")
    .map((item) => item.item_ref_id)
  const questionIds = timeline
    .filter((item) => item.item_type === "question")
    .map((item) => item.item_ref_id)

  const { data: segments, error: segmentsError } = await params.supabase
    .from("wr_story_segments")
    .select("id, segment_text")
    .in("id", segmentIds)

  if (segmentsError) {
    throw segmentsError
  }

  const { data: questions, error: questionsError } = await params.supabase
    .from("wr_audio_quiz_questions")
    .select("id, order_index, question_text, answer_a, answer_b, answer_c")
    .in("id", questionIds)

  if (questionsError) {
    throw questionsError
  }

  const segmentById = new Map(segments?.map((segment) => [segment.id, segment]))
  const questionById = new Map(questions?.map((question) => [question.id, question]))

  for (const item of timeline ?? []) {
    let text = ""
    let entryId = ""
    let isSegment = false

    if (item.item_type === "story_segment") {
      const segment = segmentById.get(item.item_ref_id)
      if (!segment) continue
      isSegment = true
      entryId = segment.id
      text = segment.segment_text
    } else {
      const question = questionById.get(item.item_ref_id)
      if (!question) continue
      entryId = question.id
      text = `Question ${question.order_index + 1}: ${question.question_text} A: ${question.answer_a} B: ${question.answer_b} C: ${question.answer_c}`
    }

    const checksum = checksumForTTS({
      text,
      provider: params.provider,
      voice: params.voice,
      speed: 1,
      model: getTTSModel(),
    })

    const { data: existing } = await params.supabase
      .from("wr_audio_clips")
      .select("id")
      .eq("checksum", checksum)
      .maybeSingle()

    if (existing) {
      continue
    }

    const clip = await synthesizeClip(
      { text, provider: params.provider, voice: params.voice, speed: 1 },
      isSegment ? "story-segment" : "quiz-question"
    )

    await params.supabase
      .from("wr_audio_clips")
      .insert({
        owner_type: isSegment ? "story_segment" : "quiz_question",
        owner_id: entryId,
        provider: params.provider,
        voice: params.voice,
        url: clip.url,
        duration_ms: clip.durationMs,
        checksum: clip.checksum,
      })
  }
}
