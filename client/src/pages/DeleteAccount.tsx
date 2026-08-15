import React from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

export default function DeleteAccount() {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 20,
        background: "var(--bp-bg-primary)",
        color: "var(--bp-text-primary)",
        fontFamily: "'Space Mono', monospace",
      }}
    >
      <section
        style={{
          width: "min(100%, 640px)",
          border: "1px solid var(--bp-grid-major)",
          background: "var(--bp-panel)",
          padding: 28,
        }}
      >
        <p style={{ margin: "0 0 8px", color: "var(--bp-cyan)", fontSize: 10, letterSpacing: "0.12em" }}>SPACE PLANNER STUDIO</p>
        <h1 style={{ margin: "0 0 14px", fontSize: 22 }}>Account deletion</h1>
        <p style={{ color: "var(--bp-text-secondary)", fontSize: 12, lineHeight: 1.7 }}>
          You can request deletion of your Space Planner Studio account and associated data. A request starts a 30-day grace period; you can cancel it at any time before final deletion by signing back in.
        </p>
        <p style={{ color: "var(--bp-text-secondary)", fontSize: 12, lineHeight: 1.7 }}>
          When deletion is completed, we permanently remove your profile, floor plans, custom furniture, share records, opted-in analytics, and opted-in crash reports. Data retained by law may be kept only for the applicable required period.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 22 }}>
          {!loading && isAuthenticated ? (
            <button
              className="bp-btn bp-btn-primary"
              onClick={() => setLocation("/")}
              style={{ padding: "8px 12px", fontSize: 10 }}
            >
              OPEN ACCOUNT CONTROLS
            </button>
          ) : (
            <button
              className="bp-btn bp-btn-primary"
              onClick={() => { window.location.href = getLoginUrl(); }}
              style={{ padding: "8px 12px", fontSize: 10 }}
            >
              SIGN IN TO REQUEST DELETION
            </button>
          )}
          <button className="bp-btn" onClick={() => setLocation("/privacy")} style={{ padding: "8px 12px", fontSize: 10 }}>
            PRIVACY POLICY
          </button>
        </div>
        <p style={{ margin: "20px 0 0", color: "var(--bp-text-muted)", fontSize: 10, lineHeight: 1.5 }}>
          Need assistance? Contact privacy@spaceplanner.studio from the email address associated with your account.
        </p>
      </section>
    </main>
  );
}
