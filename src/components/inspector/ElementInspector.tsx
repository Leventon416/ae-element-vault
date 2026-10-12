import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  RotateCcw,
  Star,
  Type,
  Palette,
  Sliders,
  CheckSquare,
  Check,
  Copy,
  Sparkles,
  Info,
  Maximize2,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { LibraryItem, ParameterPreset } from '../../types/library';
import { PresetManager } from './PresetManager';
import { saveItem } from '../../lib/storageService';
import {
  InsertionOptions,
  syncParametersToSelectedLayer,
  SyncResult,
} from '../../lib/cepBridge';

export interface ElementInspectorProps {
  item: LibraryItem;
  initialValues?: Record<string, any>;
  onClose: () => void;
  onValuesChange?: (values: Record<string, any>) => void;
  onUpdateItem: (item: LibraryItem) => Promise<void>;
  onInsert?: (item: LibraryItem) => void;
  onInsertCustomized?: (
    item: LibraryItem,
    values: Record<string, any>,
    retargetOptions?: Partial<InsertionOptions>
  ) => void;
  onSyncToLayer?: (result: SyncResult) => void;
  storagePath?: string;
}

export const BRAND_PALETTE = [
  { name: 'Adobe Blue', id: 'adobe-blue', hex: '#1473E6' },
  { name: 'Crimson', id: 'crimson', hex: '#E61448' },
  { name: 'Amber', id: 'amber', hex: '#F59E0B' },
  { name: 'Emerald', id: 'emerald', hex: '#10B981' },
  { name: 'Dark', id: 'dark', hex: '#1E1E1E' },
] as const;

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return { r, g, b };
  } else if (clean.length === 6) {
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return { r, g, b };
  }
  return null;
}

export const ElementInspector: React.FC<ElementInspectorProps> = ({
  item,
  initialValues,
  onClose,
  onValuesChange,
  onUpdateItem,
  onInsert,
  onInsertCustomized,
  onSyncToLayer,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Group properties
  const allProps = item.customizableProps || [];
  const textProps = allProps.filter((p) => p.type === 'text');
  const colorProps = allProps.filter((p) => p.type === 'color');
  const sliderAndToggleProps = allProps.filter((p) => p.type === 'slider' || p.type === 'checkbox');
  const essentialProps = allProps.filter(
    (p) => p.isEssentialProperty || Boolean(p.egTemplateName) || Boolean(item.egTemplateName)
  );

  const hasEssential = Boolean(
    item.egTemplateName ||
    essentialProps.length > 0 ||
    item.tags?.some((t) => t.toLowerCase().includes('essential'))
  );

  // Active Tab State: defaults to "essential" if element has Essential Properties
  const [activeTab, setActiveTab] = useState<'essential' | 'typography' | 'colors' | 'controls'>(
    () => {
      if (hasEssential && essentialProps.length > 0) return 'essential';
      if (textProps.length > 0) return 'typography';
      if (colorProps.length > 0) return 'colors';
      return 'controls';
    }
  );

  // Initialize and track parameter values
  const [currentValues, setCurrentValues] = useState<Record<string, any>>(() => {
    const vals: Record<string, any> = {};
    allProps.forEach((p) => {
      if (initialValues && initialValues[p.id] !== undefined) {
        vals[p.id] = initialValues[p.id];
      } else if (p.defaultValue !== undefined) {
        vals[p.id] = p.defaultValue;
      } else {
        if (p.type === 'text') vals[p.id] = p.layerName || '';
        else if (p.type === 'color') vals[p.id] = '#1473E6';
        else if (p.type === 'slider') vals[p.id] = p.min || 0;
        else if (p.type === 'checkbox') vals[p.id] = true;
      }
    });
    return vals;
  });

  // Action status states
  const [copySuccess, setCopySuccess] = useState(false);
  const [insertSuccess, setInsertSuccess] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncToast, setSyncToast] = useState<{ layerName: string; updatedCount: number } | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [activeColorPropId, setActiveColorPropId] = useState<string | null>(
    colorProps[0]?.id || null
  );

  // Format Resolution & Duration Badges
  const resolutionBadge =
    item.width >= 3840
      ? '4K UHD'
      : item.width >= 1920
      ? '1080p FHD'
      : item.width >= 1280
      ? '720p HD'
      : `${item.width}×${item.height}`;
  const formattedDuration = item.duration ? `${item.duration.toFixed(1)}s` : '0.0s';

  // Value update helper
  const handleUpdateValue = (propId: string, val: any) => {
    setCurrentValues((prev) => {
      const next = { ...prev, [propId]: val };
      if (onValuesChange) {
        onValuesChange(next);
      }
      return next;
    });
  };

  // Reset to Defaults
  const handleResetDefaults = () => {
    const defaultVals: Record<string, any> = {};
    allProps.forEach((p) => {
      defaultVals[p.id] = p.defaultValue;
    });
    setCurrentValues(defaultVals);
    if (onValuesChange) {
      onValuesChange(defaultVals);
    }
    setResetSuccess(true);
    setTimeout(() => setResetSuccess(false), 2000);
  };

  // Single-Click Brand Palette Assignment
  const handleApplyBrandColor = (hex: string) => {
    if (activeColorPropId) {
      handleUpdateValue(activeColorPropId, hex);
    } else if (colorProps.length > 0) {
      // Apply to all color properties for uniform brand styling
      colorProps.forEach((p) => {
        handleUpdateValue(p.id, hex);
      });
    }
  };

  // Preset Handlers
  const handleSavePreset = async (presetName: string) => {
    const newPreset: ParameterPreset = {
      id: `preset_${Date.now()}`,
      name: presetName,
      createdAt: new Date().toISOString(),
      values: { ...currentValues },
    };

    const updatedPresets = [...(item.presets || []), newPreset];
    const updatedItem: LibraryItem = {
      ...item,
      presets: updatedPresets,
    };

    // Persist saved preset into storage
    await saveItem(updatedItem);
    await onUpdateItem(updatedItem);
  };

  const handleApplyPreset = (preset: ParameterPreset) => {
    setCurrentValues((prev) => {
      const next = { ...prev, ...preset.values };
      if (onValuesChange) {
        onValuesChange(next);
      }
      return next;
    });
  };

  const handleDeletePreset = async (presetId: string) => {
    const updatedPresets = (item.presets || []).filter((p) => p.id !== presetId);
    const updatedItem: LibraryItem = {
      ...item,
      presets: updatedPresets,
    };
    await saveItem(updatedItem);
    await onUpdateItem(updatedItem);
  };

  // Copy Parameter JSON to Clipboard
  const handleCopyParams = async () => {
    try {
      const jsonStr = JSON.stringify(currentValues, null, 2);
      await navigator.clipboard.writeText(jsonStr);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.warn('Clipboard write failed, using fallback:', err);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  // Smart Retargeting States
  const [scaleMode, setScaleMode] = useState<'auto' | 'fit-width' | 'fill' | 'original'>('auto');
  const [positionMode, setPositionMode] = useState<'center' | 'lower-third' | 'top-third'>('center');
  const [matchFps, setMatchFps] = useState<boolean>(true);

  // Active Comp Retargeting Calculation (Mock active comp is 4K 3840x2160)
  const targetWidth = 3840;
  const targetHeight = 2160;
  const itemWidth = item.width || 1920;
  const itemHeight = item.height || 1080;

  let calculatedScale = 100;
  if (scaleMode === 'fit-width') {
    calculatedScale = Math.round((targetWidth / itemWidth) * 100);
  } else if (scaleMode === 'fill') {
    calculatedScale = Math.round(Math.max(targetWidth / itemWidth, targetHeight / itemHeight) * 100);
  } else if (scaleMode === 'original') {
    calculatedScale = 100;
  } else {
    // 'auto'
    calculatedScale = Math.round(Math.min(targetWidth / itemWidth, targetHeight / itemHeight) * 100);
  }

  const srcResText = itemWidth >= 3840 ? '4K' : itemWidth >= 1920 ? '1080p' : `${itemWidth}p`;
  const targetResText = '4K';

  let scalePreviewBadgeText = `Auto-Scaling: ${calculatedScale}% (${srcResText} → ${targetResText})`;
  if (scaleMode === 'original') {
    scalePreviewBadgeText = `Original Size: 100% (${srcResText})`;
  } else if (scaleMode === 'fit-width') {
    scalePreviewBadgeText = `Fit Width: ${calculatedScale}% (${srcResText} → ${targetResText})`;
  } else if (scaleMode === 'fill') {
    scalePreviewBadgeText = `Fill Comp: ${calculatedScale}% (${srcResText} → ${targetResText})`;
  } else {
    scalePreviewBadgeText = `Auto-Scaling: ${calculatedScale}% (${srcResText} → ${targetResText})`;
  }

  // Insert Customized to Timeline
  const handleApplyAndInsert = () => {
    const retargetOptions: Partial<InsertionOptions> = {
      scaleMode,
      positionMode,
      matchFps,
    };

    if (onInsertCustomized) {
      onInsertCustomized(item, currentValues, retargetOptions);
    } else if (onInsert) {
      onInsert(item);
    }
    setInsertSuccess(true);
    setTimeout(() => setInsertSuccess(false), 2500);
  };

  // Synchronize Customized Parameters to Currently Selected Timeline Layer
  const handleSyncToSelectedLayer = async () => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      const res = await syncParametersToSelectedLayer(currentValues);
      setSyncToast({
        layerName: res.layerName || item.name,
        updatedCount: res.updatedCount || Object.keys(currentValues).length,
      });
      if (onSyncToLayer) {
        onSyncToLayer(res);
      }
      setTimeout(() => setSyncToast(null), 3500);
    } catch (err: any) {
      console.warn('Sync to selected layer failed:', err);
      const msg = err.message || String(err);
      setSyncError(msg || 'Please select the target layer in your After Effects timeline to sync.');
      setTimeout(() => setSyncError(null), 4000);
    } finally {
      setIsSyncing(false);
    }
  };

  // Live Preview Canvas Renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Determine active primary accent color
    let primaryAccent = '#1473E6';
    if (colorProps.length > 0) {
      const primaryColorProp = colorProps[0];
      if (currentValues[primaryColorProp.id]) {
        primaryAccent = currentValues[primaryColorProp.id];
      }
    }

    const drawLiveCanvas = (bgImg?: HTMLImageElement) => {
      ctx.clearRect(0, 0, width, height);

      // Background
      if (bgImg) {
        ctx.drawImage(bgImg, 0, 0, width, height);
        // Soft gradient overlay for text readability
        const overlay = ctx.createLinearGradient(0, 0, 0, height);
        overlay.addColorStop(0, 'rgba(0, 0, 0, 0.35)');
        overlay.addColorStop(0.7, 'rgba(0, 0, 0, 0.45)');
        overlay.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
        ctx.fillStyle = overlay;
        ctx.fillRect(0, 0, width, height);
      } else {
        // Tech After Effects Canvas gradient
        const bgGrad = ctx.createRadialGradient(
          width / 2,
          height / 2,
          40,
          width / 2,
          height / 2,
          width * 0.7
        );
        bgGrad.addColorStop(0, '#22222a');
        bgGrad.addColorStop(1, '#0e0e14');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // Subtle AE Grid Lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.lineWidth = 1;
        const gridStep = 40;
        for (let x = 0; x < width; x += gridStep) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = 0; y < height; y += gridStep) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
      }

      // Dynamic Radial Glow matching customized Brand Accent
      const glow = ctx.createRadialGradient(
        width / 2,
        height * 0.75,
        10,
        width / 2,
        height * 0.75,
        220
      );
      glow.addColorStop(0, `${primaryAccent}55`);
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.fillRect(0, height * 0.4, width, height * 0.6);

      // Modern Accent Underline Bar
      ctx.fillStyle = primaryAccent;
      ctx.fillRect(width * 0.15, height * 0.82, width * 0.7, 3);

      // Dynamic Text Overlay Rendering
      if (textProps.length > 0) {
        textProps.forEach((tp, idx) => {
          const textVal =
            currentValues[tp.id] !== undefined
              ? String(currentValues[tp.id])
              : String(tp.defaultValue || tp.layerName || 'CUSTOM TEXT');

          ctx.save();
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          if (idx === 0) {
            // Primary Headline
            const fontSize = Math.min(
              44,
              Math.max(22, tp.fontSize ? Math.round(tp.fontSize * 0.6) : 34)
            );
            const fontFamily = tp.font?.replace(/[-_]/g, ' ') || 'Montserrat, sans-serif';
            ctx.font = `bold ${fontSize}px ${fontFamily}, system-ui, sans-serif`;

            ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
            ctx.shadowBlur = 14;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 4;

            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(textVal, width / 2, height * 0.44);
          } else if (idx === 1) {
            // Subtitle Layer
            const fontSize = Math.min(
              24,
              Math.max(14, tp.fontSize ? Math.round(tp.fontSize * 0.4) : 18)
            );
            ctx.font = `600 ${fontSize}px Montserrat, system-ui, sans-serif`;
            ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
            ctx.shadowBlur = 8;
            ctx.fillStyle = primaryAccent;
            ctx.fillText(textVal, width / 2, height * 0.62);
          } else {
            // Extra Lower Third / Badge
            ctx.font = '600 12px Montserrat, monospace';
            ctx.fillStyle = '#A0A0A0';
            ctx.fillText(textVal, width / 2, height * 0.73);
          }
          ctx.restore();
        });
      } else {
        // Fallback title representation if no text layer
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 30px Montserrat, system-ui, sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 12;
        ctx.fillText(item.name, width / 2, height * 0.46);

        ctx.font = '600 13px Montserrat, sans-serif';
        ctx.fillStyle = primaryAccent;
        ctx.fillText(item.category.toUpperCase(), width / 2, height * 0.62);
        ctx.restore();
      }

      // Live 16:9 Indicator Watermark Pill
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.fillRect(width - 155, 12, 142, 22);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.strokeRect(width - 155, 12, 142, 22);
      ctx.fillStyle = '#10B981';
      ctx.beginPath();
      ctx.arc(width - 143, 23, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'right';
      ctx.fillStyle = '#D1D5DB';
      ctx.fillText('LIVE PREVIEW • 16:9', width - 20, 26);
      ctx.restore();
    };

    if (item.previewPath) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => drawLiveCanvas(img);
      img.onerror = () => drawLiveCanvas();
      img.src = item.previewPath;
    } else {
      drawLiveCanvas();
    }
  }, [item, currentValues, colorProps, textProps]);

  return (
    <aside
      id={`inspector-drawer-${item.id}`}
      data-item-id={item.id}
      className="w-full h-full flex flex-col bg-[#1a1a1a] border-l border-[#2e2e2e] shadow-2xl select-none overflow-hidden"
    >
      {/* 1. Header Bar */}
      <header className="p-3 bg-[#1e1e1e] border-b border-[#2b2b2b] flex items-center justify-between gap-2 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2">
              <h3
                id="inspector-element-name"
                className="text-xs font-bold text-white tracking-wide truncate max-w-[180px] sm:max-w-[240px]"
                title={item.name}
              >
                {item.name}
              </h3>
              <span
                id="inspector-category-badge"
                className="px-1.5 py-0.2 rounded bg-blue-500/15 border border-blue-500/30 text-blue-300 font-semibold text-[9px] uppercase tracking-wider flex-shrink-0"
              >
                {item.category}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span
                id="inspector-res-duration-pill"
                className="px-1.5 py-0.2 rounded bg-[#141414] border border-[#2e2e2e] text-[#9e9e9e] font-mono text-[9px]"
              >
                {resolutionBadge} • {formattedDuration} • {item.frameRate || 30}fps
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Reset to Defaults Button */}
          <button
            id="reset-defaults-btn"
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#252525] hover:bg-[#2e2e2e] active:bg-[#1f1f1f] text-[#c1c1c1] hover:text-white border border-[#383838] text-[10px] font-medium transition-all"
            title="Reset all parameters to original composition defaults"
          >
            <RotateCcw className={`w-3 h-3 text-amber-400 ${resetSuccess ? 'rotate-180 transition-transform' : ''}`} />
            <span>{resetSuccess ? 'Reset!' : 'Reset to Defaults'}</span>
          </button>

          {/* Close Inspector Button */}
          <button
            id="close-inspector-btn"
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg bg-[#252525] hover:bg-rose-500/20 text-[#8e8e8e] hover:text-rose-400 border border-[#383838] transition-colors"
            title="Close Inspector"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Inspector Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3.5">
        {/* 2. Live Preview Canvas / Header Card */}
        <section className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] text-[#777777] font-semibold uppercase tracking-wider">
            <span>Dynamic Live Canvas Feedback</span>
            <span className="text-[#10B981] flex items-center gap-1 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
              Real-time
            </span>
          </div>

          <div
            id="inspector-preview-canvas-card"
            className="relative aspect-video w-full rounded-xl overflow-hidden bg-[#121212] border border-[#2e2e2e] shadow-md flex items-center justify-center group"
          >
            <canvas
              id="inspector-preview-canvas"
              ref={canvasRef}
              width={640}
              height={360}
              className="w-full h-full object-cover transition-opacity duration-150"
            />
          </div>
        </section>

        {/* 3. Tabbed Parameter Sections Bar */}
        <nav
          aria-label="Inspector Sections"
          className="flex items-center gap-1 p-1 rounded-xl bg-[#141414] border border-[#2b2b2b] overflow-x-auto"
        >
          {/* Tab 1: ⭐ Essential Properties */}
          <button
            id="tab-essential-props"
            type="button"
            onClick={() => setActiveTab('essential')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold tracking-wide transition-all flex-shrink-0 ${
              activeTab === 'essential'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-[#888888] hover:text-[#d1d1d1] border border-transparent'
            }`}
          >
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            <span>⭐ Essential Properties</span>
            {essentialProps.length > 0 && (
              <span className="text-[9px] px-1 rounded bg-amber-400/20 text-amber-300 font-mono">
                {essentialProps.length}
              </span>
            )}
          </button>

          {/* Tab 2: Typography */}
          <button
            id="tab-typography"
            type="button"
            onClick={() => setActiveTab('typography')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold tracking-wide transition-all flex-shrink-0 ${
              activeTab === 'typography'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-[#888888] hover:text-[#d1d1d1] border border-transparent'
            }`}
          >
            <Type className="w-3 h-3 text-cyan-400" />
            <span>Typography</span>
            {textProps.length > 0 && (
              <span className="text-[9px] px-1 rounded bg-cyan-400/20 text-cyan-300 font-mono">
                {textProps.length}
              </span>
            )}
          </button>

          {/* Tab 3: Colors & Styling */}
          <button
            id="tab-colors"
            type="button"
            onClick={() => setActiveTab('colors')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold tracking-wide transition-all flex-shrink-0 ${
              activeTab === 'colors'
                ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40 shadow-sm'
                : 'text-[#888888] hover:text-[#d1d1d1] border border-transparent'
            }`}
          >
            <Palette className="w-3 h-3 text-pink-400" />
            <span>Colors & Styling</span>
            {colorProps.length > 0 && (
              <span className="text-[9px] px-1 rounded bg-pink-400/20 text-pink-300 font-mono">
                {colorProps.length}
              </span>
            )}
          </button>

          {/* Tab 4: Controls & Toggles */}
          <button
            id="tab-controls"
            type="button"
            onClick={() => setActiveTab('controls')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold tracking-wide transition-all flex-shrink-0 ${
              activeTab === 'controls'
                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40 shadow-sm'
                : 'text-[#888888] hover:text-[#d1d1d1] border border-transparent'
            }`}
          >
            <Sliders className="w-3 h-3 text-violet-400" />
            <span>Controls & Toggles</span>
            {sliderAndToggleProps.length > 0 && (
              <span className="text-[9px] px-1 rounded bg-violet-400/20 text-violet-300 font-mono">
                {sliderAndToggleProps.length}
              </span>
            )}
          </button>
        </nav>

        {/* ======================================================== */}
        {/* TAB 1: Essential Properties Section                     */}
        {/* ======================================================== */}
        {activeTab === 'essential' && (
          <section id="essential-props-section" className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#2b2b2b] pb-1.5">
              <div className="flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <h4 className="text-xs font-bold text-white tracking-wide">
                  Curated Master Properties
                </h4>
              </div>
              <span className="text-[9px] text-amber-300 font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                Essential Graphics
              </span>
            </div>

            {essentialProps.length > 0 ? (
              <div className="space-y-2.5">
                {essentialProps.map((prop) => {
                  return (
                    <div
                      key={prop.id}
                      className="p-2.5 rounded-xl bg-[#202020] border border-[#2e2e2e] space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span
                            id={`layer-badge-${prop.id}`}
                            className="px-2 py-0.5 rounded bg-[#2a2a2a] text-[9px] font-medium text-[#e1e1e1] border border-[#383838] flex items-center gap-1"
                          >
                            <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                            <span>{prop.propertyName || prop.layerName}</span>
                          </span>
                          <span className="text-[8px] font-mono text-[#888888] uppercase">
                            ({prop.type})
                          </span>
                        </div>

                        <span className="text-[8px] px-1.5 py-0.2 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold uppercase tracking-wider">
                          ⭐ Master
                        </span>
                      </div>

                      {/* Property Type Specific Input for Essential Properties */}
                      {prop.type === 'text' && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[9px] text-[#777777] font-mono">
                            <span id={`font-pill-${prop.id}`} className="text-cyan-400">
                              <span id={`font-family-badge-${prop.id}`}>{prop.font || 'Montserrat-Bold'}</span> •{' '}
                              <span id={`font-size-badge-${prop.id}`}>{prop.fontSize ? `${prop.fontSize}px` : '48px'}</span>
                            </span>
                            <span id={`char-count-${prop.id}`}>
                              {String(currentValues[prop.id] || '').length} chars
                            </span>
                          </div>
                          <input
                            id={`text-input-${prop.id}`}
                            data-testid={`input-${prop.id}`}
                            type="text"
                            value={currentValues[prop.id] !== undefined ? currentValues[prop.id] : ''}
                            onChange={(e) => handleUpdateValue(prop.id, e.target.value)}
                            placeholder="Enter master text..."
                            className="w-full px-2.5 py-1.5 rounded-lg bg-[#141414] border border-[#333333] focus:border-cyan-500 focus:outline-none text-[#e1e1e1] text-[11px]"
                          />
                        </div>
                      )}

                      {prop.type === 'color' && (
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div
                              id={`color-preview-${prop.id}`}
                              className="w-6 h-6 rounded-md border border-white/20 shadow-xs"
                              style={{ backgroundColor: currentValues[prop.id] || '#1473E6' }}
                            />
                            <div className="space-y-0.5">
                              <span
                                id={`color-hex-${prop.id}`}
                                className="text-[10px] font-mono text-[#d1d1d1] block"
                              >
                                {currentValues[prop.id] || '#1473E6'}
                              </span>
                              {(() => {
                                const rgb = hexToRgb(currentValues[prop.id] || '#1473E6');
                                return rgb ? (
                                  <span
                                    id={`color-rgb-${prop.id}`}
                                    className="text-[8px] font-mono text-[#777777] block"
                                  >
                                    R:{rgb.r} G:{rgb.g} B:{rgb.b}
                                  </span>
                                ) : null;
                              })()}
                            </div>
                          </div>

                          <input
                            id={`color-input-${prop.id}`}
                            data-testid={`color-input-${prop.id}`}
                            type="color"
                            value={currentValues[prop.id] || '#1473E6'}
                            onChange={(e) => handleUpdateValue(prop.id, e.target.value)}
                            className="w-7 h-6 rounded cursor-pointer bg-transparent border border-[#383838] p-0.5"
                          />
                        </div>
                      )}

                      {prop.type === 'slider' && (
                        <div className="flex items-center justify-between gap-2">
                          <input
                            id={`slider-input-${prop.id}`}
                            data-testid={`slider-input-${prop.id}`}
                            type="range"
                            min={prop.min !== undefined ? prop.min : 0}
                            max={prop.max !== undefined ? prop.max : 100}
                            step={1}
                            value={currentValues[prop.id] !== undefined ? Number(currentValues[prop.id]) : 0}
                            onChange={(e) => handleUpdateValue(prop.id, parseFloat(e.target.value))}
                            className="flex-1 h-1.5 bg-[#141414] rounded-lg appearance-none cursor-pointer accent-[#1473E6]"
                          />
                          <div className="flex items-center gap-0.5 font-mono text-[9px] text-blue-300 w-12 justify-end">
                            <span id={`slider-val-${prop.id}`}>
                              {currentValues[prop.id] !== undefined ? currentValues[prop.id] : 0}
                            </span>
                            <span id={`slider-unit-${prop.id}`}>
                              {prop.propertyName.toLowerCase().includes('angle')
                                ? '°'
                                : prop.propertyName.toLowerCase().includes('opacity')
                                ? '%'
                                : 'px'}
                            </span>
                          </div>
                        </div>
                      )}

                      {prop.type === 'checkbox' && (
                        <div className="flex items-center justify-between">
                          <span
                            id={`checkbox-status-${prop.id}`}
                            className="text-[9px] font-mono text-emerald-400"
                          >
                            {currentValues[prop.id] ? 'ENABLED / ON' : 'DISABLED / OFF'}
                          </span>
                          <input
                            id={`checkbox-input-${prop.id}`}
                            data-testid={`checkbox-input-${prop.id}`}
                            type="checkbox"
                            checked={Boolean(currentValues[prop.id])}
                            onChange={(e) => handleUpdateValue(prop.id, e.target.checked)}
                            className="w-4 h-4 rounded text-blue-600 bg-[#141414] border-[#383838] cursor-pointer"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[#1d1d1d] border border-[#2b2b2b] text-center space-y-2">
                <Info className="w-5 h-5 text-amber-400 mx-auto opacity-70" />
                <p className="text-[11px] text-[#aaaaaa]">
                  No author-curated Master Properties detected for this composition.
                </p>
                <p className="text-[9px] text-[#6e6e6e]">
                  Explore all layer-level controls across the Typography, Colors, and Controls tabs.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('typography')}
                  className="px-3 py-1 rounded-lg bg-[#282828] hover:bg-[#303030] text-cyan-300 text-[10px] font-semibold border border-[#383838] transition-colors"
                >
                  Browse Typography Layer Properties
                </button>
              </div>
            )}
          </section>
        )}

        {/* ======================================================== */}
        {/* TAB 2: Typography (Text Layers)                          */}
        {/* ======================================================== */}
        {activeTab === 'typography' && (
          <section id="typography-section" className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#2b2b2b] pb-1.5">
              <div className="flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-cyan-400" />
                <h4 className="text-xs font-bold text-white tracking-wide">
                  Text Layers & Typography
                </h4>
              </div>
              <span className="text-[9px] text-cyan-300 font-mono bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                {textProps.length} Layer{textProps.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div id={`text-props-${item.id}`} className="space-y-2.5">
              {textProps.length > 0 ? (
                textProps.map((prop) => {
                  const val =
                    currentValues[prop.id] !== undefined
                      ? String(currentValues[prop.id])
                      : String(prop.defaultValue || '');

                  return (
                    <div
                      key={prop.id}
                      className="p-2.5 rounded-xl bg-[#202020] border border-[#2e2e2e] space-y-2"
                    >
                      {/* Layer Name Badge & Font Family/Size Badges */}
                      <div className="flex items-center justify-between gap-1.5 flex-wrap">
                        <div
                          id={`layer-badge-${prop.id}`}
                          className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#2a2a2a] border border-[#383838] text-[#e1e1e1] text-[9px] font-medium"
                          title={prop.layerName}
                        >
                          <Type className="w-2.5 h-2.5 text-cyan-400 flex-shrink-0" />
                          <span className="truncate max-w-[140px]">{prop.layerName}</span>
                        </div>

                        {/* Font Family & Size Badges */}
                        <div
                          id={`font-pill-${prop.id}`}
                          className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#16202c] border border-cyan-500/30 text-cyan-300 font-mono text-[8px]"
                        >
                          <span id={`font-family-badge-${prop.id}`}>
                            {prop.font || 'Montserrat-Bold'}
                          </span>
                          <span>•</span>
                          <span id={`font-size-badge-${prop.id}`}>
                            {prop.fontSize ? `${prop.fontSize}px` : '48px'}
                          </span>
                        </div>
                      </div>

                      {/* Text Input & Live Character Count */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[8px] font-mono text-[#777777]">
                          <span>Live Text Content:</span>
                          <span id={`char-count-${prop.id}`}>{val.length} chars</span>
                        </div>

                        <input
                          id={`text-input-${prop.id}`}
                          data-testid={`input-${prop.id}`}
                          type="text"
                          value={val}
                          onChange={(e) => handleUpdateValue(prop.id, e.target.value)}
                          placeholder="Customize text layer content..."
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[#141414] border border-[#333333] focus:border-cyan-500 focus:outline-none text-[#e1e1e1] font-mono text-[11px] transition-colors"
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-[10px] text-[#6e6e6e] italic">
                  No text layers discovered in this element.
                </p>
              )}
            </div>
          </section>
        )}

        {/* ======================================================== */}
        {/* TAB 3: Colors & Styling Section                          */}
        {/* ======================================================== */}
        {activeTab === 'colors' && (
          <section id="colors-section" className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#2b2b2b] pb-1.5">
              <div className="flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-pink-400" />
                <h4 className="text-xs font-bold text-white tracking-wide">
                  Brand Colors & Palettes
                </h4>
              </div>
              <span className="text-[9px] text-pink-300 font-mono bg-pink-500/10 px-2 py-0.5 rounded border border-pink-500/20">
                {colorProps.length} Color{colorProps.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Quick "Brand Palette" Swatches Bar */}
            <div className="p-2.5 rounded-xl bg-[#202020] border border-[#2e2e2e] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] uppercase tracking-wider text-[#8e8e8e] font-semibold">
                  Quick Brand Palette Swatches:
                </span>
                <span className="text-[8px] text-[#666666] italic">Single-click apply</span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {BRAND_PALETTE.map((p) => {
                  return (
                    <button
                      key={p.id}
                      id={`brand-palette-${p.id}`}
                      type="button"
                      onClick={() => handleApplyBrandColor(p.hex)}
                      className="group flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#181818] hover:bg-[#252525] border border-[#333333] hover:border-[#555555] transition-all text-left"
                      title={`Assign ${p.name} (${p.hex})`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-xs flex-shrink-0 group-hover:scale-110 transition-transform"
                        style={{ backgroundColor: p.hex }}
                      />
                      <span className="text-[9px] font-medium text-[#cccccc] group-hover:text-white">
                        {p.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color Properties List */}
            <div className="space-y-2.5">
              {colorProps.length > 0 ? (
                colorProps.map((prop) => {
                  const currentColor =
                    currentValues[prop.id] !== undefined
                      ? currentValues[prop.id]
                      : prop.defaultValue || '#1473E6';
                  const rgb = hexToRgb(currentColor);

                  return (
                    <div
                      key={prop.id}
                      onClick={() => setActiveColorPropId(prop.id)}
                      className={`p-2.5 rounded-xl bg-[#202020] border transition-all space-y-2 ${
                        activeColorPropId === prop.id
                          ? 'border-[#1473E6] ring-1 ring-[#1473E6]/40'
                          : 'border-[#2e2e2e]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <div
                          id={`layer-badge-${prop.id}`}
                          className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#2a2a2a] border border-[#383838] text-[#e1e1e1] text-[9px] font-medium"
                        >
                          <Palette className="w-2.5 h-2.5 text-pink-400 flex-shrink-0" />
                          <span className="truncate max-w-[140px]">{prop.propertyName}</span>
                        </div>

                        <span className="text-[8px] font-mono text-[#777777]">
                          Layer: {prop.layerName}
                        </span>
                      </div>

                      {/* Swatch, Hex Input, RGB Indicators */}
                      <div className="flex items-center justify-between gap-2 bg-[#171717] p-2 rounded-lg border border-[#2b2b2b]">
                        <div className="flex items-center gap-2.5">
                          {/* Color Swatch Preview */}
                          <div
                            id={`color-preview-${prop.id}`}
                            className="w-7 h-7 rounded-lg border border-white/20 shadow-sm flex-shrink-0"
                            style={{ backgroundColor: currentColor }}
                          />

                          <div className="space-y-0.5">
                            {/* Hex Input */}
                            <div className="flex items-center gap-1">
                              <span className="text-[9px] text-[#777777] font-mono">HEX:</span>
                              <input
                                id={`color-hex-${prop.id}`}
                                type="text"
                                value={currentColor}
                                onChange={(e) => handleUpdateValue(prop.id, e.target.value)}
                                className="w-20 px-1.5 py-0.5 rounded bg-[#101010] border border-[#333333] focus:border-[#1473E6] focus:outline-none text-[10px] font-mono text-white"
                              />
                            </div>

                            {/* RGB Indicators */}
                            {rgb && (
                              <div
                                id={`color-rgb-${prop.id}`}
                                className="text-[8px] font-mono text-[#8e8e8e]"
                              >
                                R: {rgb.r} G: {rgb.g} B: {rgb.b}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Native Color Picker Swatch */}
                        <input
                          id={`color-input-${prop.id}`}
                          data-testid={`color-input-${prop.id}`}
                          type="color"
                          value={currentColor}
                          onChange={(e) => handleUpdateValue(prop.id, e.target.value)}
                          className="w-8 h-7 rounded cursor-pointer bg-transparent border border-[#383838] p-0.5"
                          title="Pick custom color"
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-[10px] text-[#6e6e6e] italic">
                  No color controls discovered in this element.
                </p>
              )}
            </div>
          </section>
        )}

        {/* ======================================================== */}
        {/* TAB 4: Controls & Toggles Section                        */}
        {/* ======================================================== */}
        {activeTab === 'controls' && (
          <section id="controls-section" className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#2b2b2b] pb-1.5">
              <div className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-violet-400" />
                <h4 className="text-xs font-bold text-white tracking-wide">
                  Sliders & Toggles
                </h4>
              </div>
              <span className="text-[9px] text-violet-300 font-mono bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20">
                {sliderAndToggleProps.length} Controls
              </span>
            </div>

            <div id={`controls-section-${item.id}`} className="space-y-2.5">
              {sliderAndToggleProps.length > 0 ? (
                sliderAndToggleProps.map((prop) => {
                  if (prop.type === 'slider') {
                    const min = prop.min !== undefined ? prop.min : 0;
                    const max = prop.max !== undefined ? prop.max : 100;
                    const currentVal =
                      currentValues[prop.id] !== undefined
                        ? Number(currentValues[prop.id])
                        : typeof prop.defaultValue === 'number'
                        ? prop.defaultValue
                        : 0;

                    const unit = prop.propertyName.toLowerCase().includes('angle')
                      ? '°'
                      : prop.propertyName.toLowerCase().includes('opacity')
                      ? '%'
                      : 'px';

                    return (
                      <div
                        key={prop.id}
                        className="p-2.5 rounded-xl bg-[#202020] border border-[#2e2e2e] space-y-2"
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <div
                            id={`layer-badge-${prop.id}`}
                            className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#2a2a2a] border border-[#383838] text-[#e1e1e1] text-[9px] font-medium"
                          >
                            <Sliders className="w-2.5 h-2.5 text-blue-400 flex-shrink-0" />
                            <span className="truncate max-w-[140px]">{prop.propertyName}</span>
                          </div>

                          <div className="flex items-center gap-1 font-mono text-[9px] text-blue-300">
                            <span id={`slider-val-${prop.id}`}>{currentVal}</span>
                            <span id={`slider-unit-${prop.id}`} className="text-[#777777]">
                              {unit}
                            </span>
                          </div>
                        </div>

                        {/* Interactive Range Bar & Numeric Input */}
                        <div className="flex items-center gap-2">
                          <input
                            id={`slider-input-${prop.id}`}
                            data-testid={`slider-input-${prop.id}`}
                            type="range"
                            min={min}
                            max={max}
                            step={max > 100 ? 1 : 0.5}
                            value={currentVal}
                            onChange={(e) => handleUpdateValue(prop.id, parseFloat(e.target.value))}
                            className="flex-1 h-1.5 bg-[#141414] rounded-lg appearance-none cursor-pointer accent-[#1473E6]"
                          />
                          <input
                            type="number"
                            value={currentVal}
                            onChange={(e) => handleUpdateValue(prop.id, parseFloat(e.target.value) || 0)}
                            className="w-12 px-1 py-0.5 rounded bg-[#141414] border border-[#333333] text-[9px] font-mono text-center text-white focus:outline-none"
                          />
                        </div>
                      </div>
                    );
                  }

                  if (prop.type === 'checkbox') {
                    const currentChecked =
                      currentValues[prop.id] !== undefined
                        ? Boolean(currentValues[prop.id])
                        : Boolean(prop.defaultValue);

                    return (
                      <div
                        key={prop.id}
                        className="p-2.5 rounded-xl bg-[#202020] border border-[#2e2e2e] flex items-center justify-between gap-2"
                      >
                        <div
                          id={`layer-badge-${prop.id}`}
                          className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#2a2a2a] border border-[#383838] text-[#e1e1e1] text-[9px] font-medium"
                        >
                          <CheckSquare className="w-2.5 h-2.5 text-emerald-400 flex-shrink-0" />
                          <span className="truncate max-w-[140px]">{prop.propertyName}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            id={`checkbox-status-${prop.id}`}
                            className="text-[9px] font-mono text-emerald-300"
                          >
                            {currentChecked ? 'ENABLED / ON' : 'DISABLED / OFF'}
                          </span>
                          <input
                            id={`checkbox-input-${prop.id}`}
                            data-testid={`checkbox-input-${prop.id}`}
                            type="checkbox"
                            checked={currentChecked}
                            onChange={(e) => handleUpdateValue(prop.id, e.target.checked)}
                            className="w-4 h-4 rounded text-blue-600 bg-[#141414] border-[#383838] cursor-pointer"
                          />
                        </div>
                      </div>
                    );
                  }

                  return null;
                })
              ) : (
                <p className="text-[10px] text-[#6e6e6e] italic">
                  No expression sliders or toggles discovered in this element.
                </p>
              )}
            </div>
          </section>
        )}

        {/* ======================================================== */}
        {/* Insertion & Placement Settings Section (Smart Retarget)   */}
        {/* ======================================================== */}
        <section
          id="retargeting-settings-section"
          className="pt-3 pb-2 border-t border-[#2a2a2a] space-y-3"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Maximize2 className="w-3.5 h-3.5 text-[#1473E6]" />
              <h3 className="text-xs font-bold text-[#e1e1e1] tracking-wide uppercase">
                Insertion & Placement Settings
              </h3>
            </div>
            {/* Scale Preview Badge */}
            <div
              id="scale-preview-badge"
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#1473E6]/15 border border-[#1473E6]/30 text-[#60a5fa] text-[10px] font-mono font-semibold"
            >
              <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
              <span>{scalePreviewBadgeText}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2.5 bg-[#1a1a1a] p-2.5 rounded-xl border border-[#292929]">
            {/* Scale Mode Selector */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <label htmlFor="scale-mode-select" className="font-semibold text-[#b5b5b5]">
                  Scale Mode
                </label>
                <span className="text-[9px] text-[#717171] font-mono">
                  {scaleMode === 'auto'
                    ? 'Aspect-preserving uniform fit'
                    : scaleMode === 'fill'
                    ? 'Fill frame without letterboxing'
                    : scaleMode === 'fit-width'
                    ? 'Match comp width'
                    : '100% native resolution'}
                </span>
              </div>
              <select
                id="scale-mode-select"
                data-testid="scale-mode-select"
                value={scaleMode}
                onChange={(e) => setScaleMode(e.target.value as any)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#222222] border border-[#333333] text-white text-[11px] font-medium focus:border-[#1473E6] focus:outline-none cursor-pointer"
              >
                <option value="auto">Auto Fit (Recommended)</option>
                <option value="fit-width">Fit Width</option>
                <option value="fill">Fill Comp</option>
                <option value="original">Original (100%)</option>
              </select>

              {/* Segmented Pill Selector for Quick 1-Click Access */}
              <div
                id="scale-mode-segmented"
                className="grid grid-cols-4 gap-1 p-1 bg-[#222222] rounded-lg border border-[#303030] mt-1"
              >
                {[
                  { id: 'auto', label: 'Auto Fit' },
                  { id: 'fit-width', label: 'Fit Width' },
                  { id: 'fill', label: 'Fill Comp' },
                  { id: 'original', label: 'Original' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    id={`scale-mode-${mode.id}`}
                    data-scale-mode={mode.id}
                    onClick={() => setScaleMode(mode.id as any)}
                    className={`px-1.5 py-1 rounded text-[10px] font-semibold truncate transition-all ${
                      scaleMode === mode.id
                        ? 'bg-[#1473E6] text-white shadow-xs'
                        : 'text-[#8e8e8e] hover:text-[#e1e1e1] hover:bg-[#2a2a2a]'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Position Mode Selector (Segmented Control) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <label className="font-semibold text-[#b5b5b5]">
                  Position Mode
                </label>
                <span className="text-[9px] text-[#717171] font-mono">
                  {positionMode === 'center'
                    ? 'Comp Center [50%, 50%]'
                    : positionMode === 'lower-third'
                    ? 'Lower 20% Safe Margins'
                    : 'Upper 25% Safe Margins'}
                </span>
              </div>
              <div
                id="position-mode-select"
                className="grid grid-cols-3 gap-1 p-1 bg-[#222222] rounded-lg border border-[#333333]"
              >
                <button
                  id="position-mode-center"
                  data-position-mode="center"
                  type="button"
                  onClick={() => setPositionMode('center')}
                  className={`px-2 py-1 rounded text-[10px] font-semibold transition-all ${
                    positionMode === 'center'
                      ? 'bg-[#1473E6] text-white shadow-xs'
                      : 'text-[#8e8e8e] hover:text-[#e1e1e1] hover:bg-[#2a2a2a]'
                  }`}
                >
                  Center
                </button>
                <button
                  id="position-mode-lower-third"
                  data-position-mode="lower-third"
                  type="button"
                  onClick={() => setPositionMode('lower-third')}
                  className={`px-2 py-1 rounded text-[10px] font-semibold transition-all ${
                    positionMode === 'lower-third'
                      ? 'bg-[#1473E6] text-white shadow-xs'
                      : 'text-[#8e8e8e] hover:text-[#e1e1e1] hover:bg-[#2a2a2a]'
                  }`}
                >
                  Lower Third
                </button>
                <button
                  id="position-mode-top-third"
                  data-position-mode="top-third"
                  type="button"
                  onClick={() => setPositionMode('top-third')}
                  className={`px-2 py-1 rounded text-[10px] font-semibold transition-all ${
                    positionMode === 'top-third'
                      ? 'bg-[#1473E6] text-white shadow-xs'
                      : 'text-[#8e8e8e] hover:text-[#e1e1e1] hover:bg-[#2a2a2a]'
                  }`}
                >
                  Top Banner
                </button>
              </div>
            </div>

            {/* Match Project Frame Rate Toggle */}
            <div className="pt-1 border-t border-[#2a2a2a]">
              <label
                htmlFor="match-fps-toggle"
                className="flex items-center justify-between p-1.5 rounded-lg hover:bg-[#242424] cursor-pointer transition-colors"
              >
                <div className="flex flex-col">
                  <span className="text-[11px] font-semibold text-[#e1e1e1]">
                    Match Project Frame Rate
                  </span>
                  <span className="text-[9px] text-[#717171]">
                    Conform composition frame rate to active project speed
                  </span>
                </div>
                <div className="relative inline-flex items-center">
                  <input
                    id="match-fps-toggle"
                    data-testid="match-fps-toggle"
                    type="checkbox"
                    checked={matchFps}
                    onChange={(e) => setMatchFps(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 bg-[#141414] border-[#383838] cursor-pointer accent-[#1473E6]"
                  />
                </div>
              </label>
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* Preset Manager Section (Saved Brand Presets)             */}
        {/* ======================================================== */}
        <section className="pt-2 border-t border-[#2a2a2a]">
          <PresetManager
            presets={item.presets || []}
            currentValues={currentValues}
            onSavePreset={handleSavePreset}
            onApplyPreset={handleApplyPreset}
            onDeletePreset={handleDeletePreset}
          />
        </section>
      </div>

      {/* 4. Primary Action Sticky Bottom Footer */}
      <footer className="sticky bottom-0 left-0 right-0 p-3 bg-[#181818]/95 backdrop-blur-md border-t border-[#2d2d2d] flex flex-col gap-2 z-20 flex-shrink-0">
        {/* Sync Toast Feedback Banner */}
        {syncToast && (
          <div
            id="sync-toast"
            role="status"
            className="flex items-center justify-between gap-2 p-2 rounded-lg bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 text-[11px] font-semibold animate-in fade-in duration-200"
          >
            <div className="flex items-center gap-1.5 truncate">
              <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span className="truncate">
                Updated {syncToast.updatedCount} {syncToast.updatedCount === 1 ? 'property' : 'properties'} on layer '{syncToast.layerName}'!
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSyncToast(null)}
              className="text-emerald-400 hover:text-white p-0.5 rounded cursor-pointer"
              title="Dismiss sync notification"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Sync Error Banner */}
        {syncError && (
          <div
            id="sync-error"
            role="alert"
            className="flex items-center justify-between gap-2 p-2 rounded-lg bg-rose-950/90 border border-rose-500/50 text-rose-200 text-[11px] font-semibold animate-in fade-in duration-200"
          >
            <div className="flex items-center gap-1.5 truncate">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
              <span className="truncate">{syncError}</span>
            </div>
            <button
              type="button"
              onClick={() => setSyncError(null)}
              className="text-rose-400 hover:text-white p-0.5 rounded cursor-pointer"
              title="Dismiss error notification"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Sync to Selected Timeline Layer Action Button */}
        <button
          id="sync-selected-layer-btn"
          type="button"
          onClick={handleSyncToSelectedLayer}
          disabled={isSyncing}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#222222] hover:bg-[#2b2b2b] active:bg-[#1a1a1a] text-cyan-300 hover:text-cyan-200 border border-cyan-500/30 text-[11px] font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
          title="Push current customized parameters directly to selected layer in After Effects timeline"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Syncing to Selected Layer...' : 'Sync to Selected Timeline Layer'}</span>
        </button>

        <div className="flex items-center justify-between gap-2">
          {/* Copy Parameter JSON Button */}
          <button
            id="copy-params-btn"
            type="button"
            onClick={handleCopyParams}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#252525] hover:bg-[#2e2e2e] active:bg-[#1a1a1a] text-[#cccccc] hover:text-white border border-[#383838] text-[11px] font-semibold transition-all shadow-xs flex-1 justify-center"
            title="Copy current customized parameters as JSON to clipboard"
          >
            {copySuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300">JSON Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Parameter JSON</span>
              </>
            )}
          </button>

          {/* Insert Customized to Timeline Button */}
          <button
            id="apply-and-insert-btn"
            type="button"
            onClick={handleApplyAndInsert}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1473E6] hover:bg-[#0d66d0] active:bg-blue-800 text-white text-[11px] font-bold shadow-md shadow-blue-900/40 transition-all transform hover:scale-[1.01] active:scale-[0.99] flex-1 justify-center"
            title="Package parameters and insert into After Effects timeline"
          >
            {insertSuccess ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Inserted to Timeline!</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Insert Customized to Timeline</span>
              </>
            )}
          </button>
        </div>
      </footer>
    </aside>
  );
};
