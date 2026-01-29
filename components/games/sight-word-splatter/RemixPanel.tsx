"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BUTTON_COLORS } from "@/components/games/sight-word-splatter/SplatVisuals"
import { SIGHT_WORD_POOL_SIZES } from "@/lib/sight-word-splatter"
import type { Difficulty } from "@/types"
import type { SightWordSelectionStrategy, SightWordSplatterOverrides } from "@/components/games/sight-word-splatter/types"

const COLOR_PRESETS: Record<string, string[]> = {
  default: BUTTON_COLORS.map((c) => c.hex),
  pastel: ["#F9A8D4", "#FDE68A", "#BBF7D0", "#93C5FD", "#C4B5FD", "#FBCFE8"],
  neon: ["#22D3EE", "#F97316", "#F43F5E", "#A3E635", "#8B5CF6", "#38BDF8"],
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

type RemixPanelProps = {
  difficulty: Difficulty
  overrides: SightWordSplatterOverrides
  onApply: (next: SightWordSplatterOverrides) => void
  onReset: () => void
}

export function RemixPanel({ difficulty, overrides, onApply, onReset }: RemixPanelProps) {
  const [mode, setMode] = useState<"manual" | "prompt">("manual")
  const [selection, setSelection] = useState<SightWordSelectionStrategy>(overrides.rules?.selection ?? "weighted")
  const [poolSize, setPoolSize] = useState<number>(overrides.rules?.poolSizes?.[difficulty] ?? SIGHT_WORD_POOL_SIZES[difficulty])
  const [colorPreset, setColorPreset] = useState<string>("default")
  const [splatMin, setSplatMin] = useState<number>(overrides.ui?.splatScale?.min ?? 160)
  const [splatMax, setSplatMax] = useState<number>(overrides.ui?.splatScale?.max ?? 260)
  const [instruction, setInstruction] = useState<string>(overrides.audio?.instruction ?? "Click a word to make it splat.")
  const [prompt, setPrompt] = useState<string>("")
  const [promptStatus, setPromptStatus] = useState<"idle" | "loading" | "error">("idle")
  const [promptError, setPromptError] = useState<string | null>(null)

  const availablePresets = useMemo(() => Object.keys(COLOR_PRESETS), [])

  const applyManual = () => {
    const resolvedPoolSize = Number.isFinite(poolSize)
      ? poolSize
      : SIGHT_WORD_POOL_SIZES[difficulty]
    const resolvedSplatMin = Number.isFinite(splatMin) ? splatMin : 160
    const resolvedSplatMax = Number.isFinite(splatMax) ? splatMax : 260
    const next: SightWordSplatterOverrides = {
      rules: {
        selection,
        poolSizes: {
          ...(overrides.rules?.poolSizes ?? {}),
          [difficulty]: clamp(resolvedPoolSize, 4, 40),
        },
      },
      ui: {
        buttonColors: COLOR_PRESETS[colorPreset],
        splatScale: {
          min: clamp(resolvedSplatMin, 80, 260),
          max: clamp(resolvedSplatMax, 140, 320),
        },
      },
      audio: {
        instruction: instruction.trim() ? instruction.trim().slice(0, 120) : undefined,
      },
    }
    onApply(next)
  }

  const applyDefaults = () => {
    setSelection("weighted")
    setPoolSize(SIGHT_WORD_POOL_SIZES[difficulty])
    setColorPreset("default")
    setSplatMin(160)
    setSplatMax(260)
    setInstruction("Click a word to make it splat.")
    onReset()
  }

  const handlePrompt = async () => {
    if (prompt.trim().length < 3) return
    setPromptStatus("loading")
    setPromptError(null)

    try {
      const response = await fetch("/api/remix/sight-word-splatter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), difficulty }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error || "Could not generate remix")
      }

      const result = data?.result || {}
      const nextPreset = result.colorPreset && COLOR_PRESETS[result.colorPreset]
        ? result.colorPreset
        : colorPreset

      if (result.selection) setSelection(result.selection)
      if (typeof result.poolSize === "number") setPoolSize(result.poolSize)
      if (nextPreset) setColorPreset(nextPreset)
      if (result.splatScale?.min) setSplatMin(result.splatScale.min)
      if (result.splatScale?.max) setSplatMax(result.splatScale.max)
      if (result.instruction) setInstruction(result.instruction)

      const next: SightWordSplatterOverrides = {
        rules: {
          selection: result.selection ?? selection,
          poolSizes: {
            ...(overrides.rules?.poolSizes ?? {}),
            [difficulty]: clamp(result.poolSize ?? poolSize, 4, 40),
          },
        },
        ui: {
          buttonColors: COLOR_PRESETS[nextPreset ?? colorPreset],
          splatScale: {
            min: clamp(result.splatScale?.min ?? splatMin, 80, 260),
            max: clamp(result.splatScale?.max ?? splatMax, 140, 320),
          },
        },
        audio: {
          instruction: result.instruction?.trim()?.slice(0, 120) || instruction.trim(),
        },
      }

      onApply(next)
      setPromptStatus("idle")
    } catch (error) {
      setPromptStatus("error")
      setPromptError(error instanceof Error ? error.message : "Could not generate remix")
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <details className="rounded-2xl border border-amber-200 bg-white/70 backdrop-blur-sm shadow-sm">
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-700">
          Remix (Beta)
          <span className="ml-2 text-xs font-normal text-slate-500">Try settings or chat</span>
        </summary>
        <div className="px-4 pb-4 pt-2 space-y-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={mode === "manual" ? "default" : "outline"}
              onClick={() => setMode("manual")}
            >
              Manual
            </Button>
            <Button
              type="button"
              variant={mode === "prompt" ? "default" : "outline"}
              onClick={() => setMode("prompt")}
            >
              Prompt
            </Button>
          </div>

          {mode === "manual" ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Pool size ({difficulty})
                </label>
                <Input
                  type="number"
                  min={4}
                  max={40}
                  value={poolSize}
                  onChange={(event) => setPoolSize(Number(event.target.value))}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Selection strategy
                </label>
                <select
                  className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                  value={selection}
                  onChange={(event) => setSelection(event.target.value as SightWordSelectionStrategy)}
                >
                  <option value="weighted">Weighted (mastery)</option>
                  <option value="random">Random</option>
                  <option value="sequential">Sequential</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Color preset
                </label>
                <select
                  className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                  value={colorPreset}
                  onChange={(event) => setColorPreset(event.target.value)}
                >
                  {availablePresets.map((preset) => (
                    <option key={preset} value={preset}>
                      {preset}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Splat size
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={80}
                    max={260}
                    value={splatMin}
                    onChange={(event) => setSplatMin(Number(event.target.value))}
                  />
                  <span className="text-xs text-slate-500">to</span>
                  <Input
                    type="number"
                    min={140}
                    max={320}
                    value={splatMax}
                    onChange={(event) => setSplatMax(Number(event.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Instruction text
                </label>
                <Input
                  value={instruction}
                  onChange={(event) => setInstruction(event.target.value)}
                />
              </div>

              <div className="flex flex-wrap gap-2 md:col-span-2">
                <Button type="button" onClick={applyManual}>
                  Apply remix
                </Button>
                <Button type="button" variant="outline" onClick={applyDefaults}>
                  Reset
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <textarea
                rows={3}
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Make it fast, neon, and only 8 words"
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              />
              {promptError ? <p className="text-sm text-red-600">{promptError}</p> : null}
              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={handlePrompt} disabled={promptStatus === "loading"}>
                  {promptStatus === "loading" ? "Generating..." : "Generate remix"}
                </Button>
                <Button type="button" variant="outline" onClick={applyDefaults}>
                  Reset
                </Button>
              </div>
            </div>
          )}
        </div>
      </details>
    </div>
  )
}
