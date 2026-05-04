import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { PostHogProvider } from "@/components/posthog-provider"
import { PwaRegister } from "@/components/pwa-register"
import { OfflineDetector } from "@/components/offline-detector"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

export const metadata: Metadata = {
  title: "C-Krea PayControl",
  description: "Portal de control de pagos — Central Kreativa",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon-v3.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/icons/favicon-32x32.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PayControl",
  },
}

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: "#0f172a",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`}>
      <body className="flex h-full bg-slate-50">
        <PostHogProvider>{children}</PostHogProvider>
        <PwaRegister />
        <OfflineDetector />
      </body>
    </html>
  )
}
