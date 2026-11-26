const cookieName = "fyag_session"

export function crearAutenticador(sesiones) {
  return function autenticar(req, res, next) {
    const token = (req.headers.cookie || "").split(";").map((p) => p.trim()).find((p) => p.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1)
    const sesion = sesiones.get(token)

    if (!sesion || sesion.expira <= Date.now()) {
      if (token) sesiones.delete(token)
      res.clearCookie(cookieName)
      return res.status(401).json({ error: "Tu sesión no está activa. Vuelve a ingresar." })
    }
    req.usuario = sesion.usuario
    next()
  }
}

export function permitir(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.usuario.rol)) {
      return res.status(403).json({ error: "No tienes permiso para realizar esta operación." })
    }
    next()
  }
}

export function validarEsquema(schema) {
  return (req, res, next) => {
    const resultado = schema.safeParse(req.body)
    if (!resultado.success) {
      return res.status(400).json({ 
        error: "Datos inválidos", 
        detalles: resultado.error.issues.map(e => `${e.path.join('.')}: ${e.message}`) 
      })
    }
    req.body = resultado.data
    next()
  }
}