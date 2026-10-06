import { useRef, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { cerrarSesion, useSession } from "../session";
import "../styles/Workspace.css";

export default function AppLayout() {
  const session = useSession();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  return <div className="workspace">
    <a className="skip-link" href="#contenido">Saltar al contenido</a>
    <header className="workspace-header" onKeyDown={event => {
      if (event.key === "Escape" && menuAbierto) {
        setMenuAbierto(false);
        menuButton.current?.focus();
      }
    }}>
      <NavLink className="workspace-brand" to="/recursos" onClick={() => setMenuAbierto(false)}>ReserV</NavLink>
      <button ref={menuButton} className="workspace-menu-toggle" type="button"
        aria-expanded={menuAbierto} aria-controls="workspace-menu" onClick={() => setMenuAbierto(value => !value)}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          {menuAbierto ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
        </svg>
        {menuAbierto ? "Cerrar" : "Menú"}
      </button>
      <div id="workspace-menu" className={`workspace-menu${menuAbierto ? " is-open" : ""}`}>
      <nav aria-label="Navegación principal" onClick={() => setMenuAbierto(false)}>
        <NavLink to="/recursos">Recursos</NavLink>
        <NavLink to="/mis-reservas">Mis reservas</NavLink>
        {session?.usuario.rol === "admin" && <NavLink to="/admin/recursos">Administración</NavLink>}
      </nav>
      <div className="workspace-user">
        <span title={session?.usuario.nombre}>{session?.usuario.nombre}</span>
        <button className="btn btn-ghost" onClick={() => { setMenuAbierto(false); cerrarSesion(); }}>Cerrar sesión</button>
      </div>
      </div>
    </header>
    <div id="contenido" tabIndex={-1}><Outlet key={session?.usuario.id} /></div>
  </div>;
}
