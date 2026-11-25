import { useState, type FormEvent } from "react"
import { Navigate } from "react-router-dom"
import { ArrowRight, Boxes, LockKeyhole, Mail } from "lucide-react"
import ThemeToggle from "@/components/ThemeToggle"
import { useAppStore } from "@/store/useAppStore"
import { api, mensajeError } from "@/lib/api"
import { inicioPorRol } from "@/app/access"
import type { Usuario } from "@/types"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [enviando, setEnviando] = useState(false)

  const usuario = useAppStore((s) => s.usuario)
  const setUsuario = useAppStore((s) => s.setUsuario)

  if (usuario) return <Navigate to={inicioPorRol(usuario.rol)} replace />

  async function ingresar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (enviando) return

    setError("")
    setEnviando(true)

    try {
      const user = await api<Usuario>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      })

      setPassword("")
      setUsuario(user)
    } catch (err) {
      setError(mensajeError(err))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <main className="fyag-workspace relative grid min-h-screen place-items-center bg-app px-4 py-10 text-foreground sm:px-8">
      <div className="absolute right-4 top-4 sm:right-8" aria-label="Tema de la interfaz"><ThemeToggle /></div>
      <div className="mt-8 grid w-full max-w-5xl overflow-hidden rounded-3xl border border-border bg-card md:grid-cols-[minmax(0,.85fr)_minmax(0,1.15fr)]">
        <section className="relative isolate flex min-w-0 flex-col justify-between overflow-hidden bg-[#153d30] px-6 py-7 text-white dark:bg-[#102a22] sm:px-10 md:min-h-[490px] md:py-11">
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 -right-32 -z-10 size-[26rem] rounded-full border-[48px] border-white/5" />
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-white/10 text-emerald-100">
              <Boxes className="size-5" aria-hidden="true" />
            </span>
            <span className="text-xl font-semibold tracking-tight">FYAG</span>
          </div>
          <div className="mt-6 md:mb-7">
            <p className="max-w-xs text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">Logística e inventario</p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-emerald-100">Gestiona obras, existencias y compras en un solo lugar.</p>
          </div>
        </section>
        <section className="grid min-w-0 place-items-center px-6 py-8 sm:px-12 sm:py-12">
          <div className="w-full max-w-sm">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Iniciar sesión</h1>
            <p className="mt-2 text-sm text-muted-foreground">Ingresa con tu cuenta de trabajo.</p>
            <form onSubmit={ingresar} className="mt-8 space-y-5">
              <div>
                <label htmlFor="email" className="fyag-label">
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <input
                    id="email"
                  autoComplete="username"
                  type="email"
                  required
                  className="fyag-input pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="password" className="fyag-label">
                  Contraseña
                </label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <input
                    id="password"
                  autoComplete="current-password"
                  type="password"
                  required
                  className="fyag-input pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
              {error && (
                <p role="alert" className="fyag-error">
                  {error}
                </p>
              )}
              <button type="submit" disabled={enviando} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-dark dark:hover:bg-primary/85">
                {enviando ? "Verificando…" : "Ingresar al sistema"} <ArrowRight className="size-4" aria-hidden="true" />
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  )
}