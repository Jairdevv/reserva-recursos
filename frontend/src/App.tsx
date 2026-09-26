import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Registro from "./pages/Registro";
import Recursos from "./pages/Recursos";
import Landing from "./pages/Landing";
import { lazy, Suspense } from "react";
const ReservarRecurso = lazy(() => import("./pages/ReservarRecurso"));
import ProtectedRoute from "./ProtectedRoute";
import "./App.css";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/recursos" element={<Recursos />} />
          <Route path="/recursos/:id/reservar" element={<Suspense fallback={<p role="status">Cargando calendario...</p>}><ReservarRecurso /></Suspense>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
