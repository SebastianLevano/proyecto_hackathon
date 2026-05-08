require("dotenv").config({ path: ".env.local", quiet: true });
require("dotenv").config({ quiet: true });

const { neon } = require("@neondatabase/serverless");

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL;

if (!connectionString) {
  console.error(
    "❌ Falta DATABASE_URL (o POSTGRES_URL). Ejecuta `vercel env pull .env.local` o configúralo en .env"
  );
  process.exit(1);
}

const sql = neon(connectionString);

async function main() {
  console.log("⏳ Creando tablas...");

  await sql`
    CREATE TABLE IF NOT EXISTS aulas (
      id SERIAL PRIMARY KEY,
      nombre TEXT NOT NULL UNIQUE
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS teachers (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      aula_id INTEGER REFERENCES aulas(id)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS responses (
      id SERIAL PRIMARY KEY,
      aula_id INTEGER NOT NULL,
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  console.log("✅ Tablas listas");
  console.log("⏳ Sembrando aulas y profesores demo...");

  const aulas = [
    "1ro de Secundaria",
    "2do de Secundaria",
    "3ro de Secundaria",
    "4to de Secundaria",
    "5to de Secundaria"
  ];

  for (const nombre of aulas) {
    await sql`
      INSERT INTO aulas (nombre)
      VALUES (${nombre})
      ON CONFLICT (nombre) DO NOTHING
    `;
  }

  const aulaRows = await sql`SELECT id, nombre FROM aulas ORDER BY id`;

  for (let i = 0; i < aulaRows.length && i < 5; i++) {
    const username = `profesor${i + 1}`;
    const password = `pass${i + 1}`;
    const aulaId = aulaRows[i].id;

    await sql`
      INSERT INTO teachers (username, password, aula_id)
      VALUES (${username}, ${password}, ${aulaId})
      ON CONFLICT (username) DO NOTHING
    `;
  }

  console.log("✅ Seed completado");
  console.log(`   ${aulaRows.length} aulas, hasta 5 profesores demo`);
  console.log("   Credenciales: profesor1/pass1 ... profesor5/pass5");
}

main().catch((err) => {
  console.error("❌ Error inicializando DB:", err);
  process.exit(1);
});
