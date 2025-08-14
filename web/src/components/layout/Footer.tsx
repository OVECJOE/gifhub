export function Footer() {
  return (
    <footer className="bg-white/60 backdrop-blur-sm border-t border-gray-200/50 mt-12">
      <div className="container mx-auto px-6 py-6 text-black text-lg md:text-xl">
        © {new Date().getFullYear()} GIFHub. All rights reserved.
      </div>
    </footer>
  )
}
