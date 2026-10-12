import React from 'react';
import {
  CheckCircle2,
  Loader2,
  Clock,
  AlertCircle,
  X,
  Sparkles,
  Layers,
  Type,
  Sliders,
  Star,
  Film,
  Package,
  ArrowRight,
} from 'lucide-react';
import { INGESTION_STAGES, IngestionSummary } from '../../hooks/useIngestionPipeline';

interface IngestionProgressModalProps {
  isOpen: boolean;
  isIngesting: boolean;
  currentStage: number;
  stageProgress: number;
  statusMessage: string;
  completedStages: number[];
  resultSummary: IngestionSummary | null;
  error: string | null;
  fileName?: string;
  onCancel: () => void;
  onClose: () => void;
  onViewInLibrary: () => void;
}

export const IngestionProgressModal: React.FC<IngestionProgressModalProps> = ({
  isOpen,
  isIngesting,
  currentStage,
  stageProgress,
  statusMessage,
  completedStages,
  resultSummary,
  error,
  fileName = 'Project.aep',
  onCancel,
  onClose,
  onViewInLibrary,
}) => {
  if (!isOpen) return null;

  const isCompleted = Boolean(resultSummary && !isIngesting && !error);

  return (
    <div
      id="ingest-modal-overlay"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 select-none"
    >
      <div
        id="ingest-modal-container"
        className="w-full max-w-lg bg-[#202020] border border-[#383838] rounded-2xl shadow-2xl shadow-black/80 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#303030] bg-[#242424]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#1473E6] via-indigo-600 to-purple-600 flex items-center justify-center shadow-md shadow-blue-900/40 border border-blue-400/30">
              <Film className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
                <span>Automated Project Dissector</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/15 border border-blue-500/30 text-blue-300 font-mono">
                  6-Stage Pipeline
                </span>
              </h2>
              <p className="text-[10px] text-[#8e8e8e] truncate max-w-xs font-mono">
                {fileName}
              </p>
            </div>
          </div>

          {!isIngesting && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-[#8e8e8e] hover:text-white hover:bg-[#303030] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {/* Progress Bar & Percentage */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-[#a0a0a0] flex items-center gap-1.5">
                {isIngesting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 text-[#1473E6] animate-spin" />
                    <span className="text-white font-medium">Dissecting project assets...</span>
                  </>
                ) : isCompleted ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300 font-semibold">Dissection Complete!</span>
                  </>
                ) : error ? (
                  <>
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                    <span className="text-rose-300 font-medium">Pipeline Interrupted</span>
                  </>
                ) : (
                  <span>Ready</span>
                )}
              </span>
              <span className="text-white font-bold text-xs">
                {Math.min(100, Math.max(0, stageProgress))}%
              </span>
            </div>

            {/* Dynamic Progress Bar Container */}
            <div className="w-full h-2.5 rounded-full bg-[#141414] border border-[#2e2e2e] p-0.5 overflow-hidden shadow-inner">
              <div
                id="ingest-progress-bar"
                style={{ width: `${Math.min(100, Math.max(0, stageProgress))}%` }}
                className={`h-full rounded-full transition-all duration-300 ease-out shadow-sm ${
                  error
                    ? 'bg-rose-500'
                    : isCompleted
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    : 'bg-gradient-to-r from-[#1473E6] via-indigo-500 to-cyan-400'
                }`}
              />
            </div>

            {/* Live Status Text */}
            <div
              id="ingest-status-text"
              className="text-[10px] font-mono text-[#999999] truncate pt-0.5 flex items-center gap-1.5"
            >
              <span className="text-[#6e6e6e]">•</span>
              <span className="truncate">{statusMessage || 'Initializing dissection engine...'}</span>
            </div>
          </div>

          {/* Error Alert if Pipeline Failed */}
          {error && (
            <div
              id="ingest-error-alert"
              className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-[11px] space-y-1.5 animate-in fade-in"
            >
              <div className="flex items-center gap-2 font-semibold">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>Error Dissecting Project</span>
              </div>
              <p className="text-[10px] text-rose-200/90 font-mono leading-relaxed pl-6">
                {error}
              </p>
            </div>
          )}

          {/* Success Celebration Card */}
          {isCompleted && resultSummary && (
            <div
              id="ingest-success-card"
              className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/15 via-[#252525] to-[#1e1e1e] border border-emerald-500/30 space-y-3 shadow-lg shadow-emerald-950/20 animate-in zoom-in-95 duration-200"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                    <Sparkles className="w-4 h-4" />
                    <span>Successfully dissected {resultSummary.totalExtracted} element{resultSummary.totalExtracted !== 1 ? 's' : ''}!</span>
                  </div>
                  <p className="text-[10px] text-[#a0a0a0]">
                    All compositions isolated, exported to standalone packages, and cataloged in your library.
                  </p>
                </div>
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>

              {/* Summary Badges Grid */}
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                <div
                  id="summary-badge-comps"
                  className="p-2 rounded-lg bg-[#181818] border border-[#2e2e2e] flex flex-col items-center justify-center text-center"
                >
                  <Layers className="w-3.5 h-3.5 text-blue-400 mb-1" />
                  <span className="text-xs font-bold text-white font-mono">
                    {resultSummary.compsCount}
                  </span>
                  <span className="text-[8px] text-[#8e8e8e] uppercase font-semibold">Comps</span>
                </div>

                <div
                  id="summary-badge-text"
                  className="p-2 rounded-lg bg-[#181818] border border-[#2e2e2e] flex flex-col items-center justify-center text-center"
                >
                  <Type className="w-3.5 h-3.5 text-cyan-400 mb-1" />
                  <span className="text-xs font-bold text-white font-mono">
                    {resultSummary.textCount}
                  </span>
                  <span className="text-[8px] text-[#8e8e8e] uppercase font-semibold">Text Layers</span>
                </div>

                <div
                  id="summary-badge-controls"
                  className="p-2 rounded-lg bg-[#181818] border border-[#2e2e2e] flex flex-col items-center justify-center text-center"
                >
                  <Sliders className="w-3.5 h-3.5 text-violet-400 mb-1" />
                  <span className="text-xs font-bold text-white font-mono">
                    {resultSummary.controlsCount}
                  </span>
                  <span className="text-[8px] text-[#8e8e8e] uppercase font-semibold">Controls</span>
                </div>

                <div
                  id="summary-badge-essential"
                  className="p-2 rounded-lg bg-[#181818] border border-[#2e2e2e] flex flex-col items-center justify-center text-center"
                >
                  <Star className="w-3.5 h-3.5 text-amber-400 mb-1 fill-amber-400" />
                  <span className="text-xs font-bold text-white font-mono">
                    {resultSummary.essentialCount}
                  </span>
                  <span className="text-[8px] text-[#8e8e8e] uppercase font-semibold">Essential</span>
                </div>
              </div>
            </div>
          )}

          {/* 6-Stage Checklist */}
          <div className="space-y-1.5 bg-[#181818] p-3 rounded-xl border border-[#2e2e2e]">
            <div className="text-[10px] font-bold text-[#8e8e8e] uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Dissection Pipeline Checklist</span>
              <span className="font-mono text-[9px] text-[#6e6e6e]">
                {completedStages.length}/6 Stages
              </span>
            </div>

            <div className="space-y-1">
              {INGESTION_STAGES.map((stage) => {
                const isStageComplete = completedStages.includes(stage.id);
                const isStageCurrent = currentStage === stage.id && isIngesting;

                return (
                  <div
                    key={stage.id}
                    id={`ingest-stage-item-${stage.id}`}
                    className={`flex items-center justify-between p-2 rounded-lg text-[10px] transition-all ${
                      isStageComplete
                        ? 'bg-emerald-500/10 border border-emerald-500/20 text-[#e1e1e1]'
                        : isStageCurrent
                        ? 'bg-[#1473E6]/15 border border-[#1473E6]/40 text-white shadow-sm'
                        : 'bg-[#1e1e1e]/60 border border-transparent text-[#6e6e6e]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex-shrink-0">
                        {isStageComplete ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : isStageCurrent ? (
                          <Loader2 className="w-3.5 h-3.5 text-[#1473E6] animate-spin" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-[#555555]" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-semibold text-[11px] ${
                              isStageComplete
                                ? 'text-emerald-300'
                                : isStageCurrent
                                ? 'text-[#1473E6]'
                                : 'text-[#888888]'
                            }`}
                          >
                            Stage {stage.id}: {stage.label}
                          </span>
                        </div>
                        <p
                          className={`text-[9px] truncate max-w-sm ${
                            isStageCurrent ? 'text-neutral-300' : 'text-[#6e6e6e]'
                          }`}
                        >
                          {stage.description}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-semibold flex-shrink-0 ${
                        isStageComplete
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : isStageCurrent
                          ? 'bg-blue-500/20 text-blue-300'
                          : 'bg-[#222222] text-[#555555]'
                      }`}
                    >
                      {stage.targetPercent}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[#303030] bg-[#242424]">
          <div>
            {isIngesting && (
              <button
                id="cancel-ingest-btn"
                onClick={onCancel}
                className="px-3 py-1.5 rounded-lg bg-[#2a2a2a] hover:bg-[#333333] active:bg-[#3d3d3d] text-rose-400 hover:text-rose-300 text-[11px] font-semibold border border-[#3d3d3d] transition-all flex items-center gap-1.5"
              >
                <X className="w-3 h-3" />
                <span>Cancel</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isCompleted ? (
              <button
                id="view-ingested-in-library-btn"
                onClick={onViewInLibrary}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#1473E6] hover:bg-[#0d66d0] active:bg-blue-800 text-white text-[11px] font-bold shadow-md shadow-blue-900/40 transition-all"
              >
                <Package className="w-3.5 h-3.5" />
                <span>View in Library</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : error ? (
              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-lg bg-[#303030] hover:bg-[#383838] text-white text-[11px] font-semibold transition-all"
              >
                Close
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
