import { useAppStore } from "@/store/useAppStore";

export function usePermissions() {
  const rol = useAppStore((state) => state.usuario?.rol);
  return {
    rol,
    puedeGestionarObras: rol === "Gerencia" || rol === "Supervisor",
    puedeVerFinanzas: rol === "Gerencia" || rol === "Finanzas",
    puedeAprobarPresupuestos: rol === "Gerencia",
    esTecnico: rol === "Técnico",
  };
}
