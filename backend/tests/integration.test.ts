import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import type { Server } from "node:http";
import pg from "pg";
import jwt from "jsonwebtoken";
import "dotenv/config";
import type {
  LoginResponse,
  Recurso,
  Reserva,
  ReservaConRecurso,
  Disponibilidad,
} from "../src/types";

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
const testPassword = "Secreto123!";
const originalDatabase =
  process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

async function api<T = unknown>(
  path: string,
  method = "GET",
  body?: unknown,
  token = owner,
) {
  const response = await fetch(base + path, {
    method,
    headers: {
      ...(token ? { Authorization: "Bearer " + token } : {}),
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return {
    status: response.status,
    // El tipo describe la respuesta esperada; las aserciones comprueban el resultado.
    data: response.status === 204 ? null : ((await response.json()) as T),
  };
}
const booking = (inicio: string, fin: string) => ({
  recurso_id: resourceId,
  inicio,
  fin,
});

before(async () => {
  if (!originalDatabase)
    throw new Error(
      "Configura TEST_DATABASE_URL o DATABASE_URL para las pruebas aisladas",
    );
  admin = new pg.Pool({
    connectionString: originalDatabase,
    connectionTimeoutMillis: 5000,
  });
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
  await pool.query(
    "INSERT INTO usuarios (nombre, email, password_hash) VALUES ('Histórico', 'history@example.test', 'unused')",
  );
  await pool.query("INSERT INTO recursos (nombre) VALUES ('Histórico')");
  await pool.query(
    "INSERT INTO reservas(recurso_id, usuario_id, rango_horario) VALUES (1, 1, tsrange('2099-01-01 10:00', '2099-01-01 11:00'))",
  );
  await pool.query(
    await readFile(
      "migrations/003_validation_and_resource_history.sql",
      "utf8",
    ),
  );
  await pool.query(
    await readFile("migrations/004_account_security.sql", "utf8"),
  );
  await pool.query(await readFile("migrations/005_resource_categories.sql", "utf8"));
  await pool.query(await readFile("migrations/006_resource_booking_rules.sql", "utf8"));
  const app = (await import("../src/server")).default;
  server = await new Promise<Server>((resolve) => {
    const listener = app.listen(0, "127.0.0.1", () => resolve(listener));
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Sin puerto");
  base = "http://127.0.0.1:" + address.port;
  for (const email of [
    "owner@example.test",
    "other@example.test",
    "admin@example.test",
  ]) {
    assert.equal(
      (
        await api(
          "/auth/registro",
          "POST",
          { nombre: "Usuario", email, password: testPassword },
          "",
        )
      ).status,
      201,
    );
  }
  owner = (
    await api<LoginResponse>(
      "/auth/login",
      "POST",
      { email: "owner@example.test", password: testPassword },
      "",
    )
  ).data.token;
  other = (
    await api<LoginResponse>(
      "/auth/login",
      "POST",
      { email: "other@example.test", password: testPassword },
      "",
    )
  ).data.token;
  const promoted = await pool.query(
    "UPDATE usuarios SET rol = 'admin' WHERE email = $1",
    ["admin@example.test"],
  );
  assert.equal(promoted.rowCount, 1);

  const adminLogin = await api<LoginResponse>(
    "/auth/login",
    "POST",
    { email: "admin@example.test", password: testPassword },
    "",
  );

  assert.equal(adminLogin.status, 200);
  assert.equal(adminLogin.data.usuario.rol, "admin");
  adminToken = adminLogin.data.token;
  const created = await api<Recurso>(
    "/recursos",
    "POST",
    { nombre: "Sala prueba", capacidad: 5 },
    adminToken,
  );
  assert.equal(created.status, 201);
  resourceId = created.data.id;
});

after(async () => {
  if (server) {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
  if (pool) await pool.end();
  if (admin) {
    // Solo el esquema aleatorio creado por esta suite, nunca public.
    assert.match(schema, /^test_reservas_[a-f0-9]{16}$/);
    await admin.query('DROP SCHEMA IF EXISTS "' + schema + '" CASCADE');
    await admin.end();
  }
});

test("categorías persisten, se pueden cambiar y no aceptan referencias inválidas", async () => {
  assert.equal((await api("/categorias", "GET", undefined, "")).status, 401);
  const categorias = await api<{ id: number; nombre: string }[]>("/categorias");
  assert.equal(categorias.status, 200);
  assert.equal(categorias.data.length, 5);
  const categoria = categorias.data[0];
  const historico = await api<Recurso>("/recursos/1");
  assert.equal(historico.data.categoria_id, null);
  const created = await api<Recurso>("/recursos", "POST", { nombre: "Categoría persistente", categoria_id: categoria.id }, adminToken);
  assert.equal(created.status, 201);
  assert.equal(created.data.categoria_nombre, categoria.nombre);
  const url = "/recursos/" + created.data.id;
  assert.equal((await api<Recurso>(url)).data.categoria_id, categoria.id);
  const kept = await api<Recurso>(url, "PUT", { descripcion: "Actualizada" }, adminToken);
  assert.equal(kept.data.categoria_id, categoria.id);
  const changed = await api<Recurso>(url, "PUT", { categoria_id: categorias.data[1].id }, adminToken);
  assert.equal(changed.status, 200);
  assert.equal(changed.data.categoria_nombre, categorias.data[1].nombre);
  await assert.rejects(
    pool.query("DELETE FROM categorias WHERE id = $1", [categorias.data[1].id]),
    (error: { code: string; constraint: string }) =>
      ["23503", "23001"].includes(error.code) &&
      error.constraint === "recursos_categoria_id_fkey",
  );
  assert.equal((await api(url, "PUT", { categoria_id: categoria.id })).status, 403);
  for (const categoria_id of [0, -1, 1.5, "1", 2147483647]) {
    assert.equal((await api("/recursos", "POST", { nombre: "Inválido", categoria_id }, adminToken)).status, 400);
    assert.equal((await api(url, "PUT", { categoria_id }, adminToken)).status, 400);
  }
  const cleared = await api<Recurso>(url, "PUT", { categoria_id: null }, adminToken);
  assert.equal(cleared.status, 200);
  assert.equal(cleared.data.categoria_id, null);
  assert.equal(cleared.data.categoria_nombre, null);
  assert.equal((await api<Recurso[]>("/recursos")).data.find(item => item.id === created.data.id)?.categoria_id, null);
});

test("reglas persistidas bloquean reservas fuera de horario y conservan actualizaciones parciales", async () => {
  const reglas = { apertura: "08:00", cierre: "20:00", minutos_minimos: 30, minutos_maximos: 120, dias: [0, 1, 2, 3, 4, 5, 6] };
  const created = await api<Recurso>("/recursos", "POST", { nombre: "Con horario", reglas_reserva: reglas }, adminToken);
  assert.equal(created.status, 201);
  assert.deepEqual(created.data.reglas_reserva, reglas);
  const url = "/recursos/" + created.data.id;
  const changed = await api<Recurso>(url, "PUT", { nombre: "Con horario editado" }, adminToken);
  assert.deepEqual(changed.data.reglas_reserva, reglas);
  for (const [inicio, fin] of [["07:00", "08:00"], ["08:00", "08:15"], ["08:00", "11:00"], ["19:00", "21:00"]]) {
    assert.equal((await api("/reservas", "POST", { recurso_id: created.data.id, inicio: `2099-01-02T${inicio}:00-05:00`, fin: `2099-01-02T${fin}:00-05:00` })).status, 400);
  }
  assert.equal((await api("/reservas", "POST", { recurso_id: created.data.id, inicio: "2099-01-02T13:00:00Z", fin: "2099-01-02T13:30:00Z" })).status, 201);
  assert.equal((await api(url, "PUT", { reglas_reserva: { ...reglas, dias: [] } }, adminToken)).status, 400);
  const cleared = await api<Recurso>(url, "PUT", { reglas_reserva: null }, adminToken);
  assert.equal(cleared.data.reglas_reserva, null);
  assert.equal((await api("/reservas", "POST", { recurso_id: created.data.id, inicio: "2099-01-02T06:00:00-05:00", fin: "2099-01-02T07:00:00-05:00" })).status, 201);
});

test("solo administradores listan inactivos y reactivan conservando historial", async () => {
  assert.equal((await api("/admin/recursos", "GET", undefined, "")).status, 401);
  assert.equal((await api("/admin/recursos")).status, 403);
  const created = await api<Recurso>("/recursos", "POST", { nombre: "Reactivable", capacidad: 3 }, adminToken);
  assert.equal(created.status, 201);
  const id = created.data.id;
  const body = { recurso_id: id, inicio: "2099-01-03T10:00:00-05:00", fin: "2099-01-03T11:00:00-05:00" };
  const reserva = await api<Reserva>("/reservas", "POST", body);
  assert.equal(reserva.status, 201);
  assert.equal((await api(`/recursos/${id}`, "DELETE", undefined, adminToken)).status, 204);
  assert.equal((await api<Recurso[]>("/recursos")).data.some(item => item.id === id), false);
  const listado = await api<Recurso[]>("/admin/recursos", "GET", undefined, adminToken);
  assert.equal(listado.status, 200);
  assert.equal(listado.data.find(item => item.id === id)?.activo, false);
  assert.equal((await api(`/recursos/${id}/reactivar`, "PATCH")).status, 403);
  assert.equal((await api(`/recursos/${id}/reactivar`, "PATCH", undefined, "")).status, 401);
  for (let intento = 0; intento < 2; intento++) {
    const reactivado = await api<Recurso>(`/recursos/${id}/reactivar`, "PATCH", undefined, adminToken);
    assert.equal(reactivado.status, 200);
    assert.equal(reactivado.data.activo, true);
    assert.equal(reactivado.data.capacidad, 3);
  }
  assert.equal((await api<Recurso[]>("/recursos")).data.some(item => item.id === id), true);
  assert.equal((await api<ReservaConRecurso[]>("/mis-reservas")).data.some(item => item.id === reserva.data.id), true);
  assert.equal((await api("/reservas", "POST", body)).status, 409);
  assert.equal((await api("/reservas", "POST", { ...body, inicio: "2099-01-03T11:00:00-05:00", fin: "2099-01-03T12:00:00-05:00" })).status, 201);
  assert.equal((await api("/recursos/2147483647/reactivar", "PATCH", undefined, adminToken)).status, 404);
  assert.equal((await api("/recursos/no-valido/reactivar", "PATCH", undefined, adminToken)).status, 400);
});

test("administración de categorías valida permisos, nombres y referencias de inactivos", async () => {
  assert.equal((await api("/categorias", "POST", { nombre: "Aulas" }, "")).status, 401);
  assert.equal((await api("/categorias", "POST", { nombre: "Aulas" })).status, 403);
  for (const body of [{ nombre: " " }, { nombre: 10 }, { nombre: "x".repeat(101) }, { nombre: "Aulas", activo: true }]) {
    assert.equal((await api("/categorias", "POST", body, adminToken)).status, 400);
  }
  const created = await api<{ id: number; nombre: string }>("/categorias", "POST", { nombre: " Aulas " }, adminToken);
  assert.equal(created.status, 201);
  assert.equal(created.data.nombre, "Aulas");
  assert.equal((await api("/categorias", "POST", { nombre: "Aulas" }, adminToken)).status, 409);
  const url = "/categorias/" + created.data.id;
  assert.equal((await api(url, "PUT", { nombre: "Renombrada" })).status, 403);
  assert.equal((await api(url, "DELETE")).status, 403);
  assert.equal((await api(url, "PUT", { nombre: "Salas de reunión" }, adminToken)).status, 409);
  const recurso = await api<Recurso>("/recursos", "POST", { nombre: "Aula referenciada", categoria_id: created.data.id }, adminToken);
  assert.equal(recurso.status, 201);
  const renamed = await api<{ nombre: string }>(url, "PUT", { nombre: "Aulas nuevas" }, adminToken);
  assert.equal(renamed.status, 200);
  assert.equal((await api<Recurso>("/recursos/" + recurso.data.id)).data.categoria_nombre, "Aulas nuevas");
  assert.equal((await api(url, "DELETE", undefined, adminToken)).status, 409);
  await api("/recursos/" + recurso.data.id, "DELETE", undefined, adminToken);
  assert.equal((await api(url, "DELETE", undefined, adminToken)).status, 409);
  const unassigned = await api("/recursos/" + recurso.data.id, "PUT", { categoria_id: null }, adminToken);
  assert.equal(unassigned.status, 200);
  assert.equal((await api(url, "DELETE", undefined, adminToken)).status, 204);
  assert.equal((await api(url, "DELETE", undefined, adminToken)).status, 404);
  assert.equal((await api(url, "PUT", { nombre: "No existe" }, adminToken)).status, 404);
  assert.equal((await api("/categorias/no-valido", "DELETE", undefined, adminToken)).status, 400);
});

test("registro, login y JSON inválido producen errores de cliente", async () => {
  assert.equal(
    (
      await api("/auth/registro", "POST", {
        nombre: "",
        email: "x",
        password: 12,
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await api("/auth/registro", "POST", {
        nombre: "Otro",
        email: " OWNER@EXAMPLE.TEST ",
        password: testPassword,
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await api(
        "/auth/login",
        "POST",
        { email: " OWNER@EXAMPLE.TEST ", password: testPassword },
        "",
      )
    ).status,
    200,
  );
  const invalid = await fetch(base + "/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{",
  });
  assert.equal(invalid.status, 400);
  const invalidBody: unknown = await invalid.json();
  assert.ok(
    typeof invalidBody === "object" &&
      invalidBody !== null &&
      "error" in invalidBody,
  );
  assert.equal(typeof invalidBody.error, "string");
});

test("autenticación devuelve 401 y permisos insuficientes 403", async () => {
  assert.equal((await api("/recursos", "GET", undefined, "")).status, 401);
  assert.equal(
    (await api("/recursos", "GET", undefined, "invalid")).status,
    401,
  );
  const ownerPayload = jwt.verify(owner, secret);
  assert.ok(typeof ownerPayload !== "string");

  const expired = jwt.sign(
    {
      id: ownerPayload.id,
      rol: ownerPayload.rol,
      version_sesion: ownerPayload.version_sesion,
    },
    secret,
    {
      algorithm: "HS256",
      expiresIn: -1,
    },
  );
  assert.equal((await api("/recursos", "GET", undefined, expired)).status, 401);
  assert.equal(
    (await api("/recursos", "POST", { nombre: "No permitido" })).status,
    403,
  );
  const allowed = await fetch(base + "/health", {
    headers: { Origin: "http://localhost:5173" },
  });
  assert.equal(
    allowed.headers.get("access-control-allow-origin"),
    "http://localhost:5173",
  );
  const blocked = await fetch(base + "/health", {
    headers: { Origin: "https://untrusted.example" },
  });
  assert.equal(blocked.headers.get("access-control-allow-origin"), null);
});

test("recursos validan altas y cambios, incluyendo valores null", async () => {
  for (const body of [
    { nombre: 1 },
    { nombre: " " },
    { nombre: "Sala", capacidad: -1 },
    { nombre: "Sala", activo: false },
  ]) {
    assert.equal(
      (await api("/recursos", "POST", body, adminToken)).status,
      400,
    );
  }
  assert.equal(
    (await api("/recursos/" + resourceId, "PUT", {}, adminToken)).status,
    400,
  );
  assert.equal((await api("/recursos/no-numero")).status, 400);
  const changed = await api<Recurso>(
    "/recursos/" + resourceId,
    "PUT",
    { descripcion: null, capacidad: null },
    adminToken,
  );
  assert.equal(changed.status, 200);
  assert.equal(changed.data.capacidad, null);
});

test("horas históricas de Bogotá se exponen en UTC sin desplazamiento", async () => {
  const result = await api<{ reservasExistentes: Disponibilidad[] }>(
    "/recursos/1/disponibilidad?fecha=2099-01-01",
  );
  assert.equal(result.status, 200);
  assert.equal(
    result.data.reservasExistentes[0].inicio,
    "2099-01-01T15:00:00.000Z",
  );
  assert.equal(
    result.data.reservasExistentes[0].fin,
    "2099-01-01T16:00:00.000Z",
  );
  assert.equal("rango_horario" in result.data.reservasExistentes[0], false);
});

test("reservas rechazan fechas inválidas, pasadas y recursos inexistentes", async () => {
  for (const pair of [
    ["2099-01-01T10:00", "2099-01-01T11:00"],
    ["2099-02-30T10:00:00Z", "2099-03-01T11:00:00Z"],
    ["2099-01-01T11:00:00Z", "2099-01-01T10:00:00Z"],
    ["2099-01-01T10:00:00Z", "2099-01-01T10:00:00Z"],
    ["2000-01-01T10:00:00Z", "2000-01-01T11:00:00Z"],
  ])
    assert.equal(
      (await api("/reservas", "POST", booking(pair[0], pair[1]))).status,
      400,
    );
  assert.equal(
    (
      await api("/reservas", "POST", {
        ...booking("2099-01-01T10:00:00Z", "2099-01-01T11:00:00Z"),
        recurso_id: 2147483647,
      })
    ).status,
    404,
  );
  assert.equal(
    (await api("/recursos/" + resourceId + "/disponibilidad?fecha=2099-02-30"))
      .status,
    400,
  );
  assert.equal(
    (
      await api(
        "/recursos/" +
          resourceId +
          "/reservas?desde=2099-01-02&hasta=2099-01-01",
      )
    ).status,
    400,
  );
});

test("reservas simultáneas: una confirmada, otra 409; intervalos adyacentes permitidos", async () => {
  const body = booking(
    "2099-01-02T10:00:00-05:00",
    "2099-01-02T11:00:00-05:00",
  );
  const results = await Promise.all([
    api<Reserva>("/reservas", "POST", body),
    api<Reserva>("/reservas", "POST", body),
  ]);
  assert.deepEqual(results.map((result) => result.status).sort(), [201, 409]);
  const created = results.find((result) => result.status === 201)!.data;
  reservationId = created.id;
  assert.equal(created.inicio, "2099-01-02T15:00:00.000Z");
  assert.equal(
    (
      await api(
        "/reservas",
        "POST",
        booking("2099-01-02T16:00:00Z", "2099-01-02T17:00:00Z"),
      )
    ).status,
    201,
  );
  const params = new URLSearchParams({
    desde: "2099-01-02T15:30:00Z",
    hasta: "2099-01-02T16:30:00Z",
  });
  const found = await api<Disponibilidad[]>(
    "/recursos/" + resourceId + "/reservas?" + params,
  );
  assert.equal(found.status, 200);
  assert.equal(found.data.length, 2);
});

test("cancelación conserva historial, verifica propietario y libera el horario", async () => {
  assert.equal(
    (
      await api(
        "/reservas/" + reservationId + "/cancelar",
        "PATCH",
        undefined,
        other,
      )
    ).status,
    403,
  );
  assert.equal(
    (await api("/reservas/" + reservationId + "/cancelar", "PATCH")).status,
    200,
  );
  assert.equal(
    (await api("/reservas/" + reservationId + "/cancelar", "PATCH")).status,
    200,
  );
  const history = await api<ReservaConRecurso[]>("/mis-reservas");
  assert.equal(
    history.data.find((item: { id: number }) => item.id === reservationId)
      .estado,
    "cancelada",
  );
  assert.equal(
    (
      await api(
        "/reservas",
        "POST",
        booking("2099-01-02T15:00:00Z", "2099-01-02T16:00:00Z"),
      )
    ).status,
    201,
  );
});

test("desactivar conserva historial y bloquea nuevas reservas", async () => {
  const count = (await api<ReservaConRecurso[]>("/mis-reservas")).data.length;
  assert.equal(
    (await api("/recursos/" + resourceId, "DELETE", undefined, adminToken))
      .status,
    204,
  );
  assert.equal(
    (await api("/recursos/" + resourceId, "DELETE", undefined, adminToken))
      .status,
    204,
  );
  assert.equal(
    (await api<Recurso[]>("/recursos")).data.some(
      (item: { id: number }) => item.id === resourceId,
    ),
    false,
  );
  assert.equal(
    (await api<ReservaConRecurso[]>("/mis-reservas")).data.length,
    count,
  );
  assert.equal(
    (
      await api(
        "/reservas",
        "POST",
        booking("2099-01-03T15:00:00Z", "2099-01-03T16:00:00Z"),
      )
    ).status,
    409,
  );
  await assert.rejects(
    pool.query("DELETE FROM recursos WHERE id = $1", [resourceId]),
    (error: { code: string }) => ["23503", "23001"].includes(error.code),
  );
});
