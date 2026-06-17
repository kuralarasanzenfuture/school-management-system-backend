// import fs from "fs";
// import path from "path";
// import db from "../config/db.js";

// export const runMigrations = async () => {
//   const dir = path.join(process.cwd(), "src/database/migrations");
//   const files = fs.readdirSync(dir).sort();

//   for (const file of files) {
//     const sql = fs.readFileSync(path.join(dir, file), "utf-8");
//     console.log(`Running: ${file}`);
//     await db.query(sql);
//   }

//   console.log("✅ All migrations executed");
//   process.exit();
// };

// runMigrations();

/**
 * @param {string} sql
 * @returns {Promise<void>}
 */

// import fs from "fs";
// import path from "path";
// import { initDB, getDB } from "../config/db.js";

// const runMigrations = async () => {
//   await initDB(); // 🔥 must call first

//   const db = getDB();

//   const dir = path.join(process.cwd(), "src/database/migrations");
//   const files = fs.readdirSync(dir).sort();

//   for (const file of files) {
//     const sql = fs.readFileSync(path.join(dir, file), "utf-8");
//     console.log(`Running: ${file}`);
//     await db.query(sql);
//   }

//   console.log("✅ Migrations done");
//   process.exit();
// };

// runMigrations();


// export default runMigrations;


/*------------------------------------------------------------------*/

// import fs from "fs";
// import path from "path";
// import { initDB, getDB } from "../config/db.js";

// const runMigrations = async () => {
//   await initDB();
//   const db = getDB();

//   const dir = path.join(process.cwd(), "src/database/migrations");
//   const files = fs.readdirSync(dir).sort();

//   // 🔹 ensure migrations table exists
//   await db.query(`
//     CREATE TABLE IF NOT EXISTS migrations (
//       id INT AUTO_INCREMENT PRIMARY KEY,
//       name VARCHAR(255) UNIQUE,
//       executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//     )
//   `);

//   const [executed] = await db.query(`SELECT name FROM migrations`);
//   const executedFiles = executed.map((e) => e.name);

//   for (const file of files) {
//     if (executedFiles.includes(file)) {
//       console.log(`⏩ Skipping: ${file}`);
//       continue;
//     }

//     const sql = fs.readFileSync(path.join(dir, file), "utf-8");

//     console.log(`🚀 Running: ${file}`);
//     await db.query(sql);

//     await db.query(
//       `INSERT INTO migrations (name) VALUES (?)`,
//       [file]
//     );
//   }

//   console.log("✅ Migrations up to date");
// };

// export default runMigrations;


/* BULLETPROOF MIGRATION RUNNER */

import fs from "fs";
import path from "path";
import { initDB, getDB } from "../config/db.js";

const MIGRATIONS_DIR = path.join(process.cwd(), "src/database/migrations");

const log = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  error: (msg) => console.error(`❌ ${msg}`),
};

const runMigrations = async () => {
  await initDB();
  const db = getDB();

  // 🔹 ensure migrations table exists
  await db.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) UNIQUE,
      status ENUM('pending','success','failed') DEFAULT 'pending',
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const files = fs.readdirSync(MIGRATIONS_DIR).sort();

  const [executedRows] = await db.query(
    `SELECT name, status FROM migrations`
  );

  const executedMap = new Map();
  executedRows.forEach((m) => executedMap.set(m.name, m.status));

  for (const file of files) {
    const already = executedMap.get(file);

    if (already === "success") {
      log.info(`Skipping already executed: ${file}`);
      continue;
    }

    const filePath = path.join(MIGRATIONS_DIR, file);
    const sql = fs.readFileSync(filePath, "utf-8");

    const conn = await db.getConnection();

    try {
      log.info(`Running: ${file}`);

      await conn.beginTransaction();

      // mark as pending (or update)
      await conn.query(
        `INSERT INTO migrations (name, status)
         VALUES (?, 'pending')
         ON DUPLICATE KEY UPDATE status='pending'`,
        [file]
      );

      // 🔥 run SQL
      await conn.query(sql);

      // mark success
      await conn.query(
        `UPDATE migrations SET status='success' WHERE name=?`,
        [file]
      );

      await conn.commit();
      log.success(`Completed: ${file}`);
    } catch (err) {
      await conn.rollback();

      await conn.query(
        `UPDATE migrations SET status='failed' WHERE name=?`,
        [file]
      );

      log.error(`Failed: ${file}`);
      log.error(err.message);

      // 🔥 STOP execution immediately
      throw new Error(`Migration stopped at: ${file}`);
    } finally {
      conn.release();
    }
  }

  log.success("All migrations are up to date");
};

export default runMigrations;

