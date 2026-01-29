"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { fetchAudioBlob } from "@/lib/audio"
import { useAudio } from "@/lib/contexts/AudioContext"

interface AudioButtonProps {
  text: string
  className?: string
  size?: "sm" | "md" | "lg"
  variant?: "default" | "ghost" | "outline"
  autoPlay?: boolean
  disabled?: boolean
  rate?: number
  voice?: string
  onPlayStart?: () => void
  onPlayEnd?: () => void
}

export function AudioButton({
  text,
  className,
  size = "md",
  variant = "ghost",
  autoPlay = false,
  disabled = false,
  rate = 1.0,
  voice = "nova",
  onPlayStart,
  onPlayEnd,
}: AudioButtonProps) {
  const { audioEnabled } = useAudio()
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const blobUrlRef = useRef<string | null>(null)

  // Cleanup function
  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current)
      blobUrlRef.current = null
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return cleanup
  }, [cleanup])

  // Auto-play effect
  const playAudio = useCallback(async () => {
    if (disabled || !text || !audioEnabled || isPlaying) return

    try {
      setIsPlaying(true)
      onPlayStart?.()

      // Cleanup any previous audio
      cleanup()

      // Fetch audio blob (uses browser cache automatically)
      const blob = await fetchAudioBlob(text, { speed: rate, voice })
      const url = URL.createObjectURL(blob)
      blobUrlRef.current = url

      const audio = new Audio(url)
      audioRef.current = audio

      audio.addEventListener("ended", () => {
        setIsPlaying(false)
        cleanup()
        onPlayEnd?.()
      })

      audio.addEventListener("error", () => {
        setIsPlaying(false)
        cleanup()
        onPlayEnd?.()
      })

      await audio.play()
    } catch (error) {
      console.error("Audio playback failed:", error)
      setIsPlaying(false)
      cleanup()
      onPlayEnd?.()
    }
  }, [
    audioEnabled,
    cleanup,
    disabled,
    isPlaying,
    onPlayEnd,
    onPlayStart,
    rate,
    text,
    voice,
  ])

  useEffect(() => {
    if (autoPlay && audioEnabled && !disabled && text) {
      playAudio()
    }
  }, [autoPlay, audioEnabled, disabled, playAudio, text])

  const stopAudio = () => {
    cleanup()
    setIsPlaying(false)
    onPlayEnd?.()
  }

  const handleClick = () => {
    if (isPlaying) {
      stopAudio()
    } else {
      playAudio()
    }
  }

  // Don't render if audio is disabled
  if (!audioEnabled) {
    return null
  }

  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  }

  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  }

  return (
    <Button
      variant={variant}
      size="icon"
      className={cn(
        sizeClasses[size],
        "rounded-full transition-all duration-200",
        isPlaying && "animate-pulse bg-coral/20 text-coral",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      onClick={handleClick}
      disabled={disabled}
      aria-label={isPlaying ? "Stop audio" : "Play audio"}
    >
      {isPlaying ? (
        <VolumeX className={cn(iconSizes[size], "text-coral")} />
      ) : (
        <Volume2 className={iconSizes[size]} />
      )}
    </Button>
  )
}
