export interface IFFMPEG {
  add(base64: string): void;
  getVideo(progressCallback: Function): Promise<Blob>;
}
