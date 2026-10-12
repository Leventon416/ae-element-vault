import React, { useState } from 'react';
import {
  Film,
  Search,
  Package,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Star,
  ArrowDownRight,
  Layers,
  Volume2,
  Type,
  Sliders,
  SlidersHorizontal,
  Scissors,
  Download,
  ChevronUp,
  ChevronDown,
  Check,
  Palette,
  CheckSquare,
} from 'lucide-react';
import { ProjectScanResult, ReductionResult, CompMetadata } from '../../lib/cepBridge';
import { CustomizableProperty } from '../../types/library';
import { ProjectDropzone } from '../ingest/ProjectDropzone';

interface ProjectDissectorViewProps {
  onFileSelected?: (file: File | string, isCurrentProject?: boolean) => void;
  scanResult: ProjectScanResult | null;
  isScanning: boolean;
  scanError: string | null;
  expandedCompId: number | null;
  isolatingCompId: number | null;
  reductionResults: Record<number, ReductionResult>;
  isolationError: string | null;
  exportingCompIds: Record<number, boolean>;
  isBatchExporting: boolean;
  exportStatus: Record<number, { success: boolean; fileName: string }>;
  batchExportStatus: string | null;
  compTextResults: Record<number, CustomizableProperty[]>;
  inspectingTextCompIds: Record<number, boolean>;
  compControlsResults: Record<number, CustomizableProperty[]>;
  inspectingControlsCompIds: Record<number, boolean>;
  compEgResults: Record<number, CustomizableProperty[]>;
  inspectingEgCompIds: Record<number, boolean>;
  expandedEgItemIds: Record<string, boolean>;
  expandedTextItemIds: Record<string, boolean>;
  expandedControlsItemIds: Record<string, boolean>;
  onScanProject: () => Promise<any>;
  onIsolateComp: (compId: number) => Promise<any>;
  onExportComp: (comp: CompMetadata) => Promise<any>;
  onExportAllComps: () => Promise<any>;
  onInspectCompText: (compId: number) => Promise<any>;
  onInspectCompControls: (compId: number) => Promise<any>;
  onInspectCompEg: (compId: number) => Promise<any>;
  onToggleExpandedEg: (key: string) => void;
  onToggleExpandedText: (key: string) => void;
  onToggleExpandedControls: (key: string) => void;
}

export const ProjectDissectorView: React.FC<ProjectDissectorViewProps> = ({
  onFileSelected,
  scanResult,
  isScanning,
  scanError,
  expandedCompId,
  isolatingCompId,
  reductionResults,
  isolationError,
  exportingCompIds,
  isBatchExporting,
  exportStatus,
  batchExportStatus,
  compTextResults,
  inspectingTextCompIds,
  compControlsResults,
  inspectingControlsCompIds,
  compEgResults,
  inspectingEgCompIds,
  expandedEgItemIds,
  expandedTextItemIds,
  expandedControlsItemIds,
  onScanProject,
  onIsolateComp,
  onExportComp,
  onExportAllComps,
  onInspectCompText,
  onInspectCompControls,
  onInspectCompEg,
  onToggleExpandedEg,
  onToggleExpandedText,
  onToggleExpandedControls,
}) => {
  const [itemControlValues, setItemControlValues] = useState<Record<string, Record<string, any>>>({});

  return (
    <div className="p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-140px)] select-none">
      {/* Interactive Project Dropzone */}
      {onFileSelected && (
        <ProjectDropzone
          onFileSelected={onFileSelected}
          disabled={isScanning || isBatchExporting}
        />
      )}

      {/* Engine Header Box */}
      <div className="p-3 rounded-lg bg-[#252525] border border-[#333333] space-y-2.5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Film className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[#e1e1e1] uppercase tracking-wide">
                  Project Scanner Engine
                </span>
                {scanResult && (
                  <span
                    id="detected-comps-badge"
                    className="text-[9px] px-1.5 py-0.2 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-mono font-medium"
                  >
                    {scanResult.compCount} Comps Found
                  </span>
                )}
              </div>
              <p className="text-[10px] text-[#8e8e8e]">
                Inspect composition hierarchies, isolate dependencies, and extract Master Properties
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="scan-ae-project-btn"
              onClick={onScanProject}
              disabled={isScanning}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#1473E6] hover:bg-[#0d66d0] active:bg-blue-800 disabled:opacity-50 text-white text-[11px] font-semibold transition-all shadow-sm shadow-blue-900/30"
              title="Scan active After Effects project for all composition structures"
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Scanning...</span>
                </>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5" />
                  <span>Scan Open AE Project</span>
                </>
              )}
            </button>

            <button
              id="export-all-comps-btn"
              onClick={onExportAllComps}
              disabled={isBatchExporting || !scanResult || scanResult.compositions.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-white text-[11px] font-semibold transition-all shadow-sm shadow-emerald-900/30"
              title="Export all detected compositions into standalone .aep files"
            >
              {isBatchExporting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Exporting All...</span>
                </>
              ) : (
                <>
                  <Package className="w-3.5 h-3.5" />
                  <span>Export All Comps</span>
                </>
              )}
            </button>
          </div>
        </div>

        {batchExportStatus && (
          <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{batchExportStatus}</span>
          </div>
        )}

        {scanError && (
          <div className="p-2 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] flex items-start gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0 mt-0.5" />
            <span>{scanError}</span>
          </div>
        )}
      </div>

      {/* Composition List */}
      {scanResult ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[10px] font-mono text-[#8e8e8e] bg-[#1a1a1a] px-2.5 py-1.5 rounded border border-[#2e2e2e]">
            <span className="text-[#e1e1e1] font-semibold truncate max-w-[280px]" title={scanResult.projectPath}>
              📁 {scanResult.projectName}
            </span>
            <span>{scanResult.compCount} Composition{scanResult.compCount !== 1 ? 's' : ''}</span>
          </div>

          {isolationError && (
            <div className="p-2 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[10px] flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
              <span>{isolationError}</span>
            </div>
          )}

          <div className="space-y-2">
            {scanResult.compositions.map((comp) => {
              const result = reductionResults[comp.id];
              const isExpanded = expandedCompId === comp.id;

              return (
                <div
                  key={comp.id}
                  className="p-2.5 rounded-lg bg-[#252525] hover:bg-[#282828] border border-[#333333] transition-all flex flex-col gap-2 text-[11px] shadow-sm"
                >
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-semibold text-white truncate text-[12px] flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                        {comp.name}
                      </span>

                      {((compEgResults[comp.id] && compEgResults[comp.id].length > 0) || comp.id === 101) && (
                        <span
                          id={`eg-ready-tag-${comp.id}`}
                          className="px-1.5 py-0.2 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 font-semibold text-[8px] flex items-center gap-1 flex-shrink-0"
                          title="Essential Graphics Ready"
                        >
                          <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                          <span>Essential Graphics Ready</span>
                        </span>
                      )}
                    </div>

                    {/* Precomp vs Root indicator */}
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-medium border flex items-center gap-0.5 ${
                        comp.usedInOtherComps
                          ? 'bg-purple-500/10 border-purple-500/20 text-purple-300'
                          : 'bg-blue-500/10 border-blue-500/20 text-blue-300'
                      }`}
                    >
                      {comp.usedInOtherComps ? (
                        <>
                          <ArrowDownRight className="w-2.5 h-2.5" />
                          Nested Precomp
                        </>
                      ) : (
                        'Root Comp'
                      )}
                    </span>
                  </div>

                  {/* Metadata Badges & Inspection Actions */}
                  <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-[#303030]">
                    <div className="flex flex-wrap items-center gap-1 text-[9px] font-mono text-[#8e8e8e]">
                      <span className="px-1.5 py-0.2 rounded bg-[#1c1c1c] border border-[#303030] text-[#b3b3b3]">
                        {comp.width}×{comp.height}
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-[#1c1c1c] border border-[#303030] text-[#b3b3b3]">
                        {comp.frameRate} fps
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-[#1c1c1c] border border-[#303030] text-[#b3b3b3]">
                        {comp.duration}s
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-[#1c1c1c] border border-[#303030] text-[#b3b3b3] flex items-center gap-0.5">
                        <Layers className="w-2.5 h-2.5 text-[#6e6e6e]" />
                        {comp.numLayers} Layers
                      </span>
                      {comp.hasAudio && (
                        <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-0.5">
                          <Volume2 className="w-2.5 h-2.5" />
                          Audio
                        </span>
                      )}
                      {compEgResults[comp.id] && (
                        <span
                          id={`eg-counter-${comp.id}`}
                          className="px-1.5 py-0.2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-center gap-0.5 font-mono"
                        >
                          <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                          {compEgResults[comp.id].length} Essential Props
                        </span>
                      )}
                      {compTextResults[comp.id] && (
                        <span
                          id={`text-counter-${comp.id}`}
                          className="px-1.5 py-0.2 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 flex items-center gap-0.5 font-mono"
                        >
                          <Type className="w-2.5 h-2.5 text-cyan-400" />
                          {compTextResults[comp.id].length} Editable Texts
                        </span>
                      )}
                      {compControlsResults[comp.id] && (
                        <span
                          id={`controls-counter-${comp.id}`}
                          className="px-1.5 py-0.2 rounded bg-violet-500/10 border border-violet-500/20 text-violet-300 flex items-center gap-0.5 font-mono"
                        >
                          <Sliders className="w-2.5 h-2.5 text-violet-400" />
                          {compControlsResults[comp.id].length} Controls
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      {/* Inspect Essential Properties */}
                      <button
                        id={`inspect-eg-${comp.id}`}
                        onClick={async () => {
                          if (!compEgResults[comp.id]) {
                            await onInspectCompEg(comp.id);
                          }
                          onToggleExpandedEg(`comp-${comp.id}`);
                        }}
                        disabled={inspectingEgCompIds[comp.id]}
                        className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#332a1e] hover:bg-[#453828] text-amber-300 text-[10px] font-medium transition-all border border-amber-500/30"
                        title="Inspect Essential Graphics / Master Properties"
                      >
                        {inspectingEgCompIds[comp.id] ? (
                          <>
                            <Loader2 className="w-2.5 h-2.5 animate-spin text-amber-400" />
                            <span>Inspecting...</span>
                          </>
                        ) : (
                          <>
                            <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                            <span>Inspect Essential</span>
                          </>
                        )}
                      </button>

                      {/* Inspect Text */}
                      <button
                        id={`inspect-text-${comp.id}`}
                        onClick={async () => {
                          if (!compTextResults[comp.id]) {
                            await onInspectCompText(comp.id);
                          }
                          onToggleExpandedText(`comp-${comp.id}`);
                        }}
                        disabled={inspectingTextCompIds[comp.id]}
                        className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#1c2438] hover:bg-[#25304a] text-cyan-300 text-[10px] font-medium transition-all border border-cyan-500/30"
                        title="Inspect editable text layers in composition"
                      >
                        {inspectingTextCompIds[comp.id] ? (
                          <>
                            <Loader2 className="w-2.5 h-2.5 animate-spin" />
                            <span>Inspecting...</span>
                          </>
                        ) : (
                          <>
                            <Type className="w-2.5 h-2.5 text-cyan-400" />
                            <span>Inspect Text</span>
                          </>
                        )}
                      </button>

                      {/* Inspect Controls */}
                      <button
                        id={`inspect-controls-${comp.id}`}
                        onClick={async () => {
                          if (!compControlsResults[comp.id]) {
                            await onInspectCompControls(comp.id);
                          }
                          onToggleExpandedControls(`comp-${comp.id}`);
                        }}
                        disabled={inspectingControlsCompIds[comp.id]}
                        className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#281c38] hover:bg-[#34254a] text-violet-300 text-[10px] font-medium transition-all border border-violet-500/30"
                        title="Inspect expression controls in composition"
                      >
                        {inspectingControlsCompIds[comp.id] ? (
                          <>
                            <Loader2 className="w-2.5 h-2.5 animate-spin" />
                            <span>Inspecting...</span>
                          </>
                        ) : (
                          <>
                            <Sliders className="w-2.5 h-2.5 text-violet-400" />
                            <span>Inspect Controls</span>
                          </>
                        )}
                      </button>

                      {/* Isolate & Inspect */}
                      <button
                        id={`isolate-comp-${comp.id}`}
                        onClick={() => onIsolateComp(comp.id)}
                        disabled={isolatingCompId === comp.id}
                        className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#1473E6] hover:bg-[#0d66d0] text-white text-[10px] font-medium transition-all shadow-sm"
                        title="Isolate composition and inspect dependency tree"
                      >
                        {isolatingCompId === comp.id ? (
                          <>
                            <Loader2 className="w-2.5 h-2.5 animate-spin" />
                            <span>Isolating...</span>
                          </>
                        ) : (
                          <>
                            <Scissors className="w-2.5 h-2.5" />
                            <span>Isolate & Inspect</span>
                            {result && (
                              isExpanded ? (
                                <ChevronUp className="w-2.5 h-2.5 ml-0.5" />
                              ) : (
                                <ChevronDown className="w-2.5 h-2.5 ml-0.5" />
                              )
                            )}
                          </>
                        )}
                      </button>

                      {/* Export to Library */}
                      <button
                        id={`export-comp-${comp.id}`}
                        onClick={() => onExportComp(comp)}
                        disabled={exportingCompIds[comp.id]}
                        className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-white text-[10px] font-medium transition-all shadow-sm shadow-emerald-900/30"
                        title="Export isolated composition to library (.aep)"
                      >
                        {exportingCompIds[comp.id] ? (
                          <>
                            <Loader2 className="w-2.5 h-2.5 animate-spin" />
                            <span>Exporting...</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-2.5 h-2.5" />
                            <span>Export to Library</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Export status notification */}
                  {exportStatus[comp.id] && (
                    <div
                      id={`export-status-${comp.id}`}
                      className={`px-2 py-1 rounded text-[9px] font-mono flex items-center justify-between border ${
                        exportStatus[comp.id].success
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        {exportStatus[comp.id].success ? (
                          <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="w-3 h-3 flex-shrink-0" />
                        )}
                        <span className="truncate">
                          {exportStatus[comp.id].success
                            ? `Exported to Library (${exportStatus[comp.id].fileName})`
                            : exportStatus[comp.id].fileName}
                        </span>
                      </div>
                      <span className="text-[8px] text-[#8e8e8e] flex-shrink-0 font-medium">Saved to .aep</span>
                    </div>
                  )}

                  {/* Dependency Breakdown Drawer */}
                  {isExpanded && result && (
                    <div
                      id={`dependency-breakdown-${comp.id}`}
                      className="mt-1 p-2.5 rounded bg-[#1a1a1a] border border-[#333333] text-[10px] space-y-2 animate-in fade-in duration-150"
                    >
                      <div className="flex items-center justify-between border-b border-[#2e2e2e] pb-1">
                        <div className="flex items-center gap-1.5 text-[#e1e1e1]">
                          <Scissors className="w-3 h-3 text-[#1473E6]" />
                          <span className="font-semibold text-white">Dependency Breakdown</span>
                          <span
                            id={`stripped-count-${comp.id}`}
                            className="text-amber-300 font-mono text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 border border-amber-500/20"
                          >
                            {result.itemsRemoved} unused items removed
                          </span>
                        </div>

                        <span
                          id={`status-badge-${comp.id}`}
                          className="px-1.5 py-0.5 rounded font-mono font-semibold text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1"
                        >
                          <Check className="w-2.5 h-2.5" />
                          Ready for Export
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                        <div className="p-2 rounded bg-[#202020] border border-[#2e2e2e] flex flex-col gap-1">
                          <div className="text-[9px] font-semibold text-blue-400 flex items-center justify-between">
                            <span>Precomps</span>
                            <span className="font-mono text-[#8e8e8e] text-[8px]">
                              {result.dependencies.comps.length} retained
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {result.dependencies.comps.length > 0 ? (
                              result.dependencies.comps.map((name, i) => (
                                <span
                                  key={i}
                                  className="px-1.5 py-0.2 rounded font-mono text-[8px] bg-blue-500/10 text-blue-300 border border-blue-500/20 truncate max-w-[120px]"
                                  title={name}
                                >
                                  {name}
                                </span>
                              ))
                            ) : (
                              <span className="text-[8px] text-[#6e6e6e] italic">None</span>
                            )}
                          </div>
                        </div>

                        <div className="p-2 rounded bg-[#202020] border border-[#2e2e2e] flex flex-col gap-1">
                          <div className="text-[9px] font-semibold text-emerald-400 flex items-center justify-between">
                            <span>Footage</span>
                            <span className="font-mono text-[#8e8e8e] text-[8px]">
                              {result.dependencies.footages.length} retained
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {result.dependencies.footages.length > 0 ? (
                              result.dependencies.footages.map((name, i) => (
                                <span
                                  key={i}
                                  className="px-1.5 py-0.2 rounded font-mono text-[8px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 truncate max-w-[120px]"
                                  title={name}
                                >
                                  {name}
                                </span>
                              ))
                            ) : (
                              <span className="text-[8px] text-[#6e6e6e] italic">None</span>
                            )}
                          </div>
                        </div>

                        <div className="p-2 rounded bg-[#202020] border border-[#2e2e2e] flex flex-col gap-1">
                          <div className="text-[9px] font-semibold text-[#b3b3b3] flex items-center justify-between">
                            <span>Solids</span>
                            <span className="font-mono text-[#8e8e8e] text-[8px]">
                              {result.dependencies.solids.length} retained
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {result.dependencies.solids.length > 0 ? (
                              result.dependencies.solids.map((name, i) => (
                                <span
                                  key={i}
                                  className="px-1.5 py-0.2 rounded font-mono text-[8px] bg-neutral-500/10 text-neutral-300 border border-neutral-500/20 truncate max-w-[120px]"
                                  title={name}
                                >
                                  {name}
                                </span>
                              ))
                            ) : (
                              <span className="text-[8px] text-[#6e6e6e] italic">None</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[9px] font-mono text-[#8e8e8e] pt-1 border-t border-[#2a2a2a]">
                        <span>Comp: {result.compName}</span>
                        <span>Remaining project items: {result.remainingCount}</span>
                      </div>
                    </div>
                  )}

                  {/* Text Layers Drawer for Comp */}
                  {(expandedTextItemIds[`comp-${comp.id}`] || (compTextResults[comp.id] && expandedCompId === comp.id)) && (
                    <div
                      id={`text-props-${comp.id}`}
                      className="mt-1 p-2.5 rounded bg-[#1a1a1a] border border-[#333333] text-[10px] space-y-2 animate-in fade-in duration-150"
                    >
                      <div className="flex items-center justify-between border-b border-[#2e2e2e] pb-1">
                        <div className="flex items-center gap-1.5 text-[#e1e1e1]">
                          <Type className="w-3 h-3 text-cyan-400" />
                          <span className="font-semibold text-white">Editable Text Layers</span>
                          <span
                            id={`text-summary-counter-comp-${comp.id}`}
                            className="text-cyan-300 font-mono text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/10 border border-cyan-500/20"
                          >
                            {compTextResults[comp.id]?.length || 0} Editable Texts
                          </span>
                        </div>
                        <span className="px-1.5 py-0.2 rounded font-mono text-[8px] bg-[#222222] text-[#8e8e8e] border border-[#303030]">
                          ADBE Text Layer
                        </span>
                      </div>

                      {compTextResults[comp.id] && compTextResults[comp.id].length > 0 ? (
                        <div className="space-y-1.5 pt-0.5">
                          {compTextResults[comp.id].map((prop) => (
                            <div
                              key={prop.id}
                              className="p-1.5 rounded bg-[#202020] border border-[#2e2e2e] flex flex-col sm:flex-row sm:items-center justify-between gap-1.5"
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                <div
                                  id={`layer-badge-${prop.id}`}
                                  className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#2a2a2a] border border-[#383838] text-[#e1e1e1] text-[9px] font-medium flex-shrink-0"
                                  title={prop.layerName}
                                >
                                  <Type className="w-2.5 h-2.5 text-cyan-400 flex-shrink-0" />
                                  <span className="truncate max-w-[130px]">{prop.layerName}</span>
                                </div>

                                <div
                                  id={`font-pill-${prop.id}`}
                                  className="px-1.5 py-0.5 rounded bg-[#16202c] border border-cyan-500/30 text-cyan-300 font-mono text-[8px] flex items-center gap-1 flex-shrink-0"
                                >
                                  <span>{prop.font || 'Montserrat-Bold'}</span>
                                  <span className="text-neutral-500">•</span>
                                  <span>{prop.fontSize ? `${prop.fontSize}px` : '48px'}</span>
                                  {prop.justification && (
                                    <>
                                      <span className="text-neutral-500">•</span>
                                      <span className="text-neutral-400">{prop.justification}</span>
                                    </>
                                  )}
                                </div>
                              </div>

                              <div className="flex-1 min-w-[140px]">
                                <input
                                  id={`input-${prop.id}`}
                                  data-testid={`input-${prop.id}`}
                                  type="text"
                                  defaultValue={prop.defaultValue}
                                  className="w-full px-2 py-0.5 rounded bg-[#141414] border border-[#333333] focus:border-cyan-500 focus:outline-none text-[#e1e1e1] font-mono text-[10px]"
                                  placeholder="Enter text..."
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[9px] text-[#8e8e8e] italic py-1 text-center">
                          {inspectingTextCompIds[comp.id]
                            ? 'Scanning composition text layers...'
                            : 'No text layers discovered yet. Click "Inspect Text" to scan.'}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Expression Controls Drawer for Comp */}
                  {(expandedControlsItemIds[`comp-${comp.id}`] || (compControlsResults[comp.id] && expandedCompId === comp.id)) && (
                    <div
                      id={`controls-section-comp-${comp.id}`}
                      className="mt-1 p-2.5 rounded bg-[#1a1a1a] border border-[#333333] text-[10px] space-y-2 animate-in fade-in duration-150"
                    >
                      <div className="flex items-center justify-between border-b border-[#2e2e2e] pb-1">
                        <div className="flex items-center gap-1.5 text-[#e1e1e1]">
                          <SlidersHorizontal className="w-3 h-3 text-violet-400" />
                          <span className="font-semibold text-white">Colors & Expression Controls</span>
                          <span
                            id={`controls-summary-counter-comp-${comp.id}`}
                            className="text-violet-300 font-mono text-[9px] px-1.5 py-0.2 rounded bg-violet-500/10 border border-violet-500/20"
                          >
                            {compControlsResults[comp.id]?.length || 0} Controls
                          </span>
                        </div>
                        <span className="px-1.5 py-0.2 rounded font-mono text-[8px] bg-[#222222] text-[#8e8e8e] border border-[#303030]">
                          ADBE Effect Parade
                        </span>
                      </div>

                      {compControlsResults[comp.id] && compControlsResults[comp.id].length > 0 ? (
                        <div className="space-y-1.5 pt-0.5">
                          {compControlsResults[comp.id].map((prop) => {
                            const compKey = `comp-${comp.id}`;
                            if (prop.type === 'color') {
                              const currentColor = itemControlValues[compKey]?.[prop.id] !== undefined
                                ? itemControlValues[compKey][prop.id]
                                : prop.defaultValue || '#1473E6';
                              return (
                                <div
                                  key={prop.id}
                                  className="p-1.5 rounded bg-[#202020] border border-[#2e2e2e] flex flex-col sm:flex-row sm:items-center justify-between gap-1.5"
                                >
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <div
                                      id={`layer-badge-${prop.id}`}
                                      className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#2a2a2a] border border-[#383838] text-[#e1e1e1] text-[9px] font-medium flex-shrink-0"
                                      title={prop.layerName}
                                    >
                                      <Palette className="w-2.5 h-2.5 text-pink-400 flex-shrink-0" />
                                      <span className="truncate max-w-[130px]">{prop.propertyName}</span>
                                    </div>
                                    {prop.isMasterControl && (
                                      <span className="px-1 py-0.2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 font-mono text-[7px]">
                                        MASTER
                                      </span>
                                    )}
                                    <span className="text-[8px] font-mono text-[#8e8e8e] truncate max-w-[120px]">
                                      {prop.layerName}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <div
                                      id={`color-preview-${prop.id}`}
                                      className="px-1.5 py-0.5 rounded font-mono text-[9px] border flex items-center gap-1.5"
                                      style={{
                                        backgroundColor: `${currentColor}15`,
                                        borderColor: `${currentColor}40`,
                                        color: currentColor,
                                      }}
                                    >
                                      <span
                                        className="w-2.5 h-2.5 rounded-full border border-white/20 shadow-sm"
                                        style={{ backgroundColor: currentColor }}
                                      />
                                      <span id={`color-hex-${prop.id}`}>{currentColor}</span>
                                    </div>

                                    <input
                                      id={`color-input-${prop.id}`}
                                      data-testid={`color-input-${prop.id}`}
                                      type="color"
                                      value={currentColor}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setItemControlValues((prev) => ({
                                          ...prev,
                                          [compKey]: {
                                            ...(prev[compKey] || {}),
                                            [prop.id]: val,
                                          },
                                        }));
                                      }}
                                      className="w-7 h-6 rounded cursor-pointer bg-transparent border border-[#383838] p-0.5"
                                    />
                                  </div>
                                </div>
                              );
                            }

                            if (prop.type === 'slider') {
                              const min = prop.min !== undefined ? prop.min : 0;
                              const max = prop.max !== undefined ? prop.max : 100;
                              const currentVal = itemControlValues[compKey]?.[prop.id] !== undefined
                                ? Number(itemControlValues[compKey][prop.id])
                                : typeof prop.defaultValue === 'number' ? prop.defaultValue : 0;

                              return (
                                <div
                                  key={prop.id}
                                  className="p-1.5 rounded bg-[#202020] border border-[#2e2e2e] flex flex-col sm:flex-row sm:items-center justify-between gap-1.5"
                                >
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <div
                                      id={`layer-badge-${prop.id}`}
                                      className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#2a2a2a] border border-[#383838] text-[#e1e1e1] text-[9px] font-medium flex-shrink-0"
                                      title={prop.layerName}
                                    >
                                      <Sliders className="w-2.5 h-2.5 text-blue-400 flex-shrink-0" />
                                      <span className="truncate max-w-[130px]">{prop.propertyName}</span>
                                    </div>
                                    {prop.isMasterControl && (
                                      <span className="px-1 py-0.2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 font-mono text-[7px]">
                                        MASTER
                                      </span>
                                    )}
                                    <span className="text-[8px] font-mono text-[#8e8e8e] truncate max-w-[120px]">
                                      {prop.layerName}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2 flex-1 max-w-[220px]">
                                    <span className="text-[8px] font-mono text-[#6e6e6e]">{min}</span>
                                    <input
                                      id={`slider-input-${prop.id}`}
                                      data-testid={`slider-input-${prop.id}`}
                                      type="range"
                                      min={min}
                                      max={max}
                                      step={max > 100 ? 1 : 0.5}
                                      value={currentVal}
                                      onChange={(e) => {
                                        const val = parseFloat(e.target.value);
                                        setItemControlValues((prev) => ({
                                          ...prev,
                                          [compKey]: {
                                            ...(prev[compKey] || {}),
                                            [prop.id]: val,
                                          },
                                        }));
                                      }}
                                      className="flex-1 h-1.5 bg-[#141414] rounded-lg appearance-none cursor-pointer accent-[#1473E6]"
                                    />
                                    <span className="text-[8px] font-mono text-[#6e6e6e]">{max}</span>

                                    <span
                                      id={`slider-val-${prop.id}`}
                                      className="w-10 text-right px-1 py-0.2 rounded bg-[#172030] border border-blue-500/30 text-blue-300 font-mono text-[9px]"
                                    >
                                      {currentVal}
                                    </span>
                                  </div>
                                </div>
                              );
                            }

                            if (prop.type === 'checkbox') {
                              const currentChecked = itemControlValues[compKey]?.[prop.id] !== undefined
                                ? Boolean(itemControlValues[compKey][prop.id])
                                : Boolean(prop.defaultValue);

                              return (
                                <div
                                  key={prop.id}
                                  className="p-1.5 rounded bg-[#202020] border border-[#2e2e2e] flex items-center justify-between gap-1.5"
                                >
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <div
                                      id={`layer-badge-${prop.id}`}
                                      className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#2a2a2a] border border-[#383838] text-[#e1e1e1] text-[9px] font-medium flex-shrink-0"
                                      title={prop.layerName}
                                    >
                                      <CheckSquare className="w-2.5 h-2.5 text-emerald-400 flex-shrink-0" />
                                      <span className="truncate max-w-[130px]">{prop.propertyName}</span>
                                    </div>
                                    {prop.isMasterControl && (
                                      <span className="px-1 py-0.2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 font-mono text-[7px]">
                                        MASTER
                                      </span>
                                    )}
                                    <span className="text-[8px] font-mono text-[#8e8e8e] truncate max-w-[120px]">
                                      {prop.layerName}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <span
                                      id={`checkbox-status-${prop.id}`}
                                      className={`px-1.5 py-0.2 rounded text-[8px] font-mono border ${
                                        currentChecked
                                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                                          : 'bg-[#181818] border-[#303030] text-[#6e6e6e]'
                                      }`}
                                    >
                                      {currentChecked ? 'ENABLED' : 'DISABLED'}
                                    </span>

                                    <input
                                      id={`checkbox-input-${prop.id}`}
                                      data-testid={`checkbox-input-${prop.id}`}
                                      type="checkbox"
                                      checked={currentChecked}
                                      onChange={(e) => {
                                        const val = e.target.checked;
                                        setItemControlValues((prev) => ({
                                          ...prev,
                                          [compKey]: {
                                            ...(prev[compKey] || {}),
                                            [prop.id]: val,
                                          },
                                        }));
                                      }}
                                      className="w-4 h-4 rounded text-blue-600 bg-[#141414] border-[#383838] focus:ring-blue-500 cursor-pointer"
                                    />
                                  </div>
                                </div>
                              );
                            }

                            return null;
                          })}
                        </div>
                      ) : (
                        <div className="text-[9px] text-[#8e8e8e] italic py-1 text-center">
                          {inspectingControlsCompIds[comp.id]
                            ? 'Scanning composition expression controls...'
                            : 'No expression controls discovered yet. Click "Inspect Controls" to scan.'}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Essential Properties Drawer for Comp */}
                  {(expandedEgItemIds[`comp-${comp.id}`] || (compEgResults[comp.id] && expandedCompId === comp.id)) && (
                    <div
                      id={`essential-props-${comp.id}`}
                      className="mt-1 p-2.5 rounded bg-[#1a1a1a] border border-amber-500/30 text-[10px] space-y-2 animate-in fade-in duration-150"
                    >
                      <div className="flex items-center justify-between border-b border-[#2e2e2e] pb-1">
                        <div className="flex items-center gap-1.5 text-[#e1e1e1]">
                          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                          <span className="font-semibold text-white">Essential Properties (Master Properties)</span>
                          <span
                            id={`eg-summary-counter-comp-${comp.id}`}
                            className="text-amber-300 font-mono text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 border border-amber-500/20"
                          >
                            {compEgResults[comp.id]?.length || 0} Essential Props
                          </span>
                        </div>
                        <span className="px-1.5 py-0.2 rounded font-mono text-[8px] bg-[#222222] text-amber-300 border border-amber-500/30">
                          ADBE Essential Properties
                        </span>
                      </div>

                      {compEgResults[comp.id] && compEgResults[comp.id].length > 0 ? (
                        <div className="space-y-1.5 pt-0.5">
                          {compEgResults[comp.id].map((prop) => (
                            <div
                              key={prop.id}
                              className="p-1.5 rounded bg-[#202020] border border-[#2e2e2e] flex flex-col sm:flex-row sm:items-center justify-between gap-1.5"
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                <div
                                  id={`layer-badge-${prop.id}`}
                                  className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#2a2a2a] border border-[#383838] text-[#e1e1e1] text-[9px] font-medium flex-shrink-0"
                                  title={prop.layerName}
                                >
                                  {prop.type === 'color' ? (
                                    <Palette className="w-2.5 h-2.5 text-pink-400 flex-shrink-0" />
                                  ) : prop.type === 'text' ? (
                                    <Type className="w-2.5 h-2.5 text-cyan-400 flex-shrink-0" />
                                  ) : prop.type === 'checkbox' ? (
                                    <CheckSquare className="w-2.5 h-2.5 text-emerald-400 flex-shrink-0" />
                                  ) : (
                                    <Sliders className="w-2.5 h-2.5 text-blue-400 flex-shrink-0" />
                                  )}
                                  <span className="truncate max-w-[130px]">{prop.propertyName}</span>
                                </div>

                                <span
                                  id={`essential-badge-${prop.id}`}
                                  className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 font-semibold text-[8px] flex-shrink-0"
                                >
                                  <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                                  <span>⭐ Essential Property</span>
                                </span>

                                <span className="text-[8px] font-mono text-[#8e8e8e] truncate max-w-[120px]">
                                  {prop.layerName}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                {prop.type === 'color' ? (
                                  <input
                                    id={`color-input-${prop.id}`}
                                    data-testid={`color-input-${prop.id}`}
                                    type="color"
                                    defaultValue={prop.defaultValue || '#1473E6'}
                                    className="w-7 h-6 rounded cursor-pointer bg-transparent border border-[#383838] p-0.5"
                                  />
                                ) : prop.type === 'text' ? (
                                  <input
                                    id={`input-${prop.id}`}
                                    data-testid={`input-${prop.id}`}
                                    type="text"
                                    defaultValue={prop.defaultValue}
                                    className="w-full px-2 py-0.5 rounded bg-[#141414] border border-[#333333] focus:border-amber-500 focus:outline-none text-[#e1e1e1] font-mono text-[10px]"
                                  />
                                ) : prop.type === 'checkbox' ? (
                                  <input
                                    id={`checkbox-input-${prop.id}`}
                                    data-testid={`checkbox-input-${prop.id}`}
                                    type="checkbox"
                                    defaultChecked={Boolean(prop.defaultValue)}
                                    className="w-4 h-4 rounded text-amber-600 bg-[#141414] border-[#383838] cursor-pointer"
                                  />
                                ) : (
                                  <input
                                    id={`slider-input-${prop.id}`}
                                    data-testid={`slider-input-${prop.id}`}
                                    type="range"
                                    min={prop.min || 0}
                                    max={prop.max || 100}
                                    defaultValue={prop.defaultValue}
                                    className="w-24 h-1.5 bg-[#141414] rounded-lg appearance-none cursor-pointer accent-amber-500"
                                  />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[9px] text-[#8e8e8e] italic py-1 text-center">
                          {inspectingEgCompIds[comp.id]
                            ? 'Scanning composition Essential Properties...'
                            : 'No Essential Properties discovered yet. Click "Inspect Essential" to scan.'}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-8 rounded-lg bg-[#252525] border border-dashed border-[#333333] text-center text-[#8e8e8e] space-y-2">
          <Film className="w-8 h-8 text-[#6e6e6e] mx-auto" />
          <h4 className="text-sm font-semibold text-[#e1e1e1]">No Composition Data</h4>
          <p className="text-[11px] text-[#8e8e8e] max-w-sm mx-auto">
            Click <strong className="text-white">"Scan Open AE Project"</strong> above to discover all compositions, dependency trees, and Essential Properties from your active After Effects session.
          </p>
        </div>
      )}
    </div>
  );
};
