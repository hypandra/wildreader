import { NextRequest, NextResponse } from "next/server"
import { getOwnedChild, getSessionUser, getServiceClient } from "@/app/api/_utils"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const child = await getOwnedChild(id, user.id)
    if (!child) {
      return NextResponse.json({ error: "Child not found" }, { status: 404 })
    }

    const searchParams = request.nextUrl.searchParams
    const letter = searchParams.get("letter")

    const supabase = getServiceClient()
    let query = supabase
      .from("wr_todays_sound_attempts")
      .select("*")
      .eq("child_id", child.id)
      .order("created_at", { ascending: false })

    if (letter) {
      query = query.eq("letter_or_digraph", letter)
    }

    const { data, error } = await query.limit(50)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const attempts = (data ?? []).map((row) => ({
      id: row.id,
      date: row.date,
      letterOrDigraph: row.letter_or_digraph,
      wordsEntered: row.words_entered || [],
      matchedVocabulary: row.matched_vocabulary || [],
      totalAvailable: row.total_available,
      createdAt: row.created_at,
    }))

    return NextResponse.json({ attempts })
  } catch (error) {
    console.error("[TodaysSound] GET error:", error)
    return NextResponse.json({ error: "Failed to load attempts" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const child = await getOwnedChild(id, user.id)
    if (!child) {
      return NextResponse.json({ error: "Child not found" }, { status: 404 })
    }

    const body = (await request.json()) as {
      letterOrDigraph?: string
      wordsEntered?: string[]
      matchedVocabulary?: string[]
      totalAvailable?: number
    }

    const letterOrDigraph = body.letterOrDigraph?.trim()
    const wordsEntered = Array.isArray(body.wordsEntered) ? body.wordsEntered : []
    const matchedVocabulary = Array.isArray(body.matchedVocabulary)
      ? body.matchedVocabulary
      : []
    const totalAvailable =
      typeof body.totalAvailable === "number" ? body.totalAvailable : 0

    if (!letterOrDigraph) {
      return NextResponse.json(
        { error: "letterOrDigraph is required" },
        { status: 400 }
      )
    }

    const today = new Date().toISOString().split("T")[0]

    const supabase = getServiceClient()
    const { data, error } = await supabase
      .from("wr_todays_sound_attempts")
      .insert({
        child_id: child.id,
        date: today,
        letter_or_digraph: letterOrDigraph,
        words_entered: wordsEntered,
        matched_vocabulary: matchedVocabulary,
        total_available: totalAvailable,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const attempt = {
      id: data.id,
      date: data.date,
      letterOrDigraph: data.letter_or_digraph,
      wordsEntered: data.words_entered || [],
      matchedVocabulary: data.matched_vocabulary || [],
      totalAvailable: data.total_available,
      createdAt: data.created_at,
    }

    return NextResponse.json({ attempt })
  } catch (error) {
    console.error("[TodaysSound] POST error:", error)
    return NextResponse.json({ error: "Failed to save attempt" }, { status: 500 })
  }
}
