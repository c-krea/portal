import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { PostHogProvider } from "@/components/posthog-provider"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

export const metadata: Metadata = {
  title: "C-Krea PayControl",
  description: "Portal de control de pagos — Central Kreativa",
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
      </body>
    </html>
  )
}
