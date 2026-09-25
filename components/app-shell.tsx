"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BedDouble, Car, Home } from "lucide-react"
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
        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-[#6D1925]/10 bg-[#FFF7E9]/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="shrink-0">
            <p className="font-serif text-2xl font-semibold leading-none sm:text-3xl text-[#6D1925]">Mahery & Kanto</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.13em] sm:text-sm text-[#6D1925]/45">Hébergement & transport</p>
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
