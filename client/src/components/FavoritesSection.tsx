// ============================================================
// SPACE PLANNER STUDIO — Favorites Section
// Blueprint Dark Theme: display favorited furniture items
// ============================================================

import React from "react";
import { FurnitureTemplate, CATEGORY_COLORS } from "@/lib/furnitureData";
import { FURNITURE_SYMBOLS } from "@/lib/furnitureSymbols";

interface Props {
  favorites: string[];
  allFurniture: FurnitureTemplate[];
  onDragFurniture: (item: FurnitureTemplate) => void;
  onToggleFavorite: (furnitureId: string) => void;
}

export default function FavoritesSection({
  favorites,
  allFurniture,
  onDragFurniture,
  onToggleFavorite,
}: Props) {
  if (favorites.length === 0) return null;

  const favoriteItems = allFurniture.filter((item) => favorites.includes(item.id));

  return (
    <div style={{ borderBottom: "1px solid var(--bp-grid-subtle)", marginBottom: 8 }}>
      <div
        style={{
          padding: "8px 12px",
          fontFamily: "'Space Mono', monospace",
          fontSize: 9,
          fontWeight: 700,
          color: "var(--bp-dim-yellow)",
          letterSpacing: "0.1em",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        ★ FAVORITES ({favorites.length})
      </div>
      <div style={{ padding: "0 12px 8px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
        {favoriteItems.map((item) => {
          const catColor = CATEGORY_COLORS[item.category] || "#22d3ee";
          return (
            <div
              key={item.id}
              className="furniture-item"
              draggable
              onDragStart={() => onDragFurniture(item)}
              title={`${item.name}\n${item.widthFt}' × ${item.depthFt}'`}
              style={{ position: "relative" }}
            >
              <div
                style={{
                  width: "100%",
                  aspectRatio: `${item.widthFt} / ${item.depthFt}`,
                  maxHeight: 40,
                  background: catColor,
                  opacity: 0.15,
                  border: `1px solid ${catColor}`,
                  marginBottom: 4,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 100 100"
                  style={{ position: "absolute" }}
                  dangerouslySetInnerHTML={{
                    __html: FURNITURE_SYMBOLS[item.id] || FURNITURE_SYMBOLS.chair_dining,
                  }}
                />
              </div>
              <div
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 9,
                  color: "var(--bp-text-primary)",
                  lineHeight: 1.3,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {item.name}
              </div>
              <div
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 8,
                  color: "var(--bp-text-muted)",
                }}
              >
                {item.widthFt}' × {item.depthFt}'
              </div>
              {/* Star button to unfavorite */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(item.id);
                }}
                style={{
                  position: "absolute",
                  top: 2,
                  right: 2,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--bp-dim-yellow)",
                  padding: 2,
                  fontSize: 12,
                  opacity: 1,
                  transition: "opacity 160ms",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                title="Remove from favorites"
              >
                ★
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
