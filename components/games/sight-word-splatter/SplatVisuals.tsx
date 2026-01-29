"use client"

import React from "react"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"

export type Splat = {
  id: number
  x: number
  y: number
  color: string
  size: number
  rotation: number
}

const randomRange = (min: number, max: number) => Math.random() * (max - min) + min

const SPLAT_EMOJIS = ["🎉", "⭐", "✨", "🌟", "💫", "🎊", "💥", "🔥", "🎈", "🍭", "🦄", "🌈"]

export const BUTTON_COLORS = [
  { bg: "bg-red-500", shadow: "bg-red-700", hex: "#EF4444" },
  { bg: "bg-orange-500", shadow: "bg-orange-700", hex: "#F97316" },
  { bg: "bg-amber-500", shadow: "bg-amber-700", hex: "#F59E0B" },
  { bg: "bg-emerald-500", shadow: "bg-emerald-700", hex: "#10B981" },
  { bg: "bg-cyan-500", shadow: "bg-cyan-700", hex: "#06B6D4" },
  { bg: "bg-blue-500", shadow: "bg-blue-700", hex: "#3B82F6" },
  { bg: "bg-violet-500", shadow: "bg-violet-700", hex: "#8B5CF6" },
  { bg: "bg-pink-500", shadow: "bg-pink-700", hex: "#EC4899" },
]

// Flying emoji that shoots outward
export function FlyingEmoji({ x, y }: { x: number; y: number }) {
  const emoji = SPLAT_EMOJIS[Math.floor(Math.random() * SPLAT_EMOJIS.length)]
  const angle = randomRange(0, 360)
  const distance = randomRange(150, 350)
  const dx = Math.cos(angle * (Math.PI / 180)) * distance
  const dy = Math.sin(angle * (Math.PI / 180)) * distance
  const rotation = randomRange(-360, 360)
  const size = randomRange(24, 48)

  return (
    <motion.div
      initial={{ scale: 0, x: 0, y: 0, rotate: 0, opacity: 1 }}
      animate={{
        scale: [0, 1.5, 1],
        x: dx,
        y: dy,
        rotate: rotation,
        opacity: [1, 1, 0],
      }}
      transition={{ duration: 1, ease: "easeOut" }}
      className="absolute pointer-events-none z-50"
      style={{ left: x, top: y, fontSize: size }}
    >
      {emoji}
    </motion.div>
  )
}

// Paint blob that flies out and fades
export function PaintParticle({ x, y, color }: { x: number; y: number; color: string }) {
  const angle = randomRange(0, 360)
  const distance = randomRange(60, 180)
  const dx = Math.cos(angle * (Math.PI / 180)) * distance
  const dy = Math.sin(angle * (Math.PI / 180)) * distance
  const size = randomRange(12, 35)

  return (
    <motion.div
      initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
      animate={{
        scale: [0, 1.5, 1],
        x: dx,
        y: dy,
        opacity: [1, 1, 0.8, 0],
      }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="absolute rounded-full pointer-events-none z-50"
      style={{ backgroundColor: color, left: x, top: y, width: size, height: size }}
    />
  )
}

// Splat mark that STAYS on screen
export function SplatMark({
  x,
  y,
  color,
  size,
  rotation,
}: {
  x: number
  y: number
  color: string
  size: number
  rotation: number
}) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 0.6 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="absolute pointer-events-none z-0"
      style={{
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        transform: `rotate(${rotation}deg)`,
      }}
    >
      {/* Splat shape using multiple overlapping circles */}
      <div
        className="absolute inset-0 rounded-full"
        style={{ backgroundColor: color, opacity: 0.7 }}
      />
      <div
        className="absolute rounded-full"
        style={{
          backgroundColor: color,
          width: size * 0.6,
          height: size * 0.6,
          left: -size * 0.2,
          top: size * 0.1,
          opacity: 0.5,
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          backgroundColor: color,
          width: size * 0.5,
          height: size * 0.5,
          right: -size * 0.15,
          top: -size * 0.1,
          opacity: 0.5,
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          backgroundColor: color,
          width: size * 0.4,
          height: size * 0.4,
          left: size * 0.2,
          bottom: -size * 0.15,
          opacity: 0.4,
        }}
      />
    </motion.div>
  )
}

interface SplatButtonProps {
  word: string
  colorIndex: number
  colors?: string[]
  disabled: boolean
  isCorrect: boolean
  isWrong: boolean
  onSplat: (rect: DOMRect, color: string) => void
}

export function SplatButton({
  word,
  colorIndex,
  colors,
  disabled,
  isCorrect,
  isWrong,
  onSplat,
}: SplatButtonProps) {
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  const fallback = BUTTON_COLORS[colorIndex % BUTTON_COLORS.length]
  const hex = colors?.length
    ? colors[colorIndex % colors.length]
    : fallback.hex

  const handleClick = () => {
    if (disabled) return
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      onSplat(rect, hex)
    }
  }

  return (
    <div className="relative h-full w-full">
      <motion.button
        ref={buttonRef}
        whileTap={disabled ? {} : { scale: 0.96 }}
        transition={{ duration: 0.08, ease: "easeOut" }}
        onClick={handleClick}
        disabled={disabled}
        className={cn(
          "absolute inset-0 flex items-center justify-center",
          "text-lg sm:text-xl md:text-2xl font-normal",
          "bg-transparent border-0 shadow-none",
          "transition-colors duration-200",
          isCorrect
            ? "text-emerald-600"
            : isWrong
            ? "text-red-500"
            : "text-slate-700",
          disabled && !isCorrect && "opacity-100"
        )}
        style={{ color: isCorrect || isWrong ? undefined : hex }}
      >
        {word}
      </motion.button>
    </div>
  )
}
