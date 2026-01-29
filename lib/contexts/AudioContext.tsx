"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

interface AudioSettings {
  audioEnabled: boolean
  setAudioEnabled: (enabled: boolean) => void
}

const AudioContext = createContext<AudioSettings | undefined>(undefined)

export function AudioProvider({ children }: { children: ReactNode }) {
  const [audioEnabled, setAudioEnabledState] = useState(true)

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("wildreader_audio_enabled")
    if (saved !== null) {
      setAudioEnabledState(saved === "true")
    }
  }, [])

  // Save to localStorage when changed
  const setAudioEnabled = (enabled: boolean) => {
    setAudioEnabledState(enabled)
    localStorage.setItem("wildreader_audio_enabled", enabled.toString())
  }

  return (
    <AudioContext.Provider value={{ audioEnabled, setAudioEnabled }}>
      {children}
    </AudioContext.Provider>
  )
}

export function useAudio() {
  const context = useContext(AudioContext)
  if (context === undefined) {
    throw new Error("useAudio must be used within an AudioProvider")
  }
  return context
}
