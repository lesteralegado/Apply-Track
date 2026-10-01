import { test, expect } from "@playwright/test";
import { hasLiveAccounts, isEmulated, login } from "./helpers";
test("authenticated CRUD, validation, persistence, status and dashboard follow-ups", async ({
  page,
}) => {
  test.skip(!hasLiveAccounts, "Dedicated Firebase test accounts required.");
  const company = "E2E Company " + Date.now();
  await login(page);
  await page
    .getByRole("link", { name: "Add application", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Save application", exact: true })
    .click();
  await expect(page.getByText("Enter the company name.")).toBeVisible();
  await page.getByLabel("Company", { exact: false }).fill(company);
  await page
    .getByLabel("Job title", { exact: false })
    .fill("Frontend Engineer");
  await page.getByLabel("Status", { exact: false }).selectOption("applied");
  await page
    .getByRole("button", { name: "Save application", exact: true })
    .click();
  await expect(
    page.getByText("Add an application date for this status."),
  ).toBeVisible();
  await page
    .getByLabel("Application date", { exact: false })
    .fill("2026-09-30");
  await page.getByLabel("Follow-up date", { exact: false }).fill("2026-09-30");
  await page
    .getByLabel("Notes", { exact: false })
    .fill("Prepare portfolio walkthrough.");
  await page
    .getByRole("button", { name: "Save application", exact: true })
    .click();
  await expect(page).toHaveURL(/\/app\/applications$/);
  await page.reload();
  await page.getByLabel("Search company or role").fill(company);
  await expect(page.getByTestId("application-row")).toHaveCount(1);
  await page
    .getByRole("link", { name: "Edit " + company, exact: true })
    .first()
    .click();
  await expect(page.getByLabel("Notes", { exact: false })).toHaveValue(
    "Prepare portfolio walkthrough.",
  );
  await page
    .getByLabel("Job title", { exact: false })
    .fill("Full-stack Engineer");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await page.getByLabel("Search company or role").fill(company);
  await page
    .getByLabel("Status for " + company, { exact: true })
    .first()
    .selectOption("interviewing");
  await expect(page.getByRole("status")).toContainText(
    "Application status updated.",
  );
  await page
    .getByRole("link", { name: "Overview", exact: true })
    .first()
    .click();
  await expect(page.getByText(company).first()).toBeVisible();
  await page
    .getByRole("button", { name: "Review follow-up for " + company })
    .click();
  await page.getByLabel("Review outcome").selectOption("waiting");
  await page.getByLabel("Next follow-up date").fill("2099-01-01");
  await page.getByRole("button", { name: "Save review", exact: true }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Review follow-up for " + company }),
  ).toHaveCount(0);
  await page.goto("/app/applications");
  await page.getByLabel("Search company or role").fill(company);
  await page
    .getByRole("link", { name: "Edit " + company, exact: true })
    .first()
    .click();
  await expect(page.getByLabel("Follow-up date", { exact: false })).toHaveValue(
    "2099-01-01",
  );
  await expect(page.getByLabel("Notes", { exact: false })).toHaveValue(
    "Prepare portfolio walkthrough.",
  );
  await page
    .getByRole("link", { name: "Applications", exact: true })
    .first()
    .click();
  await page.getByLabel("Search company or role").fill(company);
  await page
    .getByRole("button", { name: "Delete " + company, exact: true })
    .first()
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.getByTestId("application-row")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Delete " + company, exact: true })
    .first()
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete application", exact: true })
    .click();
  await expect(page.getByText("No matching applications")).toBeVisible();
});
test("a failed save keeps form data and displays a useful error", async ({
  page,
  request,
}) => {
  test.skip(
    !hasLiveAccounts || !isEmulated,
    "Temporarily denies creation only in the disposable emulator.",
  );
  const { readFileSync } = await import("node:fs");
  const rules = readFileSync("firestore.rules", "utf8");
  const endpoint =
    "http://127.0.0.1:8080/emulator/v1/projects/demo-applytrack:securityRules";
  const publish = async (content: string) => {
    const response = await request.put(endpoint, {
      data: { rules: { files: [{ content }] } },
    });
    expect(response.ok()).toBe(true);
  };
  await login(page);
  await page.goto("/app/applications/new");
  await page.getByLabel("Company", { exact: false }).fill("Preserved draft");
  await page.getByLabel("Job title", { exact: false }).fill("Developer");
  try {
    await publish(
      rules.replace(
        "allow create: if owns(userId)",
        "allow create: if false && owns(userId)",
      ),
    );
    await page
      .getByRole("button", { name: "Save application", exact: true })
      .click();
    await expect(page.getByRole("alert")).toContainText(
      "We couldn't save this application",
    );
    await expect(page.getByLabel("Company", { exact: false })).toHaveValue(
      "Preserved draft",
    );
    await expect(page.getByLabel("Job title", { exact: false })).toHaveValue(
      "Developer",
    );
    await expect(page.getByRole("alert")).not.toContainText(
      "PERMISSION_DENIED",
    );
  } finally {
    await publish(rules);
  }
});

test("a confirmed save succeeds even if the subsequent list read fails", async ({
  page,
  request,
}) => {
  test.skip(
    !hasLiveAccounts || !isEmulated,
    "Temporary read denial uses the disposable emulator.",
  );
  const { readFileSync } = await import("node:fs");
  const rules = readFileSync("firestore.rules", "utf8");
  const endpoint =
    "http://127.0.0.1:8080/emulator/v1/projects/demo-applytrack:securityRules";
  const publish = async (content: string) => {
    const response = await request.put(endpoint, {
      data: { rules: { files: [{ content }] } },
    });
    expect(response.ok()).toBe(true);
  };
  const company = "Confirmed save " + Date.now();
  await login(page);
  await page.goto("/app/applications/new");
  await page.getByLabel("Company", { exact: false }).fill(company);
  await page.getByLabel("Job title", { exact: false }).fill("Developer");
  try {
    await publish(
      rules.replace(
        "allow read: if owns(userId)",
        "allow read: if false && owns(userId)",
      ),
    );
    await page
      .getByRole("button", { name: "Save application", exact: true })
      .click();
    await expect(page).toHaveURL(/\/app\/applications$/);
    await expect(page.getByRole("alert")).toContainText(
      "We couldn't load your applications",
    );
    await expect(page.getByRole("alert")).not.toContainText("We couldn't save");
  } finally {
    await publish(rules);
  }
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await page.getByLabel("Search company or role").fill(company);
  await expect(page.getByTestId("application-row")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Delete " + company, exact: true })
    .first()
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete application", exact: true })
    .click();
  await expect(page.getByTestId("application-row")).toHaveCount(0);
});
