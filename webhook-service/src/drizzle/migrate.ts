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
//#################################################################################


// temporarily dropping schema and running migrations
// import 'dotenv/config';
// import { migrate } from 'drizzle-orm/node-postgres/migrator';
// import db, { client } from './db';
// import { sql } from 'drizzle-orm';
// import { dirname } from 'path';
// import { fileURLToPath } from 'url';

// const __dirname = dirname(fileURLToPath(import.meta.url));

// async function migration() {
//   console.log('→ Dropping old schema…');
//   await db.execute(sql`DROP SCHEMA IF EXISTS public CASCADE;`);
//   await db.execute(sql`CREATE SCHEMA public;`);
//   await db.execute(sql`GRANT ALL ON SCHEMA public TO public;`);

//   console.log('→ Running Drizzle migrations…');
//   await migrate(db, { migrationsFolder: __dirname + '/migrations' });

//   console.log('→ Closing connection.');
//   await client.end();
// }

// migration().catch(err => {
//   console.error('❌❌❌Migration failed❗❗:', err);
//   process.exit(1);
// });


import "dotenv/config";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import db, { client } from "./db";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { sql } from "drizzle-orm";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function migration() {
  console.log("======== Migrations started ========");

  await migrate(db, { migrationsFolder: __dirname + "/migrations" });

  console.log("✅ Migration completed!");

  // 🔍 Query and display all tables in the public schema
  const result = await db.execute(sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE';
  `);

  console.log("📋 Tables in the database:");
  result.rows.forEach((row: any) => {
    console.log(`- ${row.table_name}`);
  });

  await client.end();
  console.log("======== Migrations ended ========");
  process.exit(0);
}

migration().catch((err) => {
  console.error(err);
  process.exit(1);
});
