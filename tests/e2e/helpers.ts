import { expect, type Page } from "@playwright/test";
export const hasLiveAccounts = Boolean(
  process.env.E2E_USER_A_EMAIL &&
  process.env.E2E_USER_A_PASSWORD &&
  (process.env.E2E_USE_EMULATORS === "true" ||
    process.env.VITE_FIREBASE_PROJECT_ID),
);
export const isEmulated = process.env.E2E_USE_EMULATORS === "true";
export async function login(page: Page, account: "A" | "B" = "A") {
  await page.goto("/sign-in");
  await page
    .getByLabel("Email address")
    .fill(process.env["E2E_USER_" + account + "_EMAIL"]!);
  await page
    .getByLabel("Password", { exact: true })
    .fill(process.env["E2E_USER_" + account + "_PASSWORD"]!);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/app\/dashboard/);
}
