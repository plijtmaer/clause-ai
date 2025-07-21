"use client"

import React, { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { User, Mail, Lock, X, Loader2, Shield } from 'lucide-react'
import Button from '@/components/ui/button'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (user: any) => void
  mandatory?: boolean // New prop for mandatory login
}

export default function AuthModal({ isOpen, onClose, onSuccess, mandatory = false }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error

        if (data.user) {
          onSuccess(data.user)
          onClose()
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        })

        if (error) throw error

        if (data.user) {
          if (data.user.email_confirmed_at) {
            onSuccess(data.user)
            onClose()
          } else {
            setError('Please check your email and click the confirmation link.')
          }
        }
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 w-full max-w-md relative">
        {/* Close Button - Only show if not mandatory */}
        {!mandatory && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-white/70" />
          </button>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {mandatory 
              ? (mode === 'login' ? 'Sign In Required' : 'Create Account Required')
              : (mode === 'login' ? 'Welcome Back' : 'Create Account')
            }
          </h2>
          <p className="text-white/60">
            {mandatory 
              ? 'You must sign in to continue using Clause AI'
              : (mode === 'login' 
                ? 'Sign in to upload and analyze documents' 
                : 'Sign up to get started with document analysis'
              )
            }
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="w-full pl-11 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/50 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 outline-none transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                minLength={6}
                className="w-full pl-11 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/50 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 outline-none transition-all"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-3 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              mode === 'login' ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="mt-6 text-center">
          <p className="text-white/60 text-sm">
            {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login')
                setError('')
              }}
              className="ml-2 text-purple-300 hover:text-purple-200 font-medium transition-colors"
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>

        {/* Features for new users */}
        {mode === 'signup' && (
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-white/60 text-xs mb-3">What you'll get:</p>
            <ul className="space-y-2 text-xs text-white/50">
              <li className="flex items-center">
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mr-3"></div>
                Upload PDF & DOCX documents
              </li>
              <li className="flex items-center">
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mr-3"></div>
                AI-powered legal analysis
              </li>
              <li className="flex items-center">
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mr-3"></div>
                Document history & management
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
} 