import { useAppStore } from "@/store/useAppStore";

export function usePermissions() {
  const usuario = useAppStore((state) => state.usuario);
  const rol = usuario?.rol;

  // Permiso para aprobar o rechazar presupuestos (Solo Gerencia)
  const puedeAprobarPresupuestos = rol === "Gerencia";

  // Permiso para gestionar obras (asignar técnicos, cambiar estados, etc.)
  // Lo tienen Gerencia y el Encargado de Bodega
  const puedeGestionarObras = rol === "Gerencia" || rol === "Encargado de Bodega";

  // Permiso para crear y editar artículos en el catálogo
  // Lo tienen el Encargado de Bodega y Finanzas (según lo que definimos)
  const puedeGestionarCatalogo = rol === "Encargado de Bodega" || rol === "Finanzas";

  // Permiso para registrar compras (Solo Finanzas)
  const puedeRegistrarCompras = rol === "Finanzas";

  // Permiso para confirmar la recepción de mercancía (Solo Encargado de Bodega)
  const puedeRecibirMercancia = rol === "Encargado de Bodega";

  return {
    puedeAprobarPresupuestos,
    puedeGestionarObras,
    puedeGestionarCatalogo,
    puedeRegistrarCompras,
    puedeRecibirMercancia,
  };
}