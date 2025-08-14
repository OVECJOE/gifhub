import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export function BuyMeCoffee() {
  return (
    <div className="fixed bottom-4 right-6 z-50">
      <Link 
        href="https://www.buymeacoffee.com/misterlyserious" 
        target="_blank"
        rel="noopener noreferrer"
      >
        <Button 
          className="shadow-lg shadow-gray-500/50 hover:shadow-gray-500/70 transition-all duration-300 hover:scale-105"
          pVal='px-3 py-2'
          title="Support this project - Buy me a coffee"
          aria-label="Buy me a coffee"
        >
          ☕
        </Button>
      </Link>
    </div>
  )
}
