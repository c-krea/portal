import { LoginForm } from "@/components/auth/login-form"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-lg">
            <span className="text-lg font-bold text-slate-900">CK</span>
          </div>
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
