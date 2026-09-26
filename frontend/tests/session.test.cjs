const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const path = require("node:path");

function setup(initial = {}) {
  const items = new Map(Object.entries(initial));
  const events = new Map();
  let now = 2000000000000;
  let timeout;
  const storage = {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => items.set(key, value),
    removeItem: (key) => items.delete(key),
  };
  const module = { exports: {} };
  const code = ts.transpileModule(
    fs.readFileSync(path.resolve(__dirname, "../src/session.ts"), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  vm.runInNewContext(code, {
    exports: module.exports,
    module,
    require,
    localStorage: storage,
    window: { addEventListener: (name, handler) => events.set(name, handler) },
    setTimeout: (callback) => {
      timeout = callback;
      return 1;
    },
    clearTimeout: () => {
      timeout = undefined;
    },
    Date: { now: () => now },
    atob,
  });
  return {
    session: module.exports,
    storage,
    expire: () => {
      now += 120000;
      timeout?.();
    },
    sync: () => events.get("storage")({ key: "token" }),
  };
}
const usuario = {
  id: 1,
  nombre: "Usuario",
  email: "user@example.test",
  rol: "usuario",
};
const token = (exp) =>
  "header." +
  Buffer.from(JSON.stringify({ exp })).toString("base64url") +
  ".signature";
const valid = token(2000000060);

test("recupera una sesión válida y limpia almacenamiento corrupto o expirado", () => {
  assert.equal(
    setup({
      token: valid,
      usuario: JSON.stringify(usuario),
    }).session.getToken(),
    valid,
  );
  for (const initial of [
    { token: valid, usuario: "invalid" },
    { token: token(1), usuario: JSON.stringify(usuario) },
    { token: "invalid", usuario: JSON.stringify(usuario) },
  ]) {
    const context = setup(initial);
    assert.equal(context.session.getToken(), null);
    assert.equal(context.storage.getItem("token"), null);
  }
});
test("login, logout y expiración comparten el mismo estado", () => {
  const context = setup();
  context.session.iniciarSesion({ token: valid, usuario });
  assert.equal(context.session.getToken(), valid);
  context.expire();
  assert.equal(context.session.getToken(), null);
  assert.equal(context.storage.getItem("usuario"), null);
  context.session.cerrarSesion();
  assert.equal(context.session.getToken(), null);
});
test("cerrar sesión en otra pestaña invalida la sesión actual", () => {
  const context = setup({ token: valid, usuario: JSON.stringify(usuario) });
  context.storage.removeItem("token");
  context.storage.removeItem("usuario");
  context.sync();
  assert.equal(context.session.getToken(), null);
});
