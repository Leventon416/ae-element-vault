/**
 * TypeScript Definitions for Adobe CEP (Common Extensibility Platform)
 * and CSInterface API
 */

export interface RGBColor {
  red: number;
  green: number;
  blue: number;
  alpha: number;
}

export interface AppSkinInfo {
  baseFontFamily: string;
  baseFontSize: number;
  appBarBackgroundColor: { color: RGBColor };
  panelBackgroundColor: { color: RGBColor };
  systemHighlightColor: { color: RGBColor };
}

export interface HostEnvironment {
  appName: string;
  appVersion: string;
  appLocale: string;
  appUILocale: string;
  appId: string;
  isAppOnline: boolean;
  appSkinInfo: AppSkinInfo;
}

export interface EvalScriptCallback {
  (result: string): void;
}

export interface CSEvent {
  type: string;
  scope: string;
  appId: string;
  extensionId: string;
  data: string;
}

export declare class CSInterface {
  constructor();
  hostEnvironment: HostEnvironment | null;
  getHostEnvironment(): HostEnvironment;
  closeExtension(): void;
  getSystemPath(pathType: string): string;
  evalScript(script: string, callback?: EvalScriptCallback): void;
  getApplicationID(): string;
  addEventListener(type: string, listener: (event: any) => void, obj?: any): void;
  removeEventListener(type: string, listener: (event: any) => void, obj?: any): void;
  dispatchEvent(event: CSEvent | CustomEvent): void;
  openURLInDefaultBrowser(url: string): void;
  resizeContent(width: number, height: number): void;
  registerKeyEventsInterest(keyEventsInterest: string): void;
  setWindowTitle(title: string): void;
  getWindowTitle(): string;
}

declare global {
  interface Window {
    CSInterface: typeof CSInterface;
    __adobe_cep__?: {
      getHostEnvironment(): string;
      closeExtension(): void;
      getSystemPath(pathType: string): string;
      evalScript(script: string, callback?: (res: string) => void): void;
      addEventListener(type: string, listener: (event: any) => void, obj?: any): void;
      removeEventListener(type: string, listener: (event: any) => void, obj?: any): void;
      dispatchEvent(event: string): void;
      resizeContent(width: number, height: number): void;
      registerKeyEventsInterest(keyEventsInterest: string): void;
      invokeSync(api: string, param: string): string;
    };
    cep?: {
      util?: {
        openURLInDefaultBrowser(url: string): void;
      };
      fs?: any;
      process?: any;
    };
    // Node.js globals in CEP when --enable-nodejs is configured
    require?: NodeRequire;
    process?: NodeJS.Process;
  }
}
