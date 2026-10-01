import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
export function testConfig() {
  const emulated = process.env.E2E_USE_EMULATORS === "true";
  const projectId = emulated
    ? "demo-applytrack"
    : process.env.VITE_FIREBASE_PROJECT_ID;
  const apiKey = emulated ? "demo-api-key" : process.env.VITE_FIREBASE_API_KEY;
  assert(projectId && apiKey, "Firebase project configuration is missing.");
  return {
    emulated,
    projectId,
    apiKey,
    authBase: emulated
      ? "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1"
      : "https://identitytoolkit.googleapis.com/v1",
    documentsBase:
      (emulated
        ? "http://127.0.0.1:8080"
        : "https://firestore.googleapis.com") +
      "/v1/projects/" +
      projectId +
      "/databases/(default)/documents",
  };
}
export async function authRequest(action, body) {
  const config = testConfig();
  const response = await fetch(
    config.authBase +
      "/accounts:" +
      action +
      "?key=" +
      encodeURIComponent(config.apiKey),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    },
  );
  assert(
    response.ok,
    "Firebase authentication request failed (HTTP " + response.status + ").",
  );
  return await response.json();
}
export async function loginAccount(email, password) {
  assert(
    email && password,
    "Dedicated Firebase test account credentials are missing.",
  );
  return authRequest("signInWithPassword", {
    email,
    password,
    returnSecureToken: true,
  });
}
export async function createTestAccount(label = "user") {
  const email =
    "applytrack-e2e-" +
    label +
    "-" +
    randomBytes(6).toString("hex") +
    "@example.com";
  const password = randomBytes(18).toString("base64url") + "!9aA";
  const identity = await authRequest("signUp", {
    email,
    password,
    returnSecureToken: true,
  });
  return { email, password, ...identity };
}
export async function deleteTestAccount(account) {
  const fresh = await loginAccount(account.email, account.password);
  const listing = await firestoreRequest(
    "/users/" + fresh.localId + "/applications",
    fresh.idToken,
  );
  try {
    if (listing.status === 200) {
      const expected =
        "projects/" +
        testConfig().projectId +
        "/databases/(default)/documents/users/" +
        fresh.localId +
        "/applications/";
      for (const document of listing.data.documents ?? []) {
        assert(
          document.name.startsWith(expected),
          "Unexpected document outside disposable test account.",
        );
        const id = document.name.slice(expected.length);
        assert(id && !id.includes("/"));
        const removed = await firestoreRequest(
          "/users/" + fresh.localId + "/applications/" + encodeURIComponent(id),
          fresh.idToken,
          "DELETE",
        );
        assert.equal(removed.status, 200, "Test application cleanup failed.");
      }
    } else
      assert(
        [401, 403, 404].includes(listing.status),
        "Test application listing failed.",
      );
  } finally {
    await authRequest("delete", { idToken: fresh.idToken });
  }
}
export function field(value) {
  if (value === null) return { nullValue: null };
  if (typeof value === "boolean") return { booleanValue: value };
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  if (typeof value === "object") return { mapValue: { fields: fields(value) } };
  return { stringValue: value };
}
export function fields(values) {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, field(value)]),
  );
}
export async function firestoreRequest(path, token, method = "GET", body) {
  const response = await fetch(testConfig().documentsBase + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: "Bearer " + token } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(testConfig().emulated ? 30000 : 15000),
  });
  return {
    status: response.status,
    data: await response.json().catch(() => ({})),
  };
}
export async function commitDocument(
  path,
  token,
  values,
  creating = false,
  serverTimestampFields = [],
) {
  const base = testConfig().documentsBase;
  const name = base.slice(base.indexOf("/projects/") + 1) + "/" + path;
  return firestoreRequest(":commit", token, "POST", {
    writes: [
      {
        update: { name, fields: fields(values) },
        ...(creating
          ? { currentDocument: { exists: false } }
          : {
              currentDocument: { exists: true },
              updateMask: { fieldPaths: Object.keys(values) },
            }),
        updateTransforms: [
          ...(creating
            ? [{ fieldPath: "created_at", setToServerValue: "REQUEST_TIME" }]
            : []),
          { fieldPath: "updated_at", setToServerValue: "REQUEST_TIME" },
          ...serverTimestampFields.map((fieldPath) => ({
            fieldPath,
            setToServerValue: "REQUEST_TIME",
          })),
        ],
      },
    ],
  });
}
