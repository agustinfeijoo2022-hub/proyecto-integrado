import { create } from "zustand"

import type { Obra, Presupuesto, Usuario } from "@/types"

import {
  obras as obrasIniciales,
  presupuestos as presupuestosIniciales,
} from "@/data/mockData"

interface AppState {
  usuario: Usuario | null

  obras: Obra[]

  presupuestos: Presupuesto[]

  setUsuario: (usuario: Usuario | null) => void

  logout: () => void

  actualizarObra: (id: string, cambios: Partial<Obra>) => void

  agregarObra: (obra: Obra) => void

  agregarPresupuesto: (presupuesto: Presupuesto) => void

  actualizarPresupuesto: (id: string, cambios: Partial<Presupuesto>) => void
}

export const useAppStore = create<AppState>((set) => ({
  usuario: null,

  obras: obrasIniciales,

  presupuestos: presupuestosIniciales,

  setUsuario: (usuario) => set({ usuario }),

  logout: () => set({ usuario: null }),

  actualizarObra: (id, cambios) =>
    set((state) => ({
      obras: state.obras.map((obra) =>
        obra.id === id ? { ...obra, ...cambios } : obra,
      ),
    })),

  agregarObra: (obra) => set((state) => ({ obras: [obra, ...state.obras] })),

  agregarPresupuesto: (presupuesto) =>
    set((state) => ({ presupuestos: [presupuesto, ...state.presupuestos] })),

  actualizarPresupuesto: (id, cambios) =>
    set((state) => ({
      presupuestos: state.presupuestos.map((p) =>
        p.id === id ? { ...p, ...cambios } : p,
      ),
    })),
}))
