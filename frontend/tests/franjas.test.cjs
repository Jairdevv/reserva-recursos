const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

function cargar(file) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, {
    module, exports: module.exports, Date,
    require: (name) => cargar(path.resolve(path.dirname(file), `${name}.ts`)),
  });
  return module.exports;
}

const { generarFranjasRapidas } = cargar(path.resolve(__dirname, "../src/features/reservas/utils/franjas.ts"));

test("sin reglas no muestra franjas ni horarios predeterminados", () => {
  assert.equal(generarFranjasRapidas("2099-01-02").length, 0);
  assert.equal(generarFranjasRapidas("2099-01-02", null).length, 0);
});
test("rechaza fechas imposibles cuando hay reglas", () => {
  const reglas = { apertura: "09:00", cierre: "11:00", minutos_minimos: 30, minutos_maximos: 60, dias: [0,1,2,3,4,5,6] };
  assert.equal(generarFranjasRapidas("2099-02-30", reglas).length, 0);
  assert.equal(generarFranjasRapidas("fecha-invalida", reglas).length, 0);
});
test("las sugerencias respetan apertura, duración y días configurados en Bogotá", () => {
  const reglas = { apertura: "09:00", cierre: "11:00", minutos_minimos: 30, minutos_maximos: 60, dias: [0,1,2,3,4,5,6] };
  const franjas = generarFranjasRapidas("2099-01-02", reglas);
  assert.ok(franjas.length > 0);
  for (const franja of franjas) {
    assert.equal(franja.fin - franja.inicio, 30 * 60000);
    const hora = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Bogota", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(franja.inicio);
    assert.ok(hora >= "09:00" && hora < "11:00");
  }
  const diaBogota = new Date("2099-01-02T12:00:00Z").getUTCDay();
  assert.equal(generarFranjasRapidas("2099-01-02", { ...reglas, dias: reglas.dias.filter(value => value !== diaBogota) }).length, 0);
});
