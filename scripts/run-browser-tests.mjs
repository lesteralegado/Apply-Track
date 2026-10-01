import { execFileSync } from "node:child_process";
import {
  createTestAccount,
  deleteTestAccount,
} from "./firebase-test-client.mjs";
const emulated = process.argv.includes("--emulators");
process.env.E2E_USE_EMULATORS = String(emulated);
process.env.VITE_FIREBASE_USE_EMULATORS = String(emulated);
const accounts = [];
try {
  const a = await createTestAccount("a");
  accounts.push(a);
  const b = await createTestAccount("b");
  accounts.push(b);
  const env = {
    ...process.env,
    E2E_USER_A_EMAIL: a.email,
    E2E_USER_A_PASSWORD: a.password,
    E2E_USER_B_EMAIL: b.email,
    E2E_USER_B_PASSWORD: b.password,
    E2E_PORT: emulated ? "5174" : "5175",
  };
  execFileSync(
    process.execPath,
    [
      "node_modules/@playwright/test/cli.js",
      "test",
      ...process.argv.slice(2).filter((arg) => arg !== "--emulators"),
    ],
    { env, stdio: "inherit" },
  );
} finally {
  for (const account of accounts) await deleteTestAccount(account);
}
