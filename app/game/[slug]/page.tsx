import type { Metadata } from "next"
import { GAME_CONFIGS } from "@/lib/games"
import { GamePageClient } from "./GamePageClient"
import type { GameType } from "@/types"

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const gameType = slug as GameType
  const config = GAME_CONFIGS[gameType]

  if (!config) {
    return {
      title: "Game | Wild Reader",
      description: "Play learning games on Wild Reader",
    }
  }

  const title = `${config.name} | Wild Reader`
  const description = `${config.description} - A fun learning game for little readers!`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "Wild Reader",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  }
}

export default async function GamePage({ params }: Props) {
  const { slug } = await params
  const gameType = (slug as GameType) || "word-match"

  return <GamePageClient gameType={gameType} />
}
