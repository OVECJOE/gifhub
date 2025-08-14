'use client'

import { Button } from './Button'
import { downloadFile } from '@/lib/utils'
import toast from 'react-hot-toast'

interface DownloadButtonProps {
  filename: string
  gifId: string
  variant?: 'primary' | 'secondary'
  className?: string
  children?: React.ReactNode
}

export function DownloadButton({ filename, gifId, variant = 'secondary', className, children }: DownloadButtonProps) {
  const handleDownload = async () => {
    try {
      await downloadFile(filename, `${gifId}.gif`)
      toast.success('GIF downloaded successfully!')
    } catch (error) {
      toast.error((error as Error).message || 'Download failed. Please try again.')
    }
  }

  return (
    <Button 
      variant={variant}
      className={className}
      onClick={handleDownload}
    >
      {children || '💾 Download'}
    </Button>
  )
}
