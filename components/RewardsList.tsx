import Link from "next/link"
import { Button } from "@/components/ui/button"
import { RewardItem } from "@/components/RewardItem"
import type { RewardInstance } from "@/types"

interface RewardsListProps {
  rewards: RewardInstance[]
  expandedRewards: Set<string>
  onToggleReward: (rewardId: string) => void
  onDeleteReward?: (rewardId: string) => Promise<void>
}

export function RewardsList({ rewards, expandedRewards, onToggleReward, onDeleteReward }: RewardsListProps) {
  if (rewards.length === 0) {
    return (
      <div className="bg-card/80 backdrop-blur-sm rounded-3xl border-2 border-border shadow-soft p-12 text-center animate-pop-in">
        <div className="text-6xl mb-4">🎁</div>
        <p className="text-xl text-muted-foreground font-medium mb-2">
          No rewards generated yet!
        </p>
        <p className="text-muted-foreground">
          Play games to earn rewards and create amazing pictures.
        </p>
        <Link href="/" className="inline-block mt-6">
          <Button className="h-12 px-6 rounded-xl font-semibold bg-gradient-to-r from-sunshine to-amber-400 text-bark hover:shadow-md">
            Start Playing
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {rewards.map((reward, index) => (
        <RewardItem
          key={reward.id}
          reward={reward}
          isExpanded={expandedRewards.has(reward.id)}
          onToggle={() => onToggleReward(reward.id)}
          onDelete={onDeleteReward}
          index={index}
        />
      ))}
    </div>
  )
}
