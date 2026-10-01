import { createContext, useContext } from "react";
import type { User } from "firebase/auth";
export const AuthContext = createContext<{
  user: User | null;
  loading: boolean;
  error: string | null;
}>({ user: null, loading: true, error: null });
export function useAuth() {
  return useContext(AuthContext);
}
