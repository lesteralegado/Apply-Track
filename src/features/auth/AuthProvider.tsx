import { useEffect, useState, useRef, type ReactNode } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { useQueryClient } from "@tanstack/react-query";
import { auth } from "../../lib/firebase/client";
import { AuthContext } from "./hooks/useAuth";
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(Boolean(auth));
  const [error, setError] = useState<string | null>(null);
  const previousUser = useRef<string | null>(null);
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(
      auth,
      (nextUser) => {
        if (previousUser.current !== (nextUser?.uid ?? null)) {
          void queryClient.cancelQueries();
          queryClient.clear();
          previousUser.current = nextUser?.uid ?? null;
        }
        setUser(nextUser);
        setLoading(false);
        setError(null);
      },
      () => {
        void queryClient.cancelQueries();
        queryClient.clear();
        previousUser.current = null;
        setUser(null);
        setLoading(false);
        setError("We couldn't restore your session. Please sign in again.");
      },
    );
  }, [queryClient]);
  return (
    <AuthContext.Provider value={{ user, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
}
