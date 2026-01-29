export function LoadingSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream">
      <div className="text-center">
        <div className="text-6xl animate-bounce-soft mb-4">📚</div>
        <p className="text-2xl font-display text-bark">Loading...</p>
      </div>
    </div>
  )
}
