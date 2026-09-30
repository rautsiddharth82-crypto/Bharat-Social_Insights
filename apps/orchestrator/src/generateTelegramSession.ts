import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import readline from "readline";

const candidates = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "apps/orchestrator/.env"),
  path.resolve(__dirname, "..", ".env"),
  path.resolve(__dirname, "..", "..", ".env"),
  path.resolve(__dirname, "..", "..", "..", ".env"),
];
for (const p of candidates) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
    break;
  }
}
dotenv.config();

function prompt(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans.trim());
    })
  );
}

async function main() {
  const apiId = Number(process.env.TELEGRAM_API_ID);
  const apiHash = process.env.TELEGRAM_API_HASH || "";

  if (!apiId || !apiHash) {
    console.error("ERROR: TELEGRAM_API_ID and TELEGRAM_API_HASH must be set in your .env file first.");
    console.log("Get them from https://my.telegram.org -> API development tools");
    process.exit(1);
  }

  console.log("Starting Telegram authentication...");
  console.log("Using API ID:", apiId);

  const session = new StringSession("");
  const client = new TelegramClient(session, apiId, apiHash, { connectionRetries: 5 });

  await client.start({
    phoneNumber: async () => await prompt("Enter your phone number (with country code, e.g. +91...): "),
    password: async () => await prompt("Enter your 2FA password (leave blank if none): "),
    phoneCode: async () => await prompt("Enter the verification code Telegram sent you: "),
    onError: (err) => console.error("Telegram Login Error:", err),
  });

  const sessionString = client.session.save() as unknown as string;
  console.log("\n=======================================================");
  console.log("SUCCESS! SAVE THIS AS TELEGRAM_SESSION_STRING IN YOUR .env AND RENDER:");
  console.log("=======================================================\n");
  console.log(sessionString);
  console.log("\n=======================================================\n");

  await client.disconnect();
  process.exit(0);
}

main();