import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
for (const path of [
  "/demo",
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/update-password",
]) {
  test("accessible public screen " + path, async ({ page }) => {
    await page.goto(path);
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(result.violations).toEqual([]);
  });
}
test("demo dialog traps keyboard focus and restores it on Escape", async ({
  page,
}) => {
  await page.goto("/demo");
  const trigger = page
    .getByRole("button", { name: "View Forma Studio" })
    .first();
  await trigger.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("dialog").getByRole("button", { name: "Close dialog" }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
});
