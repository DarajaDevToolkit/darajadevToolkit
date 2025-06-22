import "dotenv/config";
import { migrate } from "drizzle-orm/node-postgres/migrator";

import db, { client } from "./db";
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function migration() {

    console.log("======== Migrations started ========")
    await migrate(db, { migrationsFolder: __dirname + "/migrations" })
    await client.end()
    console.log("======== Migrations ended ========")
    process.exit(0)

}

migration().catch((err) => {
    console.error(err)
    process.exit(0)
})