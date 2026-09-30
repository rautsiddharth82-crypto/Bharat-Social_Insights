import dotenv from "dotenv";
import path from "path";

// Working-directory resolution instead of import.meta.url so this script compiles
// under the package's CommonJS emit. dotenv keeps the first value it finds.
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), "..", "..", ".env") });

import { pgPool } from "./db/timescale.js";
import fs from "fs";

async function initDatabase() {
  try {
    const sqlPath = path.join(__dirname, "db", "init_db.sql");
    const sql = fs.readFileSync(sqlPath, "utf-8");
    
    // Split by semicolon and execute each statement
    const statements = sql.split(";").filter(s => s.trim());
    
    for (const stmt of statements) {
      if (stmt.trim()) {
        await pgPool.query(stmt);
        console.log("Executed:", stmt.trim().substring(0, 60) + "...");
      }
    }
    
    console.log("Database initialized successfully!");
    await pgPool.end();
    process.exit(0);
  } catch (err) {
    console.error("Database initialization failed:", err);
    await pgPool.end();
    process.exit(1);
  }
}

initDatabase();