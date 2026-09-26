import axios from "axios";
import { cerrarSesion, getToken } from "./session";

const baseURL =
  import.meta.env.VITE_API_URL?.trim() ||
  (import.meta.env.DEV ? "http://localhost:3000" : "");
if (!baseURL)
  throw new Error("Configura VITE_API_URL antes de compilar el frontend");

const api = axios.create({ baseURL, timeout: 15000 });

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token && !config.url?.startsWith("/auth/")) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const token = getToken();
    // Una respuesta de una sesión anterior no debe cerrar una sesión nueva.
    if (
      error.response?.status === 401 &&
      token &&
      error.config?.headers?.Authorization === `Bearer ${token}`
    ) {
      cerrarSesion();
    }
    return Promise.reject(error);
  },
);
export default api;

export function errorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    if (!error.response)
      return "No se pudo conectar con el servidor. Revisa tu conexión e intenta de nuevo.";
    const message = error.response.data?.error;
    if (typeof message === "string") return message;
  }
  return fallback;
}
