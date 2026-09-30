import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Registro from "./pages/Registro";
import Recursos from "./pages/Recursos";
import Landing from "./pages/Landing";
import MisReservas from "./pages/MisReservas";
import AdminRecursos from "./pages/AdminRecursos";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./ProtectedRoute";
import AdminRoute from "./AdminRoute";
import AppLayout from "./components/AppLayout";
import { useConexion } from "./useConexion";
import "./App.css";

const ReservarRecurso = lazy(() => import("./pages/ReservarRecurso"));

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
            <Route path="/admin/recursos" element={<AdminRecursos />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>;
}
