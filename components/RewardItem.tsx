/* eslint-disable @next/next/no-img-element */
import { useState } from "react"
import { Calendar, Gamepad2, Sparkles, ChevronDown, ChevronUp, Image as ImageIcon, Trash2 } from "lucide-react"
import type { RewardInstance } from "@/types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface RewardItemProps {
  reward: RewardInstance
  isExpanded: boolean
  onToggle: () => void
  onDelete?: (rewardId: string) => Promise<void>
  index: number
}

export function RewardItem({ reward, isExpanded, onToggle, onDelete, index }: RewardItemProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!onDelete) return

    setIsDeleting(true)
    try {
      await onDelete(reward.id)
    } catch (error) {
      console.error('Failed to delete reward:', error)
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <div
      className="bg-card/80 backdrop-blur-sm rounded-3xl border-2 border-border shadow-soft overflow-hidden animate-pop-in"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      {/* Header - Always visible */}
      <button
        onClick={onToggle}
        className="w-full bg-gradient-to-r from-sunshine/10 via-coral/5 to-lavender/10 px-6 py-4 border-b border-border flex items-center justify-between hover:bg-sunshine/20 transition-colors duration-200"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sunshine/20 rounded-xl">
            <Calendar className="h-4 w-4 text-sunshine" />
          </div>
          <span className="font-display font-semibold text-bark">
            {reward.date} at {reward.time}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-card/80 px-3 py-1.5 rounded-full">
            <Gamepad2 className="h-4 w-4" />
            {reward.gameContext.game}
          </div>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Content - Collapsed by default */}
      {isExpanded && (
        <div className="p-6 space-y-5 animate-slide-down">
          {/* Transcript */}
          <div>
            <p className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-coral" />
              What you said:
            </p>
            <p className="text-lg font-medium text-bark bg-coral/5 px-4 py-3 rounded-xl border border-coral/20">
              &ldquo;{reward.transcript}&rdquo;
            </p>
          </div>

          {/* Words */}
          <div>
            <p className="text-sm font-semibold text-muted-foreground mb-2">
              Words from this reward:
            </p>
            <div className="flex flex-wrap gap-2">
              {reward.words.map((word, i) => (
                <span
                  key={i}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm font-semibold",
                    "bg-gradient-to-r",
                    i % 4 === 0 && "from-sunshine/20 to-amber-100 text-amber-800",
                    i % 4 === 1 && "from-coral/20 to-rose-100 text-rose-800",
                    i % 4 === 2 && "from-sage/20 to-emerald-100 text-emerald-800",
                    i % 4 === 3 && "from-sky/20 to-blue-100 text-blue-800"
                  )}
                >
                  {word}
                </span>
              ))}
            </div>
          </div>

          {/* Image */}
          {reward.imageUrl && (
            <div>
              <p className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-lavender" />
                Your creation:
              </p>
              <div className="relative rounded-2xl overflow-hidden border-2 border-sunshine/30 shadow-soft">
                <img
                  src={reward.imageUrl}
                  alt={reward.transcript}
                  className="w-full h-auto"
                />
                <div className="absolute top-3 right-3 bg-sunshine/90 text-bark px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  AI Art
                </div>
              </div>
            </div>
          )}

          {/* Delete button */}
          {onDelete && (
            <div className="pt-4 border-t border-border">
              {!showDeleteConfirm ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowDeleteConfirm(true)
                  }}
                  className="text-muted-foreground hover:text-coral hover:bg-coral/10"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete this reward
                </Button>
              ) : (
                <div className="flex items-center gap-3 bg-coral/10 p-3 rounded-xl">
                  <span className="text-sm text-bark">Delete this reward?</span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-coral hover:bg-coral/90"
                  >
                    {isDeleting ? 'Deleting...' : 'Yes, delete'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowDeleteConfirm(false)
                    }}
                    disabled={isDeleting}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
