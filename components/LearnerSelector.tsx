"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useChild } from "@/lib/contexts/ChildContext"
import { cn } from "@/lib/utils"

interface LearnerSelectorProps {
  className?: string
  buttonClassName?: string
}

export function LearnerSelector({ className, buttonClassName }: LearnerSelectorProps) {
  const { children, activeChildId, setActiveChildId, loadChildren } = useChild()
  const [open, setOpen] = useState(false)
  const [didLoad, setDidLoad] = useState(false)
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)

  const activeChild = useMemo(
    () => children.find(child => child.id === activeChildId),
    [children, activeChildId]
  )

  useEffect(() => {
    if (!didLoad) {
      setDidLoad(true)
      loadChildren().catch((error) => {
        console.error("Failed to load children:", error)
      })
    }
  }, [didLoad, loadChildren])

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node
      if (containerRef.current?.contains(target)) return
      if (menuRef.current?.contains(target)) return
      setOpen(false)
    }

    if (open) {
      document.addEventListener("pointerdown", handlePointerDown)
    }

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    const updatePosition = () => {
      if (!buttonRef.current) return
      const rect = buttonRef.current.getBoundingClientRect()
      setMenuPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.right + window.scrollX - 224,
      })
    }

    updatePosition()
    window.addEventListener("resize", updatePosition)
    window.addEventListener("scroll", updatePosition, true)
    return () => {
      window.removeEventListener("resize", updatePosition)
      window.removeEventListener("scroll", updatePosition, true)
    }
  }, [open])

  const handleSelect = async (id: string) => {
    await setActiveChildId(id)
    setOpen(false)
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <Button
        ref={buttonRef}
        type="button"
        variant="outline"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className={cn("h-auto px-3 py-1.5 rounded-2xl border-sunshine/20 bg-card/80 hover:bg-coral/10 hover:border-coral/30", buttonClassName)}
      >
        <span className="text-xs text-muted-foreground">Learner</span>
        <span className="ml-2 text-sm font-display font-bold text-bark">
          {activeChild?.name ?? "Select"}
        </span>
        <ChevronDown
          className={cn(
            "ml-2 h-4 w-4 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        />
      </Button>

      {open && menuPosition && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              style={{ top: menuPosition.top, left: menuPosition.left }}
              className="absolute w-56 rounded-2xl border border-sunshine/20 bg-card/95 backdrop-blur-md shadow-soft p-2 z-[100]"
            >
              {children.length > 0 ? (
                <div className="flex flex-col gap-1">
                  {children.map((child) => (
                    <button
                      key={child.id}
                      type="button"
                      role="menuitem"
                      onClick={() => handleSelect(child.id)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-xl font-medium text-bark hover:bg-sunshine/15 transition-colors",
                        child.id === activeChildId && "bg-sunshine/20"
                      )}
                    >
                      {child.name}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  No learners yet.
                </div>
              )}

              <div className="my-2 h-px bg-border/50" />

              <Link
                href="/select-child"
                className="block px-3 py-2 rounded-xl text-sm font-medium text-bark hover:bg-coral/10 transition-colors"
                role="menuitem"
                onClick={() => setOpen(false)}
              >
                Manage learners
              </Link>
            </div>,
            document.body
          )
        : null}
    </div>
  )
}
