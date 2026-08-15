import { useEffect, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

type CrashDetail = {
  message: string;
  stack?: string;
  componentStack?: string;
};

const MAX_RECENT_ERRORS = 10;

/** Captures minimal diagnostics only for authenticated users who explicitly opted in. */
export function ConsentCrashReporter() {
  const { isAuthenticated } = useAuth();
  const reportedErrors = useRef(new Set<string>());
  const { data: profile } = trpc.onboarding.getProfile.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
  });
  const report = trpc.crashReports.report.useMutation();

  useEffect(() => {
    if (!isAuthenticated || profile?.crashReportingEnabled !== 1) return;

    const send = (detail: CrashDetail) => {
      const fingerprint = `${detail.message}|${detail.stack || ""}`;
      if (reportedErrors.current.has(fingerprint)) return;

      reportedErrors.current.add(fingerprint);
      if (reportedErrors.current.size > MAX_RECENT_ERRORS) {
        const firstFingerprint = reportedErrors.current.values().next().value;
        if (firstFingerprint) reportedErrors.current.delete(firstFingerprint);
      }

      report.mutate({
        message: detail.message || "Unknown client error",
        stack: detail.stack,
        componentStack: detail.componentStack,
        pageUrl: window.location.href,
        userAgent: navigator.userAgent,
      });
    };

    const onWindowError = (event: ErrorEvent) =>
      send({ message: event.message, stack: event.error instanceof Error ? event.error.stack : undefined });
    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
      send({ message: reason.message, stack: reason.stack });
    };
    const onBoundaryError = (event: Event) => {
      const detail = (event as CustomEvent<CrashDetail>).detail;
      if (detail) send(detail);
    };

    window.addEventListener("error", onWindowError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);
    window.addEventListener("space-planner-crash", onBoundaryError);
    return () => {
      window.removeEventListener("error", onWindowError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
      window.removeEventListener("space-planner-crash", onBoundaryError);
    };
  }, [isAuthenticated, profile?.crashReportingEnabled, report]);

  return null;
}
