import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { isLocalMode } from "@/lib/appMode";
import { toast } from "sonner";

interface ShareDialogProps {
  floorPlanId: string;
  floorPlanName: string;
  onClose: () => void;
}

export default function ShareDialog({
  floorPlanId,
  floorPlanName,
  onClose,
}: ShareDialogProps) {
  const [permission, setPermission] = useState<"view" | "edit">("view");
  const [expiresInDays, setExpiresInDays] = useState<number | undefined>(undefined);
  const [shareLink, setShareLink] = useState<string | null>(null);

  const createShareMutation = trpc.sharing.createShare.useMutation();
  const { data: shares = [] } = trpc.sharing.getShares.useQuery(
    { floorPlanId },
    { enabled: !isLocalMode }
  );

  const handleCreateShare = async () => {
    if (isLocalMode) {
      toast.info("Cloud sharing is available when cloud mode is configured.");
      return;
    }

    try {
      const result = await createShareMutation.mutateAsync({
        floorPlanId,
        permission,
        expiresInDays,
      });

      if (result && result.shareToken) {
        const link = `${window.location.origin}/shared/${result.shareToken}`;
        setShareLink(link);
        toast.success("Share link created!");
      }
    } catch (error) {
      toast.error("Failed to create share link");
    }
  };

  const handleCopyLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      toast.success("Link copied to clipboard!");
    }
  };

  const deleteShareMutation = trpc.sharing.deleteShare.useMutation();
  const handleDeleteShare = async (shareId: string) => {
    try {
      await deleteShareMutation.mutateAsync({ shareId });
      toast.success("Share link deleted");
    } catch (error) {
      toast.error("Failed to delete share link");
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--bp-panel)",
          border: "1px solid var(--bp-grid-major)",
          borderRadius: "8px",
          padding: "2rem",
          maxWidth: "500px",
          width: "90%",
          maxHeight: "80vh",
          overflow: "auto",
          color: "var(--bp-text-primary)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {isLocalMode ? (
          <>
            <h2 style={{ marginTop: 0, color: "var(--bp-cyan)" }}>
              Cloud Sharing
            </h2>
            <p style={{ color: "var(--bp-text-secondary)", lineHeight: 1.5 }}>
              "{floorPlanName}" is saved locally on this computer. Cloud sharing is disabled in the
              dependency-free installer build.
            </p>
            <button
              onClick={onClose}
              style={{
                width: "100%",
                padding: "0.75rem",
                background: "transparent",
                color: "var(--bp-text-secondary)",
                border: "1px solid var(--bp-text-secondary)",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </>
        ) : (
          <>
        <h2 style={{ marginTop: 0, color: "var(--bp-cyan)" }}>
          Share "{floorPlanName}"
        </h2>

        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem" }}>
            Permission Level:
          </label>
          <select
            value={permission}
            onChange={(e) => setPermission(e.target.value as "view" | "edit")}
            style={{
              width: "100%",
              padding: "0.5rem",
              background: "var(--bp-input-bg)",
              border: "1px solid var(--bp-grid-major)",
              color: "var(--bp-text-primary)",
              borderRadius: "4px",
            }}
          >
            <option value="view">View Only</option>
            <option value="edit">Can Edit</option>
          </select>
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem" }}>
            Expiration (optional):
          </label>
          <select
            value={expiresInDays?.toString() || ""}
            onChange={(e) =>
              setExpiresInDays(e.target.value ? parseInt(e.target.value) : undefined)
            }
            style={{
              width: "100%",
              padding: "0.5rem",
              background: "var(--bp-input-bg)",
              border: "1px solid var(--bp-grid-major)",
              color: "var(--bp-text-primary)",
              borderRadius: "4px",
            }}
          >
            <option value="">Never Expires</option>
            <option value="1">1 Day</option>
            <option value="7">7 Days</option>
            <option value="30">30 Days</option>
          </select>
        </div>

        <button
          onClick={handleCreateShare}
          disabled={createShareMutation.isPending}
          style={{
            width: "100%",
            padding: "0.75rem",
            background: "var(--bp-cyan)",
            color: "var(--bp-navy)",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "bold",
            marginBottom: "1.5rem",
          }}
        >
          {createShareMutation.isPending ? "Creating..." : "Create Share Link"}
        </button>

        {shareLink && (
          <div
            style={{
              background: "var(--bp-navy)",
              border: "1px solid var(--bp-cyan)",
              borderRadius: "4px",
              padding: "1rem",
              marginBottom: "1.5rem",
            }}
          >
            <p style={{ marginTop: 0, fontSize: "0.9rem", color: "var(--bp-text-secondary)" }}>
              Share this link:
            </p>
            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                alignItems: "center",
              }}
            >
              <input
                type="text"
                value={shareLink}
                readOnly
                style={{
                  flex: 1,
                  padding: "0.5rem",
                  background: "var(--bp-panel)",
                  border: "1px solid var(--bp-grid-major)",
                  color: "var(--bp-text-primary)",
                  borderRadius: "4px",
                  fontSize: "0.85rem",
                }}
              />
              <button
                onClick={handleCopyLink}
                style={{
                  padding: "0.5rem 1rem",
                  background: "var(--bp-cyan)",
                  color: "var(--bp-navy)",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                Copy
              </button>
            </div>
          </div>
        )}

        <div style={{ marginBottom: "1.5rem" }}>
          <h3 style={{ marginTop: 0, color: "var(--bp-cyan)", fontSize: "1rem" }}>
            Active Shares ({shares.length})
          </h3>
          {shares.length === 0 ? (
            <p style={{ color: "var(--bp-text-secondary)", fontSize: "0.9rem" }}>
              No active shares yet
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {shares.map((share) => (
                <div
                  key={share.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.75rem",
                    background: "var(--bp-navy)",
                    border: "1px solid var(--bp-grid-major)",
                    borderRadius: "4px",
                    fontSize: "0.9rem",
                  }}
                >
                  <div>
                    <div style={{ color: "var(--bp-text-secondary)" }}>
                      {share.permission === "view" ? "View Only" : "Can Edit"}
                    </div>
                    {share.expiresAt && (
                      <div style={{ color: "var(--bp-text-secondary)", fontSize: "0.85rem" }}>
                        Expires: {new Date(share.expiresAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteShare(share.id)}
                    style={{
                      padding: "0.4rem 0.8rem",
                      background: "transparent",
                      color: "var(--bp-text-secondary)",
                      border: "1px solid var(--bp-text-secondary)",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "0.85rem",
                    }}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          style={{
            width: "100%",
            padding: "0.75rem",
            background: "transparent",
            color: "var(--bp-text-secondary)",
            border: "1px solid var(--bp-text-secondary)",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Close
        </button>
          </>
        )}
      </div>
    </div>
  );
}
