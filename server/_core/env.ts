// Load environment variables with validation
const loadEnv = () => {
  const apiKey = process.env.BUILT_IN_FORGE_API_KEY;
  const apiUrl = process.env.BUILT_IN_FORGE_API_URL;

  if (!apiKey) {
    console.error("[ENV] WARNING: BUILT_IN_FORGE_API_KEY is not set");
  }
  if (!apiUrl) {
    console.error("[ENV] WARNING: BUILT_IN_FORGE_API_URL is not set");
  }

  return {
    appId: process.env.VITE_APP_ID ?? "",
    cookieSecret: process.env.JWT_SECRET ?? "",
    databaseUrl: process.env.DATABASE_URL ?? "",
    oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
    ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
    isProduction: process.env.NODE_ENV === "production",
    forgeApiUrl: apiUrl ?? "",
    forgeApiKey: apiKey ?? "",
  };
};

export const ENV = loadEnv();
