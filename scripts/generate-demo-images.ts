/**
 * Script to generate demo images for the landing page demo
 *
 * Usage: bun run scripts/generate-demo-images.ts
 *
 * This script generates 3 AI images for the demo:
 * 1. A happy puppy playing in grass
 * 2. A colorful rainbow in the sky
 * 3. A rocket spaceship flying through stars
 *
 * The images are saved to public/demo/rewards/
 */

import { writeFileSync, mkdirSync } from "fs"
import { join } from "path"

// Load environment variables
import "dotenv/config"

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY

if (!OPENROUTER_API_KEY) {
  console.error("Error: OPENROUTER_API_KEY not set in environment")
  process.exit(1)
}

const prompts = [
  {
    name: "puppy",
    prompt: "A happy golden retriever puppy playing in a grassy field with a blue sky background, cute children's book illustration style, bright colors, simple and cheerful",
  },
  {
    name: "rainbow",
    prompt: "A vibrant colorful rainbow arching across a blue sky with fluffy white clouds, cute children's book illustration style, bright and cheerful colors",
  },
  {
    name: "spaceship",
    prompt: "A friendly cartoon rocket spaceship flying through space with stars and planets, cute children's book illustration style, bright colors, fun and whimsical",
  },
]

async function generateImage(prompt: string): Promise<Buffer | null> {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://wildreader.vercel.app",
        "X-Title": "Wild Reader Demo",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-preview-05-20:generateContent",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        provider: {
          only: ["Google"],
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`API Error: ${response.status} - ${errorText}`)
      return null
    }

    const data = await response.json()

    // Extract image from response
    const content = data.choices?.[0]?.message?.content
    if (!content) {
      console.error("No content in response")
      return null
    }

    // Handle inline image data
    if (typeof content === "object" && content.type === "image") {
      const base64 = content.source?.data
      if (base64) {
        return Buffer.from(base64, "base64")
      }
    }

    // Handle array of content parts
    if (Array.isArray(content)) {
      for (const part of content) {
        if (part.type === "image" && part.source?.data) {
          return Buffer.from(part.source.data, "base64")
        }
      }
    }

    console.error("No image found in response:", JSON.stringify(content).slice(0, 200))
    return null
  } catch (error) {
    console.error("Error generating image:", error)
    return null
  }
}

async function main() {
  const outputDir = join(process.cwd(), "public", "demo", "rewards")

  // Ensure output directory exists
  mkdirSync(outputDir, { recursive: true })

  console.log("Generating demo images...")
  console.log(`Output directory: ${outputDir}\n`)

  for (const { name, prompt } of prompts) {
    console.log(`Generating ${name}...`)
    console.log(`  Prompt: ${prompt.slice(0, 50)}...`)

    const imageBuffer = await generateImage(prompt)

    if (imageBuffer) {
      const outputPath = join(outputDir, `${name}.jpg`)
      writeFileSync(outputPath, imageBuffer)
      console.log(`  ✓ Saved to ${outputPath}`)
    } else {
      console.log(`  ✗ Failed to generate ${name}`)
    }

    // Small delay between requests
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  console.log("\nDone!")
}

main().catch(console.error)
