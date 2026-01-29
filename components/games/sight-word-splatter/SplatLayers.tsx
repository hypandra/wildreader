"use client"

import { AnimatePresence } from "motion/react"
import { FlyingEmoji, PaintParticle, SplatMark } from "./SplatVisuals"
import type { Splat } from "./SplatVisuals"

type SplatLayersProps = {
  splatMarks: Splat[]
  splats: Splat[]
}

export function SplatMarksLayer({ splatMarks }: { splatMarks: Splat[] }) {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {splatMarks.map((splat) => (
        <SplatMark
          key={`mark-${splat.id}`}
          x={splat.x}
          y={splat.y}
          color={splat.color}
          size={splat.size}
          rotation={splat.rotation}
        />
      ))}
    </div>
  )
}

export function SplatParticlesLayer({ splats }: { splats: Splat[] }) {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      <AnimatePresence>
        {splats.map((splat) => (
          <div key={splat.id}>
            {Array.from({ length: 12 }).map((_, i) => (
              <FlyingEmoji key={`emoji-${splat.id}-${i}`} x={splat.x} y={splat.y} />
            ))}
            {Array.from({ length: 10 }).map((_, i) => (
              <PaintParticle
                key={`paint-${splat.id}-${i}`}
                x={splat.x}
                y={splat.y}
                color={splat.color}
              />
            ))}
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export function SplatLayers({ splatMarks, splats }: SplatLayersProps) {
  return (
    <>
      <SplatMarksLayer splatMarks={splatMarks} />
      <SplatParticlesLayer splats={splats} />
    </>
  )
}
