import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing OPENAI_API_KEY environment variable." },
      { status: 500 }
    )
  }

  const formData = await request.formData()
  const audioFile = formData.get("audio")
  if (!(audioFile instanceof File)) {
    return NextResponse.json({ error: "No audio file provided." }, { status: 400 })
  }

  const audioBuffer = await audioFile.arrayBuffer()
  const audioBlob = new Blob([audioBuffer], {
    type: audioFile.type || "audio/webm",
  })

  const openAiForm = new FormData()
  openAiForm.append("file", audioBlob, "recording.webm")
  openAiForm.append("model", "whisper-1")
  openAiForm.append("language", "en")
  openAiForm.append("response_format", "json")

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: openAiForm,
  })

  const data = await response.json()
  if (!response.ok) {
    const message = data?.error?.message || "OpenAI transcription failed."
    return NextResponse.json({ error: message }, { status: response.status })
  }

  return NextResponse.json({ text: data?.text || "" })
}
