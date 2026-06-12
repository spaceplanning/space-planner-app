// ============================================================
// SPACE PLANNER STUDIO — Keyboard Shortcuts
// Blueprint Dark Theme: quick access to furniture and actions
// ============================================================

export type ShortcutHandler = () => void;

export interface ShortcutBinding {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  handler: ShortcutHandler;
  description: string;
}

export class KeyboardShortcutManager {
  private bindings: ShortcutBinding[] = [];
  private isEnabled: boolean = true;

  constructor() {
    this.setupEventListener();
  }

  /**
   * Register a keyboard shortcut
   */
  register(
    key: string,
    handler: ShortcutHandler,
    description: string,
    options?: { ctrlKey?: boolean; shiftKey?: boolean; altKey?: boolean }
  ): void {
    this.bindings.push({
      key: key.toLowerCase(),
      ctrlKey: options?.ctrlKey || false,
      shiftKey: options?.shiftKey || false,
      altKey: options?.altKey || false,
      handler,
      description,
    });
  }

  /**
   * Unregister a keyboard shortcut
   */
  unregister(key: string): void {
    this.bindings = this.bindings.filter((b) => b.key !== key.toLowerCase());
  }

  /**
   * Enable/disable shortcuts
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Get all registered shortcuts
   */
  getBindings(): ShortcutBinding[] {
    return this.bindings;
  }

  /**
   * Setup global keyboard event listener
   */
  private setupEventListener(): void {
    document.addEventListener("keydown", (e) => {
      if (!this.isEnabled) return;

      // Don't trigger shortcuts when typing in input fields
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const key = e.key.toLowerCase();

      for (const binding of this.bindings) {
        if (
          binding.key === key &&
          binding.ctrlKey === e.ctrlKey &&
          binding.shiftKey === e.shiftKey &&
          binding.altKey === e.altKey
        ) {
          e.preventDefault();
          binding.handler();
          break;
        }
      }
    });
  }

  /**
   * Format shortcut for display
   */
  static formatShortcut(binding: ShortcutBinding): string {
    const parts: string[] = [];
    if (binding.ctrlKey) parts.push("Ctrl");
    if (binding.shiftKey) parts.push("Shift");
    if (binding.altKey) parts.push("Alt");
    parts.push(binding.key.toUpperCase());
    return parts.join("+");
  }
}
