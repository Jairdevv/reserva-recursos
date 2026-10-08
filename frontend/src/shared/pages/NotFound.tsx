import { Link } from "react-router-dom";
import { useSession } from "../../features/auth/session";
import "../styles/Workspace.css";

export default function NotFound() {
  const session = useSession();
  return <main className="workspace-page not-found">
    <p className="eyebrow">404</p>
    <h1>No encontramos esta página</h1>
    <p>El enlace puede haber cambiado. Vuelve para continuar.</p>
    <Link className="btn btn-primary" to={session ? "/recursos" : "/"}>
      {session ? "Ver recursos" : "Ir al inicio"}
    </Link>
  </main>;
}
