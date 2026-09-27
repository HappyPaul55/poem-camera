type Callback = () => void | Promise<void>;

export default class CallbackQueue {
  private _queue: Callback[]; // Callbacks to run, in order.
  private _working: boolean; // Whether the queue is currently being processed.

  constructor() {
    this._queue = [];
    this._working = false;
  }

  add(callback: Callback): void {
    const run = async (): Promise<void> => {
      if (!this._queue.length) {
        this._working = false;
        return;
      }

      this._working = true;

      const nextCallback = this._queue.shift();
      if (nextCallback) {
        await nextCallback();
      }

      void run();
    };

    this._queue.push(callback);

    if (!this._working) {
      void run();
    }
  }

  sleep(ms: number): void {
    this.add(() => new Promise<void>((resolve) => setTimeout(resolve, ms)));
  }
}
