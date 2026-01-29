import { NextResponse } from "next/server"
import { getSessionUser, getServiceClient } from "@/app/api/_utils"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = getServiceClient()
    const { data: quizzes, error: quizzesError } = await supabase
      .from("wr_audio_quizzes")
      .select("id, title, status, created_at, story_source_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (quizzesError) {
      return NextResponse.json({ error: quizzesError.message }, { status: 500 })
    }

    const storySourceIds = Array.from(new Set((quizzes ?? []).map((quiz) => quiz.story_source_id)))

    const { data: stories, error: storyError } = await supabase
      .from("wr_story_sources")
      .select("id, title")
      .in("id", storySourceIds)

    if (storyError) {
      return NextResponse.json({ error: storyError.message }, { status: 500 })
    }

    const storyById = new Map((stories ?? []).map((story) => [story.id, story.title]))

    return NextResponse.json({
      quizzes: (quizzes ?? []).map((quiz) => ({
        id: quiz.id,
        title: quiz.title,
        status: quiz.status,
        created_at: quiz.created_at,
        story_title: storyById.get(quiz.story_source_id) || "Untitled Story",
      })),
    })
  } catch (error) {
    console.error("[AudioQuizzes] GET error:", error)
    return NextResponse.json({ error: "Failed to load audio quizzes" }, { status: 500 })
  }
}
