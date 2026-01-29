import { NextRequest, NextResponse } from "next/server"
import { getSessionUser, getServiceClient } from "@/app/api/_utils"

export async function GET(
  _request: NextRequest,
  { params }: { params: { quizId: string } }
) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = getServiceClient()
    const { data: quiz, error: quizError } = await supabase
      .from("wr_audio_quizzes")
      .select("id, title, status, created_at, story_source_id")
      .eq("id", params.quizId)
      .eq("user_id", user.id)
      .single()

    if (quizError) {
      return NextResponse.json({ error: quizError.message }, { status: 500 })
    }

    const { data: story, error: storyError } = await supabase
      .from("wr_story_sources")
      .select("id, title")
      .eq("id", quiz.story_source_id)
      .single()

    if (storyError) {
      return NextResponse.json({ error: storyError.message }, { status: 500 })
    }

    return NextResponse.json({
      quiz: {
        id: quiz.id,
        title: quiz.title,
        status: quiz.status,
        created_at: quiz.created_at,
        story_title: story?.title ?? "Untitled Story",
      },
    })
  } catch (error) {
    console.error("[AudioQuiz] GET error:", error)
    return NextResponse.json({ error: "Failed to load quiz" }, { status: 500 })
  }
}
