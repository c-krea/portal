import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { PostHogProvider } from "@/components/posthog-provider"
import { PwaRegister } from "@/components/pwa-register"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

export const metadata: Metadata = {
  title: "C-Krea PayControl",
  description: "Portal de control de pagos — Central Kreativa",
  manifest: "/manifest.webmanifest",
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
      </body>
    </html>
  )
}
