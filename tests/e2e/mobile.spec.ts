import { test, expect } from "@playwright/test";
import { login, hasLiveAccounts } from "./helpers";
for (const width of [360, 390, 768, 1024, 1440]) {
  test("responsive demo at " + width + "px", async ({ page }) => {
    await page.setViewportSize({ width, height: 850 });
    await page.goto("/demo");
    await expect(
      page.getByRole("heading", { name: "Your next chapter." }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    if (process.env.E2E_CAPTURE_REVIEW_SCREENSHOTS === "true")
      await page.screenshot({
        path: "docs/screenshots/follow-up-demo-" + width + "px.png",
        fullPage: true,
      });
    if (width < 768) {
      await expect(page.getByTestId("application-card").first()).toBeVisible();
      await expect(
        page.getByTestId("application-row").first(),
      ).not.toBeVisible();
      await page
        .getByRole("navigation", { name: "Mobile navigation" })
        .getByRole("link", { name: "Applications", exact: true })
        .click();
      await expect(
        page.getByRole("heading", { name: "Applications." }),
      ).toBeVisible();
    } else
      await expect(page.getByTestId("application-row").first()).toBeVisible();
  });
}
test("mobile form fits the viewport", async ({ page }) => {
  test.skip(!hasLiveAccounts, "Dedicated Firebase test accounts required.");
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  await page
    .getByRole("link", { name: "Add application", exact: true })
    .first()
    .click();
  await expect(page.getByLabel("Company", { exact: false })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await expect(
    page.getByRole("button", { name: "Save application", exact: true }),
  ).toBeVisible();
});
