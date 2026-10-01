import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../auth/hooks/useAuth";
import { auth } from "../../../lib/firebase/client";
import {
  getApplications,
  getApplicationById,
  createApplication,
  updateApplication,
  deleteApplication,
  updateApplicationStatus,
  reviewApplication,
} from "../api/applications";
import type {
  Application,
  ApplicationInput,
  ApplicationStatus,
  FollowUpReviewInput,
} from "../types";
export function useApplications() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["applications", user?.uid],
    enabled: Boolean(user),
    queryFn: ({ signal }) => getApplications(user!.uid, signal),
  });
}
export function useApplication(id: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["applications", user?.uid, id],
    enabled: Boolean(user && id),
    queryFn: ({ signal }) => getApplicationById(user!.uid, id, signal),
  });
}
type MutationAction =
  | { kind: "create"; input: ApplicationInput }
  | {
      kind: "update";
      id: string;
      expectedRevision: string;
      input: ApplicationInput;
    }
  | { kind: "delete"; id: string }
  | { kind: "status"; id: string; status: ApplicationStatus }
  | {
      kind: "review";
      id: string;
      expectedRevision: string;
      input: FollowUpReviewInput;
    };
export function useApplicationMutation() {
  const client = useQueryClient();
  const { user } = useAuth();
  const ownerId = user?.uid;
  return useMutation<
    Application | void,
    Error,
    MutationAction,
    { ownerId: string | undefined }
  >({
    onMutate: () => ({ ownerId }),
    mutationFn: (action: MutationAction) => {
      if (!ownerId) throw new Error("Please sign in again before saving.");
      switch (action.kind) {
        case "create":
          return createApplication(ownerId, action.input);
        case "update":
          return updateApplication(
            ownerId,
            action.id,
            action.expectedRevision,
            action.input,
          );
        case "delete":
          return deleteApplication(ownerId, action.id);
        case "status":
          return updateApplicationStatus(ownerId, action.id, action.status);
        case "review":
          return reviewApplication(
            ownerId,
            action.id,
            action.expectedRevision,
            action.input,
          );
      }
    },
    onSuccess: (_data, action, context) => {
      const savedOwner = context?.ownerId;
      if (!savedOwner || auth?.currentUser?.uid !== savedOwner) return;
      if (action.kind !== "review" && action.kind !== "update") {
        return client.invalidateQueries({
          queryKey: ["applications", savedOwner],
        });
      }
      // Save acknowledgment must not wait for (or fail with) a background refresh.
      void client
        .cancelQueries({ queryKey: ["applications", savedOwner] })
        .then(() => {
          if (auth?.currentUser?.uid !== savedOwner) return;
          return client.invalidateQueries({
            queryKey: ["applications", savedOwner],
          });
        });
    },
  });
}
