import { NextRequest, NextResponse } from "next/server"
import { getSessionUser, getServiceClient } from "@/app/api/_utils"
import { ensureStorySegments } from "@/lib/wr/quiz"

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
    }

    const supabase = getServiceClient()

    let storySourceId = body.storySourceId
    if (!storySourceId) {
      const title = body.title?.trim() || "Untitled Story"
      const sourceText = body.storyText?.trim()

      if (!sourceText) {
        return NextResponse.json({ error: "storySourceId or storyText required" }, { status: 400 })
      }

      const { data: source, error: sourceError } = await supabase
        .from("wr_story_sources")
        .insert({ title, source_text: sourceText })
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

    const segments = await ensureStorySegments(supabase, storySourceId)
    return NextResponse.json({ storySourceId, segments })
  } catch (error) {
    console.error("[StorySegment] POST error:", error)
    return NextResponse.json({ error: "Failed to segment story" }, { status: 500 })
  }
}
