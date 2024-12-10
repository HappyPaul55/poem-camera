export default class EventEmitter<T extends Record<string, any[]>> {
  private _events: Partial<{ [K in keyof T]: Array<(...args: T[K]) => void> }>;

  constructor() {
    this._events = {};
  }

  on<K extends keyof T>(event: K, listener: (...args: T[K]) => void): void {
    if (!this._events[event]) {
      this._events[event] = [];
    }
    this._events[event]!.push(listener);
  }

  emit<K extends keyof T>(event: K, ...args: T[K]): void {
    const listeners = this._events[event] ?? [];
    listeners.forEach(listener => {
      setTimeout(() => listener(...args), 0);
    });
  }
}