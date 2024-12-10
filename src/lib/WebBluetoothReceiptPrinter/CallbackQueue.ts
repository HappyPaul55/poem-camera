type Callback = () => void | Promise<void>;

export default class CallbackQueue {
  private _queue: Callback[]; // The queue holds callbacks that return promises
  private _working: boolean; // Indicates if the queue is currently being processed

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

      run();
    };

    this._queue.push(callback);

    if (!this._working) {
      run();
    }
  }

  sleep(ms: number): void {
    this.add(() => new Promise<void>(resolve => setTimeout(resolve, ms)));
  }
}