import { CSInterface, HostEnvironment } from '../types/cep';
import { evalScript, isCEP, getCSInterface, openURLInDefaultBrowser } from '../lib/cepBridge';

export interface ActiveCompInfo {
  status: 'success' | 'empty' | 'error';
  message?: string;
  id?: number;
  name?: string;
  width?: number;
  height?: number;
  pixelAspect?: number;
  frameRate?: number;
  duration?: number;
  time?: number;
  numLayers?: number;
  selectedLayersCount?: number;
  selectedLayers?: string[];
  [key: string]: any;
}

export interface ExtendScriptResponse {
  status?: string;
  success?: boolean;
  message?: string;
  [key: string]: any;
}

class CSInterfaceBridge {
  public get cs(): CSInterface {
    return getCSInterface();
  }

  public get isAE(): boolean {
    return isCEP();
  }

  public getHostEnvironment(): HostEnvironment | null {
    return this.cs.getHostEnvironment();
  }

  public evalScript(script: string): Promise<string> {
    return new Promise((resolve) => {
      this.cs.evalScript(script, (result: string) => {
        resolve(result);
      });
    });
  }

  public async evalScriptJSON<T = ExtendScriptResponse>(script: string): Promise<T> {
    try {
      const res = await evalScript<T>(script);
      return res;
    } catch (err: any) {
      return {
        status: 'error',
        success: false,
        message: err.message || String(err),
      } as unknown as T;
    }
  }

  public async getActiveComp(): Promise<ActiveCompInfo> {
    try {
      const data = await evalScript<any>('ElementVault.getActiveComp()');
      return {
        status: 'success',
        ...data,
      };
    } catch (e: any) {
      return {
        status: 'empty',
        message: e.message || 'No active composition found in After Effects.',
      };
    }
  }

  public async pingHost(): Promise<any> {
    return evalScript('ElementVault.ping()');
  }

  public async createAdjustmentLayer(name?: string): Promise<ExtendScriptResponse> {
    const safeName = (name || 'Vault Adjustment Layer').replace(/"/g, '\\"');
    try {
      const data = await evalScript(`ElementVault.createAdjustmentLayer("${safeName}")`);
      return { status: 'success', success: true, ...data };
    } catch (e: any) {
      return { status: 'error', success: false, message: e.message };
    }
  }

  public async createNullController(name?: string): Promise<ExtendScriptResponse> {
    const safeName = (name || 'Vault_Null_Rig').replace(/"/g, '\\"');
    try {
      const data = await evalScript(`ElementVault.createNullController("${safeName}")`);
      return { status: 'success', success: true, ...data };
    } catch (e: any) {
      return { status: 'error', success: false, message: e.message };
    }
  }

  public async addTextLayer(text?: string): Promise<ExtendScriptResponse> {
    const safeText = (text || 'ELEMENT VAULT').replace(/"/g, '\\"');
    try {
      const data = await evalScript(`ElementVault.addTextLayer("${safeText}")`);
      return { status: 'success', success: true, ...data };
    } catch (e: any) {
      return { status: 'error', success: false, message: e.message };
    }
  }

  public async applyElement(id: string, name: string): Promise<ExtendScriptResponse> {
    const safeId = id.replace(/"/g, '\\"');
    const safeName = name.replace(/"/g, '\\"');
    try {
      const data = await evalScript(`ElementVault.applyElement("${safeId}", "${safeName}")`);
      return { status: 'success', success: true, ...data };
    } catch (e: any) {
      return { status: 'error', success: false, message: e.message };
    }
  }

  public async centerAnchorPoint(): Promise<ExtendScriptResponse> {
    try {
      const data = await evalScript('ElementVault.centerAnchorPoint()');
      return { status: 'success', success: true, ...data };
    } catch (e: any) {
      return { status: 'error', success: false, message: e.message };
    }
  }

  public openBrowser(url: string) {
    openURLInDefaultBrowser(url);
  }
}

export const csBridge = new CSInterfaceBridge();
