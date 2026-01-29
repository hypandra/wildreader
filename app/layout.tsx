import type { Metadata } from "next"
import "./globals.css"
import { AuthProvider } from "@/components/AuthProvider"
import { AudioProvider } from "@/lib/contexts/AudioContext"
import { Footer } from "@/components/Footer"

export const metadata: Metadata = {
  title: "Wild Reader",
  description: "A magical reading adventure for little learners",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-body">
        <AuthProvider>
          <AudioProvider>
            {children}
            <Footer />
          </AudioProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

