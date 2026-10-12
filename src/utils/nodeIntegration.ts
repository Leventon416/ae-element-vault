/**
 * Node.js Integration Helper
 * Utilizes CEP CEF --enable-nodejs runtime capabilities
 */

export interface NodeSystemReport {
  isNodeAvailable: boolean;
  nodeVersion: string;
  platform: string;
  arch: string;
  tempDirectory: string;
  homeDirectory: string;
  hasFsAccess: boolean;
}

export function getNodeSystemReport(): NodeSystemReport {
  if (typeof window !== 'undefined' && typeof window.require === 'function') {
    try {
      const os = window.require('os');
      const fs = window.require('fs');
      const process = window.require('process');

      return {
        isNodeAvailable: true,
        nodeVersion: process.version || 'v20.x (CEF)',
        platform: os.platform() || 'windows',
        arch: os.arch() || 'x64',
        tempDirectory: os.tmpdir() || '',
        homeDirectory: os.homedir() || '',
        hasFsAccess: typeof fs.existsSync === 'function',
      };
    } catch (err) {
      console.warn('Node integration error in CEP:', err);
    }
  }

  // Browser Fallback (Vite Dev Server)
  return {
    isNodeAvailable: false,
    nodeVersion: 'Node available in CEP runtime',
    platform: navigator.platform || 'Win32',
    arch: 'x64 (Browser Dev)',
    tempDirectory: '%TEMP% (when hosted in AE)',
    homeDirectory: '%USERPROFILE%',
    hasFsAccess: false,
  };
}
