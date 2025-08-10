'use client'

import * as React from 'react'
import { useEffect } from 'react'

type ModalProps = {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showCloseButton?: boolean
}

export function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  showCloseButton = true 
}: ModalProps) {
  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizeClasses = {
    sm: 'w-[95vw] max-w-md',
    md: 'w-[95vw] max-w-2xl',
    lg: 'w-[95vw] max-w-4xl',
    xl: 'w-[95vw] max-w-6xl'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className={`relative bg-white/90 backdrop-blur-sm shadow-lg ${sizeClasses[size]} max-h-[90vh] overflow-hidden`}>
        {/* Header */}
        {title && (
          <div className="p-6 border-b border-gray-200/60 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-black">{title}</h3>
            {showCloseButton && (
              <button 
                className="text-gray-500 hover:text-black transition-colors duration-200 p-2 -m-2" 
                onClick={onClose}
                aria-label="Close modal"
              >
                <span className="text-2xl">✕</span>
              </button>
            )}
          </div>
        )}
        
        {/* Body */}
        <div className="p-6 overflow-auto max-h-[calc(90vh-120px)]">
          {children}
        </div>
      </div>
    </div>
  )
}
