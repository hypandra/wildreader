"use client"

import * as React from "react"
import { getStroke } from "perfect-freehand"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const COLOR_SWATCHES = [
  { name: "Sunshine", value: "hsl(43 96% 63%)" },
  { name: "Coral", value: "hsl(16 85% 70%)" },
  { name: "Sage", value: "hsl(88 50% 48%)" },
  { name: "Sky", value: "hsl(200 85% 70%)" },
  { name: "Bark", value: "hsl(16 25% 25%)" },
  { name: "Cherry", value: "hsl(0 72% 55%)" },
]

const BACKGROUND_SWATCHES = [
  { name: "Paper", value: "hsl(0 0% 100%)" },
  { name: "Butter", value: "hsl(48 100% 96%)" },
  { name: "Mint", value: "hsl(145 65% 95%)" },
  { name: "Sky", value: "hsl(200 90% 96%)" },
  { name: "Lavender", value: "hsl(260 80% 96%)" },
]

type StrokePoint = {
  x: number
  y: number
  pressure: number
}

type Stroke = {
  points: StrokePoint[]
  color: string
  size: number
}

type ShapeType = "circle" | "square" | "triangle" | "star"

const SHAPE_OPTIONS: { type: ShapeType; label: string }[] = [
  { type: "circle", label: "Circle" },
  { type: "square", label: "Square" },
  { type: "triangle", label: "Triangle" },
  { type: "star", label: "Star" },
]

type Shape = {
  id: string
  type: ShapeType
  x: number
  y: number
  size: number
  color: string
}

type ShapeAction = {
  id: string
  type: "drag" | "resize"
  offsetX: number
  offsetY: number
}

export type FreeplayCanvasProps = {
  className?: string
  brushSize?: number
  onStrokeStart?: () => void
  onStrokeEnd?: () => void
  onClear?: () => void
  onSave?: (blob: Blob) => void
}

const DEFAULT_BRUSH_SIZE = 18

// Converts a perfect-freehand outline to a canvas-friendly SVG path string.
const getSvgPathFromStroke = (points: number[][]) => {
  if (!points.length) {
    return ""
  }

  const d = points.reduce<string[]>((acc, [x0, y0], index) => {
    const [x1, y1] = points[(index + 1) % points.length]
    if (index === 0) {
      acc.push(`M ${x0} ${y0}`)
    }
    acc.push(`Q ${x0} ${y0} ${(x0 + x1) / 2} ${(y0 + y1) / 2}`)
    return acc
  }, [])

  d.push("Z")
  return d.join(" ")
}

const getStarPoints = (cx: number, cy: number, outer: number, inner: number) => {
  const points: { x: number; y: number }[] = []
  const step = Math.PI / 5
  for (let i = 0; i < 10; i += 1) {
    const radius = i % 2 === 0 ? outer : inner
    const angle = -Math.PI / 2 + i * step
    points.push({
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
    })
  }
  return points
}

const getPointFromEvent = (
  event: React.PointerEvent<HTMLCanvasElement>,
  canvas: HTMLCanvasElement
): StrokePoint => {
  const rect = canvas.getBoundingClientRect()
  const pressure = event.pressure > 0 ? event.pressure : 0.5

  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
    pressure,
  }
}

export default function FreeplayCanvas({
  className,
  brushSize = DEFAULT_BRUSH_SIZE,
  onStrokeStart,
  onStrokeEnd,
  onClear,
  onSave,
}: FreeplayCanvasProps) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const strokesRef = React.useRef<Stroke[]>([])
  const currentStrokeRef = React.useRef<Stroke | null>(null)
  const activePointerIdRef = React.useRef<number | null>(null)
  const animationFrameRef = React.useRef<number | null>(null)
  const dprRef = React.useRef(1)
  const backgroundColorRef = React.useRef("#ffffff")
  const shapesRef = React.useRef<Shape[]>([])
  const shapeActionRef = React.useRef<ShapeAction | null>(null)
  const shapePointerIdRef = React.useRef<number | null>(null)

  const [strokes, setStrokes] = React.useState<Stroke[]>([])
  const [selectedColor, setSelectedColor] = React.useState(
    COLOR_SWATCHES[0].value
  )
  const [tool, setTool] = React.useState<"draw" | "shape">("draw")
  const [activeShapeType, setActiveShapeType] = React.useState<ShapeType>("circle")
  const [shapeColor, setShapeColor] = React.useState(COLOR_SWATCHES[1].value)
  const [backgroundColor, setBackgroundColor] = React.useState(BACKGROUND_SWATCHES[0].value)
  const [shapes, setShapes] = React.useState<Shape[]>([])
  const [selectedShapeId, setSelectedShapeId] = React.useState<string | null>(null)

  const drawStroke = React.useCallback((ctx: CanvasRenderingContext2D, stroke: Stroke) => {
    if (!stroke.points.length) {
      return
    }

    const strokePoints = stroke.points.map((point) => [point.x, point.y, point.pressure])
    const outline = getStroke(strokePoints, {
      size: stroke.size,
      thinning: 0.6,
      smoothing: 0.6,
      streamline: 0.4,
      easing: (t) => t,
      simulatePressure: false,
    })

    if (!outline.length) {
      return
    }

    const path = new Path2D(getSvgPathFromStroke(outline))
    ctx.fillStyle = stroke.color
    ctx.fill(path)
  }, [])

  const drawShape = React.useCallback((ctx: CanvasRenderingContext2D, shape: Shape) => {
    const size = shape.size
    const half = size / 2

    ctx.fillStyle = shape.color

    if (shape.type === "circle") {
      ctx.beginPath()
      ctx.arc(shape.x, shape.y, half, 0, Math.PI * 2)
      ctx.fill()
      return
    }

    if (shape.type === "square") {
      ctx.fillRect(shape.x - half, shape.y - half, size, size)
      return
    }

    if (shape.type === "triangle") {
      ctx.beginPath()
      ctx.moveTo(shape.x, shape.y - half)
      ctx.lineTo(shape.x + half, shape.y + half)
      ctx.lineTo(shape.x - half, shape.y + half)
      ctx.closePath()
      ctx.fill()
      return
    }

    const points = getStarPoints(shape.x, shape.y, half, half * 0.45)
    ctx.beginPath()
    points.forEach((point, index) => {
      if (index === 0) {
        ctx.moveTo(point.x, point.y)
      } else {
        ctx.lineTo(point.x, point.y)
      }
    })
    ctx.closePath()
    ctx.fill()
  }, [])

  const redraw = React.useCallback(
    (includeLiveStroke = true) => {
      const canvas = canvasRef.current
      if (!canvas) {
        return
      }

      const ctx = canvas.getContext("2d")
      if (!ctx) {
        return
      }

      const dpr = dprRef.current
      const width = canvas.width / dpr
      const height = canvas.height / dpr

      ctx.clearRect(0, 0, width, height)
      ctx.fillStyle = backgroundColorRef.current
      ctx.fillRect(0, 0, width, height)

      strokesRef.current.forEach((stroke) => drawStroke(ctx, stroke))

      if (includeLiveStroke && currentStrokeRef.current) {
        drawStroke(ctx, currentStrokeRef.current)
      }
    },
    [drawStroke]
  )

  // Batch pointer updates into a single animation frame for smoother drawing.
  const requestRedraw = React.useCallback((forceImmediate = false) => {
    if (forceImmediate) {
      redraw(true)
      return
    }

    if (animationFrameRef.current) {
      return
    }

    animationFrameRef.current = window.requestAnimationFrame(() => {
      animationFrameRef.current = null
      redraw(true)
    })
  }, [redraw])

  const syncStrokes = React.useCallback((next: Stroke[]) => {
    strokesRef.current = next
    setStrokes(next)
  }, [])

  const syncShapes = React.useCallback((next: Shape[]) => {
    shapesRef.current = next
    setShapes(next)
  }, [])

  const getContainerPoint = React.useCallback(
    (event: { clientX: number; clientY: number }) => {
      const container = containerRef.current
      if (!container) {
        return null
      }

      const rect = container.getBoundingClientRect()
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        width: rect.width,
        height: rect.height,
      }
    },
    []
  )

  const createShape = React.useCallback(
    (type: ShapeType, x: number, y: number) => {
      const id = typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`

      return {
        id,
        type,
        x,
        y,
        size: 120,
        color: shapeColor,
      }
    },
    [shapeColor]
  )

  const updateShape = React.useCallback(
    (id: string, updater: (shape: Shape) => Shape) => {
      const next = shapesRef.current.map((shape) => (shape.id === id ? updater(shape) : shape))
      syncShapes(next)
    },
    [syncShapes]
  )

  const clampShapePosition = React.useCallback(
    (shape: Shape, bounds: { width: number; height: number }) => {
      const half = shape.size / 2
      return {
        x: Math.min(bounds.width - half, Math.max(half, shape.x)),
        y: Math.min(bounds.height - half, Math.max(half, shape.y)),
      }
    },
    []
  )

  const handlePointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas || event.button !== 0) {
        return
      }

      event.preventDefault()

      if (tool === "shape") {
        const point = getContainerPoint(event)
        if (!point) {
          return
        }

        const shape = createShape(activeShapeType, point.x, point.y)
        syncShapes([...shapesRef.current, shape])
        setSelectedShapeId(shape.id)
        shapeActionRef.current = {
          id: shape.id,
          type: "drag",
          offsetX: 0,
          offsetY: 0,
        }
        shapePointerIdRef.current = event.pointerId
        canvas.setPointerCapture(event.pointerId)
        return
      }

      canvas.setPointerCapture(event.pointerId)
      activePointerIdRef.current = event.pointerId
      setSelectedShapeId(null)

      currentStrokeRef.current = {
        color: selectedColor,
        size: brushSize,
        points: [getPointFromEvent(event, canvas)],
      }

      onStrokeStart?.()
      requestRedraw(event.pointerType === "mouse")
    },
    [activeShapeType, brushSize, createShape, getContainerPoint, onStrokeStart, requestRedraw, selectedColor, syncShapes, tool]
  )

  const handlePointerMove = React.useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas) {
        return
      }

      event.preventDefault()

      if (tool === "shape") {
        return
      }

      if (activePointerIdRef.current !== event.pointerId) {
        return
      }

      const stroke = currentStrokeRef.current
      if (!stroke) {
        return
      }

      stroke.points.push(getPointFromEvent(event, canvas))
      requestRedraw(event.pointerType === "mouse")
    },
    [requestRedraw, tool]
  )

  const finalizeStroke = React.useCallback(() => {
    const stroke = currentStrokeRef.current
    if (!stroke) {
      return
    }

    const next = [...strokesRef.current, stroke]
    syncStrokes(next)

    currentStrokeRef.current = null
    onStrokeEnd?.()
    requestRedraw()
  }, [onStrokeEnd, requestRedraw, syncStrokes])

  const handlePointerUp = React.useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (activePointerIdRef.current !== event.pointerId) {
        return
      }

      event.preventDefault()
      activePointerIdRef.current = null
      finalizeStroke()
    },
    [finalizeStroke]
  )

  const handlePointerCancel = React.useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (activePointerIdRef.current !== event.pointerId) {
        return
      }

      activePointerIdRef.current = null
      currentStrokeRef.current = null
      requestRedraw()
    },
    [requestRedraw]
  )

  const handleUndo = React.useCallback(() => {
    if (strokesRef.current.length) {
      const next = strokesRef.current.slice(0, -1)
      syncStrokes(next)
      requestRedraw()
      return
    }

    if (shapesRef.current.length) {
      const next = shapesRef.current.slice(0, -1)
      syncShapes(next)
      if (selectedShapeId && !next.find((shape) => shape.id === selectedShapeId)) {
        setSelectedShapeId(null)
      }
      return
    }

    requestRedraw()
  }, [requestRedraw, selectedShapeId, syncShapes, syncStrokes])

  const handleClear = React.useCallback(() => {
    syncStrokes([])
    syncShapes([])
    setSelectedShapeId(null)
    currentStrokeRef.current = null
    requestRedraw()
    onClear?.()
  }, [onClear, requestRedraw, syncShapes, syncStrokes])

  // Export as PNG via toBlob and trigger the optional save hook.
  const handleSave = React.useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    const exportCanvas = document.createElement("canvas")
    exportCanvas.width = canvas.width
    exportCanvas.height = canvas.height

    const ctx = exportCanvas.getContext("2d")
    if (!ctx) {
      return
    }

    ctx.fillStyle = backgroundColorRef.current
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height)
    ctx.drawImage(canvas, 0, 0)
    shapesRef.current.forEach((shape) => drawShape(ctx, shape))

    exportCanvas.toBlob((blob) => {
      if (!blob) {
        return
      }

      onSave?.(blob)

      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = "freeplay-painting.png"
      link.click()
      URL.revokeObjectURL(url)
    }, "image/png")
  }, [drawShape, onSave])

  // Match the canvas backing store to the container size and device pixel ratio.
  React.useLayoutEffect(() => {
    const rootStyles = getComputedStyle(document.documentElement)
    const card = rootStyles.getPropertyValue("--card").trim()
    if (card) {
      backgroundColorRef.current = `hsl(${card})`
    }
  }, [])

  React.useEffect(() => {
    backgroundColorRef.current = backgroundColor
    redraw(false)
  }, [backgroundColor, redraw])

  React.useEffect(() => {
    shapesRef.current = shapes
  }, [shapes])

  React.useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (shapePointerIdRef.current !== event.pointerId) {
        return
      }

      const point = getContainerPoint(event)
      const action = shapeActionRef.current
      if (!point || !action) {
        return
      }

      updateShape(action.id, (shape) => {
        if (action.type === "resize") {
          const nextSize = Math.max(40, Math.min(360, Math.max(Math.abs(point.x - shape.x), Math.abs(point.y - shape.y)) * 2))
          return { ...shape, size: nextSize }
        }

        const next = {
          ...shape,
          x: point.x - action.offsetX,
          y: point.y - action.offsetY,
        }
        const clamped = clampShapePosition(next, point)
        return { ...next, ...clamped }
      })
    }

    const handlePointerUp = (event: PointerEvent) => {
      if (shapePointerIdRef.current !== event.pointerId) {
        return
      }

      shapePointerIdRef.current = null
      shapeActionRef.current = null
    }

    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerup", handlePointerUp)
    window.addEventListener("pointercancel", handlePointerUp)

    return () => {
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)
      window.removeEventListener("pointercancel", handlePointerUp)
    }
  }, [clampShapePosition, getContainerPoint, updateShape])

  React.useLayoutEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) {
      return
    }

    const resize = () => {
      const rect = container.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      dprRef.current = dpr

      canvas.width = Math.max(1, Math.floor(rect.width * dpr))
      canvas.height = Math.max(1, Math.floor(rect.height * dpr))
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`

      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      }

      redraw(false)
    }

    resize()

    const observer = new ResizeObserver(() => resize())
    observer.observe(container)

    return () => observer.disconnect()
  }, [redraw])

  React.useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  const hasStrokes = strokes.length > 0
  const hasContent = hasStrokes || shapes.length > 0
  const selectedShape = shapes.find((shape) => shape.id === selectedShapeId) || null

  return (
    <section
      className={cn(
        "flex min-h-dvh w-full flex-col gap-4 px-4 pb-[env(safe-area-inset-bottom)] pt-4 sm:px-6",
        className
      )}
    >
      <header className="flex flex-col gap-1">
        <h2 className="font-display text-2xl text-balance">Freeplay Finger Paint</h2>
        <p className="text-sm text-muted-foreground text-pretty">
          Pick a color to draw or drop shapes onto the canvas. Tap a shape to
          resize or recolor it.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant={tool === "draw" ? "default" : "outline"}
          size="sm"
          onClick={() => setTool("draw")}
        >
          Draw
        </Button>
        <Button
          type="button"
          variant={tool === "shape" ? "default" : "outline"}
          size="sm"
          onClick={() => setTool("shape")}
        >
          Shapes
        </Button>
        {tool === "shape" && (
          <div className="flex flex-wrap items-center gap-2">
            {SHAPE_OPTIONS.map((shape) => (
              <Button
                key={shape.type}
                type="button"
                variant={activeShapeType === shape.type ? "secondary" : "outline"}
                size="sm"
                onClick={() => setActiveShapeType(shape.type)}
              >
                {shape.label}
              </Button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Paint
        </span>
        {COLOR_SWATCHES.map((swatch) => {
          const isSelected = swatch.value === selectedColor
          return (
            <button
              key={swatch.name}
              type="button"
              aria-label={`${swatch.name} paint`}
              aria-pressed={isSelected}
              onClick={() => setSelectedColor(swatch.value)}
              className={cn(
                "size-12 rounded-full border-2 border-white/70 shadow-soft transition-shadow",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isSelected && "ring-4 ring-primary"
              )}
              style={{ backgroundColor: swatch.value }}
            />
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Background
        </span>
        {BACKGROUND_SWATCHES.map((swatch) => {
          const isSelected = swatch.value === backgroundColor
          return (
            <button
              key={swatch.name}
              type="button"
              aria-label={`${swatch.name} background`}
              aria-pressed={isSelected}
              onClick={() => setBackgroundColor(swatch.value)}
              className={cn(
                "size-10 rounded-full border-2 border-white/70 shadow-soft transition-shadow",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isSelected && "ring-2 ring-primary"
              )}
              style={{ backgroundColor: swatch.value }}
            />
          )
        })}
      </div>

      {selectedShape && (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Shape color
          </span>
          {COLOR_SWATCHES.map((swatch) => {
            const isSelected = swatch.value === selectedShape.color
            return (
              <button
                key={`shape-${swatch.name}`}
                type="button"
                aria-label={`${swatch.name} shape color`}
                aria-pressed={isSelected}
                onClick={() => {
                  updateShape(selectedShape.id, (shape) => ({ ...shape, color: swatch.value }))
                  setShapeColor(swatch.value)
                }}
                className={cn(
                  "size-10 rounded-full border-2 border-white/70 shadow-soft transition-shadow",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isSelected && "ring-2 ring-primary"
                )}
                style={{ backgroundColor: swatch.value }}
              />
            )
          })}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              syncShapes(shapesRef.current.filter((shape) => shape.id !== selectedShape.id))
              setSelectedShapeId(null)
            }}
          >
            Delete shape
          </Button>
        </div>
      )}

      <div
        ref={containerRef}
        className="relative flex-1 overflow-hidden rounded-3xl border shadow-soft"
        style={{ backgroundColor }}
      >
        <canvas
          ref={canvasRef}
          className="size-full touch-none rounded-3xl"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          onContextMenu={(event) => event.preventDefault()}
          aria-label="Finger painting canvas"
          role="img"
        />
        <div className="absolute inset-0 pointer-events-none">
          {shapes.map((shape) => {
            const isSelected = shape.id === selectedShapeId
            const size = shape.size
            const left = shape.x - size / 2
            const top = shape.y - size / 2

            return (
              <div
                key={shape.id}
                data-shape-id={shape.id}
                className="absolute pointer-events-auto"
                style={{ left, top, width: size, height: size }}
                onPointerDown={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  const rect = event.currentTarget.getBoundingClientRect()
                  setSelectedShapeId(shape.id)
                  shapeActionRef.current = {
                    id: shape.id,
                    type: "drag",
                    offsetX: event.clientX - rect.left - size / 2,
                    offsetY: event.clientY - rect.top - size / 2,
                  }
                  shapePointerIdRef.current = event.pointerId
                }}
              >
                {shape.type === "circle" && (
                  <div
                    className={cn("size-full rounded-full border-2", isSelected ? "border-bark" : "border-transparent")}
                    style={{ backgroundColor: shape.color }}
                  />
                )}
                {shape.type === "square" && (
                  <div
                    className={cn("size-full border-2", isSelected ? "border-bark" : "border-transparent")}
                    style={{ backgroundColor: shape.color }}
                  />
                )}
                {shape.type === "triangle" && (
                  <svg viewBox="0 0 100 100" className="size-full">
                    <polygon
                      points="50 6 96 96 4 96"
                      fill={shape.color}
                      stroke={isSelected ? "hsl(20 15% 25%)" : "transparent"}
                      strokeWidth={isSelected ? 4 : 0}
                    />
                  </svg>
                )}
                {shape.type === "star" && (
                  <svg viewBox="0 0 100 100" className="size-full">
                    <polygon
                      points="50 6 62 38 96 38 68 58 78 92 50 72 22 92 32 58 4 38 38 38"
                      fill={shape.color}
                      stroke={isSelected ? "hsl(20 15% 25%)" : "transparent"}
                      strokeWidth={isSelected ? 4 : 0}
                    />
                  </svg>
                )}
                {isSelected && (
                  <>
                    {["tl", "tr", "bl", "br"].map((corner) => (
                      <button
                        key={corner}
                        type="button"
                        aria-label="Resize shape"
                        className={cn(
                          "absolute size-4 rounded-full bg-white border border-bark shadow-sm pointer-events-auto",
                          corner === "tl" && "-left-2 -top-2",
                          corner === "tr" && "-right-2 -top-2",
                          corner === "bl" && "-left-2 -bottom-2",
                          corner === "br" && "-right-2 -bottom-2"
                        )}
                        onPointerDown={(event) => {
                          event.preventDefault()
                          event.stopPropagation()
                          setSelectedShapeId(shape.id)
                          shapeActionRef.current = {
                            id: shape.id,
                            type: "resize",
                            offsetX: 0,
                            offsetY: 0,
                          }
                          shapePointerIdRef.current = event.pointerId
                        }}
                      />
                    ))}
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="h-14 text-base"
          onClick={handleUndo}
          disabled={!hasContent}
        >
          Undo
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="h-14 text-base"
              disabled={!hasContent}
            >
              Clear
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-balance">
                Clear the canvas?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-pretty">
                This removes everything so you can start fresh.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="h-12 text-base">
                Keep drawing
              </AlertDialogCancel>
              <AlertDialogAction
                className={cn(
                  "h-12 text-base",
                  "bg-none bg-destructive text-destructive-foreground hover:bg-destructive/90"
                )}
                onClick={handleClear}
              >
                Clear it
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Button
          type="button"
          variant="secondary"
          size="lg"
          className="h-14 text-base"
          onClick={handleSave}
          disabled={!hasContent}
        >
          Save
        </Button>
      </div>
    </section>
  )
}
