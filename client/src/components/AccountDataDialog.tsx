import React, { useState } from "react";
import { Download, ShieldAlert, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { notifyError, notifySuccess } from "@/lib/notifications";

interface AccountDataDialogProps {
  onClose: () => void;
}

export default function AccountDataDialog({ onClose }: AccountDataDialogProps) {
  const [showDeletionConfirmation, setShowDeletionConfirmation] = useState(false);
  const utils = trpc.useUtils();
  const { data: deletionStatus, isLoading } = trpc.gdpr.getDeletionStatus.useQuery();
  const exportData = trpc.gdpr.exportData.useMutation({
    onSuccess: result => {
      const link = document.createElement("a");
      link.href = result.downloadUrl;
      link.download = result.fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      notifySuccess("Your data export is ready for download.");
    },
    onError: error => notifyError(error.message || "Unable to create your data export."),
  });
  const requestDeletion = trpc.gdpr.requestDeletion.useMutation({
    onSuccess: async result => {
      await utils.gdpr.getDeletionStatus.invalidate();
      setShowDeletionConfirmation(false);
      notifySuccess(`Deletion scheduled for ${new Date(result.deletionScheduledFor).toLocaleDateString()}.`);
    },
    onError: error => notifyError(error.message || "Unable to schedule account deletion."),
  });
  const cancelDeletion = trpc.gdpr.cancelDeletion.useMutation({
    onSuccess: async () => {
      await utils.gdpr.getDeletionStatus.invalidate();
      notifySuccess("Your account deletion request was cancelled.");
    },
    onError: error => notifyError(error.message || "Unable to cancel account deletion."),
  });

  const isBusy = exportData.isPending || requestDeletion.isPending || cancelDeletion.isPending;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="account-data-title"
      style={{ position: "fixed", inset: 0, zIndex: 1000, display: "grid", placeItems: "center", padding: 16 }}
    >
      <button
        aria-label="Close account data controls"
        onClick={onClose}
        style={{ position: "absolute", inset: 0, border: 0, background: "rgba(0, 0, 0, 0.65)", cursor: "default" }}
      />
      <section
        style={{
          position: "relative",
          width: "min(100%, 540px)",
          maxHeight: "90vh",
          overflowY: "auto",
          background: "var(--bp-panel)",
          border: "1px solid var(--bp-grid-major)",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.55)",
          padding: 20,
        }}
      >
        <button
          aria-label="Close"
          onClick={onClose}
          className="bp-btn"
          style={{ position: "absolute", top: 12, right: 12, padding: 6 }}
        >
          <X size={14} />
        </button>
        <h2 id="account-data-title" style={{ margin: 0, color: "var(--bp-cyan)", fontSize: 16, fontFamily: "'Space Mono', monospace" }}>
          ACCOUNT DATA & PRIVACY
        </h2>
        <p style={{ color: "var(--bp-text-secondary)", fontSize: 12, lineHeight: 1.6, margin: "12px 0 20px" }}>
          Control your stored data. Exports include your profile, floor plans, custom furniture, shares, and opted-in analytics events.
        </p>

        <div style={{ border: "1px solid var(--bp-grid-major)", padding: 14, marginBottom: 14 }}>
          <h3 style={{ margin: "0 0 6px", fontSize: 12 }}>EXPORT YOUR DATA</h3>
          <p style={{ margin: "0 0 12px", color: "var(--bp-text-muted)", fontSize: 11, lineHeight: 1.5 }}>
            Download a portable JSON copy of the data associated with your account.
          </p>
          <button
            className="bp-btn bp-btn-primary"
            disabled={isBusy}
            onClick={() => exportData.mutate()}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 10px", fontSize: 10 }}
          >
            <Download size={12} /> {exportData.isPending ? "PREPARING…" : "EXPORT DATA"}
          </button>
        </div>

        <div style={{ border: "1px solid #9f3a38", padding: 14, background: "rgba(159, 58, 56, 0.08)" }}>
          <h3 style={{ margin: "0 0 6px", fontSize: 12, color: "#fca5a5", display: "flex", gap: 6, alignItems: "center" }}>
            <ShieldAlert size={13} /> DELETE ACCOUNT
          </h3>
          {isLoading ? (
            <p style={{ color: "var(--bp-text-muted)", fontSize: 11 }}>Checking deletion status…</p>
          ) : deletionStatus?.requested ? (
            <>
              <p style={{ margin: "0 0 12px", color: "var(--bp-text-secondary)", fontSize: 11, lineHeight: 1.5 }}>
                Deletion is scheduled for <strong>{new Date(deletionStatus.scheduledFor!).toLocaleDateString()}</strong> ({deletionStatus.daysRemaining} day{deletionStatus.daysRemaining === 1 ? "" : "s"} remaining). You can cancel before then.
              </p>
              <button
                className="bp-btn"
                disabled={isBusy}
                onClick={() => cancelDeletion.mutate()}
                style={{ borderColor: "var(--bp-cyan)", color: "var(--bp-cyan)", padding: "7px 10px", fontSize: 10 }}
              >
                {cancelDeletion.isPending ? "CANCELLING…" : "CANCEL DELETION"}
              </button>
            </>
          ) : showDeletionConfirmation ? (
            <>
              <p style={{ margin: "0 0 12px", color: "#fecaca", fontSize: 11, lineHeight: 1.5 }}>
                This schedules permanent deletion of your account and associated data after a 30-day grace period. You may cancel by signing in before the date shown.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <button
                  className="bp-btn"
                  disabled={isBusy}
                  onClick={() => requestDeletion.mutate()}
                  style={{ borderColor: "#ef4444", color: "#fecaca", padding: "7px 10px", fontSize: 10 }}
                >
                  {requestDeletion.isPending ? "SCHEDULING…" : "CONFIRM DELETION"}
                </button>
                <button className="bp-btn" disabled={isBusy} onClick={() => setShowDeletionConfirmation(false)} style={{ padding: "7px 10px", fontSize: 10 }}>
                  GO BACK
                </button>
              </div>
            </>
          ) : (
            <>
              <p style={{ margin: "0 0 12px", color: "var(--bp-text-muted)", fontSize: 11, lineHeight: 1.5 }}>
                Request deletion of your account. Your data remains recoverable for 30 days, then a daily cleanup process permanently removes it.
              </p>
              <button
                className="bp-btn"
                disabled={isBusy}
                onClick={() => setShowDeletionConfirmation(true)}
                style={{ borderColor: "#ef4444", color: "#fecaca", padding: "7px 10px", fontSize: 10 }}
              >
                REQUEST ACCOUNT DELETION
              </button>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
