import { NextRequest, NextResponse } from "next/server"
import { getSessionUser, getServiceClient } from "@/app/api/_utils"

export async function GET() {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = getServiceClient()
    const { data, error } = await supabase
      .from("wr_story_sources")
      .select("id, title, public_domain, source_ref, created_at")
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ sources: data ?? [] })
  } catch (error) {
    console.error("[StorySources] GET error:", error)
    return NextResponse.json({ error: "Failed to load story sources" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = (await request.json()) as {
      title?: string
      sourceText?: string
      publicDomain?: boolean
      sourceRef?: string
    }

    const title = body.title?.trim()
    const sourceText = body.sourceText?.trim()

    if (!title || !sourceText) {
      return NextResponse.json({ error: "title and sourceText are required" }, { status: 400 })
    }

    const supabase = getServiceClient()
    const { data, error } = await supabase
      .from("wr_story_sources")
      .insert({
        title,
        source_text: sourceText,
        public_domain: Boolean(body.publicDomain),
        source_ref: body.sourceRef ?? null,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ source: data })
  } catch (error) {
    console.error("[StorySources] POST error:", error)
    return NextResponse.json({ error: "Failed to create story source" }, { status: 500 })
  }
}
