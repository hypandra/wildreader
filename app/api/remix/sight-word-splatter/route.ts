import { NextResponse } from "next/server"
import { z } from "zod"

const inputSchema = z.object({
  prompt: z.string().min(3).max(500),
  difficulty: z.enum(["easy", "medium", "hard", "expert"]).optional(),
})

const resultSchema = z.object({
  selection: z.enum(["weighted", "random", "sequential"]).optional(),
  poolSize: z.number().int().min(4).max(40).optional(),
  colorPreset: z.enum(["default", "pastel", "neon"]).optional(),
  splatScale: z.object({
    min: z.number().min(80).max(260),
    max: z.number().min(140).max(320),
  }).optional(),
  instruction: z.string().max(120).optional(),
})

function stripCodeFences(value: string) {
  return value.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
}

export async function POST(request: Request) {
  try {
    const payload = inputSchema.parse(await request.json())
    const apiKey = process.env.OPENROUTER_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: "OPENROUTER_API_KEY is missing" }, { status: 500 })
    }

    const systemPrompt = `You generate remix settings for a children's reading game.
Return ONLY valid JSON matching this schema:
{
  "selection": "weighted" | "random" | "sequential",
  "poolSize": number (4-40),
  "colorPreset": "default" | "pastel" | "neon",
  "splatScale": { "min": number, "max": number },
  "instruction": string
}
Rules:
- Use short, kid-friendly instruction text
- Keep poolSize between 4 and 40
- If unsure, return fewer fields
`

    const userPrompt = `Prompt: "${payload.prompt}"
Difficulty: ${payload.difficulty ?? "unspecified"}
Return JSON only.`

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "anthropic/claude-3.5-sonnet",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.4,
        max_tokens: 400,
      }),
    })

    if (!response.ok) {
      const text = await response.text()
      return NextResponse.json({ error: text || "OpenRouter error" }, { status: 500 })
    }

    const data = await response.json()
    const raw = data?.choices?.[0]?.message?.content

    if (typeof raw !== "string") {
      return NextResponse.json({ error: "Invalid response format" }, { status: 500 })
    }

    const jsonStr = stripCodeFences(raw)
    const parsed = resultSchema.parse(JSON.parse(jsonStr))

    return NextResponse.json({ result: parsed })
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate remix" }, { status: 400 })
  }
}
