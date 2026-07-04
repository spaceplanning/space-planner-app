// SPACE PLANNER STUDIO — Floor Plan Parsing Hook
// Uses tRPC mutation for server-side vision analysis
// ============================================================

import { trpc } from "./trpc";

export function useParseFloorPlan() {
  return trpc.parseFloorPlan.useMutation();
}
