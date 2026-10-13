import React, { useState } from 'react';
import {
  Heart,
  Plus,
  Sliders,
  Trash2,
  Loader2,
  Volume2,
  Star,
  Type,
  Palette,
  CheckSquare,
  Film,
  RotateCw,
  Check,
  Layers,
  ChevronDown,
  ChevronUp,
  GripVertical,
} from 'lucide-react';
import { LibraryItem } from '../../types/library';
import {
  generatePreviewSequence,
  generateMockScrubFrames,
  captureThumbnail,
  generateMockThumbnailSvg,
} from '../../lib/cepBridge';
import { getLibraryPath } from '../../lib/storageService';

interface AssetCardProps {
  item: LibraryItem;
  isSelected: boolean;
  isCompact?: boolean;
  isFavorited: boolean;
  onSelect: (item: LibraryItem) => void;
  onToggleFavorite: (id: string) => void;
  onInsert?: (item: LibraryItem) => void;
  onDeleteItem: (id: string) => void | Promise<void>;
  onUpdateItem: (item: LibraryItem) => Promise<void>;
  storagePath: string;
  onCustomize?: (item: LibraryItem) => void;
  onDragStart?: (item: LibraryItem, e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  isDragging?: boolean;
  isDeleting?: boolean;
}

export const AssetCard: React.FC<AssetCardProps> = ({
  item,
  isSelected,
  isCompact = false,
  isFavorited,
  onSelect,
  onToggleFavorite,
  onInsert,
  onDeleteItem,
  onUpdateItem,
  storagePath,
  onCustomize,
  onDragStart,
  onDragEnd,
  isDragging = false,
  isDeleting = false,
}) => {
  const [hoverFrame, setHoverFrame] = useState<number | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'text' | 'controls'>('text');
  const [insertSuccess, setInsertSuccess] = useState<boolean>(false);
  const [isLocalDragging, setIsLocalDragging] = useState<boolean>(false);
  const [localDeleting, setLocalDeleting] = useState<boolean>(false);

  const isEffectivelyDeleting = Boolean(isDeleting || localDeleting);
  const isEffectivelyDragging = Boolean(isDragging || isLocalDragging);

  // Inspector property state
  const [itemTextValues, setItemTextValues] = useState<Record<string, string>>({});
  const [itemControlValues, setItemControlValues] = useState<Record<string, any>>({});
  const [generatingSeq, setGeneratingSeq] = useState<boolean>(false);
  const [refreshingThumb, setRefreshingThumb] = useState<boolean>(false);

  const textProps = item.customizableProps ? item.customizableProps.filter((p) => p.type === 'text') : [];
  const controlProps = item.customizableProps ? item.customizableProps.filter((p) => p.type !== 'text') : [];
  const hasEssential = Boolean(
    item.egTemplateName ||
    item.customizableProps?.some((p) => p.isEssentialProperty) ||
    item.tags?.some((t) => t.toLowerCase().includes('essential'))
  );
  const hasAudio = Boolean(
    item.tags?.some((t) => t.toLowerCase().includes('audio')) ||
    (item as any).hasAudio
  );

  // Format Resolution Badge
  const resolutionBadge = item.width >= 3840
    ? '4K'
    : item.width >= 1920
    ? '1080p'
    : item.width >= 1280
    ? '720p'
    : `${item.width}p`;

  const fpsBadge = `${item.frameRate || 30}fps`;
  const formattedDuration = item.duration ? `${item.duration.toFixed(1)}s` : '0.0s';

  // Scrubbing logic
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!item.previewFrames || item.previewFrames.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percent = mouseX / rect.width;
    const frameIndex = Math.min(
      Math.floor(percent * item.previewFrames.length),
      item.previewFrames.length - 1
    );
    setHoverFrame(frameIndex);
  };

  const handleMouseLeave = () => {
    setHoverFrame(null);
  };

  // Insertion Handler
  const handleInsert = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onInsert) {
      onInsert(item);
    }
    setInsertSuccess(true);
    setTimeout(() => setInsertSuccess(false), 2000);
  };

  // Drag-and-Drop Handlers conforming to CEP Native Drag-out
  const handleDragStart = (e: React.DragEvent) => {
    setIsLocalDragging(true);

    const aepPath = item.aepPath || '';
    const formattedUri = 'file:///' + aepPath.replace(/\\/g, '/');

    // 1. Plain text path
    e.dataTransfer.setData('text/plain', aepPath);

    // 2. URI-list for external drop targets
    e.dataTransfer.setData('text/uri-list', formattedUri);

    // 3. CEP / Host drag-out standard payload
    e.dataTransfer.setData(
      'DownloadURL',
      'application/octet-stream:' + item.name + '.aep:' + formattedUri
    );

    // 4. JSON payload & identifiers
    try {
      e.dataTransfer.setData('application/json', JSON.stringify(item));
      e.dataTransfer.setData('ae-element-vault/id', item.id);
      e.dataTransfer.setData('ae-element-vault/name', item.name);
    } catch {}

    // 5. Allowed drag effect
    e.dataTransfer.effectAllowed = 'copyMove';

    // 6. Custom lightweight drag ghost preview (compact pill)
    try {
      const ghost = document.createElement('div');
      ghost.id = `drag-ghost-${item.id}`;
      ghost.style.position = 'fixed';
      ghost.style.top = '-9999px';
      ghost.style.left = '-9999px';
      ghost.style.zIndex = '99999';
      ghost.style.pointerEvents = 'none';
      ghost.className =
        'px-3 py-1.5 rounded-full bg-[#1473E6] text-white text-xs font-semibold shadow-2xl flex items-center gap-2 border border-blue-400/80 backdrop-blur-md';

      const safeName = item.name.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const safeCat = (item.category || 'Element').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      ghost.innerHTML = `
        <span style="font-size:12px;">🎬</span>
        <span style="max-width:160px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:700;">${safeName}</span>
        <span style="font-size:9px;background:rgba(0,0,0,0.35);padding:1px 6px;border-radius:10px;font-family:monospace;">${safeCat}</span>
      `;
      document.body.appendChild(ghost);
      e.dataTransfer.setDragImage(ghost, 20, 16);
      setTimeout(() => {
        if (ghost.parentNode) ghost.parentNode.removeChild(ghost);
      }, 100);
    } catch (err) {
      console.warn('Failed to set drag ghost image:', err);
    }

    if (onDragStart) {
      onDragStart(item, e);
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setIsLocalDragging(false);
    if (onDragEnd) {
      onDragEnd(e);
    }
  };

  // Regeneration Handlers
  const handleGenerateHoverSequence = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setGeneratingSeq(true);
    try {
      const libPath = storagePath || getLibraryPath();
      const previewsFolder = `${libPath}\\previews`;

      let compId = 101;
      const idMatch = item.id.match(/(\d+)/);
      if (idMatch) {
        compId = parseInt(idMatch[1], 10);
      }

      const seqRes = await generatePreviewSequence(compId, previewsFolder, 10);
      const frames = seqRes.framePaths && seqRes.framePaths.length > 0
        ? seqRes.framePaths
        : generateMockScrubFrames(item.name, 10, item.width, item.height);

      const updatedItem: LibraryItem = {
        ...item,
        previewFrames: frames,
      };

      await onUpdateItem(updatedItem);
    } catch (err: any) {
      console.error('Generate hover sequence error:', err);
    } finally {
      setGeneratingSeq(false);
    }
  };

  const handleRefreshThumbnail = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setRefreshingThumb(true);
    try {
      const libPath = storagePath || getLibraryPath();
      const previewsFolder = `${libPath}\\previews`;

      let compId = 101;
      const idMatch = item.id.match(/(\d+)/);
      if (idMatch) {
        compId = parseInt(idMatch[1], 10);
      }

      const thumbRes = await captureThumbnail(compId, previewsFolder);
      const newPreview = thumbRes.thumbnailPath || generateMockThumbnailSvg(item.name, item.width, item.height);

      const updatedItem: LibraryItem = {
        ...item,
        previewPath: newPreview,
      };

      await onUpdateItem(updatedItem);
    } catch (err: any) {
      console.error('Refresh thumbnail failed:', err);
    } finally {
      setRefreshingThumb(false);
    }
  };

  const hasFrames = Boolean(item.previewFrames && item.previewFrames.length > 0);
  const activeFrameSrc = hasFrames && hoverFrame !== null
    ? item.previewFrames![hoverFrame]
    : item.previewPath || (hasFrames ? item.previewFrames![0] : '');

  return (
    <div
      id={isSelected ? `selected-card-${item.id}` : `asset-card-${item.id}`}
      data-card-id={item.id}
      data-selected={isSelected ? 'true' : 'false'}
      data-deleting={isEffectivelyDeleting ? 'true' : 'false'}
      draggable={!isEffectivelyDeleting}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={() => !isEffectivelyDeleting && onSelect(item)}
      className={`group relative rounded-xl transition-all duration-200 select-none flex flex-col bg-[#222222] border overflow-hidden ${
        isEffectivelyDeleting
          ? 'opacity-60 pointer-events-none ring-1 ring-rose-500/50'
          : isEffectivelyDragging
          ? 'opacity-50 scale-[0.98] ring-2 ring-[#1473E6]/60 shadow-md'
          : ''
      } ${
        isSelected && !isEffectivelyDeleting
          ? 'border-[#1473E6] ring-2 ring-[#1473E6]/50 shadow-lg shadow-blue-900/30 bg-[#252525]'
          : 'border-[#333333] hover:border-[#4d4d4d] hover:bg-[#262626] shadow-sm'
      }`}
    >
      {/* Animated mini deletion progress indicator bar while deletion completes */}
      {isEffectivelyDeleting && (
        <div
          id={`deleting-progress-bar-${item.id}`}
          className="absolute top-0 left-0 right-0 h-1 bg-rose-950/80 z-30 overflow-hidden"
        >
          <div className="h-full bg-gradient-to-r from-rose-500 via-amber-400 to-rose-500 w-full animate-pulse" />
        </div>
      )}
      {/* 1. 16:9 Aspect Ratio Thumbnail Container with Kinetic Hover-Scrubbing */}
      <div
        id={`thumbnail-card-${item.id}`}
        className="relative w-full aspect-video bg-[#121212] overflow-hidden cursor-crosshair group/thumb"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {activeFrameSrc ? (
          <img
            src={activeFrameSrc}
            alt={item.name}
            className="w-full h-full object-cover transition-opacity duration-75 select-none pointer-events-none"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#1c1c1c] to-[#121212] text-[#6e6e6e]">
            <Film className="w-6 h-6 text-[#555555]" />
            <span className="text-[9px] font-mono text-[#666666] mt-1">{item.width}×{item.height}</span>
          </div>
        )}

        {/* Dynamic Scrubber Gradient Progress Bar on Hover */}
        {hasFrames && hoverFrame !== null && (
          <>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/80 z-20 overflow-hidden">
              <div
                id={`scrub-bar-${item.id}`}
                className="h-full bg-gradient-to-r from-[#1473E6] via-indigo-500 to-cyan-400 transition-all duration-75"
                style={{
                  width: `${((hoverFrame + 1) / item.previewFrames!.length) * 100}%`,
                }}
              />
            </div>
            {/* Floating Frame Counter Badge */}
            <div
              id={`scrub-badge-${item.id}`}
              className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/85 text-[8px] font-mono text-cyan-300 border border-cyan-500/40 shadow-md z-20 backdrop-blur-xs flex items-center gap-1"
            >
              <span>Frame {hoverFrame + 1}/{item.previewFrames!.length}</span>
            </div>
          </>
        )}

        {/* Metadata Overlay: Top-Left (Resolution & FPS Badges) */}
        {hoverFrame === null && (
          <div className="absolute top-1.5 left-1.5 flex items-center gap-1 z-10 pointer-events-none">
            <span
              id={`res-badge-${item.id}`}
              className="px-1.5 py-0.2 rounded bg-black/75 border border-white/10 text-white font-mono text-[8px] font-semibold tracking-wider backdrop-blur-xs shadow-xs"
            >
              {resolutionBadge}
            </span>
            <span
              id={`fps-badge-${item.id}`}
              className="px-1.5 py-0.2 rounded bg-black/75 border border-white/10 text-neutral-300 font-mono text-[8px] backdrop-blur-xs shadow-xs"
            >
              {fpsBadge}
            </span>
          </div>
        )}

        {/* Metadata Overlay: Top-Right (Essential Properties Star Badge) */}
        {hasEssential && (
          <div className="absolute top-1.5 right-1.5 z-10 pointer-events-none">
            <span
              id={`eg-ready-tag-${item.id}`}
              className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[8px] font-semibold flex items-center gap-1 backdrop-blur-xs shadow-xs"
              title="Essential Graphics / Master Properties Configured"
            >
              <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
              <span>Essential</span>
            </span>
          </div>
        )}

        {/* Metadata Overlay: Bottom-Left (Audio Wave Indicator) */}
        {hasAudio && (
          <div className="absolute bottom-1.5 left-1.5 z-10 pointer-events-none">
            <span
              id={`audio-badge-${item.id}`}
              className="p-1 rounded bg-black/75 border border-white/10 text-emerald-400 backdrop-blur-xs flex items-center justify-center shadow-xs"
              title="Contains Audio"
            >
              <Volume2 className="w-3 h-3 text-emerald-400" />
            </span>
          </div>
        )}

        {/* Metadata Overlay: Bottom-Right (Duration Pill) */}
        <div className="absolute bottom-1.5 right-1.5 z-10 pointer-events-none">
          <span
            id={`duration-pill-${item.id}`}
            className="px-1.5 py-0.5 rounded bg-black/80 border border-white/10 text-[#d1d1d1] font-mono text-[8px] font-medium backdrop-blur-xs shadow-xs"
          >
            {formattedDuration}
          </span>
        </div>

        {/* Hover Action Overlay Overlay on Thumbnail */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none group-hover:pointer-events-auto">
          {/* Quick Insert on Thumbnail */}
          <button
            id={`insert-btn-${item.id}`}
            type="button"
            onClick={handleInsert}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1473E6] hover:bg-[#0d66d0] active:bg-blue-800 text-white text-[11px] font-bold shadow-lg shadow-blue-900/50 transition-transform transform hover:scale-105 active:scale-95"
            title="Insert element into active After Effects composition"
          >
            {insertSuccess ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Inserted!</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>Insert</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Card Content & Details */}
      <div className={`p-2.5 space-y-1.5 flex-1 flex flex-col justify-between ${isCompact ? 'p-2 space-y-1' : ''}`}>
        <div className="space-y-1">
          {/* Title and Drag Handle with clean truncation */}
          <div className="flex items-start justify-between gap-1.5">
            <div className="flex items-center gap-1 min-w-0 flex-1">
              <div
                id={`drag-handle-${item.id}`}
                className="cursor-grab active:cursor-grabbing p-0.5 text-[#6e6e6e] group-hover:text-[#a0a0a0] hover:text-white rounded hover:bg-[#333333] transition-colors flex-shrink-0"
                title="Drag onto After Effects Timeline or Composition Viewer"
              >
                <GripVertical className="w-3.5 h-3.5" />
              </div>
              <h4
                id={`card-title-${item.id}`}
                className="text-[11px] font-bold text-white tracking-wide truncate max-w-[170px]"
                title={item.name}
              >
                {item.name}
              </h4>
            </div>

            {/* Favorite Button */}
            <button
              id={`favorite-btn-${item.id}`}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(item.id);
              }}
              className={`p-1 rounded-md transition-colors ${
                isFavorited
                  ? 'text-rose-500 bg-rose-500/15 hover:bg-rose-500/25'
                  : 'text-[#6e6e6e] hover:text-[#d1d1d1] hover:bg-[#303030]'
              }`}
              title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart className={`w-3.5 h-3.5 ${isFavorited ? 'fill-rose-500' : ''}`} />
            </button>
          </div>

          {/* Category pill and Layer Count */}
          <div className="flex items-center gap-1.5 text-[9px] text-[#8e8e8e] font-mono flex-wrap">
            <span className="text-blue-400 font-semibold">{item.category}</span>
            <span>•</span>
            <span className="flex items-center gap-0.5 text-[#b0b0b0]">
              <Layers className="w-2.5 h-2.5 text-[#777777]" />
              {item.layerCount || 1} Layers
            </span>
          </div>

          {/* Customizable Properties Summary Pills */}
          <div className="flex items-center gap-1 flex-wrap pt-0.5">
            {textProps.length > 0 && (
              <span
                id={`text-summary-counter-${item.id}`}
                className="px-1.5 py-0.2 rounded bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 font-mono text-[8px] flex items-center gap-1"
                title={`${textProps.length} editable text layers detected`}
              >
                <Type className="w-2.5 h-2.5 text-cyan-400" />
                <span>{textProps.length} Texts</span>
              </span>
            )}

            {controlProps.length > 0 && (
              <span
                id={`controls-summary-counter-${item.id}`}
                className="px-1.5 py-0.2 rounded bg-violet-500/10 border border-violet-500/25 text-violet-300 font-mono text-[8px] flex items-center gap-1"
                title={`${controlProps.length} expression controls detected`}
              >
                <Sliders className="w-2.5 h-2.5 text-violet-400" />
                <span>{controlProps.length} Controls</span>
              </span>
            )}

            {item.previewFrames && item.previewFrames.length > 0 && (
              <span
                id={`sequence-badge-${item.id}`}
                className="px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400 font-mono text-[8px]"
              >
                {item.previewFrames.length}f
              </span>
            )}
          </div>
        </div>

        {/* 3. Quick Action Bar at Bottom of Card */}
        <div className="pt-2 border-t border-[#2e2e2e] flex items-center justify-between gap-1">
          <div className="flex items-center gap-1">
            {/* Customize / Inspect Drawer Toggle */}
            <button
              id={`customize-btn-${item.id}`}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsInspectorOpen((prev) => !prev);
                if (onCustomize) {
                  onCustomize(item);
                }
              }}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold transition-all border ${
                isInspectorOpen
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-[#2a2a2a] hover:bg-[#333333] text-[#d1d1d1] border-[#383838]'
              }`}
              title="Inspect and customize text, colors, and parameters"
            >
              <Sliders className="w-3 h-3 text-indigo-400" />
              <span>Customize</span>
              {isInspectorOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {/* Refresh Thumbnail */}
            <button
              id={`refresh-thumb-${item.id}`}
              type="button"
              onClick={handleRefreshThumbnail}
              disabled={refreshingThumb}
              className="p-1 rounded bg-[#2a2a2a] hover:bg-[#333333] text-[#8e8e8e] hover:text-white border border-[#383838] transition-colors"
              title="Recapture thumbnail snapshot from AE"
            >
              <RotateCw className={`w-3 h-3 ${refreshingThumb ? 'animate-spin text-blue-400' : ''}`} />
            </button>

            {/* Hover Sequence Generation */}
            <button
              id={`generate-hover-seq-${item.id}`}
              type="button"
              onClick={handleGenerateHoverSequence}
              disabled={generatingSeq}
              className="p-1 rounded bg-[#2a2a2a] hover:bg-[#333333] text-[#8e8e8e] hover:text-cyan-300 border border-[#383838] transition-colors"
              title="Re-render hover-scrub frame sequence"
            >
              <Film className={`w-3 h-3 ${generatingSeq ? 'animate-pulse text-cyan-400' : ''}`} />
            </button>
          </div>

          {/* Delete Action Button */}
          <button
            id={`delete-item-btn-${item.id}`}
            type="button"
            disabled={isEffectivelyDeleting}
            onClick={async (e) => {
              e.stopPropagation();
              if (isEffectivelyDeleting) return;
              setLocalDeleting(true);
              try {
                await onDeleteItem(item.id);
              } catch (err) {
                console.error('Failed to delete item:', err);
                setLocalDeleting(false);
              }
            }}
            className="p-1 rounded bg-[#2a2a2a] hover:bg-rose-500/20 text-[#6e6e6e] hover:text-rose-400 disabled:text-rose-400 disabled:opacity-80 border border-[#383838] transition-colors"
            title={isEffectivelyDeleting ? 'Deleting element...' : 'Delete element from library'}
          >
            {isEffectivelyDeleting ? (
              <Loader2 className="w-3 h-3 animate-spin text-rose-400" />
            ) : (
              <Trash2 className="w-3 h-3" />
            )}
          </button>
        </div>
      </div>

      {/* 4. In-Panel Parameter Inspector Drawer (Revealed via "Customize" Button) */}
      {isInspectorOpen && (
        <div
          id={`inspector-drawer-${item.id}`}
          onClick={(e) => e.stopPropagation()}
          draggable={false}
          onDragStart={(e) => e.stopPropagation()}
          className="p-3 border-t border-[#333333] bg-[#1a1a1a] space-y-2.5 animate-in slide-in-from-top-2 duration-150"
        >
          {/* Inspector Header & Sub-Tabs */}
          <div className="flex items-center justify-between border-b border-[#2a2a2a] pb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                Parameter Inspector
              </span>
            </div>

            <div className="flex items-center gap-1 bg-[#121212] p-0.5 rounded-md border border-[#2a2a2a]">
              {textProps.length > 0 && (
                <button
                  id={`toggle-text-${item.id}`}
                  type="button"
                  onClick={() => setActiveTab('text')}
                  className={`px-2 py-0.5 rounded text-[9px] font-semibold transition-all ${
                    activeTab === 'text'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'text-[#8e8e8e] hover:text-white'
                  }`}
                >
                  Text ({textProps.length})
                </button>
              )}

              {controlProps.length > 0 && (
                <button
                  id={`toggle-controls-${item.id}`}
                  type="button"
                  onClick={() => setActiveTab('controls')}
                  className={`px-2 py-0.5 rounded text-[9px] font-semibold transition-all ${
                    activeTab === 'controls'
                      ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                      : 'text-[#8e8e8e] hover:text-white'
                  }`}
                >
                  Controls ({controlProps.length})
                </button>
              )}
            </div>
          </div>

          {/* TAB 1: Editable Text Properties Section (#text-props-{id}) */}
          {activeTab === 'text' && textProps.length > 0 && (
            <div id={`text-props-${item.id}`} className="space-y-1.5">
              {textProps.map((prop) => {
                const val = itemTextValues[prop.id] !== undefined
                  ? itemTextValues[prop.id]
                  : (prop.defaultValue !== undefined ? String(prop.defaultValue) : '');

                return (
                  <div
                    key={prop.id}
                    className="p-1.5 rounded bg-[#202020] border border-[#2a2a2a] flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <div
                        id={`layer-badge-${prop.id}`}
                        className="flex items-center gap-1 px-1.5 py-0.2 rounded bg-[#2a2a2a] border border-[#383838] text-[#e1e1e1] text-[9px] font-medium truncate max-w-[150px]"
                        title={prop.layerName}
                      >
                        <Type className="w-2.5 h-2.5 text-cyan-400 flex-shrink-0" />
                        <span className="truncate">{prop.layerName}</span>
                      </div>

                      <div
                        id={`font-pill-${prop.id}`}
                        className="px-1.5 py-0.2 rounded bg-[#16202c] border border-cyan-500/30 text-cyan-300 font-mono text-[8px] flex items-center gap-1"
                      >
                        <span>{prop.font || 'Montserrat-Bold'}</span>
                        <span>•</span>
                        <span>{prop.fontSize ? `${prop.fontSize}px` : '48px'}</span>
                      </div>
                    </div>

                    <input
                      id={`input-${prop.id}`}
                      data-testid={`input-${prop.id}`}
                      type="text"
                      value={val}
                      onChange={(e) => {
                        const newVal = e.target.value;
                        setItemTextValues((prev) => ({ ...prev, [prop.id]: newVal }));
                      }}
                      className="w-full px-2 py-0.5 rounded bg-[#141414] border border-[#333333] focus:border-cyan-500 focus:outline-none text-[#e1e1e1] font-mono text-[10px]"
                      placeholder="Custom text..."
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: Expression Controls & Colors Section (#controls-section-{id}) */}
          {activeTab === 'controls' && controlProps.length > 0 && (
            <div id={`controls-section-${item.id}`} className="space-y-1.5">
              {controlProps.map((prop) => {
                if (prop.type === 'color') {
                  const currentColor = itemControlValues[prop.id] !== undefined
                    ? itemControlValues[prop.id]
                    : prop.defaultValue || '#1473E6';

                  return (
                    <div
                      key={prop.id}
                      className="p-1.5 rounded bg-[#202020] border border-[#2a2a2a] flex items-center justify-between gap-1.5"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div
                          id={`layer-badge-${prop.id}`}
                          className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#2a2a2a] border border-[#383838] text-[#e1e1e1] text-[9px] font-medium"
                        >
                          <Palette className="w-2.5 h-2.5 text-pink-400 flex-shrink-0" />
                          <span className="truncate max-w-[120px]">{prop.propertyName}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div
                          id={`color-preview-${prop.id}`}
                          className="px-1.5 py-0.2 rounded font-mono text-[8px] border flex items-center gap-1"
                          style={{
                            backgroundColor: `${currentColor}15`,
                            borderColor: `${currentColor}40`,
                            color: currentColor,
                          }}
                        >
                          <span
                            className="w-2 h-2 rounded-full border border-white/20"
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
                            setItemControlValues((prev) => ({ ...prev, [prop.id]: val }));
                          }}
                          className="w-6 h-5 rounded cursor-pointer bg-transparent border border-[#383838] p-0.5"
                        />
                      </div>
                    </div>
                  );
                }

                if (prop.type === 'slider') {
                  const min = prop.min !== undefined ? prop.min : 0;
                  const max = prop.max !== undefined ? prop.max : 100;
                  const currentVal = itemControlValues[prop.id] !== undefined
                    ? Number(itemControlValues[prop.id])
                    : typeof prop.defaultValue === 'number' ? prop.defaultValue : 0;

                  return (
                    <div
                      key={prop.id}
                      className="p-1.5 rounded bg-[#202020] border border-[#2a2a2a] flex items-center justify-between gap-1.5"
                    >
                      <div
                        id={`layer-badge-${prop.id}`}
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#2a2a2a] border border-[#383838] text-[#e1e1e1] text-[9px] font-medium"
                      >
                        <Sliders className="w-2.5 h-2.5 text-blue-400 flex-shrink-0" />
                        <span className="truncate max-w-[110px]">{prop.propertyName}</span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-1 max-w-[160px]">
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
                            setItemControlValues((prev) => ({ ...prev, [prop.id]: val }));
                          }}
                          className="flex-1 h-1.5 bg-[#141414] rounded-lg appearance-none cursor-pointer accent-[#1473E6]"
                        />
                        <span
                          id={`slider-val-${prop.id}`}
                          className="w-8 text-right font-mono text-[8px] text-blue-300"
                        >
                          {currentVal}
                        </span>
                      </div>
                    </div>
                  );
                }

                if (prop.type === 'checkbox') {
                  const currentChecked = itemControlValues[prop.id] !== undefined
                    ? Boolean(itemControlValues[prop.id])
                    : Boolean(prop.defaultValue);

                  return (
                    <div
                      key={prop.id}
                      className="p-1.5 rounded bg-[#202020] border border-[#2a2a2a] flex items-center justify-between gap-1.5"
                    >
                      <div
                        id={`layer-badge-${prop.id}`}
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#2a2a2a] border border-[#383838] text-[#e1e1e1] text-[9px] font-medium"
                      >
                        <CheckSquare className="w-2.5 h-2.5 text-emerald-400 flex-shrink-0" />
                        <span className="truncate max-w-[120px]">{prop.propertyName}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span
                          id={`checkbox-status-${prop.id}`}
                          className="text-[8px] font-mono text-emerald-300"
                        >
                          {currentChecked ? 'ON' : 'OFF'}
                        </span>
                        <input
                          id={`checkbox-input-${prop.id}`}
                          data-testid={`checkbox-input-${prop.id}`}
                          type="checkbox"
                          checked={currentChecked}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setItemControlValues((prev) => ({ ...prev, [prop.id]: val }));
                          }}
                          className="w-3.5 h-3.5 rounded text-blue-600 bg-[#141414] border-[#383838] cursor-pointer"
                        />
                      </div>
                    </div>
                  );
                }

                return null;
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
