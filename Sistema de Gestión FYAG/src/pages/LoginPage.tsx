import { useState, type FormEvent } from "react"

import { Navigate } from "react-router-dom"

import { Snowflake, ShieldCheck } from "lucide-react"

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
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden flex-col justify-between bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-14 text-white lg:flex">
        <div className="flex items-center gap-3 text-xl font-bold">
          <Snowflake className="size-10 text-blue-300" /> FYAG
        </div>
        <div>
          <span className="text-xs font-semibold uppercase tracking-[.25em] text-blue-300">
            Control operativo
          </span>
          <h1 className="mt-5 max-w-lg text-5xl font-bold leading-tight">
            Tu operación, conectada.
          </h1>
          <p className="mt-6 max-w-md leading-7 text-slate-300">
            Inventario, abastecimiento y obras en un mismo espacio de trabajo.
          </p>
        </div>
        <p className="flex items-center gap-2 text-sm text-slate-400">
          <ShieldCheck className="size-4" /> Acceso según responsabilidades
        </p>
      </section>
      <section className="grid place-items-center p-6 sm:p-12">
        <div className="fyag-card w-full max-w-md p-7 sm:p-10">
          <p className="text-sm font-bold tracking-widest text-blue-900">
            FYAG / GESTIÓN
          </p>
          <h2 className="mt-5 text-3xl font-bold tracking-tight">Bienvenido</h2>
          <p className="fyag-subtitle">Ingresa con tu cuenta de trabajo.</p>
          <form onSubmit={ingresar} className="mt-8 space-y-5">
            <div>
              <label htmlFor="email" className="fyag-label">
                Correo electrónico
              </label>
              <input
                id="email"
                autoComplete="username"
                type="email"
                required
                className="fyag-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="fyag-label">
                Contraseña
              </label>
              <input
                id="password"
                autoComplete="current-password"
                type="password"
                required
                className="fyag-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && (
              <p role="alert" className="fyag-error">
                {error}
              </p>
            )}
            <button disabled={enviando} className="fyag-button w-full">
              {enviando ? "Verificando…" : "Ingresar al sistema"}
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}
