import { useEffect, useSyncExternalStore } from "react";
import api from "./api";

type Estado = "inicial" | "conectando" | "listo" | "error";

let estado: Estado = "inicial";
const listeners = new Set<() => void>();

function actualizar(nuevoEstado: Estado) {
  estado = nuevoEstado;
  listeners.forEach((listener) => listener());
}

function suscribir(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function obtenerEstado() {
  return estado;
}

async function conectar() {
  // Evita comprobaciones simultáneas.
  if (estado === "conectando") return;

  actualizar("conectando");

  // Hasta tres intentos, de 30 segundos cada uno.
  for (let intento = 0; intento < 3; intento++) {
    try {
      const respuesta = await api.get("/health", {
        timeout: 30_000,
      });

      // No basta con recibir cualquier respuesta HTTP.
      if (respuesta.data?.status === "OK") {
        actualizar("listo");
        return;
      }
    } catch {
      // Solo se reintenta la comprobación de conexión.
    }
  }

  actualizar("error");
}

export function useConexion() {
  const estadoActual = useSyncExternalStore(suscribir, obtenerEstado);

  useEffect(() => {
    if (estado === "inicial") {
      void conectar();
    }
  }, []);

  return {
    estado: estadoActual,
    listo: estadoActual === "listo",
    reintentar: conectar,
  };
}
