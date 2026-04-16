import Image from "next/image"
import { LoginForm } from "@/components/auth/login-form"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <Image
            src="/ckrea-logo.png"
            alt="C-Krea logo"
            width={200}
            height={200}
            className="drop-shadow-lg"
          />
          <h1 className="mt-4 text-xl font-semibold text-white">C-Krea PayControl</h1>
          <p className="mt-1 text-sm text-slate-400">Central Kreativa — Portal de Pagos</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-700 bg-slate-800 p-7 shadow-xl">
          <h2 className="mb-6 text-base font-semibold text-white">Iniciar Sesión</h2>
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
