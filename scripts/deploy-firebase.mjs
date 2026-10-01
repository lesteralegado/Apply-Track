import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
const projectId = process.env.VITE_FIREBASE_PROJECT_ID?.trim();
assert(
  projectId &&
    /^[a-z][a-z0-9-]+$/.test(projectId) &&
    !projectId.startsWith("demo-"),
  "Set the hosted Firebase project ID in .env.local.",
);
const cli = "node_modules/firebase-tools/lib/bin/firebase.js";
const output = execFileSync(
  process.execPath,
  [cli, "projects:list", "--json"],
  {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  },
);
const projects = JSON.parse(output);
assert(
  projects.status === "success" &&
    projects.result.some((project) => project.projectId === projectId),
  "The signed-in Firebase account cannot access the configured project.",
);
console.log("Publishing Firestore rules for " + projectId + ".");
execFileSync(
  process.execPath,
  [
    cli,
    "deploy",
    "--only",
    "firestore:rules",
    "--project",
    projectId,
    "--non-interactive",
  ],
  { stdio: "inherit" },
);
