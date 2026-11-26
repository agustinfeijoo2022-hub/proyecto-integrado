import { useLocation } from "react-router-dom";

const fotosPorSeccion: Readonly<Record<string, number>> = {
  catalogo: 11678431,
  compras: 4487383,
  recepcion: 34585120,
  obras: 40607626,
  "mis-obras": 5463580,
  solicitudes: 13804490,
  "solicitudes-presupuesto": 4342126,
  presupuestos: 33175651,
  clientes: 8730120,
  facturacion: 8297220,
  cobranza: 7651738,
  reportes: 8062355,
  usuarios: 5561916,
  notificaciones: 4476635,
};

const encuadres: Partial<Record<number, string>> = {
  28726413: "48% 49%",
  29786116: "50% 48%",
  11678431: "50% 61%",
  40607626: "50% 47%",
  32497161: "54% 43%",
  34585120: "54% 53%",
  33175651: "50% 62%",
};

function pexels(id: number, ancho: number) {
  return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${ancho}`;
}

export default function SectionPhoto({ acceso = false, gerencia = false }: {
  acceso?: boolean;
  gerencia?: boolean;
}) {
  const { pathname } = useLocation();
  const [, , seccion, detalle] = pathname.split("/");
  const id = acceso ? 28726413
    : seccion === "dashboard" ? (gerencia ? 7857566 : 29786116)
    : seccion === "obras" && detalle ? 32497161
    : fotosPorSeccion[seccion];

  if (!id) return null;

  return (
    <div className={acceso ? "fyag-photo-frame fyag-photo-login" : "fyag-photo-frame"} aria-hidden="true">
      <img key={id} className="fyag-photo" alt="" referrerPolicy="no-referrer" decoding="async"
        style={{ objectPosition: encuadres[id] }}
        src={pexels(id, 800)}
        srcSet={`${pexels(id, 480)} 480w, ${pexels(id, 800)} 800w, ${pexels(id, 1280)} 1280w`}
        sizes={acceso ? "(min-width: 1024px) 440px, (min-width: 768px) 44vw, 100vw" : "(min-width: 1440px) 576px, (min-width: 1024px) 42vw, 100vw"}
        onError={event => { event.currentTarget.hidden = true; }}
      />
    </div>
  );
}
