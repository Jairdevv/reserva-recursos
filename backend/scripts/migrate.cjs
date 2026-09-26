const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");
require("dotenv").config({ quiet: true });
const { Client } = require("pg");

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL es requerido");
  const directory = path.resolve(__dirname, "../migrations");
  const requested = process.argv.slice(2);
  const available = (await fs.readdir(directory)).filter(name => /^\d+_[a-z_]+\.sql$/.test(name)).sort();
  const names = requested.length ? requested : available;
  if (names.some(name => !available.includes(name))) throw new Error("Migración desconocida");
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query("SELECT pg_advisory_lock(725093251)");
    await client.query("CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, checksum TEXT NOT NULL, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())");
    for (const name of names) {
      const source = await fs.readFile(path.join(directory, name), "utf8");
      const checksum = crypto.createHash("sha256").update(source).digest("hex");
      const applied = await client.query("SELECT checksum FROM schema_migrations WHERE name = $1", [name]);
      if (applied.rowCount) {
        if (applied.rows[0].checksum !== checksum) throw new Error("La migración aplicada fue modificada: " + name);
        console.log("Ya aplicada: " + name);
        continue;
      }
      await client.query("BEGIN");
      try {
        const sql = source.replace(/^\s*BEGIN;\s*/i, "").replace(/COMMIT;\s*$/i, "");
        await client.query(sql);
        await client.query("INSERT INTO schema_migrations(name, checksum) VALUES ($1, $2)", [name, checksum]);
        await client.query("COMMIT");
        console.log("Aplicada: " + name);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }
  } finally {
    await client.end();
  }
}
main().catch(error => {
  console.error("No se pudo aplicar la migración", { code: error.code, message: error.code ? "Revisa restricciones y migraciones previas; la migración fallida se revirtió." : error.message });
  process.exitCode = 1;
});
