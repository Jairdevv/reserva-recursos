import "dotenv/config";

export function readConfig(source: NodeJS.ProcessEnv) {
  const databaseUrl = source.DATABASE_URL?.trim();
  const jwtSecret = source.JWT_SECRET;
  if (!databaseUrl || !/^postgres(?:ql)?:\/\//.test(databaseUrl)) {
    throw new Error("DATABASE_URL debe contener una conexión PostgreSQL válida");
  }
  try { new URL(databaseUrl); } catch { throw new Error("DATABASE_URL inválida"); }
  if (!jwtSecret?.trim()) throw new Error("JWT_SECRET es requerido");
  if (source.NODE_ENV === "production" && jwtSecret.length < 32) {
    throw new Error("JWT_SECRET requiere al menos 32 caracteres en producción");
  }
  const port = Number(source.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("PORT inválido");
  if (source.NODE_ENV === "production" && !source.CORS_ORIGINS?.trim()) {
    throw new Error("CORS_ORIGINS es requerido en producción");
  }
  const origins = (source.CORS_ORIGINS ?? "http://localhost:5173,http://127.0.0.1:5173")
    .split(",").map((origin) => origin.trim()).filter(Boolean);
  if (!origins.length || origins.some((origin) => {
    try {
      const url = new URL(origin);
      return !["http:", "https:"].includes(url.protocol) || url.origin !== origin;
    } catch { return true; }
  })) throw new Error("CORS_ORIGINS debe contener orígenes HTTP(S), separados por comas");
  return { databaseUrl, jwtSecret, port, origins };
}

export const config = readConfig(process.env);
