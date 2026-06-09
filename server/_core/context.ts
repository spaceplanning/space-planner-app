export interface TrpcContext {
  user: {
    id: number;
    openId: string;
    email?: string | null;
    name?: string | null;
    loginMethod?: string | null;
    role?: string | null;
    createdAt: Date;
    updatedAt: Date;
    lastSignedIn?: Date | null;
  } | null;
  req: {
    protocol?: string;
    headers: Record<string, string | string[] | undefined>;
  };
  res: {
    clearCookie(name: string, options: Record<string, unknown>): void;
  };
}
