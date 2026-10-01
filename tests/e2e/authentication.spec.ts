import { test, expect } from "@playwright/test";
import { hasLiveAccounts, login } from "./helpers";
test("protected routes redirect and recovery routes remain reachable", async ({
  page,
}) => {
  await page.goto("/app/applications");
  await expect(page).toHaveURL(/\/sign-in/);
  await page.getByRole("link", { name: "Forgot password?" }).click();
  await expect(page).toHaveURL(/\/forgot-password/);
  await expect(
    page.getByRole("button", { name: "Send reset link" }),
  ).toBeVisible();
  await page.goto("/update-password");
  await expect(
    page.getByText("Open the link in your recovery email", { exact: false }),
  ).toBeVisible();
});
test("sign in, refresh persistence, and sign out", async ({ page }) => {
  test.skip(!hasLiveAccounts, "Dedicated Firebase test accounts are required.");
  await login(page);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Your next chapter." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL(/\/sign-in/);
  await page.goto("/app/dashboard");
  await expect(page).toHaveURL(/\/sign-in/);
});
test("invalid sign-in shows a friendly error", async ({ page }) => {
  test.skip(!hasLiveAccounts, "Firebase connection required.");
  await page.goto("/sign-in");
  await page.getByLabel("Email address").fill(process.env.E2E_USER_A_EMAIL!);
  await page
    .getByLabel("Password", { exact: true })
    .fill("definitely-not-the-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Unable to sign in");
});
