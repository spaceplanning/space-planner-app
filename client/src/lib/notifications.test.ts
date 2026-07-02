import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  showNotification,
  notifySuccess,
  notifyError,
  notifyWarning,
  notifyInfo,
  notifyLoading,
  dismissNotification,
  dismissAllNotifications,
} from "./notifications";

// Mock sonner with proper callable toast function
vi.mock("sonner", () => {
  const mockToast = vi.fn();
  mockToast.success = vi.fn();
  mockToast.error = vi.fn();
  mockToast.warning = vi.fn();
  mockToast.loading = vi.fn();
  mockToast.dismiss = vi.fn();

  return {
    toast: mockToast,
  };
});

// Import after mocking
import { toast } from "sonner";

describe("Notification Utility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("showNotification", () => {
    it("should call toast.success for success type", () => {
      showNotification("Success message", "success");
      expect(toast.success).toHaveBeenCalledWith(
        "Success message",
        expect.objectContaining({
          duration: 3000,
          icon: "✓",
        })
      );
    });

    it("should call toast.error for error type", () => {
      showNotification("Error message", "error");
      expect(toast.error).toHaveBeenCalledWith(
        "Error message",
        expect.objectContaining({
          duration: 3000,
          icon: "✕",
        })
      );
    });

    it("should call toast.warning for warning type", () => {
      showNotification("Warning message", "warning");
      expect(toast.warning).toHaveBeenCalledWith(
        "Warning message",
        expect.objectContaining({
          duration: 3000,
          icon: "⚠",
        })
      );
    });

    it("should call toast function for info type", () => {
      showNotification("Info message", "info");
      expect(toast).toHaveBeenCalledWith(
        "Info message",
        expect.objectContaining({
          duration: 3000,
          icon: "ℹ",
        })
      );
    });

    it("should use custom duration when provided", () => {
      showNotification("Message", "success", { duration: 5000 });
      expect(toast.success).toHaveBeenCalledWith(
        "Message",
        expect.objectContaining({
          duration: 5000,
        })
      );
    });

    it("should default to info type when not specified", () => {
      showNotification("Default message");
      expect(toast).toHaveBeenCalledWith(
        "Default message",
        expect.objectContaining({
          icon: "ℹ",
        })
      );
    });

    it("should include blueprint theme styling in all notifications", () => {
      showNotification("Styled message", "success");
      const callArgs = (toast.success as any).mock.calls[0][1];
      expect(callArgs.style).toMatchObject({
        background: "var(--bp-panel)",
        border: "1px solid var(--bp-grid-major)",
        color: "var(--bp-green)",
        fontFamily: "'Space Mono', monospace",
        fontSize: "12px",
      });
    });
  });

  describe("Convenience functions", () => {
    it("notifySuccess should call toast.success", () => {
      notifySuccess("Success!");
      expect(toast.success).toHaveBeenCalledWith(
        "Success!",
        expect.any(Object)
      );
    });

    it("notifyError should call toast.error", () => {
      notifyError("Error!");
      expect(toast.error).toHaveBeenCalledWith(
        "Error!",
        expect.any(Object)
      );
    });

    it("notifyWarning should call toast.warning", () => {
      notifyWarning("Warning!");
      expect(toast.warning).toHaveBeenCalledWith(
        "Warning!",
        expect.any(Object)
      );
    });

    it("notifyInfo should call toast function", () => {
      notifyInfo("Info!");
      expect(toast).toHaveBeenCalledWith(
        "Info!",
        expect.any(Object)
      );
    });

    it("notifyLoading should call toast.loading", () => {
      notifyLoading("Loading...");
      expect(toast.loading).toHaveBeenCalledWith(
        "Loading...",
        expect.objectContaining({
          style: expect.any(Object),
        })
      );
    });

    it("notifyLoading should not auto-dismiss", () => {
      notifyLoading("Loading...");
      const callArgs = (toast.loading as any).mock.calls[0][1];
      // Loading notifications don't have a duration property
      expect(callArgs.duration).toBeUndefined();
    });
  });

  describe("Dismiss functions", () => {
    it("dismissNotification should call toast.dismiss with string id", () => {
      dismissNotification("notification-1");
      expect(toast.dismiss).toHaveBeenCalledWith("notification-1");
    });

    it("dismissNotification should call toast.dismiss with numeric id", () => {
      dismissNotification(123);
      expect(toast.dismiss).toHaveBeenCalledWith(123);
    });

    it("dismissAllNotifications should call toast.dismiss without arguments", () => {
      dismissAllNotifications();
      expect(toast.dismiss).toHaveBeenCalledWith();
    });
  });

  describe("Color theming", () => {
    it("success notification should use green color", () => {
      showNotification("Success", "success");
      const callArgs = (toast.success as any).mock.calls[0][1];
      expect(callArgs.style.color).toBe("var(--bp-green)");
      expect(callArgs.style.borderColor).toBe("var(--bp-green)");
    });

    it("error notification should use red color", () => {
      showNotification("Error", "error");
      const callArgs = (toast.error as any).mock.calls[0][1];
      expect(callArgs.style.color).toBe("#ef4444");
      expect(callArgs.style.borderColor).toBe("#ef4444");
    });

    it("warning notification should use yellow color", () => {
      showNotification("Warning", "warning");
      const callArgs = (toast.warning as any).mock.calls[0][1];
      expect(callArgs.style.color).toBe("var(--bp-yellow)");
      expect(callArgs.style.borderColor).toBe("var(--bp-yellow)");
    });

    it("info notification should use cyan color", () => {
      showNotification("Info", "info");
      const callArgs = (toast as any).mock.calls[0][1];
      expect(callArgs.style.color).toBe("var(--bp-cyan)");
      expect(callArgs.style.borderColor).toBe("var(--bp-cyan)");
    });
  });
});
