import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import type { Server } from "node:http";
import pg from "pg";
import jwt from "jsonwebtoken";
import "dotenv/config";

const schema = "test_reservas_" + randomBytes(8).toString("hex");
let admin: pg.Pool;
let pool: pg.Pool;
let server: Server;
let base: string;
let owner: string;
let other: string;
let adminToken: string;
let resourceId: number;
let reservationId: number;
const secret = randomBytes(32).toString("hex");
const originalDatabase = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

async function api(path: string, method = "GET", body?: unknown, token = owner) {
  const response = await fetch(base + path, {
    method,
    headers: { ...(token ? { Authorization: "Bearer " + token } : {}), ...(body !== undefined ? { "Content-Type": "application/json" } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: response.status, data: response.status === 204 ? null : await response.json() };
}
const booking = (inicio: string, fin: string) => ({ recurso_id: resourceId, inicio, fin });

before(async () => {
  if (!originalDatabase) throw new Error("Configura TEST_DATABASE_URL o DATABASE_URL para las pruebas aisladas");
  admin = new pg.Pool({ connectionString: originalDatabase, connectionTimeoutMillis: 5000 });
  await admin.query('CREATE SCHEMA "' + schema + '"');
  const url = new URL(originalDatabase);
  url.searchParams.set("options", "-c search_path=" + schema + ",public");
  process.env.DATABASE_URL = url.toString();
  process.env.JWT_SECRET = secret;
  process.env.CORS_ORIGINS = "http://localhost:5173";
  pool = (await import("../src/config/db")).default;
  for (const file of ["001_init.sql", "002_add_indexes_and_constraints.sql"]) {
    await pool.query(await readFile("migrations/" + file, "utf8"));
  }
  // Fila anterior a la nueva migración: la hora civil debe conservarse.
  await pool.query("INSERT INTO usuarios (nombre, email, password_hash) VALUES ('Histórico', 'history@example.test', 'unused')");
  await pool.query("INSERT INTO recursos (nombre) VALUES ('Histórico')");
  await pool.query("INSERT INTO reservas(recurso_id, usuario_id, rango_horario) VALUES (1, 1, tsrange('2099-01-01 10:00', '2099-01-01 11:00'))");
  await pool.query(await readFile("migrations/003_validation_and_resource_history.sql", "utf8"));
  const app = (await import("../src/server")).default;
  server = await new Promise<Server>(resolve => {
    const listener = app.listen(0, "127.0.0.1", () => resolve(listener));
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Sin puerto");
  base = "http://127.0.0.1:" + address.port;
  for (const email of ["owner@example.test", "other@example.test"]) {
    assert.equal((await api("/auth/registro", "POST", { nombre: "Usuario", email, password: "secreto123" }, "")).status, 201);
  }
  owner = (await api("/auth/login", "POST", { email: "owner@example.test", password: "secreto123" }, "")).data.token;
  other = (await api("/auth/login", "POST", { email: "other@example.test", password: "secreto123" }, "")).data.token;
  adminToken = jwt.sign({ id: 2, rol: "admin" }, secret, { expiresIn: "1h" });
  const created = await api("/recursos", "POST", { nombre: "Sala prueba", capacidad: 5 }, adminToken);
  assert.equal(created.status, 201);
  resourceId = created.data.id;
});

after(async () => {
  if (server) {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
  if (pool) await pool.end();
  if (admin) {
    // Solo el esquema aleatorio creado por esta suite, nunca public.
    assert.match(schema, /^test_reservas_[a-f0-9]{16}$/);
    await admin.query('DROP SCHEMA IF EXISTS "' + schema + '" CASCADE');
    await admin.end();
  }
});

test("registro, login y JSON inválido producen errores de cliente", async () => {
  assert.equal((await api("/auth/registro", "POST", { nombre: "", email: "x", password: 12 })).status, 400);
  assert.equal((await api("/auth/registro", "POST", { nombre: "Otro", email: " OWNER@EXAMPLE.TEST ", password: "secreto123" })).status, 409);
  assert.equal((await api("/auth/login", "POST", { email: " OWNER@EXAMPLE.TEST ", password: "secreto123" }, "")).status, 200);
  const invalid = await fetch(base + "/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{" });
  assert.equal(invalid.status, 400);
  assert.equal(typeof (await invalid.json()).error, "string");
});
test("autenticación devuelve 401 y permisos insuficientes 403", async () => {
  assert.equal((await api("/recursos", "GET", undefined, "")).status, 401);
  assert.equal((await api("/recursos", "GET", undefined, "invalid")).status, 401);
  const expired = jwt.sign({ id: 2, rol: "usuario" }, secret, { expiresIn: -1 });
  assert.equal((await api("/recursos", "GET", undefined, expired)).status, 401);
  assert.equal((await api("/recursos", "POST", { nombre: "No permitido" })).status, 403);
  const allowed = await fetch(base + "/health", { headers: { Origin: "http://localhost:5173" } });
  assert.equal(allowed.headers.get("access-control-allow-origin"), "http://localhost:5173");
  const blocked = await fetch(base + "/health", { headers: { Origin: "https://untrusted.example" } });
  assert.equal(blocked.headers.get("access-control-allow-origin"), null);
});
test("recursos validan altas y cambios, incluyendo valores null", async () => {
  for (const body of [{ nombre: 1 }, { nombre: " " }, { nombre: "Sala", capacidad: -1 }, { nombre: "Sala", activo: false }]) {
    assert.equal((await api("/recursos", "POST", body, adminToken)).status, 400);
  }
  assert.equal((await api("/recursos/" + resourceId, "PUT", {}, adminToken)).status, 400);
  assert.equal((await api("/recursos/no-numero")).status, 400);
  const changed = await api("/recursos/" + resourceId, "PUT", { descripcion: null, capacidad: null }, adminToken);
  assert.equal(changed.status, 200);
  assert.equal(changed.data.capacidad, null);
});
test("horas históricas de Bogotá se exponen en UTC sin desplazamiento", async () => {
  const result = await api("/recursos/1/disponibilidad?fecha=2099-01-01");
  assert.equal(result.status, 200);
  assert.equal(result.data.reservasExistentes[0].inicio, "2099-01-01T15:00:00.000Z");
  assert.equal(result.data.reservasExistentes[0].fin, "2099-01-01T16:00:00.000Z");
  assert.equal("rango_horario" in result.data.reservasExistentes[0], false);
});
test("reservas rechazan fechas inválidas, pasadas y recursos inexistentes", async () => {
  for (const pair of [
    ["2099-01-01T10:00", "2099-01-01T11:00"],
    ["2099-02-30T10:00:00Z", "2099-03-01T11:00:00Z"],
    ["2099-01-01T11:00:00Z", "2099-01-01T10:00:00Z"],
    ["2099-01-01T10:00:00Z", "2099-01-01T10:00:00Z"],
    ["2000-01-01T10:00:00Z", "2000-01-01T11:00:00Z"],
  ]) assert.equal((await api("/reservas", "POST", booking(pair[0], pair[1]))).status, 400);
  assert.equal((await api("/reservas", "POST", { ...booking("2099-01-01T10:00:00Z", "2099-01-01T11:00:00Z"), recurso_id: 2147483647 })).status, 404);
  assert.equal((await api("/recursos/" + resourceId + "/disponibilidad?fecha=2099-02-30")).status, 400);
  assert.equal((await api("/recursos/" + resourceId + "/reservas?desde=2099-01-02&hasta=2099-01-01")).status, 400);
});
test("reservas simultáneas: una confirmada, otra 409; intervalos adyacentes permitidos", async () => {
  const body = booking("2099-01-02T10:00:00-05:00", "2099-01-02T11:00:00-05:00");
  const results = await Promise.all([api("/reservas", "POST", body), api("/reservas", "POST", body)]);
  assert.deepEqual(results.map(result => result.status).sort(), [201, 409]);
  const created = results.find(result => result.status === 201)!.data;
  reservationId = created.id;
  assert.equal(created.inicio, "2099-01-02T15:00:00.000Z");
  assert.equal((await api("/reservas", "POST", booking("2099-01-02T16:00:00Z", "2099-01-02T17:00:00Z"))).status, 201);
  const params = new URLSearchParams({ desde: "2099-01-02T15:30:00Z", hasta: "2099-01-02T16:30:00Z" });
  const found = await api("/recursos/" + resourceId + "/reservas?" + params);
  assert.equal(found.status, 200);
  assert.equal(found.data.length, 2);
});
test("cancelación conserva historial, verifica propietario y libera el horario", async () => {
  assert.equal((await api("/reservas/" + reservationId + "/cancelar", "PATCH", undefined, other)).status, 403);
  assert.equal((await api("/reservas/" + reservationId + "/cancelar", "PATCH")).status, 200);
  assert.equal((await api("/reservas/" + reservationId + "/cancelar", "PATCH")).status, 200);
  const history = await api("/mis-reservas");
  assert.equal(history.data.find((item: { id: number }) => item.id === reservationId).estado, "cancelada");
  assert.equal((await api("/reservas", "POST", booking("2099-01-02T15:00:00Z", "2099-01-02T16:00:00Z"))).status, 201);
});
test("desactivar conserva historial y bloquea nuevas reservas", async () => {
  const count = (await api("/mis-reservas")).data.length;
  assert.equal((await api("/recursos/" + resourceId, "DELETE", undefined, adminToken)).status, 204);
  assert.equal((await api("/recursos/" + resourceId, "DELETE", undefined, adminToken)).status, 204);
  assert.equal((await api("/recursos")).data.some((item: { id: number }) => item.id === resourceId), false);
  assert.equal((await api("/mis-reservas")).data.length, count);
  assert.equal((await api("/reservas", "POST", booking("2099-01-03T15:00:00Z", "2099-01-03T16:00:00Z"))).status, 409);
  await assert.rejects(pool.query("DELETE FROM recursos WHERE id = $1", [resourceId]), (error: { code: string }) => ["23503", "23001"].includes(error.code));
});
