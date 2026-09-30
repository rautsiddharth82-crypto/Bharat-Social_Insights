import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import dotenv from "dotenv";
import path from "path";

// Working-directory resolution instead of import.meta.url so this script compiles
// under the package's CommonJS emit.
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), "..", "..", ".env") });

async function main() {
  const apiId = Number(process.env.TELEGRAM_API_ID);
  const apiHash = process.env.TELEGRAM_API_HASH || "";

  console.log("API ID:", apiId);
  console.log("API Hash:", apiHash ? "SET" : "MISSING");

  const session = new StringSession("");
  const client = new TelegramClient(session, apiId, apiHash, { connectionRetries: 3 });

  await client.connect();
  console.log("\n=== SAVE THIS AS TELEGRAM_SESSION_STRING IN .env ===");
  console.log(client.session.save());
  await client.disconnect();
}

main();