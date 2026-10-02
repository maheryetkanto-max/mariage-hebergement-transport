import { Analytics } from "@vercel/analytics/next"
import type { Metadata, Viewport } from "next"
import { Cormorant_Garamond, Inter } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import { AppShell } from "@/components/app-shell"
import "./globals.css"

// Final UX release 2026-10-02

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-serif",
})

export const metadata: Metadata = {
  metadataBase: new URL("https://mariage-mk-app.vercel.app"),
  title: "Mahery & Kanto — Hébergement & Transport",
  applicationName: "Mahery & Kanto",
  description:
    "Trouvez ou proposez un hébergement et un transport pour le mariage de Mahery & Kanto.",
  openGraph: {
    title: "Mahery & Kanto — Covoiturage & Cohébergement",
    description:
      "Hébergement & transport pour le mariage de Mahery & Kanto.",
    url: "https://mariage-mk-app.vercel.app",
    siteName: "Mahery & Kanto",
    locale: "fr_FR",
    type: "website",
    images: [
      {
        url: "/og-photo",
        width: 382,
        height: 200,
        alt: "Mahery et Kanto",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mahery & Kanto — Covoiturage & Cohébergement",
    description:
      "Hébergement & transport pour le mariage de Mahery & Kanto.",
    images: ["/og-covoiturage-hebergement.jpg"],
  },
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
