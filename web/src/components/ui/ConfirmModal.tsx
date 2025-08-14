import * as React from 'react'
import { Modal } from './Modal'
import { Button } from './Button'

type ConfirmModalProps = {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'default'
}

export function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default'
}: ConfirmModalProps) {
  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={title}
      size="sm"
      showCloseButton={false}
    >
      <div className="space-y-4">
        <p className="text-gray-700">{message}</p>
        
        <div className="flex gap-3 justify-end">
          <Button 
            variant="secondary" 
            onClick={onClose}
            className="px-4 py-2"
          >
            {cancelText}
          </Button>
          <Button 
            onClick={handleConfirm}
            className={`px-4 py-2 ${variant === 'danger' ? 'bg-red-600 hover:bg-red-700' : ''}`}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
