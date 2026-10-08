import { useEffect, useRef, useState } from "react";
import { getMisReservas, cancelarReserva } from "../services";
import type { ReservaConRecurso } from "../types";
import { filtrarReservas, reservaVigente, type FiltroReservas } from "../utils/reservas";
import { errorMessage } from "../../../shared/api/http";

export function useMisReservas() {
  const [reservas, setReservas] = useState<ReservaConRecurso[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [recarga, setRecarga] = useState(0);
  const [filtro, setFiltro] = useState<FiltroReservas>("proximas");
  const [busqueda, setBusqueda] = useState("");
  const [pendiente, setPendiente] = useState<ReservaConRecurso | null>(null);
  const [cancelando, setCancelando] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const busy = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    let vigente = true;
    const controller = new AbortController();
    getMisReservas(controller.signal)
      .then(datos => { if (vigente) { setReservas(datos); setErrorCarga(""); } })
      .catch(error => { if (vigente) setErrorCarga(errorMessage(error, "No se pudieron cargar tus reservas")); })
      .finally(() => { if (vigente) setCargando(false); });
    return () => { vigente = false; controller.abort(); };
  }, [recarga]);

  function recargar() {
    if (busy.current || cargando) return;
    setPendiente(null);
    setErrorCarga("");
    setError("");
    setCargando(true);
    setRecarga(value => value + 1);
  }
  async function confirmarCancelacion() {
    if (!pendiente || busy.current) return;
    busy.current = true;
    setCancelando(true);
    setError("");
    setMensaje("");
    try {
      const actualizada = await cancelarReserva(pendiente.id);
      setReservas(items => items.map(item => item.id === actualizada.id
        ? { ...item, estado: actualizada.estado } : item));
      setPendiente(null);
      setMensaje("Reserva cancelada. Puedes consultarla en el historial.");
    } catch (error) {
      setError(errorMessage(error, "No se pudo cancelar la reserva"));
    } finally {
      busy.current = false;
      setCancelando(false);
    }
  }
  const visibles = filtrarReservas(reservas, filtro, busqueda, now);
  const proximas = reservas.filter(reserva => reservaVigente(reserva, now)).length;
  return {
    reservas,
    cargando,
    errorCarga,
    error,
    setError,
    mensaje,
    setMensaje,
    filtro,
    setFiltro,
    busqueda,
    setBusqueda,
    pendiente,
    setPendiente,
    cancelando,
    now,
    recargar,
    confirmarCancelacion,
    visibles,
    proximas,
  };
}
