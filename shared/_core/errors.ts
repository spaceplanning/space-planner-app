export type AppErrorCode = "UNKNOWN";

export interface AppErrorShape {
  code: AppErrorCode;
  message: string;
}

export const APP_ERROR_CODES = {
  UNKNOWN: "UNKNOWN",
} as const;
