'use client'

import { ChildProvider } from '@/lib/contexts/ChildContext'
import { ReactNode } from 'react'

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <ChildProvider>
      {children}
    </ChildProvider>
  )
}
