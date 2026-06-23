// public/ts/core/StateManager.ts
var StateManager = class {
  constructor() {
    this._state = {
      user: null,
      profile: null,
      isOnline: navigator.onLine
    };
    this._watchers = {};
  }
  get(key) {
    return this._state[key];
  }
  set(key, value) {
    this._state[key] = value;
    this._watchers[key]?.forEach((fn) => fn(value));
  }
  watch(key, fn) {
    if (!this._watchers[key]) this._watchers[key] = [];
    this._watchers[key].push(fn);
    return () => {
      this._watchers[key] = this._watchers[key].filter((f) => f !== fn);
    };
  }
};
var state = new StateManager();
window.addEventListener("online", () => state.set("isOnline", true));
window.addEventListener("offline", () => state.set("isOnline", false));

export {
  state
};
//# sourceMappingURL=chunk-BSM6WVR6.js.map
