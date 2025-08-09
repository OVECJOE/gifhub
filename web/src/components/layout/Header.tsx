'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'

export function Header() {
  const pathname = usePathname()
  const { status } = useSession()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  
  const link = (href: string, label: string, mobile = false) => (
    <Link
      key={href}
      href={href}
      className={`${
        mobile 
          ? 'block px-4 py-3 text-lg border-b border-gray-200/30 hover:bg-white/20' 
          : 'p-2 text-base lg:text-lg'
      } ${pathname === href ? 'font-semibold' : ''} transition-all duration-200`}
      onClick={() => mobile && setIsMenuOpen(false)}
    >
      {label}
    </Link>
  )

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
    setIsMenuOpen(false)
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <header className="bg-white/60 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-50">
      <nav className="container mx-auto px-4 sm:px-6 py-4">
        {/* Desktop and Mobile Header Bar */}
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link 
            href="/" 
            className="text-xl sm:text-2xl lg:text-3xl font-bold text-black"
            onClick={() => setIsMenuOpen(false)}
          >
            GifHub
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2 text-black">
            {link('/explore', 'Explore')}
            
            {status === 'authenticated' ? (
              <>
                {link('/dashboard', 'Dashboard')}
                <button
                  onClick={handleSignOut}
                  className="p-2 text-base lg:text-lg hover:font-semibold transition-all duration-200"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                {link('/login', 'Login')}
                {link('/register', 'Register')}
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className="md:hidden p-2 text-black focus:outline-none focus:ring-2 focus:ring-gray-200 rounded"
            aria-label="Toggle navigation menu"
          >
            <svg
              className={`w-6 h-6 transition-transform duration-200 ${isMenuOpen ? 'rotate-90' : ''}`}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        <div className={`md:hidden transition-all duration-300 ease-in-out ${
          isMenuOpen 
            ? 'max-h-96 opacity-100 mt-4' 
            : 'max-h-0 opacity-0 overflow-hidden'
        }`}>
          <div className="bg-white/40 backdrop-blur-sm border border-gray-200/50 shadow-lg">
            {link('/explore', 'Explore', true)}
            
            {status === 'authenticated' ? (
              <>
                {link('/dashboard', 'Dashboard', true)}
                <button
                  onClick={handleSignOut}
                  className="block w-full text-left px-4 py-3 text-lg border-b border-gray-200/30 hover:bg-white/20 transition-all duration-200"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                {link('/login', 'Login', true)}
                {link('/register', 'Register', true)}
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  )
}


