"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { getAudioQuizManifest } from "@/lib/db/audio-quizzes"
import type { AudioQuizManifest } from "@/types"

interface AudioQuizPlayerProps {
  quizId: string
}

export function AudioQuizPlayer({ quizId }: AudioQuizPlayerProps) {
  const [manifest, setManifest] = useState<AudioQuizManifest | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    let active = true

    async function loadManifest() {
      setLoading(true)
      setError(null)
      try {
        const data = await getAudioQuizManifest(quizId)
        if (active) {
          setManifest(data)
          setCurrentIndex(0)
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to load manifest")
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadManifest()

    return () => {
      active = false
    }
  }, [quizId])

  useEffect(() => {
    if (!isPlaying || !manifest) return

    const items = manifest.items
    if (currentIndex >= items.length) {
      setIsPlaying(false)
      return
    }

    const item = items[currentIndex]
    const audio = item.audioUrl ? new Audio(item.audioUrl) : null
    audioRef.current = audio

    const advance = () => {
      const pauseMs = item.pauseMs ?? 0
      timeoutRef.current = setTimeout(() => {
        setCurrentIndex((prev) => prev + 1)
      }, pauseMs)
    }

    if (audio) {
      audio.onended = advance
      audio.onerror = advance
      audio.play().catch(() => advance())
    } else {
      advance()
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [isPlaying, currentIndex, manifest])

  const handlePlay = () => {
    if (!manifest) return
    setIsPlaying(true)
  }

  const handlePause = () => {
    setIsPlaying(false)
    if (audioRef.current) {
      audioRef.current.pause()
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }

  const handleRestart = () => {
    handlePause()
    setCurrentIndex(0)
    setIsPlaying(true)
  }

  if (loading) {
    return (
      <div className="rounded-3xl border-2 border-border bg-card/80 p-6 shadow-soft">
        <p className="text-muted-foreground">Loading audio timeline...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-3xl border-2 border-destructive/40 bg-destructive/10 p-6">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    )
  }

  if (!manifest) {
    return null
  }

  const currentItem = manifest.items[currentIndex]

  return (
    <div className="rounded-3xl border-2 border-border bg-card/80 p-6 shadow-soft">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Now Playing</p>
          <p className="text-lg font-semibold text-bark">
            {currentItem
              ? `${currentItem.itemType === "question" ? "Question" : "Story"} ${currentIndex + 1}`
              : "All done"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handlePlay}
            disabled={isPlaying}
            className="rounded-2xl"
          >
            Play
          </Button>
          <Button
            onClick={handlePause}
            variant="outline"
            className="rounded-2xl"
          >
            Pause
          </Button>
          <Button
            onClick={handleRestart}
            variant="secondary"
            className="rounded-2xl"
          >
            Restart
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-2">
        {manifest.items.map((item, index) => (
          <div
            key={`${item.itemType}-${index}`}
            className={`flex items-center justify-between rounded-2xl border px-4 py-2 text-sm ${
              index === currentIndex
                ? "border-sunshine bg-sunshine/20 text-bark"
                : "border-border/60 text-muted-foreground"
            }`}
          >
            <span>
              {item.itemType === "question" ? "Question" : "Story"} {index + 1}
            </span>
            <span>{item.pauseMs}ms pause</span>
          </div>
        ))}
      </div>
    </div>
  )
}
