import * as React from 'react'

type CardProps = React.PropsWithChildren<{ className?: string }>

export function GlassCard({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-white/70 backdrop-blur-sm p-6 md:p-8 border border-gray-200/60 ${className}`}>
      {children}
    </div>
  )
}


