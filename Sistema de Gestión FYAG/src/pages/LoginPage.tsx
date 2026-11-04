import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router";
import { ArrowRight, CheckCircle2, Snowflake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/input";
import { Muted, PageTitle } from "@/components/ui/typography";
import { useAppStore } from "@/store/useAppStore";
import type { Rol } from "@/types";

export default function LoginPage() {
  const [rol, setRol] = useState<Rol>("Gerencia");
  
  // Nuevos estados para capturar lo que el usuario escribe
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const usuario = useAppStore((state) => state.usuario);
  const login = useAppStore((state) => state.login);
  const navigate = useNavigate();

  if (usuario) return <Navigate to={usuario.rol === "Técnico" ? "/mis-obras" : "/dashboard"} replace />;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    // Aquí podrías agregar una validación extra si quisieras, 
    // pero como es prototipo, dejará pasar cualquier cosa.
    login(rol);
    navigate(rol === "Técnico" ? "/mis-obras" : "/dashboard");
  };

  return (
    <div className="grid min-h-screen bg-app lg:grid-cols-2">
      <section className="hidden bg-sidebar p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid size-12 place-items-center rounded-xl bg-white/10"><Snowflake /></div>
          <div><div className="text-2xl font-bold">FYAG</div><div className="text-sm text-blue-200">Frío y Agroindustria SpA</div></div>
        </div>
        <div className="max-w-lg">
          <div className="text-4xl font-bold leading-tight">Control total de cada obra, desde el presupuesto hasta el cobro.</div>
          <div className="mt-5 text-lg leading-relaxed text-blue-100">Centraliza la operación, asegura la trazabilidad y toma decisiones con información actualizada.</div>
        </div>
        <div className="grid gap-3 text-sm text-blue-100">
          {["Workflows con reglas de negocio", "Indicadores gerenciales en tiempo real", "Acceso seguro según cada rol"].map((item) => (
            <div className="flex items-center gap-2" key={item}><CheckCircle2 className="size-5 text-success" />{item}</div>
          ))}
        </div>
      </section>

      <section className="grid place-items-center p-5">
        <Card className="w-full max-w-md">
          <CardContent className="p-7 sm:p-9">
            <div className="mb-7 lg:hidden">
              <div className="flex items-center gap-2 font-bold text-primary"><Snowflake />FYAG</div>
            </div>
            
            <PageTitle>Bienvenido</PageTitle>
            <Muted className="mt-2">Selecciona un perfil para acceder al entorno de demostración.</Muted>

            <form className="mt-7 grid gap-5" onSubmit={submit}>
              
              {/* CORREO: Ahora se puede escribir */}
              <Field label="Correo electrónico">
                <Input 
                  type="email" 
                  placeholder="ej: gerencia@fyag.cl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Field>

              {/* CONTRASEÑA: Ahora se puede escribir */}
              <Field label="Contraseña">
                <Input 
                  type="password" 
                  placeholder="Ingresa tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Field>

              {/* ROL: Se queda igual, seleccionable */}
              <Field label="Rol de acceso">
                <Select value={rol} onChange={(event) => setRol(event.target.value as Rol)}>
                  <option>Gerencia</option>
                  <option>Finanzas</option>
                  <option>Supervisor</option>
                  <option>Técnico</option>
                </Select>
              </Field>

              <Button type="submit" className="mt-2 w-full">
                Ingresar al sistema <ArrowRight className="size-4" />
              </Button>
            </form>

            <div className="mt-6 rounded-lg bg-info-light p-3 text-xs leading-relaxed text-info-dark">
              <strong>Entorno demo:</strong> Ingresa tu correo y contraseña asignados e ingresa al sistema.
            </div>

          </CardContent>
        </Card>
      </section>
    </div>
  );
}