// import "dotenv/config";
// import { migrate } from "drizzle-orm/node-postgres/migrator";

// import db, { client } from "./db";
// import { dirname } from 'path';
// import { fileURLToPath } from 'url';

// const __dirname = dirname(fileURLToPath(import.meta.url));

// async function migration() {

//     console.log("======== Migrations started ========")
//     await migrate(db, { migrationsFolder: __dirname + "/migrations" })
//     await client.end()
//     console.log("======== Migrations ended ========")
//     process.exit(0)

// }

// migration().catch((err) => {
//     console.error(err)
//     process.exit(0)
// })

// temporarily dropping schema and running migrations
import 'dotenv/config';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import db, { client } from './db';
import { sql } from 'drizzle-orm';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function migration() {
  console.log('→ Dropping old schema…');
  await db.execute(sql`DROP SCHEMA IF EXISTS public CASCADE;`);
  await db.execute(sql`CREATE SCHEMA public;`);
  await db.execute(sql`GRANT ALL ON SCHEMA public TO public;`);

  console.log('→ Running Drizzle migrations…');
  await migrate(db, { migrationsFolder: __dirname + '/migrations' });

  console.log('→ Closing connection.');
  await client.end();
}

migration().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
