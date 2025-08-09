import Link from 'next/link'
import { Button } from '@/app/components/ui/Button'
import { GlassCard } from '@/app/components/ui/GlassCard'

export default function Home() {
  return (
    <div className="space-y-8">
      <section className="text-center">
        <h1 className="text-3xl md:text-5xl font-bold leading-tight max-w-xl mx-auto">Create, Organize, and Share High-Quality GIFs</h1>
        <p className="text-lg md:text-2xl mt-4 max-w-2xl mx-auto">Upload videos, convert to GIFs client-side, and share publicly.</p>
        <div className="mt-6 flex justify-center gap-4">
          <Link href="/upload"><Button>Get Started</Button></Link>
          <Link href="/explore"><Button variant="secondary">Explore</Button></Link>
        </div>
      </section>
      <section>
        <GlassCard>
          <h2 className="text-2xl md:text-3xl font-semibold mb-4">Public GIF Showcase</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white/80 border border-gray-200 h-32"></div>
            ))}
          </div>
        </GlassCard>
      </section>
    </div>
  )
}
