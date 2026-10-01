import { test, expect, type Page } from "@playwright/test";
import { hasLiveAccounts, isEmulated, login } from "./helpers";

const apiPath = "/src/features/applications/api/applications.ts";
const clientPath = "/src/lib/firebase/client.ts";

async function seeded(page: Page, followUpDate = "2020-01-01") {
  await page.goto("/app/applications/new");
  await expect(page.getByLabel("Company", { exact: false })).toBeVisible();
  return page.evaluate(
    async ({ apiPath, clientPath, followUpDate }) => {
      const api = await import(apiPath);
      const { auth } = await import(clientPath);
      const owner = auth.currentUser.uid;
      const company = "Review persistence " + crypto.randomUUID();
      await api.createApplication(owner, {
        company,
        jobTitle: "Engineer",
        jobUrl: "https://example.com/jobs",
        status: "applied",
        applicationDate: "2026-09-20",
        followUpDate,
        notes: "Keep these notes.",
      });
      return (await api.getApplications(owner)).find(
        (item: { company: string }) => item.company === company,
      );
    },
    { apiPath, clientPath, followUpDate },
  );
}

test("review transactions persist outcomes, preserve fields, and allow later ordinary scheduling", async ({
  page,
}) => {
  test.skip(
    !hasLiveAccounts || !isEmulated,
    "New schema is tested only on disposable emulators.",
  );
  await login(page);
  const record = await seeded(page);
  const result = await page.evaluate(
    async ({ apiPath, record }) => {
      const api = await import(apiPath);
      const baseline = [
        "status",
        "application_date",
        "company",
        "job_title",
        "job_url",
        "notes",
        "owner_id",
        "created_at",
      ];
      const preserved: boolean[] = [];
      const decisions = [
        { outcome: "reviewed", nextFollowUpDate: "" },
        { outcome: "reviewed", nextFollowUpDate: "2099-01-01" },
        { outcome: "waiting", nextFollowUpDate: "" },
        { outcome: "waiting", nextFollowUpDate: "2099-01-01" },
        { outcome: "stopped", nextFollowUpDate: "" },
      ];
      let current = record;
      const outcomes = [];
      for (const input of decisions) {
        if (!current.follow_up_date || current.follow_up_date > "2020-01-01") {
          await api.updateApplication(
            record.owner_id,
            record.id,
            current.revision,
            {
              company: record.company,
              jobTitle: record.job_title,
              jobUrl: record.job_url,
              status: record.status,
              applicationDate: record.application_date,
              followUpDate: "2020-01-01",
              notes: record.notes,
            },
          );
          current = await api.getApplicationById(record.owner_id, record.id);
        }
        await api.reviewApplication(
          record.owner_id,
          record.id,
          current.revision,
          input,
        );
        current = await api.getApplicationById(record.owner_id, record.id);
        preserved.push(baseline.every((key) => current[key] === record[key]));
        outcomes.push({
          outcome: current.follow_up_review.outcome,
          date: current.follow_up_date,
        });
      }
      await api.updateApplication(
        record.owner_id,
        record.id,
        current.revision,
        {
          company: record.company,
          jobTitle: record.job_title,
          jobUrl: record.job_url,
          status: record.status,
          applicationDate: record.application_date,
          followUpDate: "2099-01-02",
          notes: record.notes,
        },
      );
      const reopened = await api.getApplicationById(record.owner_id, record.id);
      await api.deleteApplication(record.owner_id, record.id);
      return { preserved, outcomes, reopened };
    },
    { apiPath, record },
  );
  expect(result.preserved).toEqual([true, true, true, true, true]);
  expect(result.outcomes).toEqual([
    { outcome: "reviewed", date: null },
    { outcome: "reviewed", date: "2099-01-01" },
    { outcome: "waiting", date: null },
    { outcome: "waiting", date: "2099-01-01" },
    { outcome: "stopped", date: null },
  ]);
  expect(result.reopened.follow_up_date).toBe("2099-01-02");
  expect(result.reopened.follow_up_review.outcome).toBe("stopped");
});

test("stale reviews and ordinary edits cannot overwrite a newer review, and deletion is not recreated", async ({
  page,
}) => {
  test.skip(!hasLiveAccounts || !isEmulated, "Disposable emulators required.");
  await login(page);
  const record = await seeded(page);
  const result = await page.evaluate(
    async ({ apiPath, record }) => {
      const api = await import(apiPath);
      await api.reviewApplication(record.owner_id, record.id, record.revision, {
        outcome: "waiting",
        nextFollowUpDate: "",
      });
      const errors = [];
      try {
        await api.reviewApplication(
          record.owner_id,
          record.id,
          record.revision,
          { outcome: "stopped", nextFollowUpDate: "" },
        );
      } catch (error) {
        errors.push((error as Error).message);
      }
      try {
        await api.updateApplication(
          record.owner_id,
          record.id,
          record.revision,
          {
            company: record.company,
            jobTitle: record.job_title,
            jobUrl: record.job_url,
            status: record.status,
            applicationDate: record.application_date,
            followUpDate: record.follow_up_date,
            notes: "Stale draft",
          },
        );
      } catch (error) {
        errors.push((error as Error).message);
      }
      const current = await api.getApplicationById(record.owner_id, record.id);
      await api.deleteApplication(record.owner_id, record.id);
      try {
        await api.reviewApplication(
          record.owner_id,
          record.id,
          current.revision,
          { outcome: "reviewed", nextFollowUpDate: "" },
        );
      } catch (error) {
        errors.push((error as Error).message);
      }
      return {
        errors,
        current,
        deleted: await api.getApplicationById(record.owner_id, record.id),
      };
    },
    { apiPath, record },
  );
  expect(result.errors).toHaveLength(3);
  expect(result.errors[0]).toContain("changed");
  expect(result.errors[1]).toContain("changed");
  expect(result.errors[2]).toContain("available");
  expect(result.current.notes).toBe("Keep these notes.");
  expect(result.current.follow_up_date).toBeNull();
  expect(result.current.follow_up_review.outcome).toBe("waiting");
  expect(result.deleted).toBeNull();
});

test("review requires a currently due task and compares the complete timestamp revision", async ({
  page,
}) => {
  test.skip(!hasLiveAccounts || !isEmulated, "Disposable emulators required.");
  await login(page);
  const record = await seeded(page);
  const result = await page.evaluate(
    async ({ apiPath, record }) => {
      const api = await import(apiPath);
      const [seconds, nanoString] = record.revision.split(":");
      const nanos = Number(nanoString);
      // This token has the same millisecond as the real committed revision.
      const staleNano = nanos % 1_000_000 === 999_999 ? nanos - 1 : nanos + 1;
      const errors = [];
      try {
        await api.reviewApplication(
          record.owner_id,
          record.id,
          seconds + ":" + staleNano,
          { outcome: "reviewed", nextFollowUpDate: "" },
        );
      } catch (error) {
        errors.push((error as Error).message);
      }
      await api.updateApplication(record.owner_id, record.id, record.revision, {
        company: record.company,
        jobTitle: record.job_title,
        jobUrl: record.job_url,
        status: record.status,
        applicationDate: record.application_date,
        followUpDate: "2099-01-01",
        notes: record.notes,
      });
      let current = await api.getApplicationById(record.owner_id, record.id);
      try {
        await api.reviewApplication(
          record.owner_id,
          record.id,
          current.revision,
          { outcome: "reviewed", nextFollowUpDate: "" },
        );
      } catch (error) {
        errors.push((error as Error).message);
      }
      await api.updateApplication(
        record.owner_id,
        record.id,
        current.revision,
        {
          company: record.company,
          jobTitle: record.job_title,
          jobUrl: record.job_url,
          status: "offer",
          applicationDate: record.application_date,
          followUpDate: "2020-01-01",
          notes: record.notes,
        },
      );
      current = await api.getApplicationById(record.owner_id, record.id);
      try {
        await api.reviewApplication(
          record.owner_id,
          record.id,
          current.revision,
          { outcome: "reviewed", nextFollowUpDate: "" },
        );
      } catch (error) {
        errors.push((error as Error).message);
      }
      const unchanged = await api.getApplicationById(
        record.owner_id,
        record.id,
      );
      await api.deleteApplication(record.owner_id, record.id);
      return {
        errors,
        unchanged,
        sameMillisecond:
          Math.floor(nanos / 1_000_000) === Math.floor(staleNano / 1_000_000),
      };
    },
    { apiPath, record },
  );
  expect(result.sameMillisecond).toBe(true);
  expect(result.errors).toHaveLength(3);
  expect(result.errors[0]).toContain("changed");
  expect(
    result.errors
      .slice(1)
      .every((message: string) => message.includes("no longer due")),
  ).toBe(true);
  expect(result.unchanged.follow_up_review).toBeNull();
  expect(result.unchanged.follow_up_date).toBe("2020-01-01");
  expect(result.unchanged.status).toBe("offer");
});

test("an open ordinary editor retains its draft and cannot resurrect a consumed date", async ({
  page,
  context,
}) => {
  test.skip(!hasLiveAccounts || !isEmulated, "Disposable emulators required.");
  await login(page);
  const record = await seeded(page);
  await page.goto("/app/applications/" + record.id + "/edit");
  await expect(page.getByLabel("Notes", { exact: false })).toHaveValue(
    record.notes,
  );
  await page
    .getByLabel("Notes", { exact: false })
    .fill("My unsaved interview notes");
  const other = await context.newPage();
  try {
    await other.goto("/app/dashboard");
    await other.evaluate(
      async ({ apiPath, record }) => {
        const api = await import(apiPath);
        await api.reviewApplication(
          record.owner_id,
          record.id,
          record.revision,
          { outcome: "reviewed", nextFollowUpDate: "" },
        );
      },
      { apiPath, record },
    );
    await page.bringToFront();
    await page.clock.setSystemTime(new Date(Date.now() + 31_000));
    const refreshedDetail = page.waitForResponse(
      async (response) => {
        if (!response.url().includes("/Listen/channel") || !response.ok())
          return false;
        const body = await response.text().catch(() => "");
        return body.includes(record.id) && body.includes("follow_up_review");
      },
      { timeout: 10_000 },
    );
    await page.evaluate(() =>
      window.dispatchEvent(new Event("visibilitychange")),
    );
    await refreshedDetail;
    await page
      .getByRole("button", { name: "Save changes", exact: true })
      .click();
    await expect(page.getByRole("alert")).toContainText("changed");
    await expect(page.getByLabel("Notes", { exact: false })).toHaveValue(
      "My unsaved interview notes",
    );
    const current = await page.evaluate(
      async ({ apiPath, record }) => {
        const api = await import(apiPath);
        return api.getApplicationById(record.owner_id, record.id);
      },
      { apiPath, record },
    );
    expect(current.follow_up_date).toBeNull();
    expect(current.follow_up_review.outcome).toBe("reviewed");
    expect(current.notes).toBe(record.notes);
    await page
      .getByRole("button", { name: "Discard draft and reload application" })
      .click();
    await expect(page.getByLabel("Notes", { exact: false })).toHaveValue(
      record.notes,
    );
    await expect(
      page.getByLabel("Follow-up date", { exact: false }),
    ).toHaveValue("");
  } finally {
    await other.close();
    await page.evaluate(
      async ({ apiPath, record }) => {
        const api = await import(apiPath);
        await api.deleteApplication(record.owner_id, record.id);
      },
      { apiPath, record },
    );
  }
});

test("transaction acknowledgment survives a subsequent read failure; a denied review leaves data unchanged", async ({
  page,
  request,
}) => {
  test.skip(
    !hasLiveAccounts || !isEmulated,
    "Temporary rule changes are isolated to disposable emulators.",
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
  const record = await seeded(page);
  try {
    await publish(
      rules.replace(
        "allow update: if owns(userId)",
        "allow update: if false && owns(userId)",
      ),
    );
    const rejected = await page.evaluate(
      async ({ apiPath, record }) => {
        const api = await import(apiPath);
        try {
          await api.reviewApplication(
            record.owner_id,
            record.id,
            record.revision,
            { outcome: "waiting", nextFollowUpDate: "2099-01-01" },
          );
          return "";
        } catch (error) {
          return (error as Error).message;
        }
      },
      { apiPath, record },
    );
    expect(rejected).toContain("We couldn't save this review");
    expect(rejected).not.toContain("PERMISSION_DENIED");
    await publish(rules);
    const unchanged = await page.evaluate(
      async ({ apiPath, record }) => {
        const api = await import(apiPath);
        return api.getApplicationById(record.owner_id, record.id);
      },
      { apiPath, record },
    );
    expect(unchanged.revision).toBe(record.revision);
    let commitIntercepted = false;
    await page.route("**/documents:commit*", async (route) => {
      const response = await route.fetch();
      expect(response.ok()).toBe(true);
      // Commit on the emulator first, deny reads before delivering its acknowledgment.
      await publish(
        rules.replace(
          "allow read: if owns(userId)",
          "allow read: if false && owns(userId)",
        ),
      );
      commitIntercepted = true;
      await route.fulfill({ response });
    });
    await page.evaluate(
      async ({ apiPath, record }) => {
        const api = await import(apiPath);
        await api.reviewApplication(
          record.owner_id,
          record.id,
          record.revision,
          { outcome: "waiting", nextFollowUpDate: "" },
        );
      },
      { apiPath, record },
    );
    expect(commitIntercepted).toBe(true);
    await page.unroute("**/documents:commit*");
    const readError = await page.evaluate(
      async ({ apiPath, record }) => {
        const api = await import(apiPath);
        try {
          await api.getApplicationById(record.owner_id, record.id);
          return "";
        } catch (error) {
          return (error as Error).message;
        }
      },
      { apiPath, record },
    );
    expect(readError).toContain("We couldn't load");
  } finally {
    await page.unroute("**/documents:commit*");
    await publish(rules);
    await page.evaluate(
      async ({ apiPath, record }) => {
        const api = await import(apiPath);
        const current = await api.getApplicationById(
          record.owner_id,
          record.id,
        );
        if (current.follow_up_review) {
          if (
            current.follow_up_review.outcome !== "waiting" ||
            current.follow_up_date !== null
          )
            throw new Error("Acknowledged review was not persisted.");
        }
        await api.deleteApplication(record.owner_id, record.id);
      },
      { apiPath, record },
    );
  }
});

test("dashboard reviews the last due task, retains upcoming work, and persists completion", async ({
  page,
}) => {
  test.skip(!hasLiveAccounts || !isEmulated, "Disposable emulators required.");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await login(page);
  const record = await seeded(page);
  const tomorrow = await page.evaluate(() => {
    const next = new Date();
    next.setDate(next.getDate() + 1);
    return [
      next.getFullYear(),
      String(next.getMonth() + 1).padStart(2, "0"),
      String(next.getDate()).padStart(2, "0"),
    ].join("-");
  });
  const upcoming = await seeded(page, tomorrow);
  try {
    await page.goto("/app/dashboard");
    await page
      .getByRole("button", { name: "Review follow-up for " + record.company })
      .click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page
      .getByRole("button", { name: "Save review", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText("Review saved");
    await expect(
      page.getByRole("heading", {
        name: "Today's follow-up review is complete",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "Today's follow-up review is complete",
      }),
    ).toBeFocused();
    await expect(
      page
        .getByRole("region", { name: "Upcoming follow-ups" })
        .getByText(upcoming.company),
    ).toBeVisible();
    if (process.env.E2E_CAPTURE_REVIEW_SCREENSHOTS === "true")
      await page.screenshot({
        path: "docs/screenshots/follow-up-complete-1440px.png",
        fullPage: true,
      });
    await page.reload();
    await expect(
      page.getByRole("heading", {
        name: "Today's follow-up review is complete",
      }),
    ).toBeVisible();
    await expect(
      page
        .getByRole("region", { name: "Upcoming follow-ups" })
        .getByText(upcoming.company),
    ).toBeVisible();
    await page.goto("/app/applications/" + record.id + "/edit");
    await expect(
      page.getByText("Last review: Reviewed", { exact: false }),
    ).toBeVisible();
    await expect(
      page.getByLabel("Follow-up date", { exact: false }),
    ).toHaveValue("");
  } finally {
    await deleteReviewRecord(page, record);
    await deleteReviewRecord(page, upcoming);
  }
});

async function deleteReviewRecord(
  page: Page,
  record: { id: string; owner_id: string },
) {
  await page.evaluate(
    async ({ apiPath, record }) => {
      const api = await import(apiPath);
      await api.deleteApplication(record.owner_id, record.id);
    },
    { apiPath, record },
  );
}
async function scheduleReviewRecord(
  page: Page,
  record: { id: string; owner_id: string },
  followUpDate: string,
  notes?: string,
) {
  await page.evaluate(
    async ({ apiPath, record, followUpDate, notes }) => {
      const api = await import(apiPath);
      const current = await api.getApplicationById(record.owner_id, record.id);
      await api.updateApplication(
        record.owner_id,
        record.id,
        current.revision,
        {
          company: current.company,
          jobTitle: current.job_title,
          jobUrl: current.job_url,
          status: current.status,
          applicationDate: current.application_date,
          followUpDate,
          notes: notes ?? current.notes,
        },
      );
    },
    { apiPath, record, followUpDate, notes },
  );
}

test("review outcomes, cancellation, keyboard trap, and mobile controls preserve hiring stage", async ({
  page,
}) => {
  test.skip(!hasLiveAccounts || !isEmulated, "Disposable emulators required.");
  await login(page);
  const record = await seeded(page);
  try {
    for (const width of [360, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 850 });
      await page.goto("/app/dashboard");
      const trigger = page.getByRole("button", {
        name: "Review follow-up for " + record.company,
      });
      await trigger.click();
      await expect(page.getByLabel("Review outcome")).toBeFocused();
      if (process.env.E2E_CAPTURE_REVIEW_SCREENSHOTS === "true")
        await page.screenshot({
          path: "docs/screenshots/follow-up-review-" + width + "px.png",
        });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      const dialog = page.getByRole("dialog");
      expect(
        await dialog.evaluate(
          (element) => element.scrollWidth <= element.clientWidth,
        ),
      ).toBe(true);
      if (width === 360) {
        const { default: AxeBuilder } = await import("@axe-core/playwright");
        const result = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze();
        expect(result.violations).toEqual([]);
      }
      await page.getByLabel("Next follow-up date").fill("2099-01-01");
      await page.getByLabel("Review outcome").selectOption("stopped");
      await expect(page.getByLabel("Next follow-up date")).toHaveValue("");
      await expect(page.getByLabel("Next follow-up date")).toBeDisabled();
      await page.getByRole("button", { name: "Close dialog" }).focus();
      await page.keyboard.press("Shift+Tab");
      await expect(
        page.getByRole("button", { name: "Save review", exact: true }),
      ).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(
        page.getByRole("button", { name: "Close dialog" }),
      ).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(trigger).toBeFocused();
      await expect(trigger).toBeVisible();
    }
    // Existing unit tests validate future dates; these prove the actual UI saves each decision.
    for (const [outcome, nextDate] of [
      ["waiting", ""],
      ["waiting", "2099-01-01"],
      ["stopped", ""],
    ] as const) {
      await scheduleReviewRecord(page, record, "2020-01-01");
      await page.goto("/app/dashboard");
      await page
        .getByRole("button", { name: "Review follow-up for " + record.company })
        .click();
      await page.getByLabel("Review outcome").selectOption(outcome);
      if (nextDate) await page.getByLabel("Next follow-up date").fill(nextDate);
      await page
        .getByRole("button", { name: "Save review", exact: true })
        .click();
      await expect(page.getByRole("status")).toContainText("Review saved");
      await expect(
        page.getByRole("heading", {
          name: "Today's follow-up review is complete",
        }),
      ).toBeVisible();
      const current = await page.evaluate(
        async ({ apiPath, record }) => {
          const api = await import(apiPath);
          return api.getApplicationById(record.owner_id, record.id);
        },
        { apiPath, record },
      );
      expect(current.status).toBe("applied");
      expect(current.notes).toBe(record.notes);
      expect(current.follow_up_review.outcome).toBe(outcome);
      expect(current.follow_up_date).toBe(nextDate || null);
    }
    // Stop is historical metadata; deliberate ordinary scheduling makes the task due again.
    await scheduleReviewRecord(page, record, "2020-01-01");
    await page.goto("/app/dashboard");
    await expect(
      page.getByRole("button", {
        name: "Review follow-up for " + record.company,
      }),
    ).toBeVisible();
  } finally {
    await deleteReviewRecord(page, record);
  }
});

test("review denial retains a draft; acknowledgment with failed refresh prevents repeat and fake completion", async ({
  page,
  request,
}) => {
  test.skip(!hasLiveAccounts || !isEmulated, "Disposable emulators required.");
  const { readFileSync } = await import("node:fs");
  const rules = readFileSync("firestore.rules", "utf8");
  const publish = async (content: string) => {
    const response = await request.put(
      "http://127.0.0.1:8080/emulator/v1/projects/demo-applytrack:securityRules",
      { data: { rules: { files: [{ content }] } } },
    );
    expect(response.ok()).toBe(true);
  };
  await page.setViewportSize({ width: 390, height: 850 });
  await login(page);
  const record = await seeded(page);
  try {
    await page.goto("/app/dashboard");
    await page
      .getByRole("button", { name: "Review follow-up for " + record.company })
      .click();
    await page.getByLabel("Review outcome").selectOption("waiting");
    await page.getByLabel("Next follow-up date").fill("2099-01-01");
    await publish(
      rules.replace(
        "allow update: if owns(userId)",
        "allow update: if false && owns(userId)",
      ),
    );
    await page
      .getByRole("button", { name: "Save review", exact: true })
      .click();
    await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
      "We couldn't save this review",
    );
    await expect(page.getByLabel("Review outcome")).toHaveValue("waiting");
    await expect(page.getByLabel("Next follow-up date")).toHaveValue(
      "2099-01-01",
    );
    await expect(
      page.getByRole("heading", {
        name: "Today's follow-up review is complete",
      }),
    ).toHaveCount(0);
    await publish(rules);
    await page.getByLabel("Next follow-up date").fill("");
    let intercepted = false;
    await page.route("**/documents:commit*", async (route) => {
      const response = await route.fetch();
      expect(response.ok()).toBe(true);
      await publish(
        rules.replace(
          "allow read: if owns(userId)",
          "allow read: if false && owns(userId)",
        ),
      );
      intercepted = true;
      await route.fulfill({ response });
    });
    await page
      .getByRole("button", { name: "Save review", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText("Review saved");
    await expect(page.getByRole("alert")).toContainText(
      "Your review was saved, but we couldn't refresh",
    );
    expect(intercepted).toBe(true);
    if (process.env.E2E_CAPTURE_REVIEW_SCREENSHOTS === "true")
      await page.screenshot({
        path: "docs/screenshots/follow-up-refresh-error-390px.png",
        fullPage: true,
      });
    await expect(
      page.getByRole("button", {
        name: "Review follow-up for " + record.company,
      }),
    ).toBeDisabled();
    await expect(
      page.getByRole("heading", {
        name: "Today's follow-up review is complete",
      }),
    ).toHaveCount(0);
    await page.unroute("**/documents:commit*");
    await publish(rules);
    await page.getByRole("button", { name: "Refresh applications" }).click();
    await expect(
      page.getByRole("heading", {
        name: "Today's follow-up review is complete",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "Today's follow-up review is complete",
      }),
    ).toBeFocused();
    await expect(page.getByRole("status")).toContainText("Review saved");
  } finally {
    await page.unroute("**/documents:commit*");
    await publish(rules);
    await deleteReviewRecord(page, record);
  }
});

test("a selected review keeps its draft after a concurrent change and newly fetched due work joins", async ({
  page,
  context,
}) => {
  test.skip(!hasLiveAccounts || !isEmulated, "Disposable emulators required.");
  await page.setViewportSize({ width: 390, height: 850 });
  await login(page);
  const record = await seeded(page);
  const other = await context.newPage();
  let added: { id: string; owner_id: string; company: string } | undefined;
  try {
    await page.goto("/app/dashboard");
    await page
      .getByRole("button", { name: "Review follow-up for " + record.company })
      .click();
    await page.getByLabel("Review outcome").selectOption("waiting");
    await page.getByLabel("Next follow-up date").fill("2099-01-01");
    await other.goto("/app/applications/" + record.id + "/edit");
    await scheduleReviewRecord(
      other,
      record,
      "2020-01-01",
      "Changed in another tab",
    );
    added = await seeded(other);
    // Submission detects concurrent changes even when another tab has not triggered a fresh read.
    await page
      .getByRole("button", { name: "Save review", exact: true })
      .click();
    await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
      "changed",
    );
    await expect(page.getByLabel("Review outcome")).toHaveValue("waiting");
    await expect(page.getByLabel("Next follow-up date")).toHaveValue(
      "2099-01-01",
    );
    await expect(
      page.getByRole("button", { name: "Save review", exact: true }),
    ).toHaveCount(0);
    if (process.env.E2E_CAPTURE_REVIEW_SCREENSHOTS === "true")
      await page.screenshot({
        path: "docs/screenshots/follow-up-conflict-390px.png",
      });
    await page
      .getByRole("button", { name: "Discard draft and refresh" })
      .click();
    await expect(
      page.getByRole("button", {
        name: "Review follow-up for " + added!.company,
      }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Review follow-up for " + record.company })
      .click();
    await expect(page.getByLabel("Review outcome")).toHaveValue("reviewed");
    await page
      .getByRole("button", { name: "Save review", exact: true })
      .click();
    await expect(
      page.getByRole("button", {
        name: "Review follow-up for " + added!.company,
      }),
    ).toBeFocused();
    await page
      .getByRole("button", { name: "Review follow-up for " + added!.company })
      .click();
    await page
      .getByRole("button", { name: "Save review", exact: true })
      .click();
    await expect(
      page.getByRole("heading", {
        name: "Today's follow-up review is complete",
      }),
    ).toBeVisible();
  } finally {
    await other.close();
    await deleteReviewRecord(page, record);
    if (added) await deleteReviewRecord(page, added);
  }
});

test("fixed schedules become due across local midnight and focus; submission rechecks today's date", async ({
  page,
}) => {
  test.skip(!hasLiveAccounts || !isEmulated, "Disposable emulators required.");
  await page.clock.install({ time: new Date("2030-05-01T23:59:30") });
  await login(page);
  const record = await seeded(page, "2030-05-02");
  try {
    await page.goto("/app/dashboard");
    await expect(
      page.getByRole("heading", {
        name: "Today's follow-up review is complete",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", {
        name: "Review follow-up for " + record.company,
      }),
    ).toHaveCount(0);
    await page.clock.fastForward(31_000);
    await page
      .getByRole("button", { name: "Review follow-up for " + record.company })
      .click();
    await page.getByLabel("Next follow-up date").fill("2030-05-03");
    await page.clock.setSystemTime(new Date("2030-05-03T10:00:00"));
    await page
      .getByRole("button", { name: "Save review", exact: true })
      .click();
    await expect(page.getByRole("alert")).toContainText("after today");
    await expect(page.getByLabel("Next follow-up date")).toHaveValue(
      "2030-05-03",
    );
    await page.getByLabel("Next follow-up date").fill("");
    await page
      .getByRole("button", { name: "Save review", exact: true })
      .click();
    await expect(
      page.getByRole("heading", {
        name: "Today's follow-up review is complete",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "Today's follow-up review is complete",
      }),
    ).toBeFocused();
    await scheduleReviewRecord(page, record, "2030-05-04");
    await page.reload();
    await expect(
      page.getByRole("heading", {
        name: "Today's follow-up review is complete",
      }),
    ).toBeVisible();
    // Skip timers while suspended, then restore focus; no relative demo data participates.
    await page.clock.setSystemTime(new Date("2030-05-04T10:00:00"));
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await expect(
      page.getByRole("button", {
        name: "Review follow-up for " + record.company,
      }),
    ).toBeVisible();
    await page.clock.setSystemTime(new Date("2030-05-05T10:00:00"));
    await page.evaluate(() =>
      document.dispatchEvent(new Event("visibilitychange")),
    );
    await expect(page.getByText("Overdue", { exact: true })).toBeVisible();
  } finally {
    await deleteReviewRecord(page, record);
  }
});

test("account switch during delayed review clears the draft and guards old success feedback", async ({
  page,
}) => {
  test.skip(!hasLiveAccounts || !isEmulated, "Disposable emulators required.");
  await login(page);
  const record = await seeded(page);
  let release!: () => void;
  let committed!: () => void;
  let delivered!: () => void;
  const commitReceived = new Promise<void>((resolve) => {
    committed = resolve;
  });
  const delayed = new Promise<void>((resolve) => {
    release = resolve;
  });
  const deliveryDone = new Promise<void>((resolve) => {
    delivered = resolve;
  });
  try {
    await page.goto("/app/dashboard");
    await page
      .getByRole("button", { name: "Review follow-up for " + record.company })
      .click();
    await page.getByLabel("Review outcome").selectOption("waiting");
    await page.route("**/documents:commit*", async (route) => {
      const response = await route.fetch();
      expect(response.ok()).toBe(true);
      committed();
      await delayed;
      await route.fulfill({ response });
      delivered();
    });
    await page
      .getByRole("button", { name: "Save review", exact: true })
      .click();
    await commitReceived;
    // Change the SDK identity in this mounted SPA. Full navigation would destroy the
    // old callback and fail to exercise the late-save ownership guard.
    await page.evaluate(
      async ({ email, password }) => {
        const authApiPath = "/src/features/auth/api/auth.ts";
        const { signOut, signIn } = await import(authApiPath);
        await signOut();
        await signIn(email, password);
      },
      {
        email: process.env.E2E_USER_B_EMAIL!,
        password: process.env.E2E_USER_B_PASSWORD!,
      },
    );
    await page
      .getByRole("link", { name: "Overview", exact: true })
      .first()
      .click();
    await expect(page).toHaveURL(/\/app\/dashboard/);
    await expect(
      page.getByText(process.env.E2E_USER_B_EMAIL!, { exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    release();
    await deliveryDone;
    await expect(
      page.getByText("No applications yet", { exact: true }),
    ).toBeVisible();
    await page.unroute("**/documents:commit*");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByRole("status")).toHaveCount(0);
    await expect(page.getByText(record.company, { exact: false })).toHaveCount(
      0,
    );
  } finally {
    release();
    await page.unroute("**/documents:commit*");
    await page.evaluate(
      async ({ email, password }) => {
        const authApiPath = "/src/features/auth/api/auth.ts";
        const { signOut, signIn } = await import(authApiPath);
        await signOut();
        await signIn(email, password);
      },
      {
        email: process.env.E2E_USER_A_EMAIL!,
        password: process.env.E2E_USER_A_PASSWORD!,
      },
    );
    await deleteReviewRecord(page, record);
  }
});

test("a refreshed changed or missing selection requires reselection without losing its draft", async ({
  page,
  context,
}) => {
  test.skip(!hasLiveAccounts || !isEmulated, "Disposable emulators required.");
  await login(page);
  const record = await seeded(page);
  const other = await context.newPage();
  try {
    await page.goto("/app/dashboard");
    await page
      .getByRole("button", { name: "Review follow-up for " + record.company })
      .click();
    await page.getByLabel("Review outcome").selectOption("waiting");
    await page.getByLabel("Next follow-up date").fill("2099-01-01");
    await other.goto("/app/applications/" + record.id + "/edit");
    await scheduleReviewRecord(other, record, "2020-01-01", "A newer record");
    await page.bringToFront();
    await page.clock.setSystemTime(new Date(Date.now() + 31_000));
    await page.evaluate(() =>
      window.dispatchEvent(new Event("visibilitychange")),
    );
    await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
      "changed or is no longer due",
    );
    await expect(page.getByLabel("Review outcome")).toHaveValue("waiting");
    await expect(page.getByLabel("Next follow-up date")).toHaveValue(
      "2099-01-01",
    );
    await expect(
      page.getByRole("button", { name: "Save review", exact: true }),
    ).toHaveCount(0);
    await page
      .getByRole("button", { name: "Discard draft and refresh" })
      .click();
    await page
      .getByRole("button", { name: "Review follow-up for " + record.company })
      .click();
    await expect(page.getByLabel("Review outcome")).toHaveValue("reviewed");
    await deleteReviewRecord(other, record);
    await page.bringToFront();
    await page.clock.setSystemTime(new Date(Date.now() + 62_000));
    await page.evaluate(() =>
      window.dispatchEvent(new Event("visibilitychange")),
    );
    await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
      "changed or is no longer due",
    );
    await expect(
      page.getByRole("button", { name: "Save review", exact: true }),
    ).toHaveCount(0);
    await page
      .getByRole("button", { name: "Discard draft and refresh" })
      .click();
    await expect(
      page.getByRole("heading", {
        name: "Today's follow-up review is complete",
      }),
    ).toBeVisible();
  } finally {
    await other.close();
  }
});
