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
  invalid(() => passwordInput("12345", true));
  invalid(() => passwordInput("é".repeat(37), true));
  assert.equal(passwordInput("secreto", true), "secreto");
});
