"use client"

import { motion } from "motion/react"
import { SplatButton } from "./SplatVisuals"
import type { TargetPosition } from "./types"
import type { VocabularyItem } from "@/types"

type PlayfieldProps = {
  options: VocabularyItem[]
  positionsById: Record<string, TargetPosition>
  buttonColorsById: Record<string, number>
  colorPalette?: string[]
  height?: number
  feedback: "correct" | "wrong" | null
  selectedIndex: number | null
  wrongIndex: number | null
  onAnswer: (index: number, rect: DOMRect, color: string) => void
}

export function Playfield({
  options,
  positionsById,
  buttonColorsById,
  colorPalette,
  height,
  feedback,
  selectedIndex,
  wrongIndex,
  onAnswer,
}: PlayfieldProps) {
  return (
    <div
      className="relative w-full mt-2 min-h-[360px] sm:min-h-[500px] md:min-h-[560px]"
      style={height ? { height } : undefined}
    >
      {options.map((option, index) => {
        const isCorrect = selectedIndex === index && feedback === "correct"
        const isWrong = wrongIndex === index
        const position = positionsById[option.id]
        const colorIndex = buttonColorsById[option.id] ?? 0

        return (
          <motion.div
            key={option.id}
            className="absolute"
            style={{
              left: position?.x ?? 0,
              top: position?.y ?? 0,
              width: position?.width,
              height: position?.height,
            }}
            initial={{
              x: position?.spawnOffsetX ?? 0,
              y: position?.spawnOffsetY ?? 0,
              opacity: 0,
              scale: 0.7,
            }}
            animate={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            transition={{
              duration: 0.6,
              delay: position?.delay ?? 0,
              ease: "easeOut",
            }}
          >
            <motion.div
              animate={{
                x: [0, position?.driftX ?? 0],
                y: [0, position?.driftY ?? 0],
              }}
              transition={{
                duration: position?.duration ?? 8,
                repeat: Infinity,
                repeatType: "mirror",
                ease: "easeInOut",
              }}
            >
              <SplatButton
                word={option.word}
                colorIndex={colorIndex}
                colors={colorPalette}
                disabled={feedback === "correct"}
                isCorrect={isCorrect}
                isWrong={isWrong}
                onSplat={(rect, color) => onAnswer(index, rect, color)}
              />
            </motion.div>
          </motion.div>
        )
      })}
    </div>
  )
}
