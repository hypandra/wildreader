'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react'
import { useSession } from '@/lib/auth-client'
import { getChildren } from '@/lib/db/children'
import { getSession, updateSession as updateDbSession } from '@/lib/db/sessions'
import type { ChildProfile, SessionState } from '@/types'

interface ChildContextType {
  activeChildId: string | null
  setActiveChildId: (id: string) => void
  children: ChildProfile[]
  loadChildren: (options?: { force?: boolean }) => Promise<void>
  loading: boolean
  session: SessionState
  updateSession: (updates: Partial<SessionState>) => Promise<void>
  refreshSession: () => Promise<void>
}

const ChildContext = createContext<ChildContextType | null>(null)

export function ChildProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession()
  const [activeChildId, setActiveChildIdState] = useState<string | null>(null)
  const [childrenList, setChildrenList] = useState<ChildProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [sessionState, setSessionState] = useState<SessionState>({
    currentGame: null,
    streak: 0,
    totalStars: 0,
    difficultyByGame: {}
  })
  const childrenLoadedRef = useRef(false)
  const childrenLoadingRef = useRef<Promise<void> | null>(null)
  const authFailedRef = useRef(false)
  const lastUserIdRef = useRef<string | null>(null)

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('active_child_id')
    if (stored) setActiveChildIdState(stored)
    setLoading(false)
  }, [])

  const setActiveChildId = async (id: string) => {
    setActiveChildIdState(id)
    localStorage.setItem('active_child_id', id)

    // Load session for the new active child
    try {
      const childSession = await getSession(id)
      setSessionState(childSession)
    } catch (error) {
      console.error('Failed to load session for child:', error)
    }
  }

  const loadChildren = useCallback(async (options?: { force?: boolean }) => {
    if (authFailedRef.current) return
    const force = options?.force === true
    if (force) {
      childrenLoadedRef.current = false
      authFailedRef.current = false
    }

    if (childrenLoadedRef.current) return
    if (childrenLoadingRef.current) return childrenLoadingRef.current

    childrenLoadingRef.current = (async () => {
      try {
        // Check if user is authenticated via Better Auth
        if (!session?.user) {
          setChildrenList([])
          childrenLoadedRef.current = true
          return
        }

        // Use the database helper function
        const data = await getChildren({ force })
        setChildrenList(data)
        childrenLoadedRef.current = true

        // Auto-select if only one child
        if (data.length === 1 && !activeChildId) {
          await setActiveChildId(data[0].id)
        }
      } catch (error) {
        const status = (error as { status?: number })?.status
        if (status === 401) {
          authFailedRef.current = true
        }
        console.error('Failed to load children:', error)
        setChildrenList([])
        childrenLoadedRef.current = true
      } finally {
        childrenLoadingRef.current = null
      }
    })()

    return childrenLoadingRef.current
  }, [activeChildId, session?.user])

  const updateSession = async (updates: Partial<SessionState>) => {
    if (!activeChildId) return

    const newSession = { ...sessionState, ...updates }
    setSessionState(newSession)

    // Update database in background
    try {
      await updateDbSession(activeChildId, newSession)
    } catch (error) {
      console.error('Failed to update session in database:', error)
    }
  }

  const refreshSession = async () => {
    if (!activeChildId) return

    try {
      const childSession = await getSession(activeChildId)
      setSessionState(childSession)
    } catch (error) {
      console.error('Failed to refresh session:', error)
    }
  }

  // Load session when activeChildId changes
  useEffect(() => {
    if (activeChildId) {
      getSession(activeChildId)
        .then(setSessionState)
        .catch((error) => console.error('Failed to load session:', error))
    }
  }, [activeChildId])

  useEffect(() => {
    const currentUserId = session?.user?.id ?? null
    if (lastUserIdRef.current !== currentUserId) {
      lastUserIdRef.current = currentUserId
      childrenLoadedRef.current = false
      authFailedRef.current = false
      childrenLoadingRef.current = null
      setChildrenList([])
    }

    if (!currentUserId) {
      return
    }

    loadChildren().catch((error) => {
      console.error('Failed to load children:', error)
    })
  }, [session?.user?.id, loadChildren])

  return (
    <ChildContext.Provider value={{
      activeChildId,
      setActiveChildId,
      children: childrenList,
      loadChildren,
      loading,
      session: sessionState,
      updateSession,
      refreshSession
    }}>
      {children}
    </ChildContext.Provider>
  )
}

export function useChild() {
  const context = useContext(ChildContext)
  if (!context) throw new Error('useChild must be used within ChildProvider')
  return context
}
