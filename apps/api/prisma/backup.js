// Respaldo COMPLETO de la base a un JSON con timestamp.
// Uso: DATABASE_URL=... node apps/api/prisma/backup.js
// El archivo se guarda en ./backups (NO se commitea — contiene datos personales).
const { PrismaClient, Prisma } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Cargar DATABASE_URL desde .env si no está en el entorno (para correr fácil)
if (!process.env.DATABASE_URL) {
  const candidates = [
    path.join(process.cwd(), '.env'),
    path.join(__dirname, '..', '.env'),
    path.join(__dirname, '..', '..', '..', '.env'),
  ];
  for (const p of candidates) {
    try {
      const m = fs.readFileSync(p, 'utf8').match(/^DATABASE_URL=(.*)$/m);
      if (m) { process.env.DATABASE_URL = m[1].trim().replace(/^["']|["']$/g, ''); break; }
    } catch (_) { /* seguir */ }
  }
}

const prisma = new PrismaClient();

(async () => {
  const models = Prisma.dmmf.datamodel.models.map((m) => m.name);
  const dump = {};
  const counts = {};

  for (const model of models) {
    const key = model.charAt(0).toLowerCase() + model.slice(1);
    if (prisma[key] && typeof prisma[key].findMany === 'function') {
      const rows = await prisma[key].findMany();
      dump[model] = rows;
      counts[model] = rows.length;
    }
  }

  const dir = path.join(process.cwd(), 'backups');
  fs.mkdirSync(dir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const file = path.join(dir, `backup-${ts}.json`);

  const json = JSON.stringify(
    dump,
    (k, v) => (typeof v === 'bigint' ? v.toString() : v),
    2,
  );
  fs.writeFileSync(file, json, 'utf8');

  console.log('=== RESPALDO CREADO ===');
  console.log('Archivo:', file);
  console.log('Tamaño :', (json.length / 1024).toFixed(1), 'KB');
  console.log('Conteos por tabla:');
  console.log(JSON.stringify(counts, null, 2));

  await prisma.$disconnect();
})().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
