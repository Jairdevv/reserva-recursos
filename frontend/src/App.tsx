import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./features/auth/pages/Login";
import Registro from "./features/auth/pages/Registro";
import Recursos from "./features/recursos/pages/Recursos";
import Landing from "./features/inicio/pages/Landing";
import MisReservas from "./features/reservas/pages/MisReservas";
import AdminRecursos from "./features/administracion/pages/AdminRecursos";
import NotFound from "./shared/pages/NotFound";
import ProtectedRoute from "./features/auth/components/ProtectedRoute";
import AdminRoute from "./features/auth/components/AdminRoute";
import AppLayout from "./shared/components/AppLayout";
import { useConexion } from "./shared/hooks/useConexion";
import "./App.css";
import "./shared/styles/Theme.css";

const ReservarRecurso = lazy(() => import("./features/reservas/pages/ReservarRecurso"));

export default function App() {
  useConexion();

  return <BrowserRouter>
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/recursos" element={<Recursos />} />
          <Route path="/mis-reservas" element={<MisReservas />} />
          <Route path="/recursos/:id/reservar" element={
            <Suspense fallback={<p className="workspace-page" role="status">Cargando calendario...</p>}>
              <ReservarRecurso />
            </Suspense>
          } />
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminRecursos />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>;
}
