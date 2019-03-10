/**
 * Created by Nikolay Glushchenko (nick@nickalie.com) on 13.05.2017.
 */

class Timer {
  private _timerStarted = 0;
  private _ticks = 0;

  constructor(private _callback: any, private _interval: number) {

  }

  public start(): void {
    this._timerStarted = performance.now();
  }

  public destroy(): void {
    this._callback = null;
  }

  public update(): void {
    const now = performance.now();
    const dif = now - this._timerStarted;
    const count = Math.floor(dif / this._interval) - this._ticks;

    if (count === 0) {
      return;
    }

    this._ticks += count;

    for (let i = 0; i < count; i++) {
      if (this._callback == null) {
        break;
      }

      this._callback();
    }
  }
}

export class AccurateTimer {
  static _timers: Map<number, Timer> = new Map();
  static _started = false;

  static setTimeout(callback: any, timeout: number): number {
    const id: number = AccurateTimer.setInterval(() => {
      AccurateTimer.clearInterval(id);
      callback();
    }, timeout);

    return id;
  }

  static setInterval(callback: any, timeout: number): number {
    const id = Math.round(Math.random() * 1000000000);
    const timer = new Timer(callback, timeout);
    timer.start();
    AccurateTimer._timers.set(id, timer);

    if (AccurateTimer._timers.size === 1) {
      AccurateTimer.start();
    }

    return id;
  }

  static clearInterval(id: number): void {
    const timer: Timer = AccurateTimer._timers.get(id);

    if (timer == null) {
      return;
    }

    timer.destroy();
    AccurateTimer._timers.delete(id);

    if (AccurateTimer._timers.size === 0) {
      AccurateTimer.stop();
    }
  }

  static clearTimeout(id: number): void {
    AccurateTimer.clearInterval(id);
  }

  static promise(timeout: number): Promise<void> {
    return new Promise<void>(resolve => AccurateTimer.setTimeout(resolve, timeout));
  }

  private static start(): void {
    if (this._started) {
      return;
    }

    this._started = true;
    requestAnimationFrame(AccurateTimer.step.bind(AccurateTimer));
  }

  private static stop(): void {
    this._started = false;
  }

  private static step(): void {
    if (!this._started) {
      return;
    }

    AccurateTimer._timers.forEach(timer => timer.update());
    requestAnimationFrame(AccurateTimer.step.bind(AccurateTimer));
  }
}
