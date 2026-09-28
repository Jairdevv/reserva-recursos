import { NavLink, Outlet } from "react-router-dom";
import { cerrarSesion, useSession } from "../session";
import "../styles/Workspace.css";

export default function AppLayout() {
  const session = useSession();
  return <div className="workspace">
    <a className="skip-link" href="#contenido">Saltar al contenido</a>
    <header className="workspace-header">
      <NavLink className="workspace-brand" to="/recursos">ReserV</NavLink>
      <nav aria-label="Navegación principal">
        <NavLink to="/recursos">Recursos</NavLink>
        <NavLink to="/mis-reservas">Mis reservas</NavLink>
        {session?.usuario.rol === "admin" && <NavLink to="/admin/recursos">Administración</NavLink>}
      </nav>
      <div className="workspace-user">
        <span>{session?.usuario.nombre}</span>
        <button className="btn btn-ghost" onClick={cerrarSesion}>Cerrar sesión</button>
      </div>
    </header>
    <div id="contenido" tabIndex={-1}><Outlet key={session?.usuario.id} /></div>
  </div>;
}
