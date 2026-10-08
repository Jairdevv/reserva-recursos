import { useSyncExternalStore } from "react";
import type { LoginResponse, Usuario } from "./types";

type Session = LoginResponse & { expiresAt: number };
const listeners = new Set<() => void>();
let expirationTimer: ReturnType<typeof setTimeout> | undefined;

function readSession(): Session | null {
  try {
    const token = localStorage.getItem("token");
    const usuario: Usuario = JSON.parse(
      localStorage.getItem("usuario") ?? "null",
    );
    if (
      !token ||
      !usuario ||
      !Number.isSafeInteger(usuario.id) ||
      !["admin", "usuario"].includes(usuario.rol)
    )
      return null;

    const encoded = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    // Solo permite anticipar la expiración en la interfaz; la API verifica la firma.
    const payload = JSON.parse(atob(encoded));
    const expiresAt = Number(payload.exp) * 1000;
    if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return null;
    return { token, usuario, expiresAt };
  } catch {
    return null;
  }
}

let current = readSession();
function publish() {
  clearTimeout(expirationTimer);
  if (current) {
    expirationTimer = setTimeout(
      () => {
        if (current && current.expiresAt <= Date.now()) cerrarSesion();
        else publish();
      },
      Math.min(Math.max(0, current.expiresAt - Date.now()), 2147483647),
    );
  }
  listeners.forEach((listener) => listener());
}

export function iniciarSesion(data: LoginResponse) {
  localStorage.setItem("token", data.token);
  localStorage.setItem("usuario", JSON.stringify(data.usuario));
  current = readSession();
  publish();
}

export function cerrarSesion() {
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
  current = null;
  publish();
}

export function getToken() {
  if (current && current.expiresAt <= Date.now()) cerrarSesion();
  return current?.token ?? null;
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const useSession = () =>
  useSyncExternalStore(
    subscribe,
    () => current,
    () => null,
  );

window.addEventListener("storage", (event) => {
  if (event.key === null || event.key === "token" || event.key === "usuario") {
    current = readSession();
    publish();
  }
});
if (!current) {
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
}
publish();
