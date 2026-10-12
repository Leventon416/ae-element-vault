import React from 'react';
import { CheckCircle2, Layers } from 'lucide-react';
import { AEPingData } from '../../lib/cepBridge';

interface StatusBarProps {
  isAE: boolean;
  totalActiveItems: number;
  storagePath: string;
  pingData: AEPingData | null;
  pingError: string | null;
  lastPingTime: string | null;
  version?: string;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  isAE,
  totalActiveItems,
  storagePath,
  pingData,
  pingError,
  lastPingTime,
  version = '1.0.0',
}) => {
  return (
    <footer
      id="panel-status-bar"
      className="h-6 border-t border-[#333333] bg-[#141414] px-3 flex items-center justify-between text-[10px] text-[#8e8e8e] font-mono flex-shrink-0 select-none"
    >
      {/* Left side: Host and Extension identity */}
      <div className="flex items-center gap-2 truncate">
        <span className="flex items-center gap-1 text-[#b3b3b3]">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isAE ? 'bg-emerald-400' : 'bg-amber-400'
            }`}
          />
          <span>{isAE ? 'After Effects Host' : 'Browser Simulation'}</span>
        </span>

        {pingData?.version && (
          <>
            <span className="text-[#4a4a4a]">|</span>
            <span className="text-blue-400">Ae v{pingData.version}</span>
          </>
        )}

        {pingData?.projectName && (
          <>
            <span className="text-[#4a4a4a]">|</span>
            <span className="text-[#e1e1e1] truncate max-w-[150px]" title={pingData.projectName}>
              {pingData.projectName}
            </span>
          </>
        )}

        {pingError && (
          <>
            <span className="text-[#4a4a4a]">|</span>
            <span className="text-rose-400 truncate max-w-[150px]" title={pingError}>
              Offline
            </span>
          </>
        )}

        {lastPingTime && (
          <>
            <span className="text-[#4a4a4a]">|</span>
            <span className="text-[#6e6e6e] text-[9px]">{lastPingTime}</span>
          </>
        )}
      </div>

      {/* Center / Right side: Active item count & Storage status */}
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1">
          <Layers className="w-3 h-3 text-[#6e6e6e]" />
          <span id="status-bar-item-count" className="text-[#b3b3b3]">
            {totalActiveItems} element{totalActiveItems !== 1 ? 's' : ''}
          </span>
        </span>

        <span className="text-[#4a4a4a]">|</span>

        <span
          className="flex items-center gap-1 text-emerald-400 truncate max-w-[200px]"
          title={storagePath}
        >
          <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
          <span>Storage OK</span>
        </span>

        <span className="text-[#4a4a4a]">|</span>

        <span className="text-[#6e6e6e]">v{version}</span>
      </div>
    </footer>
  );
};
