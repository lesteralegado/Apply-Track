import {
  collection,
  doc,
  getDocFromServer,
  getDocsFromServer,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { requireAccount } from "../../../lib/firebase/client";
import { publicError } from "../../../lib/errors";
import { scheduledFollowUpState, todayDate } from "../../../lib/dates";
import { applicationValues, decodeApplication } from "./document";
import type {
  ApplicationInput,
  ApplicationStatus,
  FollowUpReviewInput,
} from "../types";
import { followUpReviewSchema } from "../schemas/followUpReviewSchema";

function records(ownerId: string) {
  const { db } = requireAccount(ownerId);
  return collection(db, "users", ownerId, "applications");
}
function record(ownerId: string, id: string) {
  if (!id || id.includes("/"))
    throw new Error("This application could not be found.");
  return doc(records(ownerId), id);
}
function checkActive(ownerId: string, signal?: AbortSignal) {
  signal?.throwIfAborted();
  requireAccount(ownerId);
}
export async function getApplications(ownerId: string, signal?: AbortSignal) {
  try {
    checkActive(ownerId, signal);
    const snapshot = await getDocsFromServer(
      query(records(ownerId), orderBy("updated_at", "desc")),
    );
    checkActive(ownerId, signal);
    return snapshot.docs.map((item) =>
      decodeApplication(item.id, item.data(), ownerId),
    );
  } catch (error) {
    if (signal?.aborted) throw error;
    throw publicError(
      error,
      "We couldn't load your applications. Please try again.",
    );
  }
}
export async function getApplicationById(
  ownerId: string,
  id: string,
  signal?: AbortSignal,
) {
  try {
    checkActive(ownerId, signal);
    const snapshot = await getDocFromServer(record(ownerId, id));
    checkActive(ownerId, signal);
    return snapshot.exists()
      ? decodeApplication(snapshot.id, snapshot.data(), ownerId)
      : null;
  } catch (error) {
    if (signal?.aborted) throw error;
    throw publicError(
      error,
      "We couldn't load this application. Please try again.",
    );
  }
}
async function savedApplication(ownerId: string, id: string) {
  const result = await getApplicationById(ownerId, id);
  if (!result)
    throw new Error(
      "This application is no longer available. Refresh your list.",
    );
  return result;
}
export async function createApplication(
  ownerId: string,
  input: ApplicationInput,
) {
  try {
    const ref = doc(records(ownerId));
    await setDoc(ref, {
      ...applicationValues(input),
      owner_id: ownerId,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
    // An acknowledged write succeeded; a later read failure must not invite duplicate retries.
  } catch (error) {
    throw publicError(
      error,
      "We couldn't save this application. Your form changes are still here. Please try again.",
    );
  }
}

export async function updateApplication(
  ownerId: string,
  id: string,
  expectedRevision: string,
  input: ApplicationInput,
): Promise<void> {
  try {
    const { db } = requireAccount(ownerId);
    const ref = record(ownerId, id);
    const values = applicationValues(input);
    await runTransaction(db, async (transaction) => {
      checkActive(ownerId);
      const snapshot = await transaction.get(ref);
      checkActive(ownerId);
      currentApplication(snapshot, ownerId, expectedRevision);
      transaction.update(ref, { ...values, updated_at: serverTimestamp() });
    });
  } catch (error) {
    if (error instanceof ApplicationConflictError) throw error;
    throw publicError(
      error,
      "We couldn't save your changes. Your form changes are still here. Please try again.",
    );
  }
}
export async function deleteApplication(ownerId: string, id: string) {
  try {
    const { db } = requireAccount(ownerId);
    const ref = record(ownerId, id);
    await runTransaction(db, async (transaction) => {
      const existing = await transaction.get(ref);
      if (!existing.exists()) throw new Error("Application no longer exists.");
      transaction.delete(ref);
    });
  } catch (error) {
    throw publicError(
      error,
      "We couldn't delete this application. Please try again.",
    );
  }
}
export async function updateApplicationStatus(
  ownerId: string,
  id: string,
  status: ApplicationStatus,
) {
  try {
    const { db } = requireAccount(ownerId);
    const ref = record(ownerId, id);
    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists()) throw new Error("Application no longer exists.");
      const existing = decodeApplication(snapshot.id, snapshot.data(), ownerId);
      transaction.update(ref, {
        status,
        application_date:
          existing.application_date ||
          (status === "saved" ? null : todayDate()),
        updated_at: serverTimestamp(),
      });
    });
    return await savedApplication(ownerId, id);
  } catch (error) {
    throw publicError(
      error,
      "We couldn't update the status. Please try again.",
    );
  }
}

export class ApplicationConflictError extends Error {
  constructor(
    message = "This application changed since you opened it. Your draft is still here. Reload the application before saving again.",
  ) {
    super(message);
    this.name = "ApplicationConflictError";
  }
}

function currentApplication(
  snapshot: import("firebase/firestore").DocumentSnapshot,
  ownerId: string,
  expectedRevision: string,
) {
  if (!snapshot.exists()) {
    throw new ApplicationConflictError(
      "This application is no longer available. Your draft is still here. Refresh your list.",
    );
  }
  const current = decodeApplication(snapshot.id, snapshot.data(), ownerId);
  if (!expectedRevision || current.revision !== expectedRevision) {
    throw new ApplicationConflictError();
  }
  return current;
}

export async function reviewApplication(
  ownerId: string,
  id: string,
  expectedRevision: string,
  input: FollowUpReviewInput,
): Promise<void> {
  try {
    const { db } = requireAccount(ownerId);
    const ref = record(ownerId, id);
    await runTransaction(db, async (transaction) => {
      checkActive(ownerId);
      const snapshot = await transaction.get(ref);
      checkActive(ownerId);
      const existing = currentApplication(snapshot, ownerId, expectedRevision);
      const today = todayDate();
      const values = followUpReviewSchema(today).parse(input);
      if (
        !["overdue", "today"].includes(
          scheduledFollowUpState(
            existing.follow_up_date,
            existing.status,
            today,
          ),
        )
      ) {
        throw new ApplicationConflictError(
          "This follow-up is no longer due. Your draft is still here. Refresh and select a current follow-up.",
        );
      }
      transaction.update(ref, {
        follow_up_date: values.nextFollowUpDate || null,
        follow_up_review: {
          outcome: values.outcome,
          reviewed_at: serverTimestamp(),
        },
        updated_at: serverTimestamp(),
      });
    });
    // The commit acknowledgment is success even if a later refresh cannot read.
  } catch (error) {
    if (error instanceof ApplicationConflictError) throw error;
    throw publicError(
      error,
      "We couldn't save this review. Your choices are still here. Please try again.",
    );
  }
}
