import * as React from 'react'
import * as Dialog from '@radix-ui/react-dialog'

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
  const sizeClasses = {
    sm: 'w-[95vw] max-w-md',
    md: 'w-[95vw] max-w-2xl',
    lg: 'w-[95vw] max-w-4xl',
    xl: 'w-[95vw] max-w-6xl'
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className={`fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] bg-white/90 backdrop-blur-sm shadow-lg ${sizeClasses[size]} max-h-[90vh] flex flex-col data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]`}>
          {/* Header */}
          {title && (
            <div className="p-6 border-b border-gray-200/60 flex items-center justify-between flex-shrink-0">
              <Dialog.Title className="text-xl font-semibold text-black">
                {title}
              </Dialog.Title>
              {showCloseButton && (
                <Dialog.Close className="text-gray-500 hover:text-black transition-colors duration-200 p-2 -m-2" aria-label="Close modal">
                  <span className="text-2xl">✕</span>
                </Dialog.Close>
              )}
            </div>
          )}
          
          {/* Body */}
          <div className="p-6 overflow-y-auto flex-1">
            {children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
