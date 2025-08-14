'use client'

import * as React from 'react'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary'
  pVal?: string
}

export function Button({ variant = 'primary', className = '', children, pVal, ...props }: ButtonProps) {
  const base = `text-lg md:text-xl font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-black active:opacity-90 ${pVal || 'px-6 py-3'}`
  const styles =
    variant === 'primary'
      ? 'bg-black text-white hover:bg-gray-800'
      : 'bg-white/80 text-black border border-gray-300 hover:bg-white'
  return (
    <button className={`${base} ${styles} ${className}`} {...props}>
      {children}
    </button>
  )
}


