import { test, expect } from "@playwright/test";
import { hasLiveAccounts } from "./helpers";
test("direct Firestore REST API enforces ownership and validation", async () => {
  test.skip(
    !hasLiveAccounts || !process.env.E2E_USER_B_EMAIL,
    "Two dedicated Firebase accounts required.",
  );
  const { verifyPrivacy } = await import("../../scripts/verify-privacy.mjs");
  expect(await verifyPrivacy()).toHaveLength(
    process.env.E2E_USE_EMULATORS === "true" ? 46 : 24,
  );
});
