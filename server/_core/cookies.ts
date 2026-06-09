export function getSessionCookieOptions(req: { protocol?: string }): {
  secure: boolean;
  sameSite: "lax" | "strict" | "none";
  httpOnly: true;
  path: string;
} {
  const isSecure = (req.protocol ?? "http").startsWith("https");

  return {
    secure: isSecure,
    sameSite: isSecure ? "none" : "lax",
    httpOnly: true,
    path: "/",
  };
}
