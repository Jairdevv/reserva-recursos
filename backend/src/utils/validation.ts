import { HttpError } from "./errors";

export function objectInput(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new HttpError(400, "Se requiere un objeto JSON");
  }
  return value as Record<string, unknown>;
}

export function positiveId(value: unknown): number {
  const number =
    typeof value === "string" && /^[1-9]\d*$/.test(value)
      ? Number(value)
      : value;
  if (
    typeof number !== "number" ||
    !Number.isSafeInteger(number) ||
    number <= 0 ||
    number > 2147483647
  ) {
    throw new HttpError(400, "El identificador debe ser un entero positivo");
  }
  return number;
}

export function textInput(value: unknown, field: string, max: number): string {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max) {
    throw new HttpError(
      400,
      `${field} es requerido y admite hasta ${max} caracteres`,
    );
  }
  return value.trim();
}

export function emailInput(value: unknown): string {
  const email = textInput(value, "Email", 150).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new HttpError(400, "Email inválido");
  }
  return email;
}

export function passwordInput(value: unknown, registering = false): string {
  if (
    typeof value !== "string" ||
    value.length < (registering ? 6 : 1) ||
    Buffer.byteLength(value, "utf8") > 72
  ) {
    throw new HttpError(
      400,
      registering
        ? "La contraseña requiere al menos 6 caracteres"
        : "Contraseña inválida",
    );
  }
  return value;
}

export function dateOnly(value: unknown): string {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    value.startsWith("0000")
  ) {
    throw new HttpError(400, "La fecha debe tener formato YYYY-MM-DD");
  }
  const date = new Date(`${value}T00:00:00Z`);
  if (
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    throw new HttpError(400, "Fecha inválida");
  }
  return value;
}

// Valida un instante ISO con zona explícita y lo normaliza a UTC.
export function instant(value: unknown): string {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(
      value,
    )
  ) {
    throw new HttpError(400, "La fecha y hora deben incluir zona: Z o ±HH:MM");
  }
  dateOnly(value.slice(0, 10));
  const time = value.slice(11).match(/^(\d{2}):(\d{2})(?::(\d{2}))?/)!;
  const offset = value.match(/[+-](\d{2}):(\d{2})$/);
  if (
    Number(time[1]) > 23 ||
    Number(time[2]) > 59 ||
    Number(time[3] ?? 0) > 59 ||
    (offset &&
      (Number(offset[1]) > 14 ||
        Number(offset[2]) > 59 ||
        (Number(offset[1]) === 14 && Number(offset[2]) !== 0)))
  ) {
    throw new HttpError(400, "Hora o zona inválida");
  }
  const date = new Date(value);
  if (!Number.isFinite(date.getTime()))
    throw new HttpError(400, "Fecha inválida");
  const iso = date.toISOString();
  if (!/^\d{4}-/.test(iso) || iso.startsWith("0000")) {
    throw new HttpError(400, "Fecha fuera de rango");
  }
  return iso;
}

export function dateRange(start: unknown, end: unknown, future = false) {
  const inicio = instant(start);
  const fin = instant(end);

  if (inicio >= fin)
    throw new HttpError(400, "El inicio debe ser anterior al fin");
  if (future && Date.parse(inicio) <= Date.now()) {
    throw new HttpError(400, "La reserva debe comenzar en el futuro");
  }
  return { inicio, fin };
}
