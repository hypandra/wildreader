import { writeFile } from "node:fs/promises"
import { uploadImageToBunny } from "@/lib/bunnycdn"

type Example = {
  prompt: string
  imageUrl: string
}

const prompts = [
  "a rainbow unicorn in a flower field",
  "a friendly robot reading books",
  "a sleepy cat on a stack of pillows",
  "a pirate ship made of cupcakes",
]

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

async function generateImage(apiKey: string, prompt: string): Promise<string> {
  const requestBody = {
    model: "google/gemini-2.5-flash-image",
    messages: [{ role: "user", content: `Create a picture of ${prompt}.` }],
    modalities: ["text", "image"],
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error?.message || `OpenRouter error: ${response.status}`)
  }

  const data = await response.json()
  const message = data.choices?.[0]?.message

  let imageUrl: string | null = null
  if (message?.images && message.images.length > 0) {
    imageUrl = message.images[0]?.image_url?.url
  }

  if (!imageUrl && message?.content) {
    if (Array.isArray(message.content)) {
      for (const part of message.content) {
        if (part.type === "image_url" && part.image_url?.url) {
          imageUrl = part.image_url.url
          break
        }
      }
    }
  }

  if (!imageUrl) {
    throw new Error("No image data returned from OpenRouter")
  }

  return imageUrl
}

async function generateRewardExamples() {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is required to generate examples.")
  }

  const examples: Example[] = []

  for (const prompt of prompts) {
    console.log(`Generating: ${prompt}`)
    const base64Image = await generateImage(apiKey, prompt)
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 9)
    const filename = `example-${timestamp}-${randomId}.png`
    const bunnyUrl = await uploadImageToBunny(base64Image, filename)
    examples.push({ prompt, imageUrl: bunnyUrl })
    console.log(`Uploaded: ${bunnyUrl}`)
  }

  const output = `export const rewardExamples = ${JSON.stringify(examples, null, 2)}\n`
  await writeFile("data/reward-examples.ts", output)
  console.log("Updated data/reward-examples.ts")
}

generateRewardExamples().catch((error) => {
  console.error(error)
  process.exit(1)
})
