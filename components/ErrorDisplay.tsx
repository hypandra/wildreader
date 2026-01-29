import { Button } from '@/components/ui/button'

export function ErrorDisplay({
  error,
  retry
}: {
  error: string
  retry?: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream">
      <div className="text-center max-w-md px-4">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-display font-bold text-bark mb-2">
          Oops!
        </h2>
        <p className="text-bark/70 mb-4">{error}</p>
        {retry && (
          <Button onClick={retry} className="bg-coral hover:bg-coral/90">
            Try Again
          </Button>
        )}
      </div>
    </div>
  )
}
