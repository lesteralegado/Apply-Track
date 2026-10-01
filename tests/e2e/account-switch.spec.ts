import { test, expect } from "@playwright/test";
import { hasLiveAccounts, login } from "./helpers";
import {
  loginAccount,
  commitDocument,
  firestoreRequest,
} from "../../scripts/firebase-test-client.mjs";

test("switching accounts clears the previous user's applications", async ({
  page,
}) => {
  test.skip(
    !hasLiveAccounts || !process.env.E2E_USER_B_EMAIL,
    "Two dedicated Firebase accounts required.",
  );
  const a = await loginAccount(
    process.env.E2E_USER_A_EMAIL,
    process.env.E2E_USER_A_PASSWORD,
  );
  const company = "Private account switch " + Date.now();
  const path = "users/" + a.localId + "/applications/switch-" + Date.now();
  const result = await commitDocument(
    path,
    a.idToken,
    {
      owner_id: a.localId,
      company,
      job_title: "Developer",
      job_url: null,
      status: "saved",
      application_date: null,
      follow_up_date: null,
      notes: null,
    },
    true,
  );
  expect(result.status).toBe(200);
  try {
    await login(page);
    await page
      .getByRole("link", { name: "Applications", exact: true })
      .first()
      .click();
    await page.getByLabel("Search company or role").fill(company);
    await expect(page.getByTestId("application-row")).toHaveCount(1);
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await login(page, "B");
    await page
      .getByRole("link", { name: "Applications", exact: true })
      .first()
      .click();
    await expect(page.getByText("No applications yet")).toBeVisible();
    await expect(page.getByText(company)).toHaveCount(0);
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await login(page);
    await page
      .getByRole("link", { name: "Applications", exact: true })
      .first()
      .click();
    await page.getByLabel("Search company or role").fill(company);
    await expect(page.getByTestId("application-row")).toHaveCount(1);
  } finally {
    expect(
      (await firestoreRequest("/" + path, a.idToken, "DELETE")).status,
    ).toBe(200);
  }
});
