import { create } from "zustand"
import type { Usuario, PresupuestoDB, ObraDB, CambiosObra } from "@/types"
import { 
  obtenerPresupuestos, crearPresupuesto, actualizarEstadoPresupuesto,
  obtenerObras, crearObra, actualizarObraApi
} from "@/lib/api"

interface AppState {
  usuario: Usuario | null
  presupuestos: PresupuestoDB[]
  obras: ObraDB[]
  cargandoPresupuestos: boolean
  cargandoObras: boolean

  setUsuario: (usuario: Usuario | null) => void
  logout: () => void
  
  fetchPresupuestos: () => Promise<void>
  agregarPresupuesto: (presupuesto: Omit<PresupuestoDB, "id">) => Promise<boolean>
  actualizarPresupuesto: (id: number, cambios: Partial<PresupuestoDB>) => Promise<boolean>

  fetchObras: () => Promise<void>
  agregarObra: (obra: Omit<ObraDB, "id" | "avance">) => Promise<boolean>
  actualizarObra: (id: number, cambios: CambiosObra) => Promise<void>
}

export const useAppStore = create<AppState>((set) => ({
  usuario: null,
  presupuestos: [],
  obras: [],
  cargandoPresupuestos: false,
  cargandoObras: false,

  setUsuario: (usuario) => set({ usuario }),
  logout: () => set({ usuario: null }),

  fetchPresupuestos: async () => {
    set({ cargandoPresupuestos: true })
    try { const data = await obtenerPresupuestos(); set({ presupuestos: data }) } 
    catch (error) { console.error(error) } 
    finally { set({ cargandoPresupuestos: false }) }
  },
  agregarPresupuesto: async (nuevo) => {
    try { const data = await crearPresupuesto(nuevo); set((state) => ({ presupuestos: [data, ...state.presupuestos] })); return true } 
    catch (error) { console.error(error); return false }
  },
  actualizarPresupuesto: async (id, cambios) => {
    try {
      if (!cambios.estado) return false;
      const data = await actualizarEstadoPresupuesto(id, cambios.estado);
      set((state) => ({ presupuestos: state.presupuestos.map((p) => (p.id === id ? { ...p, ...data } : p)) }));
      return true;
    } catch (error) { console.error(error); return false }
  },

  fetchObras: async () => {
    set({ cargandoObras: true })
    try { const data = await obtenerObras(); set({ obras: data }) } 
    catch (error) { console.error(error) } 
    finally { set({ cargandoObras: false }) }
  },
  agregarObra: async (nueva) => {
    try { const data = await crearObra(nueva); set((state) => ({ obras: [data, ...state.obras] })); return true } 
    catch (error) { console.error(error); return false }
  },
  actualizarObra: async (id, cambios) => {
    const data = await actualizarObraApi(id, cambios);
    set((state) => ({ obras: state.obras.map((o) => (o.id === id ? { ...o, ...data } : o)) }));
  },
}))