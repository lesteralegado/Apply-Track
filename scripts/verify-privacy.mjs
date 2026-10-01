import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { pathToFileURL } from "node:url";
import {
  loginAccount,
  firestoreRequest,
  commitDocument,
  testConfig,
} from "./firebase-test-client.mjs";
export async function verifyPrivacy() {
  const [a, b] = await Promise.all([
    loginAccount(process.env.E2E_USER_A_EMAIL, process.env.E2E_USER_A_PASSWORD),
    loginAccount(process.env.E2E_USER_B_EMAIL, process.env.E2E_USER_B_PASSWORD),
  ]);
  const id = "privacy-" + randomBytes(8).toString("hex");
  const path = "users/" + a.localId + "/applications/" + id;
  const checks = [];
  const values = {
    owner_id: a.localId,
    company: "Privacy check",
    job_title: "Developer",
    job_url: null,
    status: "saved",
    application_date: null,
    follow_up_date: null,
    notes: null,
  };
  const denied = (result, label) => {
    assert(
      [401, 403].includes(result.status),
      label + " must be denied; received HTTP " + result.status,
    );
    checks.push(label);
  };
  let created = false;
  try {
    assert.equal(
      (await commitDocument(path, a.idToken, values, true)).status,
      200,
      "The owner must be able to create a valid application. Check deployed rules.",
    );
    created = true;
    const first = await firestoreRequest("/" + path, a.idToken);
    assert.equal(first.status, 200);
    assert.equal(first.data.fields.owner_id.stringValue, a.localId);
    assert(first.data.fields.created_at.timestampValue);
    assert(first.data.fields.updated_at.timestampValue);
    checks.push("Owner create/read with server timestamps");
    denied(await firestoreRequest("/" + path, b.idToken), "Cross-user read");
    denied(
      await firestoreRequest(
        "/users/" + a.localId + "/applications",
        b.idToken,
      ),
      "Cross-user list",
    );
    denied(
      await commitDocument(path, b.idToken, { company: "Intruder" }),
      "Cross-user update",
    );
    denied(
      await firestoreRequest("/" + path, b.idToken, "DELETE"),
      "Cross-user delete",
    );
    denied(
      await commitDocument(path, a.idToken, { owner_id: b.localId }),
      "Ownership transfer",
    );
    denied(
      await commitDocument(
        "users/" + b.localId + "/applications/" + id,
        b.idToken,
        values,
        true,
      ),
      "Forged owner",
    );
    denied(
      await commitDocument(
        "users/" + a.localId + "/applications/forged-" + id,
        b.idToken,
        values,
        true,
      ),
      "Cross-user create",
    );
    denied(await firestoreRequest("/" + path, null), "Anonymous read");
    denied(
      await commitDocument(path, null, { company: "Intruder" }),
      "Anonymous update",
    );
    denied(
      await firestoreRequest("/" + path, null, "DELETE"),
      "Anonymous delete",
    );
    denied(
      await commitDocument(
        "users/" + a.localId + "/applications/anon-" + id,
        null,
        values,
        true,
      ),
      "Anonymous create",
    );
    for (const [change, label] of [
      [{ company: "   " }, "Blank company"],
      [{ job_title: "" }, "Blank job title"],
      [{ status: "unknown" }, "Invalid status"],
      [
        { status: "applied", application_date: null },
        "Missing application date",
      ],
      [{ follow_up_date: "2026-02-30" }, "Invalid calendar date"],
      [{ follow_up_date: "2025-02-29" }, "Invalid leap date"],
      [{ job_url: "javascript:alert(1)" }, "Unsafe job URL"],
      [{ administrator: true }, "Unexpected fields"],
    ])
      denied(await commitDocument(path, a.idToken, change), label);
    const original = first.data.fields.created_at.timestampValue;
    const timestampChange = await firestoreRequest(
      ":commit",
      a.idToken,
      "POST",
      {
        writes: [
          {
            update: {
              name: first.data.name,
              fields: {
                created_at: { timestampValue: "2000-01-01T00:00:00Z" },
              },
            },
            updateMask: { fieldPaths: ["created_at"] },
            updateTransforms: [
              { fieldPath: "updated_at", setToServerValue: "REQUEST_TIME" },
            ],
          },
        ],
      },
    );
    denied(timestampChange, "Creation timestamp changes");
    const staleUpdate = await firestoreRequest(":commit", a.idToken, "POST", {
      writes: [
        {
          update: {
            name: first.data.name,
            fields: { updated_at: { timestampValue: original } },
          },
          updateMask: { fieldPaths: ["updated_at"] },
        },
      ],
    });
    denied(staleUpdate, "Client-generated update timestamps");
    assert.equal(
      (
        await commitDocument(path, a.idToken, {
          company: "Owner update",
          follow_up_date: "2028-02-29",
        })
      ).status,
      200,
    );
    const updated = await firestoreRequest("/" + path, a.idToken);
    assert.equal(updated.data.fields.company.stringValue, "Owner update");
    assert.equal(updated.data.fields.created_at.timestampValue, original);
    assert.notEqual(
      updated.data.fields.updated_at.timestampValue,
      first.data.fields.updated_at.timestampValue,
    );
    checks.push("Owner update and immutable creation timestamp");
    // These new-rule cases are local until rule publication is separately authorized.
    if (testConfig().emulated) {
      // Legacy records still support ordinary edits; review checks use direct REST writes.
      assert.equal(
        (await firestoreRequest("/" + path, a.idToken, "DELETE")).status,
        200,
      );
      created = false;
      checks.push("Owner delete of legacy record");
      assert.equal(
        (
          await commitDocument(
            path,
            a.idToken,
            { ...values, follow_up_review: null },
            true,
          )
        ).status,
        200,
      );
      created = true;
      checks.push("Owner create with null review metadata");
      const reviewValues = (outcome = "reviewed", nextDate = null) => ({
        follow_up_date: nextDate,
        follow_up_review: { outcome },
      });
      const reviewCommit = (token, change = reviewValues()) =>
        commitDocument(path, token, change, false, [
          "follow_up_review.reviewed_at",
        ]);
      denied(
        await commitDocument(path, a.idToken, {
          follow_up_review: {
            outcome: "waiting",
            reviewed_at: "2026-10-01T00:00:00Z",
          },
        }),
        "Review timestamp string",
      );
      denied(
        await reviewCommit(a.idToken, { follow_up_review: {} }),
        "Missing review outcome",
      );
      denied(await reviewCommit(b.idToken), "Cross-user review");
      denied(await reviewCommit(null), "Anonymous review");
      denied(
        await commitDocument(path, a.idToken, {
          follow_up_review: {
            outcome: "reviewed",
            reviewed_at: new Date("2000-01-01T00:00:00Z"),
          },
        }),
        "Forged review timestamp",
      );
      denied(
        await commitDocument(path, a.idToken, {
          follow_up_review: { outcome: "reviewed" },
        }),
        "Missing review timestamp",
      );
      denied(
        await reviewCommit(a.idToken, {
          follow_up_review: { outcome: "emailed" },
        }),
        "Invalid review outcome",
      );
      denied(
        await reviewCommit(a.idToken, {
          follow_up_review: { outcome: "waiting", extra: true },
        }),
        "Unexpected review fields",
      );
      denied(
        await commitDocument(path, a.idToken, { follow_up_review: "reviewed" }),
        "Invalid review map",
      );
      denied(
        await reviewCommit(a.idToken, {
          ...reviewValues(),
          status: "withdrawn",
          application_date: "2026-10-01",
        }),
        "Review changing hiring status",
      );
      denied(
        await reviewCommit(a.idToken, {
          ...reviewValues(),
          notes: "Changed by review",
        }),
        "Review changing notes",
      );
      denied(
        await reviewCommit(a.idToken, reviewValues("stopped", "2028-02-29")),
        "Stopped review with next date",
      );
      denied(
        await commitDocument(
          path + "-review-on-create",
          a.idToken,
          { ...values, follow_up_review: { outcome: "reviewed" } },
          true,
          ["follow_up_review.reviewed_at"],
        ),
        "Review metadata on create",
      );
      assert.equal(
        (await reviewCommit(a.idToken)).status,
        200,
        "Owner review must commit with trusted time.",
      );
      const reviewed = await firestoreRequest("/" + path, a.idToken);
      assert.equal(reviewed.data.fields.follow_up_date.nullValue, null);
      assert.equal(
        reviewed.data.fields.follow_up_review.mapValue.fields.outcome
          .stringValue,
        "reviewed",
      );
      assert.equal(
        reviewed.data.fields.follow_up_review.mapValue.fields.reviewed_at
          .timestampValue,
        reviewed.data.fields.updated_at.timestampValue,
      );
      assert.equal(reviewed.data.fields.status.stringValue, "saved");
      checks.push("Owner review with trusted timestamp");
      denied(
        await commitDocument(path, a.idToken, { follow_up_review: null }),
        "Reset recorded review",
      );
      // Omitting a masked field deletes it, unlike an ordinary partial update.
      denied(
        await firestoreRequest(":commit", a.idToken, "POST", {
          writes: [
            {
              update: { name: reviewed.data.name, fields: {} },
              updateMask: { fieldPaths: ["follow_up_review"] },
              updateTransforms: [
                { fieldPath: "updated_at", setToServerValue: "REQUEST_TIME" },
              ],
            },
          ],
        }),
        "Remove recorded review",
      );
      assert.equal(
        (
          await commitDocument(path, a.idToken, {
            notes: "Ordinary edit preserves review",
          })
        ).status,
        200,
      );
      const edited = await firestoreRequest("/" + path, a.idToken);
      assert.deepEqual(
        edited.data.fields.follow_up_review,
        reviewed.data.fields.follow_up_review,
      );
      checks.push("Ordinary edit preserves old review timestamp");
      assert.equal(
        (await reviewCommit(a.idToken, reviewValues("waiting", "2028-02-29")))
          .status,
        200,
      );
      checks.push("Waiting review schedules a future check");
      assert.equal(
        (await reviewCommit(a.idToken, reviewValues("stopped"))).status,
        200,
      );
      const stopped = await firestoreRequest("/" + path, a.idToken);
      assert.equal(stopped.data.fields.follow_up_date.nullValue, null);
      checks.push("Stopped review clears schedule");
      assert.equal(
        (
          await commitDocument(path, a.idToken, {
            follow_up_date: "2028-02-29",
          })
        ).status,
        200,
      );
      const rescheduled = await firestoreRequest("/" + path, a.idToken);
      assert.deepEqual(
        rescheduled.data.fields.follow_up_review,
        stopped.data.fields.follow_up_review,
      );
      checks.push("Ordinary scheduling resumes after stopped review");
    }
    assert.equal(
      (await firestoreRequest("/" + path, a.idToken, "DELETE")).status,
      200,
    );
    created = false;
    assert.equal((await firestoreRequest("/" + path, a.idToken)).status, 404);
    checks.push("Owner delete");
    return checks;
  } finally {
    if (created) {
      const result = await firestoreRequest("/" + path, a.idToken, "DELETE");
      assert.equal(result.status, 200, "Privacy-test record cleanup failed.");
    }
  }
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const checks = await verifyPrivacy();
  console.log(checks.length + " direct Firebase privacy checks passed.");
}
