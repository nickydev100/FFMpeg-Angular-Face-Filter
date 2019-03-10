export interface IVideoRecorder {
  start(canvas: HTMLCanvasElement): void;
  stop(): Promise<Blob>;
}
