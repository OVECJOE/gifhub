'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function Header() {
  const pathname = usePathname()
  const link = (href: string, label: string) => (
    <Link
      key={href}
      href={href}
      className={`px-3 py-2 text-lg md:text-xl ${pathname === href ? 'font-semibold' : ''}`}
    >
      {label}
    </Link>
  )
  return (
    <header className="bg-white/60 backdrop-blur-sm border-b border-gray-200/50">
      <nav className="container mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl md:text-3xl font-bold text-black">GifHub</Link>
        <div className="flex items-center gap-4 text-black">
          {link('/explore', 'Explore')}
          {link('/upload', 'Upload')}
          {link('/dashboard', 'Dashboard')}
          <Link href="/login" className="px-3 py-2 text-lg md:text-xl">Login</Link>
        </div>
      </nav>
    </header>
  )
}


