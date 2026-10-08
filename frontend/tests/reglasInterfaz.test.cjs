const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const mod = { exports: {} };
const source = fs.readFileSync(path.resolve(__dirname, "../src/features/recursos/components/ReglasReservaInfo.tsx"), "utf8");
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText;
vm.runInNewContext(code, { module: mod, exports: mod.exports, require });
const Componente = mod.exports.default;
const render = reglas => renderToStaticMarkup(React.createElement(Componente, { reglas }));
test("no presenta límites si el recurso no tiene reglas", () => {
  assert.equal(render(null), "");
  assert.equal(render(undefined), "");
});
test("muestra exactamente los límites configurados", () => {
  const html = render({ apertura: "10:30", cierre: "17:00", minutos_minimos: 45, minutos_maximos: 90, dias: [1, 3] });
  assert.ok(html.includes("10:30 – 17:00"));
  assert.ok(html.includes("45 – 90 minutos"));
  assert.ok(html.includes("Lunes, Miércoles"));
  assert.equal(html.includes("08:00"), false);
});
