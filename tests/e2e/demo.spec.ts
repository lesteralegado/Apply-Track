import { test, expect } from "@playwright/test";
test("public demo is fictional, searchable, read-only and makes no application requests", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (request) => {
    if (/google\.firestore|firestore\.googleapis|:8080\/v1/.test(request.url()))
      requests.push(request.url());
  });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page).toHaveURL(/\/demo/);
  await expect(page.getByText("Demo mode", { exact: true })).toBeVisible();
  await expect(
    page.getByText(
      "This dashboard uses fictional sample data. Editing is disabled.",
    ),
  ).toBeVisible();
  await expect(page.getByText("Forma Studio").first()).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Delete|Edit|Save|Review follow-up/ }),
  ).toHaveCount(0);
  await page.getByLabel("Search company or role").fill("  NORTHSTAR ");
  await expect(page.getByTestId("application-row")).toHaveCount(1);
  await page.getByLabel("Filter by status").selectOption("interviewing");
  await expect(page.getByText("No matching applications")).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page.getByTestId("application-row")).toHaveCount(8);
  await page.getByRole("button", { name: "View Forma Studio" }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByText("Last review: Reviewed", { exact: false }),
  ).toBeVisible();
  await expect(page.getByText("Fictional sample · Read-only")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  expect(requests).toEqual([]);
  expect(errors).toEqual([]);
});
test("demo filters survive refresh", async ({ page }) => {
  await page.goto(
    "/demo?view=applications&status=interviewing&search=frontend",
  );
  await expect(page.getByTestId("application-row")).toHaveCount(2);
  await page.reload();
  await expect(page.getByLabel("Filter by status")).toHaveValue("interviewing");
  await expect(page.getByLabel("Search company or role")).toHaveValue(
    "frontend",
  );
  await expect(page.getByTestId("application-row")).toHaveCount(2);
});
