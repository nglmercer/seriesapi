type Listener = (...args: any[]) => void;

class EventEmitter<T extends Record<string, any>> {
  private events: Map<keyof T, Listener[]> = new Map();

  /**
   * Register a listener for a specific event.
   */
  public on<K extends keyof T>(event: K, listener: (data: T[K]) => void): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(listener);
    
    // Return unsubscribe function
    return () => {
      this.off(event, listener);
    };
  }

  /**
   * Register a listener that runs only once.
   */
  public once<K extends keyof T>(event: K, listener: (data: T[K]) => void): void {
    const wrapper = (data: T[K]) => {
      listener(data);
      this.off(event, wrapper);
    };
    this.on(event, wrapper);
  }

  /**
   * Trigger all listeners associated with an event.
   */
  public emit<K extends keyof T>(event: K, data: T[K]): void {
    const listeners = this.events.get(event);
    if (listeners) {
      // Slice to avoid issues if a listener removes itself during execution
      listeners.slice().forEach((listener) => listener(data));
    }
  }

  /**
   * Remove a specific listener from an event.
   */
  public off<K extends keyof T>(event: K, listener: (data: T[K]) => void): void {
    const listeners = this.events.get(event);
    if (listeners) {
      this.events.set(
        event,
        listeners.filter((l) => l !== listener)
      );
    }
  }

  /**
   * Remove all listeners for a specific event or all events entirely.
   */
  public removeAllListeners(event?: keyof T): void {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }

  /**
   * Get the count of listeners for a specific event.
   */
  public listenerCount(event: keyof T): number {
    return this.events.get(event)?.length || 0;
  }
}
export const eventBus = new EventEmitter();
