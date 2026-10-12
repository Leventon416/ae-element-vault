import React, { useState, useRef, useEffect } from 'react';
import {
  Layers,
  HardDrive,
  Database,
  ExternalLink,
  RefreshCw,
  Zap,
  FolderPlus,
  PlusCircle,
  CheckCircle2,
  Film,
  Package,
  UploadCloud,
} from 'lucide-react';
import { csBridge } from '../../utils/csinterface';

export type ViewMode = 'catalog' | 'dissector';

interface HeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  itemCount: number;
  storagePath: string;
  isAE: boolean;
  onImportAep?: (file: File) => void;
  onRefreshComp?: () => void;
  isRefreshing?: boolean;
  onTestAE?: () => void;
  isPinging?: boolean;
  onInitLibrary?: () => void;
  onAddMockItem?: () => void;
  isStorageLoading?: boolean;
  storageStatusMsg?: string | null;
  version?: string;
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  onViewModeChange,
  itemCount,
  storagePath,
  isAE,
  onImportAep,
  onRefreshComp,
  isRefreshing = false,
  onTestAE,
  isPinging = false,
  onInitLibrary,
  onAddMockItem,
  isStorageLoading = false,
  storageStatusMsg,
  version = '1.0.0',
}) => {
  const [showStoragePopover, setShowStoragePopover] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const headerFileInputRef = useRef<HTMLInputElement>(null);

  const handleHeaderFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (onImportAep) {
        onImportAep(file);
      }
      e.target.value = '';
    }
  };

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowStoragePopover(false);
      }
    };
    if (showStoragePopover) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showStoragePopover]);

  return (
    <header className="border-b border-[#333333] bg-[#1e1e1e] select-none sticky top-0 z-30">
      {/* Top Bar: Brand, View Mode Switcher, Storage Pill, AE Host Connection */}
      <div className="flex items-center justify-between px-3 py-2">
        {/* Brand Logo & Ae Tag */}
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-[#1473E6] via-[#5c5cff] to-[#8a3ffc] flex items-center justify-center shadow-md shadow-blue-950/40 ring-1 ring-blue-400/30">
            <Layers className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-[12px] font-bold tracking-wider text-[#e1e1e1] uppercase flex items-center gap-1">
                Element Vault
              </h1>
              <span className="text-[8px] px-1 py-0.2 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono font-medium">
                Ae 2026
              </span>
            </div>
            <p className="text-[9px] text-[#8e8e8e] font-medium leading-none">
              Motion Graphics & Preset Engine
            </p>
          </div>
        </div>

        {/* View Mode Switcher Pills: Library Catalog vs Project Dissector */}
        <div className="flex items-center p-0.5 rounded-full bg-[#141414] border border-[#2e2e2e]">
          <button
            id="view-mode-catalog"
            onClick={() => onViewModeChange('catalog')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all ${
              viewMode === 'catalog'
                ? 'bg-[#1473E6] text-white shadow-sm shadow-blue-900/50'
                : 'text-[#909090] hover:text-[#e1e1e1]'
            }`}
            title="Browse, search, and customize saved motion elements"
          >
            <Package className="w-3 h-3" />
            <span>Library Catalog</span>
            <span
              id="catalog-pill-count"
              className={`ml-0.5 text-[8px] px-1 py-0.2 rounded-full font-mono ${
                viewMode === 'catalog' ? 'bg-black/30 text-white' : 'bg-[#252525] text-[#8e8e8e]'
              }`}
            >
              {itemCount}
            </span>
          </button>

          <button
            id="view-mode-dissector"
            onClick={() => onViewModeChange('dissector')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all ${
              viewMode === 'dissector'
                ? 'bg-[#1473E6] text-white shadow-sm shadow-blue-900/50'
                : 'text-[#909090] hover:text-[#e1e1e1]'
            }`}
            title="Scan, dissect, isolate dependencies, and export compositions"
          >
            <Film className="w-3 h-3" />
            <span>Project Dissector</span>
          </button>
        </div>

        {/* Storage Status Pill & Runtime Status Indicators */}
        <div className="flex items-center gap-2">
          {/* Hidden File Input for Header Import */}
          <input
            ref={headerFileInputRef}
            id="header-aep-file-input"
            type="file"
            accept=".aep"
            onChange={handleHeaderFileChange}
            className="hidden"
          />

          {/* Import .AEP Button */}
          {onImportAep && (
            <button
              id="import-aep-btn"
              onClick={() => headerFileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1473E6]/15 hover:bg-[#1473E6]/25 border border-[#1473E6]/30 hover:border-[#1473E6]/60 text-blue-400 hover:text-blue-300 text-[10px] font-semibold transition-all shadow-sm"
              title="Import & dissect any external .aep file"
            >
              <UploadCloud className="w-3 h-3" />
              <span>Import .AEP</span>
            </button>
          )}

          {/* Storage Status Pill with Popover */}
          <div className="relative" ref={popoverRef}>
            <button
              id="storage-status-pill"
              onClick={() => setShowStoragePopover((prev) => !prev)}
              className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#252525] hover:bg-[#2e2e2e] border border-[#333333] text-[10px] font-mono text-[#b3b3b3] hover:text-white transition-colors"
              title="Click to view Library Storage Path & Database configuration"
            >
              <Database className="w-3 h-3 text-emerald-400" />
              <span id="stored-items-count-badge" className="text-[#e1e1e1] font-semibold">
                {itemCount} Elements
              </span>
            </button>

            {/* Storage Path & Tools Popover */}
            <div
              id="storage-path-popover"
              className={`absolute right-0 mt-1.5 w-72 p-2.5 rounded-lg bg-[#1a1a1a] border border-[#333333] shadow-xl shadow-black/60 z-50 text-[10px] font-mono space-y-2 animate-in fade-in duration-100 ${
                showStoragePopover ? 'block' : 'hidden'
              }`}
            >
                <div className="flex items-center justify-between border-b border-[#2e2e2e] pb-1.5 text-neutral-300">
                  <div className="flex items-center gap-1 font-semibold text-white">
                    <HardDrive className="w-3.5 h-3.5 text-blue-400" />
                    <span>Library Storage Vault</span>
                  </div>
                  <span className="text-[9px] text-[#8e8e8e]">v{version}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] text-[#8e8e8e] block uppercase tracking-wider">
                    Disk Location
                  </span>
                  <div
                    id="library-storage-path"
                    className="p-1.5 rounded bg-[#141414] border border-[#2a2a2a] text-[#b3b3b3] text-[9px] break-all select-text"
                    title={storagePath}
                  >
                    {storagePath || 'Resolving local library directory...'}
                  </div>
                </div>

                {storageStatusMsg && (
                  <div className="p-1.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{storageStatusMsg}</span>
                  </div>
                )}

                <div className="flex items-center gap-1.5 pt-1 border-t border-[#2a2a2a]">
                  {onInitLibrary && (
                    <button
                      id="init-library-btn"
                      onClick={() => {
                        onInitLibrary();
                      }}
                      disabled={isStorageLoading}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded bg-[#252525] hover:bg-[#303030] text-neutral-200 text-[9px] font-medium border border-[#383838] transition-colors"
                      title="Initialize folder tree on disk"
                    >
                      <FolderPlus className="w-3 h-3 text-blue-400" />
                      <span>Init Folder</span>
                    </button>
                  )}

                  {onAddMockItem && (
                    <button
                      id="add-mock-item-btn"
                      onClick={() => {
                        onAddMockItem();
                      }}
                      disabled={isStorageLoading}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded bg-[#1473E6] hover:bg-[#0d66d0] text-white text-[9px] font-medium transition-colors shadow-sm"
                      title="Add a sample lower third element to test JSON persistence"
                    >
                      <PlusCircle className="w-3 h-3" />
                      <span>Add Mock Item</span>
                    </button>
                  )}
                </div>
              </div>
          </div>

          {/* Test AE Connection Button */}
          {onTestAE && (
            <button
              id="test-ae-connection-btn"
              onClick={onTestAE}
              disabled={isPinging}
              className="flex items-center gap-1 px-2 py-1 rounded bg-[#252525] hover:bg-[#2e2e2e] active:bg-[#333333] border border-[#333333] text-[#b3b3b3] hover:text-white text-[10px] font-medium transition-colors"
              title="Test ExtendScript Bridge Communication"
            >
              <Zap className={`w-3 h-3 ${isPinging ? 'text-amber-400 animate-spin' : 'text-blue-400'}`} />
              <span>{isPinging ? 'Pinging...' : 'Ping AE'}</span>
            </button>
          )}

          {/* Host Runtime Mode Badge */}
          <div
            title={isAE ? 'Connected to Adobe After Effects Host' : 'Running in Vite Browser Simulation'}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-medium border ${
              isAE
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isAE ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span>{isAE ? 'AE' : 'Browser'}</span>
          </div>

          {/* Refresh Comp Button */}
          {onRefreshComp && (
            <button
              onClick={onRefreshComp}
              disabled={isRefreshing}
              title="Refresh active composition info"
              className="p-1 rounded bg-[#252525] hover:bg-[#2e2e2e] text-[#909090] hover:text-white transition-colors disabled:opacity-50 border border-[#333333]"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
            </button>
          )}

          {/* CEF Remote Debugger Link */}
          <button
            onClick={() => csBridge.openBrowser('http://localhost:8088')}
            title="Open Chromium CEF Remote Debugger (Port 8088)"
            className="p-1 rounded bg-[#252525] hover:bg-[#2e2e2e] text-[#909090] hover:text-white transition-colors border border-[#333333]"
          >
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>
    </header>
  );
};
