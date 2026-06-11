export const isCloudMode =
  import.meta.env.VITE_APP_MODE === "cloud" ||
  import.meta.env.VITE_ENABLE_CLOUD === "true";

export const isLocalMode = !isCloudMode;

export const hasCloudLoginConfig = Boolean(
  import.meta.env.VITE_OAUTH_PORTAL_URL && import.meta.env.VITE_APP_ID
);
