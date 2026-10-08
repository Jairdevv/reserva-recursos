import { Link } from "react-router-dom";
import type { Recurso } from "../../recursos/types";

type Props = {
  recurso: Recurso | null;
  seleccion: { inicio: string; fin: string } | null;
  enviando: boolean;
  zone: string;
  confirmar: () => void;
  limpiar: () => void;
};
const fechaHora = (value: string) => new Date(value).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" });

export default function ResumenReserva({ recurso, seleccion, enviando, zone, confirmar, limpiar }: Props) {
  const detalles = [
    ["Recurso", recurso?.nombre ?? "Cargando…"],
    ["Inicio", seleccion ? fechaHora(seleccion.inicio) : "—"],
    ["Fin", seleccion ? fechaHora(seleccion.fin) : "—"],
    ["Duración", seleccion ? `${Math.round((Date.parse(seleccion.fin) - Date.parse(seleccion.inicio)) / 60000)} minutos` : "—"],
    ["Zona horaria", zone],
  ];

  return <aside className="booking-sidebar" aria-labelledby="booking-summary-title">
    <div className="booking-summary-card">
      <div className="booking-photo">
        <img src="https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=800&q=80" alt="" onError={event => { event.currentTarget.style.visibility = "hidden"; }} />
        <span>Imagen ilustrativa</span><strong>{recurso?.nombre ?? "Tu espacio"}</strong>
      </div>
      <div className="booking-summary-body">
        <div className="booking-section-heading">
          <h2 id="booking-summary-title">Tu reserva</h2>
          <span className="booking-summary-state">{seleccion ? "Por confirmar" : "Sin selección"}</span>
        </div>
        <dl>{detalles.map(([nombre, value]) => <div key={nombre}><dt>{nombre}</dt><dd>{value}</dd></div>)}</dl>
        <p className="booking-summary-note">{seleccion ? "Revisa el horario y confirma tu reserva." : "Elige un horario para continuar."}</p>
        <button className="btn btn-primary booking-confirm" disabled={!seleccion || enviando || !recurso?.activo} onClick={confirmar}>
          {enviando ? "Reservando…" : "Confirmar reserva →"}
        </button>
        <div className="booking-summary-links">
          <button type="button" disabled={!seleccion || enviando} onClick={limpiar}>Limpiar selección</button>
          <Link to="/recursos">Volver al catálogo</Link>
        </div>
      </div>
    </div>
    <p className="booking-summary-note">La disponibilidad se verifica al confirmar.</p>
  </aside>;
}
