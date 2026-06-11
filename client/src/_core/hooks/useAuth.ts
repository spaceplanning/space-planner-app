import { useCallback, useMemo } from "react";
import { getLoginUrl } from "@/const";
import { isLocalMode } from "@/lib/appMode";
import { trpc } from "@/lib/trpc";

const localUser = {
  id: 0,
  openId: "local-user",
  email: null,
  name: "Local User",
  loginMethod: "local",
  role: "local",
  createdAt: new Date(0),
  updatedAt: new Date(0),
  lastSignedIn: new Date(0),
};

export function useAuth() {
  const { data: user, isLoading, isFetching } = trpc.auth.me.useQuery(undefined, {
    enabled: !isLocalMode,
    retry: false,
  });

  const logoutMutation = trpc.auth.logout.useMutation();

  const logout = useCallback(async () => {
    if (isLocalMode) {
      window.location.href = window.location.origin;
      return;
    }

    try {
      await logoutMutation.mutateAsync();
    } finally {
      window.location.href = getLoginUrl();
    }
  }, [logoutMutation]);

  return useMemo(
    () => ({
      user: isLocalMode ? localUser : user ?? null,
      loading: isLocalMode ? false : isLoading || isFetching,
      isAuthenticated: isLocalMode || Boolean(user),
      logout,
    }),
    [isFetching, isLoading, logout, user]
  );
}
