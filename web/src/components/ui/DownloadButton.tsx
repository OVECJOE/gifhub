'use client'

import { Button } from './Button'
import { downloadFile } from '@/lib/utils'

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
    } catch (error) {
      alert(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
