class EventBus {
  private _listeners: Record<string, Array<(data: unknown) => void>> = {};

  on(event: string, fn: (data: unknown) => void): () => void {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(fn);
    return () => this.off(event, fn);
  }

  off(event: string, fn: (data: unknown) => void) {
    this._listeners[event] = this._listeners[event]?.filter(f => f !== fn);
  }

  emit(event: string, data?: unknown) {
    this._listeners[event]?.forEach(fn => fn(data));
  }
}

export const bus = new EventBus();
