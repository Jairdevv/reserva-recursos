import { Link } from "react-router-dom";
import "../styles/Landing.css";

interface FilaTablero {
  recurso: string;
  horario: string;
  estado: "LIBRE" | "OCUPADO";
}

const filas: FilaTablero[] = [
  { recurso: "SALA A", horario: "14:00–16:00", estado: "OCUPADO" },
  { recurso: "CANCHA 2", horario: "16:00–18:00", estado: "LIBRE" },
  { recurso: "LAB 3", horario: "09:00–11:00", estado: "LIBRE" },
  { recurso: "SALA B", horario: "10:00–12:00", estado: "OCUPADO" },
  { recurso: "CANCHA 1", horario: "18:00–20:00", estado: "LIBRE" },
];

export default function Landing() {
  return (
    <div className="landing">
      <header className="landing-nav">
        <span className="landing-brand">ReserV</span>
        <Link to="/login" className="landing-nav-link">
          Iniciar sesión
        </Link>
      </header>

      <section className="landing-hero">
        <div className="landing-hero-copy">
          <h1>
            Reserva.
            <br />
            Sin choques.
          </h1>
          <p>
            Un horario, un recurso, sin dobles reservas. Elige una sala, cancha
            o equipo, mira lo que está libre en tiempo real, y confírmalo en
            segundos.
          </p>
          <div className="landing-cta">
            <Link to="/registro" className="btn btn-primary">
              Crear cuenta
            </Link>
            <Link to="/login" className="btn btn-ghost">
              Ya tengo cuenta
            </Link>
          </div>
        </div>

        <div className="landing-board" role="img" aria-label="Ejemplo de disponibilidad de recursos">
          <div className="landing-board-header">
            <span>RECURSO</span>
            <span>HORARIO</span>
            <span>ESTADO</span>
          </div>
          {filas.map((fila, i) => (
            <div
              className={`landing-board-row ${i === 1 ? "landing-board-row--highlight" : ""}`}
              key={fila.recurso}
            >
              <span>{fila.recurso}</span>
              <span>{fila.horario}</span>
              <span className={fila.estado === "LIBRE" ? "estado-libre" : "estado-ocupado"}>
                {fila.estado}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-steps">
        <div className="landing-step">
          <span className="landing-step-num">1</span>
          <h3>Elige un recurso</h3>
          <p>Salas, canchas o equipos disponibles en tu espacio.</p>
        </div>
        <div className="landing-step">
          <span className="landing-step-num">2</span>
          <h3>Selecciona un horario</h3>
          <p>Ve la disponibilidad real, sin adivinar.</p>
        </div>
        <div className="landing-step">
          <span className="landing-step-num">3</span>
          <h3>Confirma tu reserva</h3>
          <p>Queda bloqueado al instante, nadie más puede tomarlo.</p>
        </div>
      </section>
    </div>
  );
}