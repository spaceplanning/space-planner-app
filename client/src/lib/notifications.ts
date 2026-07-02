import { toast } from "sonner";

export type NotificationType = "success" | "error" | "info" | "warning";

interface NotificationOptions {
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Show a custom notification toast
 */
export function showNotification(
  message: string,
  type: NotificationType = "info",
  options?: NotificationOptions
) {
  const { duration = 3000, action } = options || {};

  const commonStyle = {
    background: "var(--bp-panel)",
    border: "1px solid var(--bp-grid-major)",
    color: "var(--bp-text-primary)",
    fontFamily: "'Space Mono', monospace",
    fontSize: "12px",
  };

  const toastOptions = {
    duration,
    style: commonStyle,
  };

  switch (type) {
    case "success":
      return toast.success(message, {
        ...toastOptions,
        style: {
          ...commonStyle,
          borderColor: "var(--bp-green)",
          color: "var(--bp-green)",
        },
        icon: "✓",
      });

    case "error":
      return toast.error(message, {
        ...toastOptions,
        style: {
          ...commonStyle,
          borderColor: "#ef4444",
          color: "#ef4444",
        },
        icon: "✕",
      });

    case "warning":
      return toast.warning(message, {
        ...toastOptions,
        style: {
          ...commonStyle,
          borderColor: "var(--bp-yellow)",
          color: "var(--bp-yellow)",
        },
        icon: "⚠",
      });

    case "info":
    default:
      return toast(message, {
        ...toastOptions,
        style: {
          ...commonStyle,
          borderColor: "var(--bp-cyan)",
          color: "var(--bp-cyan)",
        },
        icon: "ℹ",
      });
  }
}

/**
 * Show success notification
 */
export function notifySuccess(message: string, options?: NotificationOptions) {
  return showNotification(message, "success", options);
}

/**
 * Show error notification
 */
export function notifyError(message: string, options?: NotificationOptions) {
  return showNotification(message, "error", options);
}

/**
 * Show warning notification
 */
export function notifyWarning(message: string, options?: NotificationOptions) {
  return showNotification(message, "warning", options);
}

/**
 * Show info notification
 */
export function notifyInfo(message: string, options?: NotificationOptions) {
  return showNotification(message, "info", options);
}

/**
 * Show loading notification (doesn't auto-dismiss)
 */
export function notifyLoading(message: string) {
  return toast.loading(message, {
    style: {
      background: "var(--bp-panel)",
      border: "1px solid var(--bp-grid-major)",
      color: "var(--bp-cyan)",
      fontFamily: "'Space Mono', monospace",
      fontSize: "12px",
    },
  });
}

/**
 * Dismiss a notification by ID
 */
export function dismissNotification(id: string | number) {
  toast.dismiss(id);
}

/**
 * Dismiss all notifications
 */
export function dismissAllNotifications() {
  toast.dismiss();
}
