import React from 'react';
import { Layers, RefreshCw, Terminal, ExternalLink, Cpu } from 'lucide-react';
import { csBridge } from '../utils/csinterface';

interface HeaderProps {
  isAE: boolean;
  onRefreshComp: () => void;
  isRefreshing: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  nodeAvailable: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  isAE,
  onRefreshComp,
  isRefreshing,
  activeTab,
  setActiveTab,
  nodeAvailable
}) => {
  return (
    <header className="border-b border-[#333338] bg-[#222226] select-none sticky top-0 z-20">
      {/* Top Branding Bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 flex items-center justify-center shadow-lg shadow-blue-900/30 ring-1 ring-blue-400/30">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-xs font-bold tracking-wider text-neutral-100 flex items-center gap-1.5 uppercase">
              Element Vault
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono font-medium">
                CEP 9-11
              </span>
            </h1>
            <p className="text-[10px] text-neutral-400 font-medium">
              After Effects 16.0 – 25.x
            </p>
          </div>
        </div>

        {/* Runtime Status Indicators */}
        <div className="flex items-center gap-1.5">
          <div
            title={isAE ? "Connected to Adobe After Effects Host" : "Running in Vite Browser Dev Simulation"}
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono font-medium border ${
              isAE
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "bg-amber-500/10 border-amber-500/20 text-amber-300"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isAE ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
              }`}
            />
            {isAE ? "AE Native" : "Dev Mock"}
          </div>

          <button
            onClick={() => csBridge.openBrowser('http://localhost:8088')}
            title="Open Chromium CEF Remote Debugger (Port 8088)"
            className="p-1.5 rounded bg-[#2c2c32] hover:bg-[#383840] text-neutral-300 hover:text-white transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onRefreshComp}
            disabled={isRefreshing}
            title="Refresh Active Composition Info"
            className="p-1.5 rounded bg-[#2c2c32] hover:bg-[#383840] text-neutral-300 hover:text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="flex px-2 border-t border-[#2e2e34] bg-[#1c1c20] text-xs font-medium">
        <button
          onClick={() => setActiveTab('vault')}
          className={`px-3 py-1.5 transition-all relative ${
            activeTab === 'vault'
              ? 'text-blue-400 font-semibold'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Preset Vault
          {activeTab === 'vault' && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-500 shadow-sm shadow-blue-500" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('comp')}
          className={`px-3 py-1.5 transition-all relative ${
            activeTab === 'comp'
              ? 'text-blue-400 font-semibold'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Active Comp
          {activeTab === 'comp' && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-500 shadow-sm shadow-blue-500" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('script')}
          className={`px-3 py-1.5 transition-all relative flex items-center gap-1 ${
            activeTab === 'script'
              ? 'text-blue-400 font-semibold'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Terminal className="w-3 h-3" />
          ExtendScript
          {activeTab === 'script' && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-500 shadow-sm shadow-blue-500" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('node')}
          className={`px-3 py-1.5 transition-all relative flex items-center gap-1 ${
            activeTab === 'node'
              ? 'text-blue-400 font-semibold'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Cpu className="w-3 h-3" />
          Node.js
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              nodeAvailable ? 'bg-emerald-400' : 'bg-neutral-500'
            }`}
          />
          {activeTab === 'node' && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-500 shadow-sm shadow-blue-500" />
          )}
        </button>
      </nav>
    </header>
  );
};
