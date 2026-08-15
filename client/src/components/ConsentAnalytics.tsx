import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

/** Records minimal, first-party usage data only after an authenticated user opts in. */
export function ConsentAnalytics() {
  const { isAuthenticated } = useAuth();
  const [location] = useLocation();
  const { data: profile } = trpc.onboarding.getProfile.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
  });
  const trackRouteView = trpc.analytics.track.useMutation();

  useEffect(() => {
    if (!isAuthenticated || profile?.analyticsEnabled !== 1) return;

    trackRouteView.mutate({
      eventName: "route_viewed",
      eventData: { route: location },
    });
  }, [isAuthenticated, location, profile?.analyticsEnabled, trackRouteView]);

  return null;
}
