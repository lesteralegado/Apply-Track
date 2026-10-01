import { test, expect } from "@playwright/test";
import { isEmulated } from "./helpers";
import {
  createTestAccount,
  deleteTestAccount,
  authRequest,
} from "../../scripts/firebase-test-client.mjs";
import { randomBytes } from "node:crypto";

test("sign-up creates a private account", async ({ page }) => {
  test.skip(
    !isEmulated,
    "Disposable sign-up is exercised in the Auth emulator.",
  );
  const email =
    "applytrack-signup-" + randomBytes(6).toString("hex") + "@example.com";
  const password = randomBytes(16).toString("base64url") + "!9aA";
  try {
    await page.goto("/sign-up");
    await page.getByLabel("Email address").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page
      .getByRole("button", { name: "Create account", exact: true })
      .click();
    await expect(page).toHaveURL(/\/app\/dashboard/);
    await expect(page.getByText("No applications yet")).toBeVisible();
    await page.reload();
    await expect(page.getByText("No applications yet")).toBeVisible();
  } finally {
    const identity = await authRequest("signInWithPassword", {
      email,
      password,
      returnSecureToken: true,
    });
    await authRequest("delete", { idToken: identity.idToken });
  }
});

test("email recovery changes the password, supports sign-in, and rejects a used code", async ({
  page,
  request,
  baseURL,
}) => {
  test.skip(!isEmulated, "Uses the Auth emulator's recovery-code inbox.");
  const account = await createTestAccount("recovery");
  const password = randomBytes(18).toString("base64url") + "!9aA";
  try {
    await page.goto("/forgot-password");
    await page.getByLabel("Email address").fill(account.email);
    await page
      .getByRole("button", { name: "Send reset link", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText(
      "If an account exists",
    );
    const response = await request.get(
      "http://127.0.0.1:9099/emulator/v1/projects/demo-applytrack/oobCodes",
    );
    const data = await response.json();
    const code = data.oobCodes.find(
      (item: { email: string; requestType: string }) =>
        item.email === account.email && item.requestType === "PASSWORD_RESET",
    );
    expect(code).toBeTruthy();
    const recoveryURL =
      baseURL +
      "/update-password?mode=resetPassword&oobCode=" +
      encodeURIComponent(code.oobCode);
    await page.goto(recoveryURL);
    await page.getByLabel("New password", { exact: true }).fill(password);
    await page
      .getByLabel("Confirm new password", { exact: true })
      .fill("does-not-match");
    await page
      .getByRole("button", { name: "Update password", exact: true })
      .click();
    await expect(page.getByRole("alert")).toContainText("passwords");
    await page
      .getByLabel("Confirm new password", { exact: true })
      .fill(password);
    await page
      .getByRole("button", { name: "Update password", exact: true })
      .click();
    await expect(page).toHaveURL(/\/sign-in/);
    await expect(page.getByRole("status")).toContainText("Password updated");
    await page.getByLabel("Email address").fill(account.email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL(/\/app\/dashboard/);
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await page.goto(recoveryURL);
    await expect(
      page.getByText("This reset link is expired", { exact: false }),
    ).toBeVisible();
  } finally {
    try {
      await deleteTestAccount({ ...account, password });
    } catch {
      await deleteTestAccount(account);
    }
  }
});

test("an invalid recovery code provides a new-link action", async ({
  page,
}) => {
  test.skip(!isEmulated, "Invalid-code verification uses the Auth emulator.");
  await page.goto("/update-password?mode=resetPassword&oobCode=invalid-code");
  await expect(
    page.getByText("This reset link is expired", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Request a new link" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Update password" }),
  ).toHaveCount(0);
});
