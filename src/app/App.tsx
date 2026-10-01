import { lazy, Suspense, type ReactNode } from "react";
import { Routes, Route, Navigate, Link } from "react-router-dom";
import { ProtectedRoute } from "../features/auth/ProtectedRoute";
import { AppShell } from "../components/layout/AppShell";
import { LoadingState } from "../components/ui/States";
const DemoDashboard = lazy(() =>
  import("../features/demo/DemoDashboard").then((module) => ({
    default: module.DemoDashboard,
  })),
);
const AuthPage = lazy(() =>
  import("../pages/AuthPage").then((module) => ({ default: module.AuthPage })),
);
const DashboardPage = lazy(() =>
  import("../pages/DashboardPage").then((module) => ({
    default: module.DashboardPage,
  })),
);
const ApplicationsPage = lazy(() =>
  import("../pages/ApplicationsPage").then((module) => ({
    default: module.ApplicationsPage,
  })),
);
const ApplicationEditorPage = lazy(() =>
  import("../pages/ApplicationEditorPage").then((module) => ({
    default: module.ApplicationEditorPage,
  })),
);
function screen(element: ReactNode) {
  return (
    <Suspense fallback={<LoadingState text="Opening your workspace…" />}>
      {element}
    </Suspense>
  );
}
export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/demo" replace />} />
      <Route path="/demo" element={screen(<DemoDashboard />)} />
      <Route
        path="/sign-in"
        element={screen(<AuthPage key="sign-in" mode="sign-in" />)}
      />
      <Route
        path="/sign-up"
        element={screen(<AuthPage key="sign-up" mode="sign-up" />)}
      />
      <Route
        path="/forgot-password"
        element={screen(
          <AuthPage key="forgot-password" mode="forgot-password" />,
        )}
      />
      <Route
        path="/update-password"
        element={screen(
          <AuthPage key="update-password" mode="update-password" />,
        )}
      />
      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<AppShell />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={screen(<DashboardPage />)} />
          <Route path="applications" element={screen(<ApplicationsPage />)} />
          <Route
            path="applications/new"
            element={screen(<ApplicationEditorPage />)}
          />
          <Route
            path="applications/:id/edit"
            element={screen(<ApplicationEditorPage />)}
          />
          <Route
            path="*"
            element={
              <div className="state">
                <h1>Page not found</h1>
                <Link to="/app/dashboard">Back to your dashboard</Link>
              </div>
            }
          />
        </Route>
      </Route>
      <Route
        path="*"
        element={
          <div className="state not-found">
            <h1>This page took a different path.</h1>
            <p>Let’s get you back to your next chapter.</p>
            <Link className="button primary" to="/demo">
              Back to ApplyTrack
            </Link>
          </div>
        }
      />
    </Routes>
  );
}
