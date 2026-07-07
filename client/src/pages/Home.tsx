// ============================================================
// SPACE PLANNER STUDIO — Main Application Page
// Blueprint Dark Theme: full-screen layout with left panel + canvas
// ============================================================

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import {
  FloorPlan,
  loadPlans,
  savePlans,
  loadCustomFurniture,
  saveCustomFurniture,
  loadActivePlanId,
  saveActivePlanId,
  loadFavorites,
  saveFavorites,
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
import BulkDeleteDialog from "@/components/BulkDeleteDialog";
import { trpc } from "@/lib/trpc";
import { notifySuccess, notifyError, notifyInfo } from "@/lib/notifications";

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
  const { user, loading, isAuthenticated } = useAuth();

  const [plans, setPlans] = useState<FloorPlan[]>([]);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [customFurniture, setCustomFurniture] = useState<FurnitureTemplate[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [focusedRoomId, setFocusedRoomId] = useState<string | null>(null);
  const [draggedFurniture, setDraggedFurniture] = useState<FurnitureTemplate | null>(null);
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [showMobilePanel, setShowMobilePanel] = useState(false);
  const [selectedPlanIds, setSelectedPlanIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Detect mobile screen size
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setShowMobilePanel(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load user's floor plans from database
  const { data: dbPlans = [] } = trpc.floorPlans.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Load user's custom furniture from database
  const { data: dbCustomFurniture = [] } = trpc.customFurniture.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Sync database floor plans to local state
  useEffect(() => {
    if (dbPlans.length > 0) {
      const convertedPlans: FloorPlan[] = dbPlans.map((dbPlan) => ({
        id: dbPlan.id,
        name: dbPlan.name,
        totalWidth: dbPlan.totalWidth,
        totalHeight: dbPlan.totalHeight,
        rooms: JSON.parse(dbPlan.roomsJson || "[]"),
        furniture: JSON.parse(dbPlan.furnitureJson || "[]"),
        createdAt: new Date(dbPlan.createdAt).getTime(),
        updatedAt: new Date(dbPlan.updatedAt).getTime(),
      }));
      setPlans(convertedPlans);
      const savedActiveId = loadActivePlanId();
      const activeExists = convertedPlans.find((p) => p.id === savedActiveId);
      setActivePlanId(activeExists ? savedActiveId : convertedPlans[0].id);
    }
  }, [dbPlans]);

  // Sync database custom furniture to local state
  useEffect(() => {
    if (dbCustomFurniture.length > 0) {
      const converted: FurnitureTemplate[] = dbCustomFurniture.map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category as any,
        widthFt: item.width / 12, // Convert inches to feet
        depthFt: item.depth / 12,
        color: item.color,
        isCustom: true,
      }));
      setCustomFurniture(converted);
    }
  }, [dbCustomFurniture]);

  // Load local favorites
  useEffect(() => {
    const savedFavorites = loadFavorites();
    setFavorites(savedFavorites);
  }, []);

  // Persist plans to database when they change
  const saveFloorPlanMutation = trpc.floorPlans.save.useMutation();
  useEffect(() => {
    if (plans.length > 0 && isAuthenticated) {
      plans.forEach((plan) => {
        saveFloorPlanMutation.mutate({
          id: plan.id,
          name: plan.name,
          totalWidth: plan.totalWidth,
          totalHeight: plan.totalHeight,
          roomsJson: JSON.stringify(plan.rooms),
          furnitureJson: JSON.stringify(plan.furniture),
        });
      });
    }
  }, [plans, isAuthenticated]);

  // Persist custom furniture to database
  const saveCustomFurnitureMutation = trpc.customFurniture.save.useMutation();
  useEffect(() => {
    if (customFurniture.length > 0 && isAuthenticated) {
      customFurniture.forEach((item) => {
        if (item.isCustom) {
          saveCustomFurnitureMutation.mutate({
            id: item.id,
            name: item.name,
            category: item.category,
            width: Math.round(item.widthFt * 12), // Convert feet to inches
            depth: Math.round(item.depthFt * 12),
            color: item.color,
          });
        }
      });
    }
  }, [customFurniture, isAuthenticated]);

  // Persist active plan id
  useEffect(() => {
    saveActivePlanId(activePlanId);
  }, [activePlanId]);

  // Persist favorites
  useEffect(() => {
    saveFavorites(favorites);
  }, [favorites]);

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
    notifySuccess(`Created new plan: ${newPlan.name}`);
  }, [plans.length]);

  const deleteFloorPlanMutation = trpc.floorPlans.delete.useMutation();

  const handleTogglePlanSelection = useCallback(
    (id: string) => {
      const newSelected = new Set(selectedPlanIds);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      setSelectedPlanIds(newSelected);
    },
    [selectedPlanIds]
  );

  const handleBulkDelete = useCallback(() => {
    if (selectedPlanIds.size === 0) return;

    const idsToDelete = Array.from(selectedPlanIds);
    
    // Delete each plan
    idsToDelete.forEach((id) => {
      deleteFloorPlanMutation.mutate(
        { id },
        {
          onSuccess: () => {
            // Remove from plans list
            setPlans((prevPlans) => prevPlans.filter((p) => p.id !== id));
            
            // If deleted plan was active, switch to another
            if (activePlanId === id) {
              const remaining = plans.filter((p) => p.id !== id);
              if (remaining.length > 0) {
                setActivePlanId(remaining[0].id);
              }
            }
          },
          onError: (error) => {
            notifyError(`Failed to delete plan: ${error.message}`);
          },
        }
      );
    });

    // Clear selection and close dialog
    setSelectedPlanIds(new Set());
    setShowBulkDeleteDialog(false);
    notifySuccess(`Deleted ${idsToDelete.length} plan${idsToDelete.length !== 1 ? "s" : ""}`);
  }, [selectedPlanIds, plans, activePlanId, deleteFloorPlanMutation]);

  const handleDeletePlan = useCallback(
    (id: string) => {
      if (plans.length <= 1) return;
      
      // Delete from server
      deleteFloorPlanMutation.mutate(
        { id },
        {
          onSuccess: () => {
            // Update local state after successful deletion
            const remaining = plans.filter((p) => p.id !== id);
            setPlans(remaining);
            if (activePlanId === id) {
              setActivePlanId(remaining[0].id);
              setFocusedRoomId(null);
            }
            notifySuccess("Plan deleted");
          },
          onError: (error) => {
            notifyError(`Failed to delete plan: ${error.message}`);
          },
        }
      );
    },
    [plans, activePlanId, deleteFloorPlanMutation]
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
    notifySuccess(`Added custom furniture: ${item.name}`);
  }, []);

  const handleDeleteCustomFurniture = useCallback((id: string) => {
    setCustomFurniture((prev) => prev.filter((f) => f.id !== id));
    notifySuccess("Custom furniture deleted");
  }, []);

  const handleToggleFavorite = useCallback((furnitureId: string) => {
    setFavorites((prev) => {
      const isFavorited = prev.includes(furnitureId);
      if (isFavorited) {
        notifyInfo("Removed from favorites");
      } else {
        notifySuccess("Added to favorites");
      }
      return isFavorited
        ? prev.filter((id) => id !== furnitureId)
        : [...prev, furnitureId];
    });
  }, []);

  const allFurniture = [...DEFAULT_FURNITURE, ...customFurniture];

  // Show login screen if not authenticated
  if (loading) {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bp-navy)",
        }}
      >
        <div style={{ textAlign: "center", color: "var(--bp-text-primary)" }}>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bp-navy)",
          gap: "2rem",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h1 style={{ color: "var(--bp-cyan)", fontSize: "2.5rem", marginBottom: "0.5rem" }}>
            SPACE PLANNER STUDIO
          </h1>
          <p style={{ color: "var(--bp-text-secondary)", fontSize: "1.1rem" }}>
            Blueprint Mode - Interactive 2D Floor Planning
          </p>
        </div>
        <Button
          onClick={() => {
            window.location.href = getLoginUrl();
          }}
          style={{
            padding: "0.75rem 2rem",
            fontSize: "1rem",
            backgroundColor: "var(--bp-cyan)",
            color: "var(--bp-navy)",
            border: "1px solid var(--bp-cyan)",
            cursor: "pointer",
          }}
        >
          Login to Continue
        </Button>
      </div>
    );
  }

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
        showLabels={showLabels}
        onToggleLabels={setShowLabels}
        isMobile={isMobile}
        onToggleMobilePanel={() => setShowMobilePanel(!showMobilePanel)}
      />

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>
        {/* Left panel - hidden on mobile, shown as overlay */}
        <div
          style={{
            display: isMobile && !showMobilePanel ? "none" : "flex",
            flexDirection: "column",
            width: isMobile ? "100%" : "280px",
            position: isMobile ? "absolute" : "relative",
            height: "100%",
            zIndex: isMobile ? 50 : 1,
            background: "var(--bp-navy)",
            boxShadow: isMobile ? "0 0 20px rgba(0,0,0,0.5)" : "none",
          }}
        >
          <LeftPanel
            plan={activePlan}
            allFurniture={allFurniture}
            favorites={favorites}
            focusedRoomId={focusedRoomId}
            onPlanChange={handlePlanChange}
            onFocusRoom={handleFocusRoom}
            onDragFurniture={handleDragFurniture}
            onAddCustomFurniture={() => setShowCustomDialog(true)}
            onDeleteCustomFurniture={handleDeleteCustomFurniture}
            onToggleFavorite={handleToggleFavorite}
          />
        </div>

        {/* Mobile overlay backdrop */}
        {isMobile && showMobilePanel && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.5)",
              zIndex: 40,
            }}
            onClick={() => setShowMobilePanel(false)}
          />
        )}

        {/* Canvas */}
        <div
          ref={canvasContainerRef}
          style={{
            flex: 1,
            overflow: "hidden",
            display: isMobile && showMobilePanel ? "none" : "flex",
          }}
        >
          <FloorPlanCanvas
            plan={activePlan}
            focusedRoomId={focusedRoomId}
            onPlanChange={handlePlanChange}
            draggedFurniture={draggedFurniture}
            onDragEnd={handleDragEnd}
            showLabels={showLabels}
            onToggleLabels={setShowLabels}
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
