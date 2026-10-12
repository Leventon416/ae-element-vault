import React, { useState } from 'react';
import { Film, Sliders, Type, Crosshair, Plus, CheckCircle2, AlertCircle } from 'lucide-react';
import { ActiveCompInfo, csBridge } from '../utils/csinterface';

interface CompInspectorProps {
  compInfo: ActiveCompInfo | null;
  onRefresh: () => void;
}

export const CompInspector: React.FC<CompInspectorProps> = ({ compInfo, onRefresh }) => {
  const [actionStatus, setActionStatus] = useState<string | null>(null);

  const runQuickAction = async (actionFn: () => Promise<any>, label: string) => {
    setActionStatus(`Executing ${label}...`);
    try {
      const res = await actionFn();
      if (res.status === 'success') {
        setActionStatus(`✓ ${label} applied`);
        onRefresh();
      } else {
        setActionStatus(`Notice: ${res.message || 'Action completed'}`);
      }
    } catch (e: any) {
      setActionStatus(`Error: ${e.message}`);
    }
    setTimeout(() => setActionStatus(null), 3000);
  };

  return (
    <div className="p-3.5 space-y-3.5 overflow-y-auto">
      {/* Active Composition Status Card */}
      <div className="rounded-lg bg-[#25252b] border border-[#36363e] p-3.5 shadow-sm">
        <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-[#32323a]">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-semibold text-neutral-200">Active Composition</span>
          </div>
          {compInfo?.name ? (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
              Ready
            </span>
          ) : (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-700 text-neutral-400 font-medium">
              No Comp
            </span>
          )}
        </div>

        {compInfo?.status === 'success' ? (
          <div className="space-y-2.5">
            <div>
              <p className="text-[11px] text-neutral-400">Composition Name</p>
              <p className="text-sm font-bold text-white truncate font-mono">{compInfo.name}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-[#1c1c20] p-2 rounded border border-[#2f2f35]">
                <p className="text-[10px] text-neutral-400">Resolution</p>
                <p className="font-mono font-medium text-neutral-200">
                  {compInfo.width} × {compInfo.height}
                </p>
              </div>

              <div className="bg-[#1c1c20] p-2 rounded border border-[#2f2f35]">
                <p className="text-[10px] text-neutral-400">Frame Rate</p>
                <p className="font-mono font-medium text-neutral-200">
                  {compInfo.frameRate} fps
                </p>
              </div>

              <div className="bg-[#1c1c20] p-2 rounded border border-[#2f2f35]">
                <p className="text-[10px] text-neutral-400">Duration</p>
                <p className="font-mono font-medium text-neutral-200">
                  {compInfo.duration?.toFixed(2)}s
                </p>
              </div>

              <div className="bg-[#1c1c20] p-2 rounded border border-[#2f2f35]">
                <p className="text-[10px] text-neutral-400">Total Layers</p>
                <p className="font-mono font-medium text-neutral-200">
                  {compInfo.numLayers} layers
                </p>
              </div>
            </div>

            {compInfo.selectedLayers && compInfo.selectedLayers.length > 0 && (
              <div className="bg-[#1c1c20] p-2 rounded border border-[#2f2f35]">
                <p className="text-[10px] text-neutral-400 mb-1">
                  Selected Layers ({compInfo.selectedLayersCount})
                </p>
                <div className="flex flex-wrap gap-1">
                  {compInfo.selectedLayers.map((layerName, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] bg-blue-500/10 text-blue-300 px-1.5 py-0.5 rounded border border-blue-500/20 font-mono truncate max-w-[140px]"
                    >
                      {layerName}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-3 text-center space-y-1.5 bg-[#1e1e22] rounded border border-dashed border-[#3c3c44]">
            <AlertCircle className="w-5 h-5 mx-auto text-amber-400/80" />
            <p className="text-xs text-neutral-300">
              {compInfo?.message || "No composition active in After Effects."}
            </p>
            <p className="text-[10px] text-neutral-500">
              Open or focus a composition timeline, then click Refresh.
            </p>
          </div>
        )}
      </div>

      {/* Quick Composition Actions */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
          Quick Composition Tools
        </h3>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            onClick={() => runQuickAction(() => csBridge.createAdjustmentLayer(), 'Adjustment Layer')}
            className="flex items-center gap-2 p-2.5 rounded-lg bg-[#27272d] hover:bg-[#32323a] border border-[#383842] hover:border-blue-500/50 text-neutral-200 hover:text-white transition-all text-left group"
          >
            <Sliders className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
            <div>
              <p className="font-medium text-xs">Adjustment Layer</p>
              <p className="text-[10px] text-neutral-400">FX stack carrier</p>
            </div>
          </button>

          <button
            onClick={() => runQuickAction(() => csBridge.createNullController(), 'Null Controller')}
            className="flex items-center gap-2 p-2.5 rounded-lg bg-[#27272d] hover:bg-[#32323a] border border-[#383842] hover:border-blue-500/50 text-neutral-200 hover:text-white transition-all text-left group"
          >
            <Plus className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            <div>
              <p className="font-medium text-xs">Null Controller</p>
              <p className="text-[10px] text-neutral-400">Motion master rig</p>
            </div>
          </button>

          <button
            onClick={() => runQuickAction(() => csBridge.addTextLayer('ELEMENT VAULT'), 'Kinetic Text')}
            className="flex items-center gap-2 p-2.5 rounded-lg bg-[#27272d] hover:bg-[#32323a] border border-[#383842] hover:border-blue-500/50 text-neutral-200 hover:text-white transition-all text-left group"
          >
            <Type className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
            <div>
              <p className="font-medium text-xs">Kinetic Title</p>
              <p className="text-[10px] text-neutral-400">Centered styled text</p>
            </div>
          </button>

          <button
            onClick={() => runQuickAction(() => csBridge.centerAnchorPoint(), 'Center Anchor Point')}
            className="flex items-center gap-2 p-2.5 rounded-lg bg-[#27272d] hover:bg-[#32323a] border border-[#383842] hover:border-blue-500/50 text-neutral-200 hover:text-white transition-all text-left group"
          >
            <Crosshair className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
            <div>
              <p className="font-medium text-xs">Center Anchor</p>
              <p className="text-[10px] text-neutral-400">Selected layers</p>
            </div>
          </button>
        </div>

        {actionStatus && (
          <div className="flex items-center gap-1.5 p-2 rounded bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
            <span>{actionStatus}</span>
          </div>
        )}
      </div>
    </div>
  );
};
