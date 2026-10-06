import test from "node:test";
import assert from "node:assert/strict";
import {
  dateRange,
  dateOnly,
  instant,
  emailInput,
  passwordInput,
  positiveId,
  objectInput,
} from "../src/utils/validation";
import { HttpError } from "../src/utils/errors";
import { validarReglas, comprobarHorario } from "../src/utils/reglasReserva";

test("reglas de reserva validan configuración, duración y límites en Bogotá", () => {
  const reglas = validarReglas({ apertura: "08:00", cierre: "20:00", minutos_minimos: 30, minutos_maximos: 120, dias: [0, 1, 2, 3, 4, 5, 6] })!;
  comprobarHorario(reglas, "2099-01-02T13:00:00Z", "2099-01-02T13:30:00Z");
  comprobarHorario(reglas, "2099-01-02T18:00:00-05:00", "2099-01-02T20:00:00-05:00");
  invalid(() => comprobarHorario(reglas, "2099-01-02T12:59:59Z", "2099-01-02T14:00:00Z"));
  invalid(() => comprobarHorario(reglas, "2099-01-02T18:00:00-05:00", "2099-01-02T20:00:01-05:00"));
  invalid(() => comprobarHorario(reglas, "2099-01-02T08:00:00-05:00", "2099-01-02T08:29:59-05:00"));
  invalid(() => comprobarHorario(reglas, "2099-01-02T08:00:00-05:00", "2099-01-02T10:01:00-05:00"));
  invalid(() => comprobarHorario(reglas, "2099-01-02T19:00:00-05:00", "2099-01-03T08:00:00-05:00"));
  const dia = new Date("2099-01-02T12:00:00Z").getUTCDay();
  invalid(() => comprobarHorario({ ...reglas, dias: reglas.dias.filter(value => value !== dia) }, "2099-01-02T08:00:00-05:00", "2099-01-02T09:00:00-05:00"));
  for (const cambios of [{ dias: [] }, { dias: [7] }, { cierre: "07:00" }, { minutos_minimos: 900 }, { minutos_maximos: 10 }, { apertura: "24:00" }, { minutos_minimos: 1.5 }]) invalid(() => validarReglas({ ...reglas, ...cambios }));
  assert.equal(validarReglas(null), null);
  comprobarHorario(null, "2099-01-02T02:00:00Z", "2099-01-03T06:00:00Z");
});

const invalid = (fn: () => unknown) =>
  assert.throws(
    fn,
    (error: any) => error instanceof HttpError && error.status === 400,
  );

test("identificadores y cuerpos inválidos se rechazan", () => {
  for (const value of [0, -1, 1.5, "1x", "1e2", "", null, [], true, 2147483648])
    invalid(() => positiveId(value));
  assert.equal(positiveId("12"), 12);
  for (const value of [null, undefined, [], "body"])
    invalid(() => objectInput(value));
});

test("fechas imposibles y horas sin zona no se normalizan silenciosamente", () => {
  for (const value of ["2026-02-30", "2025-02-29", "2026-13-01"])
    invalid(() => dateOnly(value));
  assert.equal(dateOnly("2028-02-29"), "2028-02-29");
  for (const value of [
    "2026-09-25T10:00",
    "2026-02-30T10:00:00Z",
    "2026-09-25T24:00:00Z",
    "2026-09-25T10:00:00+14:30",
  ])
    invalid(() => instant(value));
});

test("offsets distintos representan el mismo instante y el rango es exclusivo al final", () => {
  assert.equal(
    instant("2099-01-01T10:00:00-05:00"),
    "2099-01-01T15:00:00.000Z",
  );
  invalid(() => dateRange("2099-01-01T10:00:00-05:00", "2099-01-01T15:00:00Z"));
  invalid(() => dateRange("2099-01-01T16:00:00Z", "2099-01-01T15:00:00Z"));
  invalid(() =>
    dateRange("2000-01-01T10:00:00Z", "2000-01-01T11:00:00Z", true),
  );
});

test("emails se normalizan y contraseñas no se truncan por bcrypt", () => {
  assert.equal(emailInput("  USER@Example.COM "), "user@example.com");
  invalid(() => emailInput("incorrecto"));
  invalid(() => passwordInput("secreto1!", true));
  invalid(() => passwordInput("Secreto!", true));
  invalid(() => passwordInput("Secreto1", true));
  invalid(() => passwordInput("Sec1!", true));
  invalid(() => passwordInput("s1!".repeat(40), true));
  assert.equal(passwordInput("Secreto1!", true), "Secreto1!");
});
