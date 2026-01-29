import Link from "next/link"

export function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 py-2 text-center text-xs text-bark/40 bg-cream/80 backdrop-blur-sm z-50">
      <Link href="/terms" className="hover:text-bark/60 hover:underline">
        Terms of Service
      </Link>
    </footer>
  )
}
