"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { BedDouble, Car, Globe2, Home, Music2, Pause, Play } from "lucide-react"
import { cn } from "@/lib/utils"

const NAV = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/hebergements", label: "Hébergement", icon: BedDouble },
  { href: "/transports", label: "Transport", icon: Car },
]

function WeddingVerseCard() {
  return (
    <aside
      aria-label="Verset du mariage"
      className="fixed bottom-3 left-3 z-40 w-[190px] rounded-2xl border border-white/15 bg-[#6D1925]/95 p-3 text-[#FFF7E9] shadow-lg backdrop-blur sm:bottom-4 sm:left-4 sm:w-[250px] sm:p-4"
    >
      <p className="font-serif text-sm font-semibold leading-tight sm:text-base">Éphésiens 3:20-21</p>
      <p className="mt-1.5 text-[9px] leading-[1.35] text-white/85 sm:text-[10px]">
        Or à celui qui peut faire par la puissance qui agit en nous, infiniment au-delà de tout ce que nous demandons ou pensons,
        à lui soit la gloire dans l’Église et en Jésus-Christ dans toutes les générations, aux siècles des siècles. Amen.
      </p>
    </aside>
  )
}

function SongButton() {
  return (
    <div className="fixed bottom-3 right-3 z-50 w-[calc(100vw-226px)] max-w-[145px] overflow-hidden rounded-xl border border-white/15 bg-[#6D1925] shadow-lg sm:bottom-4 sm:right-4 sm:w-[260px] sm:max-w-none sm:rounded-2xl">
      <div className="flex items-center gap-1.5 px-2 py-1.5 text-[#FFF7E9] sm:gap-2 sm:px-3 sm:py-2">
        <Music2 className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" aria-hidden="true" />
        <span className="truncate text-[10px] font-bold sm:text-sm">Notre chanson</span>
      </div>

      <div className="aspect-video w-full bg-black">
        <iframe
          title="Notre chanson — His Robes for Mine"
          src="https://www.youtube-nocookie.com/embed/w0NEOVbU3hQ?playsinline=1&controls=1&rel=0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="h-full w-full border-0"
        />
      </div>
    </div>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLegacyAdmin = pathname.startsWith("/invites") || pathname.startsWith("/admin")

  if (isLegacyAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
        <WeddingVerseCard />
        <SongButton />
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

      <main className="mx-auto w-full max-w-6xl px-4 py-6 pb-36 sm:px-6 sm:pb-32 lg:px-8 lg:py-8">{children}</main>

      <footer className="mt-10 border-t border-[#6D1925]/10 px-4 py-8 pb-36 text-center text-xs text-[#6D1925]/45 sm:pb-32">
        Mariage Mahery & Kanto · 31 décembre 2026
      </footer>

      <WeddingVerseCard />
      <SongButton />
    </div>
  )
}
