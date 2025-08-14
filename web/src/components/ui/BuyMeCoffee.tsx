'use client'
import { useEffect } from 'react'

interface BuyMeCoffeeProps {
  username?: string
  className?: string
}

export function BuyMeCoffee({ username = 'misterlyserious', className = '' }: BuyMeCoffeeProps) {
  useEffect(() => {
    // Load Buy Me a Coffee script
    const script = document.createElement('script')
    script.src = 'https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js'
    script.setAttribute('data-name', 'BMC-Widget')
    script.setAttribute('data-cfasync', 'false')
    script.setAttribute('data-id', username)
    script.setAttribute('data-description', 'Support me on Buy me a coffee!')
    script.setAttribute('data-message', 'Thanks for using GifHub! If you find it useful, consider supporting the development.')
    script.setAttribute('data-color', '#40DCA5')
    script.setAttribute('data-position', 'Right')
    script.setAttribute('data-x_margin', '18')
    script.setAttribute('data-y_margin', '18')
    
    document.body.appendChild(script)
    
    return () => {
      // Cleanup script when component unmounts
      const existingScript = document.querySelector('script[data-name="BMC-Widget"]')
      if (existingScript) {
        document.body.removeChild(existingScript)
      }
      
      // Also remove the widget if it exists
      const widget = document.querySelector('#bmc-wbtn')
      if (widget) {
        widget.remove()
      }
    }
  }, [username])

  return (
    <div className={`buy-me-coffee ${className}`}>
      {/* The widget will be rendered by the script */}
    </div>
  )
}

// Alternative inline button component if you prefer a custom styled button
export function BuyMeCoffeeButton({ username = 'yourname', className = '' }: BuyMeCoffeeProps) {
  const handleClick = () => {
    window.open(`https://www.buymeacoffee.com/${username}`, '_blank')
  }

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-2 px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-black font-medium transition-colors ${className}`}
      title="Support this project"
    >
      ☕ Buy me a coffee
    </button>
  )
}
