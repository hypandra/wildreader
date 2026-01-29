import { NextRequest } from "next/server"
import { getSessionUser, getServiceClient } from "@/app/api/_utils"
import { checksumForTTS } from "@/lib/wr/tts"
import { getTTSModel } from "@/lib/audio/generate"

export async function GET(request: NextRequest) {
  const user = await getSessionUser()
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }

  const { searchParams } = new URL(request.url)
  const quizId = searchParams.get("quizId")

  if (!quizId) {
    return new Response(JSON.stringify({ error: "quizId required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  try {
    const supabase = getServiceClient()
    const { data: quiz, error: quizError } = await supabase
      .from("wr_audio_quizzes")
      .select("id, title, provider, voice, user_id")
      .eq("id", quizId)
      .single()

    if (quizError) {
      return new Response(JSON.stringify({ error: quizError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    if (quiz.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }

    const { data: timeline, error: timelineError } = await supabase
      .from("wr_audio_quiz_timeline")
      .select("item_type, item_ref_id, order_index, pause_ms")
      .eq("quiz_id", quizId)
      .order("order_index")

    if (timelineError) {
      return new Response(JSON.stringify({ error: timelineError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    const segmentIds = (timeline ?? [])
      .filter((item) => item.item_type === "story_segment")
      .map((item) => item.item_ref_id)
    const questionIds = (timeline ?? [])
      .filter((item) => item.item_type === "question")
      .map((item) => item.item_ref_id)

    const { data: segments, error: segmentsError } = await supabase
      .from("wr_story_segments")
      .select("id, segment_text")
      .in("id", segmentIds.length > 0 ? segmentIds : ["00000000-0000-0000-0000-000000000000"])

    if (segmentsError) {
      return new Response(JSON.stringify({ error: segmentsError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    const { data: questions, error: questionsError } = await supabase
      .from("wr_audio_quiz_questions")
      .select("id, order_index, question_text, answer_a, answer_b, answer_c")
      .in("id", questionIds.length > 0 ? questionIds : ["00000000-0000-0000-0000-000000000000"])

    if (questionsError) {
      return new Response(JSON.stringify({ error: questionsError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    const segmentById = new Map((segments ?? []).map((segment) => [segment.id, segment]))
    const questionById = new Map((questions ?? []).map((question) => [question.id, question]))

    const model = getTTSModel()
    const provider = quiz.provider || "openai"
    const voice = quiz.voice || "nova"

    const itemsWithText = (timeline ?? []).map((item) => {
      let text = ""
      if (item.item_type === "story_segment") {
        const segment = segmentById.get(item.item_ref_id)
        text = segment?.segment_text ?? ""
      } else {
        const question = questionById.get(item.item_ref_id)
        text = question
          ? `Question ${question.order_index + 1}: ${question.question_text} A: ${question.answer_a} B: ${question.answer_b} C: ${question.answer_c}`
          : ""
      }

      const checksum = checksumForTTS({
        text,
        provider,
        voice,
        speed: 1,
        model,
      })

      return {
        ...item,
        checksum,
      }
    })

    const checksums = Array.from(new Set(itemsWithText.map((item) => item.checksum)))
    const { data: clips, error: clipsError } = await supabase
      .from("wr_audio_clips")
      .select("checksum, url")
      .in("checksum", checksums.length > 0 ? checksums : ["missing"])

    if (clipsError) {
      return new Response(JSON.stringify({ error: clipsError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    const clipByChecksum = new Map((clips ?? []).map((clip) => [clip.checksum, clip.url]))

    const manifest = {
      quizId: quiz.id,
      title: quiz.title,
      items: itemsWithText.map((item) => ({
        orderIndex: item.order_index,
        itemType: item.item_type,
        audioUrl: clipByChecksum.get(item.checksum) || "",
        pauseMs: item.pause_ms ?? 0,
      })),
    }

    return new Response(JSON.stringify(manifest, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename=audio-quiz-${quiz.id}-manifest.json`,
      },
    })
  } catch (error) {
    console.error("[AudioQuizzes] Download error:", error)
    return new Response(JSON.stringify({ error: "Failed to download manifest" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
