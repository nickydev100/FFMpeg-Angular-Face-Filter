export class Deferred {
  public readonly promise: Promise<any>;
  private _resolve: Function;
  private _reject: Function;

  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
    });
  }

  get reject(): Function {
    return this._reject;
  }

  get resolve(): Function {
    return this._resolve;
  }
}
