import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Difficulty } from "@/types"

const COLOR_SCHEMES = {
  sunshine: {
    size: "px-6 py-2",
    active: "bg-gradient-to-r from-sunshine to-amber-400 text-bark shadow-md hover:shadow-lg",
    inactive: "hover:bg-sunshine/10 hover:border-sunshine",
  },
  coral: {
    size: "px-4 py-2 text-sm",
    active: "bg-gradient-to-r from-coral to-rose-500 text-white shadow-md hover:shadow-lg",
    inactive: "hover:bg-coral/10 hover:border-coral",
  },
}

type DifficultySelectorProps = {
  levels: Difficulty[]
  current: Difficulty
  onChange: (level: Difficulty) => void
  colorScheme: "sunshine" | "coral"
}

export function DifficultySelector({
  levels,
  current,
  onChange,
  colorScheme,
}: DifficultySelectorProps) {
  const scheme = COLOR_SCHEMES[colorScheme]

  return (
    <div className="mb-3 flex flex-wrap gap-2 justify-center animate-slide-up">
      {levels.map((level) => (
        <Button
          key={level}
          variant={current === level ? "default" : "outline"}
          onClick={() => onChange(level)}
          className={cn(
            scheme.size,
            "rounded-2xl font-display font-semibold transition-all duration-200",
            current === level ? scheme.active : scheme.inactive
          )}
        >
          {level.charAt(0).toUpperCase() + level.slice(1)}
        </Button>
      ))}
    </div>
  )
}
