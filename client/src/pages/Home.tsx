// ============================================================
// SPACE PLANNER STUDIO — Main Application Page
// Blueprint Dark Theme: full-screen layout with left panel + canvas
// ============================================================

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  FloorPlan,
  loadPlans,
  savePlans,
  loadCustomFurniture,
  saveCustomFurniture,
  loadActivePlanId,
  saveActivePlanId,
  generateId,
} from "@/lib/floorPlanTypes";
import {
  FurnitureTemplate,
  DEFAULT_FURNITURE,
} from "@/lib/furnitureData";
import FloorPlanCanvas from "@/components/FloorPlanCanvas";
import LeftPanel from "@/components/LeftPanel";
import TopToolbar from "@/components/TopToolbar";
import CustomFurnitureDialog from "@/components/CustomFurnitureDialog";

function createEmptyPlan(name: string = "New Plan"): FloorPlan {
  return {
    id: generateId(),
    name,
    totalWidth: 0,
    totalHeight: 0,
    rooms: [],
    furniture: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export default function Home() {
  const [plans, setPlans] = useState<FloorPlan[]>([]);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [customFurniture, setCustomFurniture] = useState<FurnitureTemplate[]>([]);
  const [focusedRoomId, setFocusedRoomId] = useState<string | null>(null);
  const [draggedFurniture, setDraggedFurniture] = useState<FurnitureTemplate | null>(null);
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Load persisted data on mount
  useEffect(() => {
    const savedPlans = loadPlans();
    const savedCustom = loadCustomFurniture();
    const savedActiveId = loadActivePlanId();

    setCustomFurniture(savedCustom);

    if (savedPlans.length > 0) {
      setPlans(savedPlans);
      const activeExists = savedPlans.find((p) => p.id === savedActiveId);
      setActivePlanId(activeExists ? savedActiveId : savedPlans[0].id);
    } else {
      const initial = createEmptyPlan("My Floor Plan");
      setPlans([initial]);
      setActivePlanId(initial.id);
    }
  }, []);

  // Persist plans whenever they change
  useEffect(() => {
    if (plans.length > 0) {
      savePlans(plans);
    }
  }, [plans]);

  // Persist active plan id
  useEffect(() => {
    saveActivePlanId(activePlanId);
  }, [activePlanId]);

  // Persist custom furniture
  useEffect(() => {
    saveCustomFurniture(customFurniture);
  }, [customFurniture]);

  const activePlan = plans.find((p) => p.id === activePlanId) || plans[0];

  const handlePlanChange = useCallback(
    (updated: FloorPlan) => {
      setPlans((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    },
    []
  );

  const handleNewPlan = useCallback(() => {
    const newPlan = createEmptyPlan(`Plan ${plans.length + 1}`);
    setPlans((prev) => [...prev, newPlan]);
    setActivePlanId(newPlan.id);
    setFocusedRoomId(null);
  }, [plans.length]);

  const handleDeletePlan = useCallback(
    (id: string) => {
      if (plans.length <= 1) return;
      const remaining = plans.filter((p) => p.id !== id);
      setPlans(remaining);
      if (activePlanId === id) {
        setActivePlanId(remaining[0].id);
        setFocusedRoomId(null);
      }
    },
    [plans, activePlanId]
  );

  const handleSelectPlan = useCallback((id: string) => {
    setActivePlanId(id);
    setFocusedRoomId(null);
  }, []);

  const handleFocusRoom = useCallback((roomId: string | null) => {
    setFocusedRoomId(roomId);
  }, []);

  const handleDragFurniture = useCallback((item: FurnitureTemplate) => {
    setDraggedFurniture(item);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedFurniture(null);
  }, []);

  const handleAddCustomFurniture = useCallback((item: FurnitureTemplate) => {
    setCustomFurniture((prev) => [...prev, item]);
  }, []);

  const handleDeleteCustomFurniture = useCallback((id: string) => {
    setCustomFurniture((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const allFurniture = [...DEFAULT_FURNITURE, ...customFurniture];

  if (!activePlan) return null;

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--bp-navy)",
        overflow: "hidden",
      }}
    >
      {/* Top toolbar */}
      <TopToolbar
        plan={activePlan}
        allPlans={plans}
        focusedRoomId={focusedRoomId}
        onPlanChange={handlePlanChange}
        onSelectPlan={handleSelectPlan}
        onNewPlan={handleNewPlan}
        onDeletePlan={handleDeletePlan}
        onFocusRoom={handleFocusRoom}
        canvasElement={canvasContainerRef.current}
      />

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Left panel */}
        <LeftPanel
          plan={activePlan}
          allFurniture={allFurniture}
          focusedRoomId={focusedRoomId}
          onPlanChange={handlePlanChange}
          onFocusRoom={handleFocusRoom}
          onDragFurniture={handleDragFurniture}
          onAddCustomFurniture={() => setShowCustomDialog(true)}
          onDeleteCustomFurniture={handleDeleteCustomFurniture}
        />

        {/* Canvas */}
        <div ref={canvasContainerRef} style={{ flex: 1, overflow: "hidden" }}>
          <FloorPlanCanvas
            plan={activePlan}
            focusedRoomId={focusedRoomId}
            onPlanChange={handlePlanChange}
            draggedFurniture={draggedFurniture}
            onDragEnd={handleDragEnd}
          />
        </div>
      </div>

      {/* Custom furniture dialog */}
      {showCustomDialog && (
        <CustomFurnitureDialog
          onSave={handleAddCustomFurniture}
          onClose={() => setShowCustomDialog(false)}
        />
      )}
    </div>
  );
}
