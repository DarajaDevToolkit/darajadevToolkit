# Drizzle ORM Setup Guide

This project uses [Drizzle ORM](https://orm.drizzle.team/) with PostgreSQL for type-safe database access and migrations.

---

## 1. Install Dependencies

Make sure you have the following dependencies in your `package.json`:

```json
"dependencies": {
  "drizzle-orm": "^0.44.2",
  "drizzle-kit": "^0.31.1",
  "pg": "^8.16.2",
  "dotenv": "^16.5.0"
}
```

Install them with:

```bash
bun install
```

---

## 2. Configure Drizzle

Create a `drizzle.config.ts` file at the root of your service (already present):

```ts
import { defineConfig } from 'drizzle-kit';
import "dotenv/config";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/drizzle/schema.ts",
  out: "./src/drizzle/migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL as string,
  },
  verbose: true,
  strict: true,
});
```

- **DATABASE_URL** should be set in your environment (e.g., `.env` file):  
  `DATABASE_URL=postgres://user:password@host:port/dbname`

---

## 3. Define Your Schema

Define your tables in `src/drizzle/schema.ts` using Drizzle's schema builder:

```ts
import { pgTable, uuid, varchar, timestamp, boolean, text, jsonb, integer } from 'drizzle-orm/pg-core';

export const users = pgTable('users', { ... });
export const webhooks = pgTable('webhooks', { ... });
export const deliveryAttempts = pgTable('delivery_attempts', { ... });
```

---

## 4. Generate and Run Migrations

### Update the package.json file:
Update the `package.json` file to include the following scripts:

```json
"scripts": {
  "generate": "drizzle-kit generate",
  "migrate": "tsx src/drizzle/migrate.ts",
  "studio": "drizzle-kit studio",
  "push": "drizzle-kit generate && tsx src/drizzle/migrate.ts"
}
```

- **Generate migration files** based on your schema:
  ```bash
  bun run generate
  ```
  _o

- **Run migrations** to apply them to your database:
  ```bash
  bun run migrate
  ```


The migration script (`src/drizzle/migrate.ts`) uses Drizzle's migrator:

```ts
import { migrate } from "drizzle-orm/node-postgres/migrator";
import db, { client } from "./db";
...
await migrate(db, { migrationsFolder: __dirname + "/migrations" });
await client.end();
```

---

## 5. Connect to the Database in Your App

Use Drizzle ORM in your app by creating a client in `src/drizzle/db.ts`:

```ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";
import * as schema from "./schema";

export const client = new Client({
  connectionString: process.env.DATABASE_URL as string,
});

await client.connect();
const db = drizzle(client, { schema, logger: true });
export default db;
```

---

## 6. Seeding the Database (Optional)

You can seed your database using a script like `src/drizzle/seed.ts`:

```ts
import db from './db';
import { users, webhooks, deliveryAttempts } from './schema';

await db.insert(users).values([...]);
await db.insert(webhooks).values([...]);
await db.insert(deliveryAttempts).values([...]);
```

Run with:
```bash
bunx tsx src/drizzle/seed.ts
```

---

## 7. Useful Scripts

Your `package.json` includes helpful scripts:

- `bun run generate` — Generate migrations
- `bun run migrate` — Run migrations
- `bun run push` — Generate and run migrations
- `bun run seed` — Seed the database

---

## 8. Using Drizzle in Your App

Import and use the `db` instance from `src/drizzle/db.ts` in your services, controllers, or routes.

---

**Note:**  
- For more, see [Drizzle ORM docs](https://orm.drizzle.team/docs/overview).
