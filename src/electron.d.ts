export {}

declare global {
  interface Window {
    barakDesktop?: {
      getInfo: () => Promise<{ version: string; dataPath: string }>
    }
  }
}
