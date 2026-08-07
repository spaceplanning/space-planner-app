import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import FloorPlanCanvas from "@/components/FloorPlanCanvas";
import { FloorPlan } from "@/lib/floorPlanTypes";
import { notifyError, notifyInfo } from "@/lib/notifications";

export default function ShareView() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const token = params?.token as string;
  
  const [floorPlan, setFloorPlan] = useState<FloorPlan | null>(null);
  const [permission, setPermission] = useState<"view" | "edit" | null>(null);
  const [focusedRoomId, setFocusedRoomId] = useState<string | null>(null);
  const [draggedFurniture, setDraggedFurniture] = useState(null);
  const [showLabels, setShowLabels] = useState(true);

  // Fetch shared floor plan using tRPC hook
  const { data: planData, isLoading, error: queryError } = trpc.sharing.getSharedFloorPlan.useQuery(
    { token: token || "" },
    { enabled: !!token }
  );

  // Update state when data arrives
  useEffect(() => {
    if (planData) {
      setFloorPlan(planData);
      setPermission(planData.permission);
      notifyInfo(`Viewing floor plan: ${planData.name}`);
    } else if (queryError) {
      notifyError(queryError.message || "Failed to load shared floor plan");
    }
  }, [planData, queryError]);

  if (isLoading) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "var(--bp-bg-primary)",
        color: "var(--bp-text-primary)",
        fontFamily: "'Space Mono', monospace",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 14, marginBottom: 16 }}>Loading shared floor plan...</div>
          <div style={{ fontSize: 12, color: "var(--bp-text-muted)" }}>Please wait</div>
        </div>
      </div>
    );
  }

  if (queryError || !floorPlan) {
    const errorMsg = queryError?.message || "Floor plan not found or share link has expired";
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "var(--bp-bg-primary)",
        color: "var(--bp-text-primary)",
        fontFamily: "'Space Mono', monospace",
      }}>
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <div style={{ fontSize: 14, marginBottom: 16, color: "var(--bp-error)" }}>
            {errorMsg}
          </div>
          <button
            onClick={() => setLocation("/")}
            style={{
              padding: "8px 16px",
              background: "var(--bp-cyan)",
              color: "var(--bp-bg-primary)",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontFamily: "'Space Mono', monospace",
              fontSize: 10,
            }}
          >
            RETURN TO HOME
          </button>
        </div>
      </div>
    );
  }

  // Render shared floor plan view
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--bp-bg-primary)" }}>
      {/* Header */}
      <div style={{
        background: "var(--bp-panel)",
        border: "1px solid var(--bp-grid-major)",
        padding: "12px 16px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <div>
          <h1 style={{
            margin: 0,
            fontSize: 14,
            color: "var(--bp-cyan)",
            fontFamily: "'Space Mono', monospace",
          }}>
            {floorPlan.name}
          </h1>
          <div style={{
            fontSize: 10,
            color: "var(--bp-text-muted)",
            fontFamily: "'Space Mono', monospace",
            marginTop: 4,
          }}>
            {permission === "view" ? "VIEW-ONLY" : "EDIT PERMISSION"}
            {" • "}
            {floorPlan.totalWidth > 0 && `${(floorPlan.totalWidth * floorPlan.totalHeight).toFixed(0)} SQ FT`}
          </div>
        </div>
        <button
          onClick={() => setLocation("/")}
          style={{
            padding: "6px 12px",
            background: "transparent",
            border: "1px solid var(--bp-grid-major)",
            borderRadius: 4,
            cursor: "pointer",
            color: "var(--bp-text-secondary)",
            fontFamily: "'Space Mono', monospace",
            fontSize: 10,
            transition: "all 150ms ease-out",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--bp-cyan)";
            e.currentTarget.style.color = "var(--bp-cyan)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--bp-grid-major)";
            e.currentTarget.style.color = "var(--bp-text-secondary)";
          }}
        >
          BACK TO HOME
        </button>
      </div>

      {/* Canvas - Read-only or edit based on permission */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        <FloorPlanCanvas
          plan={floorPlan}
          focusedRoomId={focusedRoomId}
          onPlanChange={(updatedPlan) => {
            // Only allow changes if permission is "edit"
            if (permission === "edit") {
              setFloorPlan(updatedPlan);
            } else {
              notifyError("You do not have permission to edit this floor plan");
            }
          }}
          draggedFurniture={draggedFurniture}
          onDragEnd={() => setDraggedFurniture(null)}
          showLabels={showLabels}
          onToggleLabels={setShowLabels}
        />
      </div>
    </div>
  );
}
