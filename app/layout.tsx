import { Analytics } from "@vercel/analytics/next"
import type { Metadata, Viewport } from "next"
import { Cormorant_Garamond, Inter } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import { AppShell } from "@/components/app-shell"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-serif",
})

export const metadata: Metadata = {
  title: "Hébergement & Transport — Mariage M&K",
  description:
    "Gérez l'hébergement et le transport des invités du mariage de M&K : suivi, affectations et alertes.",
  generator: "v0.app",
}

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#6D1925",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" className={`light ${inter.variable} ${cormorant.variable}`}>
      <body className="antialiased font-sans">
        <AppShell>{children}</AppShell>
        <Toaster richColors position="top-center" />
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
