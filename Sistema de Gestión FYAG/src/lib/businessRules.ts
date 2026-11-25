export const validarCreacionObra = (presupuesto?: any) => {
  if (!presupuesto) {
    return "Selecciona un presupuesto de origen.";
  }

  // Convertimos el estado a texto y lo comparamos sin importar mayúsculas/minúsculas
  const estadoActual = String(presupuesto.estado).trim();

  if (estadoActual !== "Aprobado") {
    return "La obra solo puede crearse desde un presupuesto aprobado.";
  }

  return null;
};
