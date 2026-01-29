/* eslint-disable @next/next/no-img-element */
"use client"

import { useState, useEffect, useRef } from "react"
import { Mic, Square, Loader2, Sparkles, Wand2, Image as ImageIcon, LogIn, Plus, RotateCcw, Volume2, Info } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { addReward } from "@/lib/db/rewards"
import type { GameType } from "@/types"
import { cn } from "@/lib/utils"
import { speak } from "@/lib/audio"
import { rewardExamples } from "@/data/reward-examples"

type RecordingState = "idle" | "preparing" | "recording" | "transcribing"

// Celebration decorations
function CelebrationDecorations() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Confetti-like floating elements */}
      <div className="absolute top-[5%] left-[10%] text-4xl animate-float">🎉</div>
      <div className="absolute top-[8%] right-[15%] text-3xl animate-float-slow delay-200">⭐</div>
      <div className="absolute top-[12%] left-[30%] text-2xl animate-twinkle delay-400">✨</div>
      <div className="absolute top-[6%] right-[35%] text-3xl animate-float delay-100">🌟</div>
      <div className="absolute top-[15%] left-[50%] text-2xl animate-bounce-soft delay-300">💫</div>
      <div className="absolute top-[10%] right-[8%] text-4xl animate-wiggle">🎊</div>

      {/* Side decorations */}
      <div className="absolute top-[30%] left-[3%] text-3xl animate-float-slow opacity-50">🌈</div>
      <div className="absolute top-[50%] right-[3%] text-2xl animate-twinkle delay-500 opacity-40">✨</div>
      <div className="absolute bottom-[30%] left-[5%] text-2xl animate-float delay-600 opacity-40">🎨</div>
      <div className="absolute bottom-[20%] right-[8%] text-3xl animate-bounce-soft delay-200 opacity-50">🦋</div>

      {/* Decorative circles */}
      <div className="absolute top-[20%] left-[8%] w-20 h-20 bg-sunshine/10 rounded-full blur-xl animate-pulse-glow" />
      <div className="absolute bottom-[25%] right-[10%] w-16 h-16 bg-coral/10 rounded-full blur-xl animate-pulse-glow delay-500" />
      <div className="absolute top-[40%] right-[5%] w-12 h-12 bg-sage/10 rounded-full blur-xl animate-pulse-glow delay-300" />
    </div>
  )
}

interface RewardDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: () => void
  onDismiss?: (imageUrl?: string) => void
  gameType: GameType
  streak: number
  childId: string
  initialImageUrl?: string
}

export function RewardDialog({
  open,
  onOpenChange,
  onComplete,
  onDismiss,
  gameType,
  streak,
  childId,
  initialImageUrl,
}: RewardDialogProps) {
  const exampleSlides = rewardExamples.filter((example) => example.imageUrl)
  const [exampleIndex, setExampleIndex] = useState(0)
  const [transcript, setTranscript] = useState("")
  const [recordingState, setRecordingState] = useState<RecordingState>("idle")
  const [isGenerating, setIsGenerating] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(initialImageUrl || null)
  const [error, setError] = useState<string | null>(null)
  const [needsAuth, setNeedsAuth] = useState(false)
  const [expandedExample, setExpandedExample] = useState(false)
  const [recordingSupported, setRecordingSupported] = useState(true)
  const [hideExamples, setHideExamples] = useState(false)
  const [wasRetried, setWasRetried] = useState(false)
  const [retryExplanation, setRetryExplanation] = useState<string | null>(null)
  const [showParentInfo, setShowParentInfo] = useState(false)

  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const timeoutRef = useRef<number | null>(null)
  const appendModeRef = useRef<boolean>(false)

  // Check if recording is supported
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
        setRecordingSupported(false)
      }
    }
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined") {
      setHideExamples(localStorage.getItem("wr_hide_reward_examples") === "true")
    }
  }, [])

  // Reset dialog state when opening; only preload image when recovering a reward
  useEffect(() => {
    if (!open) return
    setTranscript("")
    setError(null)
    setNeedsAuth(false)
    setExpandedExample(false)
    setRecordingState("idle")
    setIsGenerating(false)
    appendModeRef.current = false
    setExampleIndex(0)
    setImageUrl(initialImageUrl || null)
    setWasRetried(false)
    setRetryExplanation(null)
    setShowParentInfo(false)
  }, [open, initialImageUrl])

  // Handle dialog close
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && open) {
      // Dialog is being closed
      if (onDismiss) {
        onDismiss(imageUrl || undefined)
      } else {
        onOpenChange(false)
      }
    } else {
      onOpenChange(newOpen)
    }
  }

  useEffect(() => {
    if (exampleSlides.length > 0 && exampleIndex >= exampleSlides.length) {
      setExampleIndex(0)
    }
  }, [exampleIndex, exampleSlides.length])

  const transcribeAudio = async (audioBlob: Blob) => {
    setRecordingState("transcribing")
    setError(null)
    try {
      const formData = new FormData()
      formData.append("audio", audioBlob, "recording.webm")
      const response = await fetch("/api/speech-to-text", {
        method: "POST",
        body: formData,
      })
      const data = await response.json()
      if (!response.ok) {
        if (response.status === 401) {
          setNeedsAuth(true)
          throw new Error("Please sign in to use voice input.")
        }
        throw new Error(data?.error || "Transcription failed.")
      }
      const spokenText = (data?.text || "").trim()
      if (!spokenText) {
        setError("No speech detected. Please speak clearly into your microphone.")
      } else {
        // Check if we should append or replace
        if (appendModeRef.current) {
          const currentText = transcript.trim()
          const separator = currentText.endsWith('.') || currentText.endsWith('!') || currentText.endsWith('?')
            ? ' '
            : ', '
          setTranscript(currentText + separator + spokenText)
        } else {
          setTranscript(spokenText)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transcription error. Please try again.")
    } finally {
      appendModeRef.current = false
      setRecordingState("idle")
    }
  }

  const startListening = async () => {
    if (!recordingSupported || recordingState !== "idle") return

    setRecordingState("preparing")
    setError(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
    } catch {
      setRecordingState("idle")
      setError("Microphone permission required. Please allow microphone access.")
      return
    }

    const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : ""
    const recorder = new MediaRecorder(streamRef.current!, mimeType ? { mimeType } : undefined)
    recorderRef.current = recorder
    chunksRef.current = []

    recorder.onstart = () => {
      setRecordingState("recording")
    }

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunksRef.current.push(event.data)
      }
    }

    recorder.onstop = async () => {
      const audioBlob = new Blob(chunksRef.current, { type: mimeType || "audio/webm" })
      chunksRef.current = []
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
      await transcribeAudio(audioBlob)
    }

    recorder.start()

    // Auto-stop after 10 seconds
    timeoutRef.current = window.setTimeout(() => {
      if (recorderRef.current?.state === "recording") {
        recorderRef.current.stop()
      }
    }, 10000)
  }

  const stopListening = () => {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop()
    }
  }

  const handleRecordMore = async () => {
    appendModeRef.current = true
    await startListening()
  }

  const handleRerecord = async () => {
    setTranscript("")
    appendModeRef.current = false
    await startListening()
  }

  const handleGenerate = async () => {
    if (!transcript.trim()) {
      setError("Please enter or speak a description")
      return
    }

    setIsGenerating(true)
    setError(null)
    setNeedsAuth(false)

    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: transcript }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        // Check for authentication error
        if (response.status === 401) {
          setNeedsAuth(true)
          throw new Error("Please sign in to generate your reward image!")
        }
        throw new Error(errorData.error || "Failed to generate image")
      }

      const data = await response.json()
      if (data.error) {
        throw new Error(data.error)
      }
      setImageUrl(data.imageUrl)

      // Track if the prompt was sanitized and retried
      if (data.wasRetried) {
        setWasRetried(true)
        setRetryExplanation(data.retryExplanation || "We made your idea even more fun!")
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("wr_hide_reward_examples", "true")
        setHideExamples(true)
      }

      // Save reward to database
      const words = transcript
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 0)

      await addReward(childId, {
        transcript,
        words,
        imageUrl: data.imageUrl,
        gameType: gameType,
        streak: streak,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate image. Please try again.")
      console.error(err)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleKeepPlaying = () => {
    onComplete()
    onOpenChange(false)
  }

  return (
    <>
      {open && <CelebrationDecorations />}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 border-2 border-sunshine/30 rounded-[2rem] bg-card/95 backdrop-blur-md">
          {/* Header with celebration - only show before image is generated */}
          {!imageUrl && (
            <div className="bg-gradient-to-r from-sunshine/20 via-coral/10 to-sage/20 px-6 py-5 text-center border-b border-sunshine/20">
              <div className="text-4xl mb-2 animate-celebrate">🎉</div>
              <h1 className="text-3xl md:text-4xl font-display font-bold text-gradient mb-1">
                Amazing Work!
              </h1>
              <p className="text-base text-muted-foreground font-medium">
                You earned a special reward!
              </p>
            </div>
          )}

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Input section - only show before image is generated */}
            {!imageUrl && (
              <>
                <div className="text-center mb-4">
                  <div className="inline-flex items-center gap-2 bg-lavender/20 text-lavender px-3 py-1.5 rounded-full">
                    <Wand2 className="h-4 w-4" />
                    <span className="font-semibold text-sm">What picture would you like to see?</span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground font-medium">
                    Describe anything you want. We will turn your words into a reward picture.
                  </p>
                </div>

                <div className="space-y-4">
              {!hideExamples && exampleSlides.length > 0 && (
                <div className="flex items-center justify-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-full shrink-0"
                    onClick={() =>
                      setExampleIndex((prev) =>
                        prev === 0 ? exampleSlides.length - 1 : prev - 1
                      )
                    }
                  >
                    ←
                  </Button>
                  <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-sunshine/10 border border-sunshine/20">
                    <img
                      src={exampleSlides[exampleIndex]?.imageUrl}
                      alt={exampleSlides[exampleIndex]?.prompt}
                      className="h-24 w-24 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setExpandedExample(true)}
                    />
                    <p className="text-xs text-bark font-medium max-w-[160px]">
                      &quot;{exampleSlides[exampleIndex]?.prompt}&quot;
                    </p>
                  </div>
                  {expandedExample && (
                    <div
                      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
                      onClick={() => setExpandedExample(false)}
                    >
                      <img
                        src={exampleSlides[exampleIndex]?.imageUrl}
                        alt={exampleSlides[exampleIndex]?.prompt}
                        className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
                      />
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-full shrink-0"
                    onClick={() =>
                      setExampleIndex((prev) =>
                        prev === exampleSlides.length - 1 ? 0 : prev + 1
                      )
                    }
                  >
                    →
                  </Button>
                </div>
              )}
              <div className="flex gap-3 items-start">
                <div className="relative flex-1">
                  <textarea
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    onKeyDown={(e) => {
                      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && transcript.trim() && !isGenerating && recordingState === "idle") {
                        handleGenerate()
                      }
                    }}
                    placeholder="Describe what you want to see..."
                    className="min-h-[160px] w-full text-base rounded-2xl border-2 border-border focus:border-sunshine px-4 py-3 input-soft font-medium resize-none"
                    disabled={recordingState !== "idle" || isGenerating}
                  />
                </div>
                {recordingSupported && (
                  <Button
                    onClick={recordingState === "recording" ? stopListening : startListening}
                    variant="outline"
                    size="icon"
                    disabled={isGenerating || recordingState === "preparing" || recordingState === "transcribing"}
                    className={cn(
                      "h-12 w-12 rounded-2xl border-2 transition-all duration-300 mt-1",
                      recordingState === "recording"
                        ? "bg-coral text-white border-coral animate-pulse"
                        : recordingState === "preparing" || recordingState === "transcribing"
                        ? "bg-muted border-muted"
                        : "hover:border-coral hover:bg-coral/10"
                    )}
                  >
                    {recordingState === "preparing" || recordingState === "transcribing" ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : recordingState === "recording" ? (
                      <Square className="h-5 w-5" />
                    ) : (
                      <Mic className="h-5 w-5" />
                    )}
                  </Button>
                )}
              </div>

              {recordingState === "recording" && (
                <div className="flex items-center justify-center gap-2 text-coral animate-pulse">
                  <div className="w-2 h-2 bg-coral rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-coral rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-coral rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="font-medium ml-2">Listening... Speak now!</span>
                </div>
              )}

              {recordingState === "transcribing" && (
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="font-medium">Processing your speech...</span>
                </div>
              )}

              {transcript.trim().length > 0 && !imageUrl && recordingState === "idle" && (
                <div className="space-y-3">
                  {/* Hear what I said button - for pre-literate kids to verify transcription */}
                  <Button
                    onClick={() => speak(transcript)}
                    variant="outline"
                    disabled={isGenerating}
                    className={cn(
                      "w-full h-14 rounded-xl font-display font-bold text-lg",
                      "bg-gradient-to-r from-lavender/10 to-purple-400/10",
                      "border-2 border-lavender/30 text-lavender hover:border-lavender hover:bg-lavender/20",
                      "transition-all duration-300"
                    )}
                  >
                    <Volume2 className="h-6 w-6 mr-3" />
                    Hear What I Said
                  </Button>

                  {recordingSupported && (
                    <div className="flex gap-3">
                      <Button
                        onClick={handleRecordMore}
                        variant="outline"
                        disabled={isGenerating}
                        className={cn(
                          "flex-1 h-12 rounded-xl font-display font-bold",
                          "bg-gradient-to-r from-sky/10 to-blue-500/10",
                          "border-2 border-sky/30 text-sky hover:border-sky hover:bg-sky/20",
                          "transition-all duration-300"
                        )}
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        Record More
                      </Button>
                      <Button
                        onClick={handleRerecord}
                        variant="outline"
                        disabled={isGenerating}
                        className={cn(
                          "flex-1 h-12 rounded-xl font-display font-bold",
                          "bg-gradient-to-r from-coral/10 to-rose-400/10",
                          "border-2 border-coral/30 text-coral hover:border-coral hover:bg-coral/20",
                          "transition-all duration-300"
                        )}
                      >
                        <RotateCcw className="h-5 w-5 mr-2" />
                        Re-record
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-2xl px-4 py-3 text-center">
                  <p className="text-destructive font-medium">{error}</p>
                  {needsAuth && (
                    <Link href="/login">
                      <Button
                        className="mt-3 h-12 px-6 rounded-xl font-display font-bold bg-gradient-to-r from-coral to-rose-400 text-white hover:from-rose-400 hover:to-coral shadow-tactile transition-all duration-300"
                      >
                        <LogIn className="h-4 w-4 mr-2" />
                        Sign In
                      </Button>
                    </Link>
                  )}
                </div>
              )}

              <Button
                onClick={handleGenerate}
                disabled={!transcript.trim() || isGenerating || recordingState !== "idle"}
                className={cn(
                  "w-full h-14 text-lg font-display font-bold rounded-2xl",
                  "bg-gradient-to-r from-sunshine to-amber-400 text-bark",
                  "hover:from-amber-400 hover:to-sunshine",
                  "shadow-tactile hover:shadow-lg",
                  "transition-all duration-300",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {isGenerating ? (
                  <span className="flex items-center gap-3">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    Creating magic...
                  </span>
                ) : (
                  <span className="flex items-center gap-3">
                    <Sparkles className="h-6 w-6" />
                    Create My Picture!
                  </span>
                )}
              </Button>
            </div>

                {/* Loading skeleton */}
                {isGenerating && (
                  <div className="rounded-2xl border-2 border-dashed border-sunshine/40 bg-sunshine/5 p-8 animate-pulse">
                    <div className="flex flex-col items-center gap-4">
                      <ImageIcon className="h-16 w-16 text-sunshine/40" />
                      <p className="text-muted-foreground font-medium">Your picture is being created...</p>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Generated image - full screen focus */}
            {imageUrl && (
              <div className="space-y-6 animate-pop-in">
                {/* Image with prompt caption */}
                <div className="relative rounded-2xl overflow-hidden border-4 border-sunshine/30 shadow-glow">
                  <img
                    src={imageUrl}
                    alt={transcript}
                    className="w-full h-auto"
                  />
                </div>

                {/* Show the prompt used */}
                <blockquote className="bg-muted/50 border-l-4 border-sunshine/50 px-4 py-2 mx-4 rounded-r-lg">
                  <p className="text-sm text-muted-foreground">
                    {transcript}
                  </p>
                </blockquote>

                {/* Child-friendly notice when prompt was modified */}
                {wasRetried && retryExplanation && (
                  <div className="bg-lavender/10 border border-lavender/30 rounded-xl px-4 py-3">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">✨</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-bark">
                          {retryExplanation}
                        </p>
                        <button
                          onClick={() => setShowParentInfo(true)}
                          className="text-xs text-muted-foreground hover:text-lavender underline mt-1 inline-flex items-center gap-1"
                        >
                          <Info className="h-3 w-3" />
                          More info for parents
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Prominent Keep Playing button */}
                <Button
                  onClick={handleKeepPlaying}
                  className={cn(
                    "w-full h-20 text-2xl font-display font-bold rounded-2xl",
                    "bg-gradient-to-r from-sage to-emerald-500 text-white",
                    "hover:from-emerald-500 hover:to-sage",
                    "shadow-tactile hover:shadow-xl",
                    "transition-all duration-300 transform hover:scale-[1.02]"
                  )}
                >
                  Keep Playing! 🚀
                </Button>
              </div>
            )}

            {/* Parent info dialog */}
            {showParentInfo && (
              <div
                className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
                onClick={() => setShowParentInfo(false)}
              >
                <div
                  className="bg-card rounded-2xl p-6 max-w-md shadow-xl border border-border"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 className="text-lg font-display font-bold text-bark mb-3">
                    Why was the image modified?
                  </h3>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <p>
                      Our image generator (Google Gemini) has safety filters that sometimes
                      block creative requests that are actually harmless—like &quot;scary monsters&quot;
                      or &quot;dragons breathing fire.&quot;
                    </p>
                    <p>
                      When this happens, we automatically create a child-friendly version
                      of your child&apos;s idea so they still get their reward. For example,
                      a &quot;scary monster&quot; might become a &quot;silly, friendly monster.&quot;
                    </p>
                    <p>
                      This ensures your child always gets a fun picture while keeping
                      the content appropriate.
                    </p>
                  </div>
                  <Button
                    onClick={() => setShowParentInfo(false)}
                    className="w-full mt-4 bg-lavender hover:bg-lavender/90 text-white"
                  >
                    Got it
                  </Button>
                </div>
              </div>
            )}

            {/* Skip link */}
            {!imageUrl && (
              <div className="text-center">
                <button
                  onClick={handleKeepPlaying}
                  className="text-muted-foreground hover:text-coral underline font-medium transition-colors"
                >
                  Skip for now
                </button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
