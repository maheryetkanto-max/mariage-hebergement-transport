"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BedDouble, Car, Globe2, Home, Play } from "lucide-react"
import { cn } from "@/lib/utils"

const NAV = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/hebergements", label: "Hébergement", icon: BedDouble },
  { href: "/transports", label: "Transport", icon: Car },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLegacyAdmin = pathname.startsWith("/invites") || pathname.startsWith("/admin")

  if (isLegacyAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b border-[#6D1925]/10 bg-white/70 px-4 py-2">
        <div className="mx-auto flex max-w-6xl items-center justify-end">
          <button
            type="button"
            onClick={() => {
              const existing = document.getElementById("mk-song-player")
              if (existing) {
                existing.remove()
                return
              }
              const iframe = document.createElement("iframe")
              iframe.id = "mk-song-player"
              iframe.src = "https://www.youtube.com/embed/w0NEOVbU3hQ?autoplay=1&playsinline=1"
              iframe.allow = "autoplay"
              iframe.style.position = "fixed"
              iframe.style.width = "1px"
              iframe.style.height = "1px"
              iframe.style.opacity = "0"
              iframe.style.pointerEvents = "none"
              document.body.appendChild(iframe)
            }}
            className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[#6D1925]/15 bg-[#FFF7E9] px-3 text-xs font-semibold text-[#6D1925]"
            aria-label="Lire notre chanson"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            Play
          </button>
        </div>
      </div>

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-[#6D1925]/10 bg-[#FFF7E9]/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="shrink-0">
            <p className="font-serif text-xl font-semibold leading-none text-[#6D1925]">Mahery & Kanto</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-[#6D1925]/45">Hébergement & transport</p>
          </Link>
          <nav className="flex items-center gap-1">
            {NAV.map((item) => {
              const Icon = item.icon
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium transition",
                    active ? "bg-[#6D1925] text-[#FFF7E9]" : "text-[#6D1925] hover:bg-[#6D1925]/5",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              )
            })}
            <a
              href="https://mahery-et-kanto.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium text-[#6D1925] transition hover:bg-[#6D1925]/5"
            >
              <Globe2 className="h-4 w-4" />
              <span className="hidden sm:inline">Notre site</span>
            </a>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>

      <footer className="mt-10 border-t border-[#6D1925]/10 px-4 py-8 text-center text-xs text-[#6D1925]/45">
        Mariage Mahery & Kanto · 31 décembre 2026
      </footer>
    </div>
  )
}
