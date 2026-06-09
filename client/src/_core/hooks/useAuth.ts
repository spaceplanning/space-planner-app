import { useMemo } from "react";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";

export function useAuth() {
  const { data: user, isLoading, isFetching } = trpc.auth.me.useQuery(undefined, {
    retry: false,
  });

  const logoutMutation = trpc.auth.logout.useMutation();

  const logout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } finally {
      window.location.href = getLoginUrl();
    }
  };

  return useMemo(
    () => ({
      user: user ?? null,
      loading: isLoading || isFetching,
      isAuthenticated: Boolean(user),
      logout,
    }),
    [isFetching, isLoading, logout, user]
  );
}
