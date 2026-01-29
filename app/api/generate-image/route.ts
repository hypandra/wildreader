import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { uploadImageToBunny } from "@/lib/bunnycdn"
import { auth } from "@/lib/auth"

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function truncateLogValue(value: unknown, maxLength = 500) {
  if (typeof value !== "string") return value
  if (value.length <= maxLength) return value
  if (value.startsWith("data:image/")) {
    return `${value.slice(0, 80)}...(truncated)`
  }
  return `${value.slice(0, maxLength)}...(truncated)`
}

function logReplacer(_key: string, value: unknown) {
  return truncateLogValue(value)
}

function summarizeOpenRouterResponse(response: any) {
  const message = response?.choices?.[0]?.message
  const content = message?.content
  const contentParts = Array.isArray(content)
    ? content
    : Array.isArray(content?.parts)
      ? content.parts
      : []

  return {
    id: response?.id,
    model: response?.model,
    choicesCount: response?.choices?.length,
    finishReason: response?.choices?.[0]?.finish_reason,
    messageKeys: message ? Object.keys(message) : [],
    contentType: typeof content,
    contentIsArray: Array.isArray(content),
    contentPartTypes: contentParts.map((part: any) => part?.type).filter(Boolean),
    imagesCount: message?.images?.length,
    hasDataArray: Array.isArray(response?.data),
    dataKeys: response?.data ? Object.keys(response.data) : [],
  }
}

function toDataUrl(data?: string, mimeType?: string) {
  if (!data) return null
  if (data.startsWith("data:image/")) return data
  const resolvedMimeType = mimeType || "image/png"
  return `data:${resolvedMimeType};base64,${data}`
}

function extractImageFromPart(part: any): string | null {
  if (!part) return null

  if (typeof part === "string") {
    const match = part.match(/data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+/)
    return match?.[0] || null
  }

  const urlCandidates = [
    part?.image_url?.url,
    part?.image_url,
    part?.image?.url,
    part?.url,
  ].filter(Boolean)

  if (urlCandidates.length > 0) {
    return urlCandidates[0]
  }

  const dataCandidates = [
    toDataUrl(part?.data, part?.mime_type),
    toDataUrl(part?.image?.data, part?.image?.mime_type || part?.mime_type),
    toDataUrl(part?.source?.data, part?.source?.media_type),
    toDataUrl(part?.image_base64, part?.mime_type),
    toDataUrl(part?.b64_json, part?.mime_type),
  ].filter(Boolean)

  if (dataCandidates.length > 0) {
    return dataCandidates[0] as string
  }

  if (typeof part?.text === "string") {
    const match = part.text.match(/data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+/)
    return match?.[0] || null
  }

  return null
}

/**
 * Extract text content from OpenRouter response (useful for understanding refusals)
 */
function extractTextFromResponse(response: any): string | null {
  const message = response?.choices?.[0]?.message
  const content = message?.content

  if (typeof content === "string") {
    return content
  }

  if (Array.isArray(content)) {
    const textParts = content
      .filter((part: any) => part?.type === "text" || typeof part?.text === "string")
      .map((part: any) => part?.text || part)
      .filter((text: any) => typeof text === "string")

    if (textParts.length > 0) {
      return textParts.join(" ")
    }
  }

  return null
}

/**
 * Use Claude Haiku to analyze a refusal and generate a safer prompt
 */
async function sanitizePromptWithHaiku(
  apiKey: string,
  originalPrompt: string,
  refusalText: string | null
): Promise<{ sanitizedPrompt: string; explanation: string }> {
  const systemPrompt = `You are helping a child's reading app generate safe, fun images.
When an image generation request is refused (often due to safety filters being overly cautious),
you help create an alternative prompt that captures the child's creative intent while being clearly safe.

Rules:
- Keep the core creative idea but make it obviously child-friendly
- Remove any words that might trigger safety filters (violence, scary, weapons, etc.)
- Add positive descriptors like "friendly", "cartoon", "playful", "cute"
- Keep it simple and fun
- If the request was for a monster/creature, make it a "friendly" or "silly" version

Respond in JSON format:
{
  "sanitizedPrompt": "the new safe prompt",
  "explanation": "brief child-friendly explanation of what was changed"
}`

  const userMessage = refusalText
    ? `Original request: "${originalPrompt}"\n\nThe image generator said: "${refusalText}"\n\nPlease create a safe alternative prompt.`
    : `Original request: "${originalPrompt}"\n\nThe image generator couldn't create this image. Please create a safe alternative prompt.`

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "anthropic/claude-3-haiku",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        max_tokens: 300,
      }),
    })

    if (!response.ok) {
      throw new Error("Haiku request failed")
    }

    const data = await response.json()
    const content = data?.choices?.[0]?.message?.content

    if (typeof content === "string") {
      // Try to parse JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          sanitizedPrompt: parsed.sanitizedPrompt || originalPrompt,
          explanation: parsed.explanation || "We made your idea even more fun!",
        }
      }
    }

    // Fallback if parsing fails
    return {
      sanitizedPrompt: `a friendly, cartoon version of ${originalPrompt}`,
      explanation: "We made your idea into a fun cartoon!",
    }
  } catch (error) {
    console.error("Haiku sanitization failed:", error)
    // Fallback to simple sanitization
    return {
      sanitizedPrompt: `a friendly, cute, cartoon ${originalPrompt.replace(/monster|scary|evil|dark|creepy/gi, "silly")}`,
      explanation: "We made your idea into a fun cartoon!",
    }
  }
}

function extractImageUrlFromResponse(response: any): string | null {
  const message = response?.choices?.[0]?.message
  if (message?.images && message.images.length > 0) {
    return message.images[0]?.image_url?.url || message.images[0]?.image_url || null
  }

  const content = message?.content
  if (Array.isArray(content)) {
    for (const part of content) {
      const extracted = extractImageFromPart(part)
      if (extracted) return extracted
    }
  }

  if (Array.isArray(content?.parts)) {
    for (const part of content.parts) {
      const extracted = extractImageFromPart(part)
      if (extracted) return extracted
    }
  }

  if (typeof content === "string") {
    const extracted = extractImageFromPart(content)
    if (extracted) return extracted
  }

  const dataArray = response?.data
  if (Array.isArray(dataArray)) {
    for (const item of dataArray) {
      const extracted = extractImageFromPart(item)
      if (extracted) return extracted
    }
  }

  const candidates = response?.candidates
  if (Array.isArray(candidates)) {
    for (const candidate of candidates) {
      const parts = candidate?.content?.parts
      if (Array.isArray(parts)) {
        for (const part of parts) {
          const extracted = extractImageFromPart(part)
          if (extracted) return extracted
        }
      }
    }
  }

  return null
}

/**
 * Generate image using OpenRouter API with retry logic
 */
async function generateImageWithRetry(
  apiKey: string,
  prompt: string,
  maxRetries = 3
): Promise<any> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log("Making OpenRouter request with key:", apiKey?.substring(0, 10) + "...")

      const requestBody = {
        model: "google/gemini-2.5-flash-image",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        modalities: ["text", "image"],
      }

      console.log("Request body:", JSON.stringify(requestBody, null, 2))

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("OpenRouter API Error:", {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        })

        // Check for rate limit
        if (response.status === 429) {
          const retryAfter = response.headers.get("retry-after")
          const retryDelay = retryAfter
            ? parseInt(retryAfter) * 1000
            : 2000 * Math.pow(2, attempt)

          console.log(`Rate limit hit, retrying in ${retryDelay}ms (attempt ${attempt + 1}/${maxRetries})`)
          await sleep(retryDelay)
          continue
        }

        throw new Error(errorData.error?.message || `API error: ${response.status}`)
      }

      const responseJson = await response.json()
      console.log(
        "OpenRouter response summary:",
        JSON.stringify(summarizeOpenRouterResponse(responseJson), null, 2)
      )
      return responseJson
    } catch (error: any) {
      lastError = error
      console.error("Request failed:", error?.message)

      if (attempt < maxRetries - 1 && error?.message?.includes("rate")) {
        const retryDelay = 2000 * Math.pow(2, attempt)
        console.log(`Retrying in ${retryDelay}ms (attempt ${attempt + 1}/${maxRetries})`)
        await sleep(retryDelay)
        continue
      }

      throw error
    }
  }

  throw lastError || new Error("Failed to generate image after retries")
}

export async function POST(request: Request) {
  try {
    // Require authentication - only logged-in users can generate images
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in to generate images" },
        { status: 401 }
      )
    }

    const { prompt } = await request.json()

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      )
    }

    // Use server-side OpenRouter API key for all authenticated users
    const apiKey = process.env.OPENROUTER_API_KEY

    if (!apiKey) {
      console.error("OPENROUTER_API_KEY not configured in environment")
      return NextResponse.json(
        { error: "Image generation is not configured. Please contact support." },
        { status: 500 }
      )
    }

    if (!apiKey.startsWith("sk-or-")) {
      console.error("Invalid OPENROUTER_API_KEY format in environment")
      return NextResponse.json(
        { error: "Image generation is misconfigured. Please contact support." },
        { status: 500 }
      )
    }

    const enhancedPrompt = `Create a picture of ${prompt}.`

    // Generate image using OpenRouter
    let response = await generateImageWithRetry(apiKey, enhancedPrompt)
    let imageUrl = extractImageUrlFromResponse(response)
    let wasRetried = false
    let retryExplanation: string | null = null

    // If no image, check if Gemini refused and try to sanitize the prompt
    if (!imageUrl) {
      const refusalText = extractTextFromResponse(response)
      const finishReason = response?.choices?.[0]?.finish_reason

      console.log("No image in first attempt. Checking for refusal...", {
        finishReason,
        hasRefusalText: !!refusalText,
        refusalTextPreview: refusalText?.substring(0, 200),
      })

      // Check if this looks like a refusal (has text but no image, or specific finish reasons)
      const looksLikeRefusal =
        refusalText ||
        finishReason === "SAFETY" ||
        finishReason === "content_filter" ||
        (finishReason === "stop" && !imageUrl)

      if (looksLikeRefusal) {
        console.log("Detected potential refusal, attempting to sanitize prompt with Claude Haiku...")

        try {
          const { sanitizedPrompt, explanation } = await sanitizePromptWithHaiku(
            apiKey,
            prompt,
            refusalText
          )

          console.log("Haiku sanitized prompt:", sanitizedPrompt)

          // Retry with sanitized prompt
          const sanitizedEnhancedPrompt = `Create a picture of ${sanitizedPrompt}.`
          response = await generateImageWithRetry(apiKey, sanitizedEnhancedPrompt)
          imageUrl = extractImageUrlFromResponse(response)

          if (imageUrl) {
            wasRetried = true
            retryExplanation = explanation
            console.log("Retry succeeded with sanitized prompt")
          }
        } catch (sanitizeError) {
          console.error("Sanitization/retry failed:", sanitizeError)
        }
      }
    }

    if (!imageUrl) {
      const responseSummary = summarizeOpenRouterResponse(response)
      const refusalText = extractTextFromResponse(response)
      console.error(
        "No image in response after retry:",
        JSON.stringify(response, logReplacer, 2)
      )
      return NextResponse.json(
        {
          error: refusalText
            ? "We couldn't create that picture. Try describing something different!"
            : "No image data returned from API. The response did not include a recognized image payload.",
          details: responseSummary,
          refusalReason: refusalText,
        },
        { status: 500 }
      )
    }

    // Upload to BunnyCDN (optional - falls back to base64 if not configured)
    let finalImageUrl = imageUrl
    try {
      const timestamp = Date.now()
      const randomId = Math.random().toString(36).substring(2, 9)
      const filename = `${timestamp}-${randomId}.png`

      finalImageUrl = await uploadImageToBunny(imageUrl, filename)
      console.log("Image uploaded to BunnyCDN:", finalImageUrl)
    } catch (uploadError) {
      console.warn("BunnyCDN upload failed, falling back to base64:", uploadError)
      // Continue with base64 imageUrl
    }

    return NextResponse.json({
      imageUrl: finalImageUrl,
      wasRetried,
      retryExplanation,
    })
  } catch (error) {
    console.error("Error generating image:", error)

    let errorMessage = "Internal server error"
    let statusCode = 500

    if (error instanceof Error) {
      errorMessage = error.message

      if (error.message.includes("quota") || error.message.includes("limit")) {
        statusCode = 403
      } else if (error.message.includes("429") || error.message.includes("rate")) {
        statusCode = 429
      } else if (error.message.includes("API key") || error.message.includes("auth")) {
        statusCode = 401
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
}
