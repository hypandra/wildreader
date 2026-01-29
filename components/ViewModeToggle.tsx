import { List, Award } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ViewMode = "vocabulary" | "rewards"

interface ViewModeToggleProps {
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
}

export function ViewModeToggle({ viewMode, onViewModeChange }: ViewModeToggleProps) {
  return (
    <div className="flex gap-3">
      <Button
        onClick={() => onViewModeChange("vocabulary")}
        variant={viewMode === "vocabulary" ? "default" : "outline"}
        className={cn(
          "flex-1 h-14 rounded-2xl font-display font-bold text-base transition-all duration-200",
          viewMode === "vocabulary"
            ? "bg-gradient-to-r from-lavender to-purple-500 text-white shadow-md"
            : "border-2 hover:border-lavender hover:bg-lavender/10"
        )}
      >
        <List className="h-5 w-5 mr-2" />
        Vocabulary List
      </Button>
      <Button
        onClick={() => onViewModeChange("rewards")}
        variant={viewMode === "rewards" ? "default" : "outline"}
        className={cn(
          "flex-1 h-14 rounded-2xl font-display font-bold text-base transition-all duration-200",
          viewMode === "rewards"
            ? "bg-gradient-to-r from-sunshine to-amber-400 text-bark shadow-md"
            : "border-2 hover:border-sunshine hover:bg-sunshine/10"
        )}
      >
        <Award className="h-5 w-5 mr-2" />
        Rewards Log
      </Button>
    </div>
  )
}
