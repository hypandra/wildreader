"use client"

type DemoCaptionProps = {
  text: string
}

export function DemoCaption({ text }: DemoCaptionProps) {
  return (
    <div className="absolute bottom-4 left-0 right-0 flex justify-center px-4 z-10">
      <div className="bg-bark/90 backdrop-blur-sm text-cream px-4 py-2 rounded-lg text-sm font-medium max-w-md text-center shadow-soft">
        {text}
      </div>
    </div>
  )
}
