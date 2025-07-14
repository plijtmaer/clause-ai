"use client"

import React from 'react'
import { CheckCircle, Circle, AlertCircle, Loader2 } from 'lucide-react'

interface ProgressStep {
  step: number
  total: number
  message: string
  status: 'pending' | 'in_progress' | 'completed' | 'error'
}

interface ProgressStatusProps {
  progress: ProgressStep
  isVisible: boolean
}

const ProgressStatus: React.FC<ProgressStatusProps> = ({ progress, isVisible }) => {
  if (!isVisible) return null

  const steps = [
    "Extracting document content...",
    "Analyzing document structure...",
    "Calculating privacy scores...",
    "Generating final summary..."
  ]

  const getStepIcon = (stepIndex: number) => {
    const stepNumber = stepIndex + 1
    
    if (stepNumber < progress.step) {
      return <CheckCircle className="w-5 h-5 text-green-500" />
    } else if (stepNumber === progress.step) {
      if (progress.status === 'completed') {
        return <CheckCircle className="w-5 h-5 text-green-500" />
      } else if (progress.status === 'error') {
        return <AlertCircle className="w-5 h-5 text-red-500" />
      } else {
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
      }
    } else {
      return <Circle className="w-5 h-5 text-gray-400" />
    }
  }

  const getStepStatus = (stepIndex: number) => {
    const stepNumber = stepIndex + 1
    
    if (stepNumber < progress.step) {
      return "completed"
    } else if (stepNumber === progress.step) {
      return progress.status
    } else {
      return "pending"
    }
  }

  const progressPercentage = ((progress.step - 1) / progress.total) * 100

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-white">
          Analyzing Document
        </h3>
        <span className="text-xs text-white/60">
          {progress.step}/{progress.total}
        </span>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full bg-white/10 rounded-full h-2 mb-4">
        <div 
          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Current Step Message */}
      <div className="flex items-center gap-2 mb-4">
        {progress.status === 'in_progress' && (
          <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
        )}
        {progress.status === 'completed' && (
          <CheckCircle className="w-4 h-4 text-green-500" />
        )}
        {progress.status === 'error' && (
          <AlertCircle className="w-4 h-4 text-red-500" />
        )}
        <span className="text-sm text-white/90">{progress.message}</span>
      </div>

      {/* Step List */}
      <div className="space-y-2">
        {steps.map((step, index) => {
          const status = getStepStatus(index)
          return (
            <div key={index} className="flex items-center gap-3">
              {getStepIcon(index)}
              <span className={`text-sm ${
                status === 'completed' ? 'text-green-400' :
                status === 'in_progress' ? 'text-blue-400' :
                status === 'error' ? 'text-red-400' :
                'text-white/60'
              }`}>
                {step}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ProgressStatus 