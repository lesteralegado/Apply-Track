import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  confirmPasswordReset,
  verifyPasswordResetCode,
} from "firebase/auth";
import { requireFirebase } from "../../../lib/firebase/client";
import { publicError } from "../../../lib/errors";
export async function signIn(email: string, password: string) {
  try {
    await signInWithEmailAndPassword(requireFirebase().auth, email, password);
  } catch (error) {
    throw publicError(
      error,
      "Unable to sign in. Check your email and password and try again.",
    );
  }
}
export async function signUp(email: string, password: string) {
  try {
    return await createUserWithEmailAndPassword(
      requireFirebase().auth,
      email,
      password,
    );
  } catch (error) {
    throw publicError(
      error,
      "We couldn't create your account. Check your email and use a password of at least 8 characters.",
    );
  }
}
export async function signOut() {
  try {
    await firebaseSignOut(requireFirebase().auth);
  } catch (error) {
    throw publicError(error, "We couldn't sign you out. Please try again.");
  }
}
export async function requestPasswordReset(email: string) {
  try {
    await sendPasswordResetEmail(requireFirebase().auth, email, {
      url: window.location.origin + "/sign-in",
    });
  } catch (error) {
    // Keep the same result for an unknown email to avoid exposing account existence.
    if ((error as { code?: string }).code === "auth/user-not-found") return;
    throw publicError(
      error,
      "We couldn't send the reset link. Please try again later.",
    );
  }
}
export async function checkPasswordResetCode(code: string) {
  try {
    return await verifyPasswordResetCode(requireFirebase().auth, code);
  } catch (error) {
    throw publicError(
      error,
      "This reset link is expired or incomplete. Request a new one.",
    );
  }
}
export async function updatePassword(password: string, code: string) {
  try {
    const { auth } = requireFirebase();
    await confirmPasswordReset(auth, code, password);
    await firebaseSignOut(auth);
  } catch (error) {
    throw publicError(
      error,
      "We couldn't update your password. Please request a new link and try again.",
    );
  }
}
