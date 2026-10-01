import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
const env = { ...process.env };
const javaCache = ".context/compound-engineering/firebase-migration/java";
if (!env.JAVA_HOME && existsSync(javaCache)) {
  const runtime = readdirSync(javaCache).find(
    (name) =>
      name.startsWith("jdk-") &&
      existsSync(join(javaCache, name, "bin", "java.exe")),
  );
  if (runtime) {
    env.JAVA_HOME = join(process.cwd(), javaCache, runtime);
    env.PATH = join(env.JAVA_HOME, "bin") + ";" + env.PATH;
  }
}
const test = process.argv.includes("test");
const args = [
  "node_modules/firebase-tools/lib/bin/firebase.js",
  test ? "emulators:exec" : "emulators:start",
  "--project",
  "demo-applytrack",
  "--only",
  "auth,firestore",
  ...(test ? ["node scripts/run-browser-tests.mjs --emulators"] : []),
];
const result = spawnSync(process.execPath, args, { env, stdio: "inherit" });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
