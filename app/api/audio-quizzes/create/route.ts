import { NextRequest, NextResponse } from "next/server"
import { getSessionUser, getServiceClient } from "@/app/api/_utils"
import {
  ensureStorySegments,
  createQuiz,
  generateQuizQuestions,
  insertQuestions,
  buildTimelineItems,
  saveTimeline,
  ensureClipsForTimeline,
} from "@/lib/wr/quiz"

const MAX_STORY_CHARS = 8000

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = (await request.json()) as {
      storySourceId?: string
      storyText?: string
      title?: string
      provider?: "openai"
      voice?: "alloy" | "echo" | "fable" | "nova" | "onyx" | "shimmer"
    }

    const supabase = getServiceClient()
    const provider = body.provider ?? "openai"
    const voice = body.voice ?? "nova"

    let storySourceId = body.storySourceId

    if (!storySourceId) {
      const title = body.title?.trim() || "New Story"
      const sourceText = body.storyText?.trim()
      if (!sourceText) {
        return NextResponse.json({ error: "storyText required" }, { status: 400 })
      }

      const { data: source, error: sourceError } = await supabase
        .from("wr_story_sources")
        .insert({ title, source_text: sourceText.slice(0, MAX_STORY_CHARS) })
        .select()
        .single()

      if (sourceError) {
        return NextResponse.json({ error: sourceError.message }, { status: 500 })
      }

      storySourceId = source.id
    }

    if (!storySourceId) {
      return NextResponse.json({ error: "storySourceId required" }, { status: 400 })
    }

    const { data: story, error: storyError } = await supabase
      .from("wr_story_sources")
      .select("title, source_text")
      .eq("id", storySourceId)
      .single()

    if (storyError) {
      return NextResponse.json({ error: storyError.message }, { status: 500 })
    }

    const segments = await ensureStorySegments(supabase, storySourceId)
    if (segments.length === 0) {
      return NextResponse.json({ error: "Story too short to segment" }, { status: 400 })
    }

    const questions = await generateQuizQuestions({
      storyText: story?.source_text ?? "",
      segments,
    })

    if (questions.length === 0) {
      return NextResponse.json({ error: "Failed to generate questions" }, { status: 500 })
    }

    const quizTitle = body.title?.trim() || `${story?.title ?? "Story"} Quiz`

    const quiz = await createQuiz(supabase, {
      userId: user.id,
      storySourceId,
      title: quizTitle,
      provider,
      voice,
    })

    const insertedQuestions = await insertQuestions(supabase, quiz.id, questions)

    const timelineItems = buildTimelineItems({
      segmentIds: segments.map((segment: any) => ({ id: segment.id, pause_ms: segment.pause_ms })),
      questionIds: insertedQuestions.map((question) => ({ id: question.id })),
    })

    await saveTimeline(supabase, quiz.id, timelineItems)

    await ensureClipsForTimeline({
      supabase,
      quizId: quiz.id,
      provider,
      voice,
    })

    await supabase
      .from("wr_audio_quizzes")
      .update({ status: "ready" })
      .eq("id", quiz.id)

    return NextResponse.json({ quizId: quiz.id })
  } catch (error) {
    console.error("[AudioQuizzes] POST error:", error)
    return NextResponse.json({ error: "Failed to create audio quiz" }, { status: 500 })
  }
}
