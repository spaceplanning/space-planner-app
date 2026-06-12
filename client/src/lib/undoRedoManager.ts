// ============================================================
// SPACE PLANNER STUDIO — Undo/Redo Manager
// Blueprint Dark Theme: history management for floor plans
// ============================================================

export interface HistoryState {
  rooms: any[];
  furniture: any[];
  timestamp: number;
  description: string;
}

export class UndoRedoManager {
  private history: HistoryState[] = [];
  private currentIndex: number = -1;
  private maxHistorySize: number = 50;

  constructor() {
    this.history = [];
    this.currentIndex = -1;
  }

  /**
   * Add a new state to the history
   */
  push(rooms: any[], furniture: any[], description: string = "Action"): void {
    // Remove any states after current index (when user performs new action after undo)
    this.history = this.history.slice(0, this.currentIndex + 1);

    // Add new state
    this.history.push({
      rooms: JSON.parse(JSON.stringify(rooms)),
      furniture: JSON.parse(JSON.stringify(furniture)),
      timestamp: Date.now(),
      description,
    });

    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    } else {
      this.currentIndex++;
    }
  }

  /**
   * Undo to previous state
   */
  undo(): HistoryState | null {
    if (this.canUndo()) {
      this.currentIndex--;
      return this.history[this.currentIndex];
    }
    return null;
  }

  /**
   * Redo to next state
   */
  redo(): HistoryState | null {
    if (this.canRedo()) {
      this.currentIndex++;
      return this.history[this.currentIndex];
    }
    return null;
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.currentIndex > 0;
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  /**
   * Get current state
   */
  getCurrentState(): HistoryState | null {
    if (this.currentIndex >= 0 && this.currentIndex < this.history.length) {
      return this.history[this.currentIndex];
    }
    return null;
  }

  /**
   * Clear history
   */
  clear(): void {
    this.history = [];
    this.currentIndex = -1;
  }

  /**
   * Get history size
   */
  getHistorySize(): number {
    return this.history.length;
  }

  /**
   * Get current index
   */
  getCurrentIndex(): number {
    return this.currentIndex;
  }
}
