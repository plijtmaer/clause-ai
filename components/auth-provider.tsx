"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { User } from '@supabase/supabase-js'
import AuthModal from './auth-modal'
import { LogOut, User as UserIcon, BarChart3 } from 'lucide-react'

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
  showAuthModal: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
      
      // Show auth modal if no user (mandatory login)
      if (!session?.user) {
        setShowModal(true)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
        
        // Show auth modal if user logs out
        if (!session?.user && event === 'SIGNED_OUT') {
          setShowModal(true)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  const showAuthModal = () => {
    setShowModal(true)
  }

  const handleAuthSuccess = (user: User) => {
    setUser(user)
    setShowModal(false)
  }

  const value = {
    user,
    loading,
    signOut,
    showAuthModal,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
      
      {/* Auth Modal */}
      <AuthModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleAuthSuccess}
        mandatory={!user && !loading} // Mandatory if no user and not loading
      />
      
      {/* User Menu (when authenticated) */}
      {user && (
        <div className="fixed top-4 right-4 z-40">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-2 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-white/70" />
              <span className="text-white/90 text-sm font-medium">
                {user.email?.split('@')[0]}
              </span>
            </div>
            <a
              href="/dashboard"
              className="p-1.5 hover:bg-white/10 rounded-md transition-colors group"
              title="Dashboard"
            >
              <BarChart3 className="w-4 h-4 text-white/60 group-hover:text-white/90" />
            </a>
            <button
              onClick={signOut}
              className="p-1.5 hover:bg-white/10 rounded-md transition-colors group"
              title="Sign out"
            >
              <LogOut className="w-4 h-4 text-white/60 group-hover:text-white/90" />
            </button>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  )
} 