class StateManager {
  private _state: Record<string, unknown> = {
    user:     null,
    profile:  null,
    isOnline: navigator.onLine,
  };

  private _watchers: Record<string, Array<(v: unknown) => void>> = {};

  get<T>(key: string): T | null {
    return this._state[key] as T | null;
  }

  set(key: string, value: unknown) {
    this._state[key] = value;
    this._watchers[key]?.forEach(fn => fn(value));
  }

  watch(key: string, fn: (value: unknown) => void): () => void {
    if (!this._watchers[key]) this._watchers[key] = [];
    this._watchers[key].push(fn);
    return () => {
      this._watchers[key] = this._watchers[key].filter(f => f !== fn);
    };
  }
}

export const state = new StateManager();

// Online/offline takibi
window.addEventListener('online',  () => state.set('isOnline', true));
window.addEventListener('offline', () => state.set('isOnline', false));
