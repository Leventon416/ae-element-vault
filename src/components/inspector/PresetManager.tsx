import React, { useState } from 'react';
import { Bookmark, Plus, Check, Trash2, Tag } from 'lucide-react';
import { ParameterPreset } from '../../types/library';

interface PresetManagerProps {
  presets: ParameterPreset[];
  currentValues?: Record<string, any>;
  onSavePreset: (name: string) => Promise<void>;
  onApplyPreset: (preset: ParameterPreset) => void;
  onDeletePreset?: (presetId: string) => Promise<void>;
}

export const PresetManager: React.FC<PresetManagerProps> = ({
  presets,
  currentValues = {},
  onSavePreset,
  onApplyPreset,
  onDeletePreset,
}) => {
  const [newPresetName, setNewPresetName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newPresetName.trim();
    if (!name) return;

    setIsSaving(true);
    try {
      await onSavePreset(name);
      setNewPresetName('');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to save preset:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleApply = (preset: ParameterPreset) => {
    setActivePresetId(preset.id);
    onApplyPreset(preset);
  };

  return (
    <div
      id="preset-manager-section"
      className="p-3 rounded-xl bg-[#1e1e1e] border border-[#333333] space-y-3 select-none"
    >
      <div className="flex items-center justify-between border-b border-[#2b2b2b] pb-2">
        <div className="flex items-center gap-1.5">
          <Bookmark className="w-3.5 h-3.5 text-amber-400" />
          <h4 className="text-xs font-bold text-white tracking-wide">
            Brand Presets & Saved Styles
          </h4>
          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono">
            {presets.length} Saved • {Object.keys(currentValues).length} Params
          </span>
        </div>
      </div>

      {/* Save Preset Form */}
      <form onSubmit={handleSave} className="flex items-center gap-1.5">
        <div className="relative flex-1">
          <input
            id="preset-name-input"
            type="text"
            value={newPresetName}
            onChange={(e) => setNewPresetName(e.target.value)}
            placeholder="e.g. Brand Style - Dark Blue..."
            className="w-full px-2.5 py-1.5 rounded-lg bg-[#141414] border border-[#333333] focus:border-[#1473E6] focus:outline-none text-[#e1e1e1] text-[11px] placeholder-[#666666] transition-colors"
          />
        </div>

        <button
          id="save-preset-btn"
          type="submit"
          disabled={!newPresetName.trim() || isSaving}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1473E6] hover:bg-[#0d66d0] active:bg-blue-800 disabled:opacity-40 disabled:pointer-events-none text-white text-[11px] font-semibold transition-all shadow-sm shadow-blue-900/30 flex-shrink-0"
        >
          {saveSuccess ? (
            <>
              <Check className="w-3 h-3 text-emerald-300" />
              <span>Saved!</span>
            </>
          ) : (
            <>
              <Plus className="w-3 h-3" />
              <span>Save as Preset</span>
            </>
          )}
        </button>
      </form>

      {/* Saved Presets Pills / List */}
      <div className="space-y-1.5">
        <span className="text-[9px] uppercase tracking-wider text-[#777777] font-semibold block">
          One-Click Brand Styles:
        </span>

        {presets.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {presets.map((preset) => {
              const isActive = activePresetId === preset.id;
              // Provide multiple id variants for flexible query matching
              const normalizedName = preset.name.toLowerCase().replace(/\s+/g, '-');
              const rawSlug = preset.name.replace(/\s+/g, '-');

              return (
                <div
                  key={preset.id}
                  id={`preset-pill-${normalizedName}`}
                  data-preset-id={preset.id}
                  data-preset-name={preset.name}
                  className={`group flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-lg border text-[10px] font-medium transition-all ${
                    isActive
                      ? 'bg-[#1473E6]/20 border-[#1473E6] text-white shadow-sm'
                      : 'bg-[#252525] hover:bg-[#2b2b2b] border-[#383838] text-[#cccccc] hover:text-white'
                  }`}
                >
                  <button
                    id={normalizedName !== rawSlug ? `preset-pill-${rawSlug}` : undefined}
                    type="button"
                    onClick={() => handleApply(preset)}
                    className="flex items-center gap-1 text-left"
                    title={`Apply "${preset.name}" preset values`}
                  >
                    <Tag className="w-2.5 h-2.5 text-amber-400" />
                    <span>{preset.name}</span>
                  </button>

                  {onDeletePreset && (
                    <button
                      id={`delete-preset-btn-${preset.id}`}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeletePreset(preset.id);
                      }}
                      className="p-0.5 rounded text-[#666666] hover:text-rose-400 hover:bg-rose-500/10 transition-colors ml-0.5"
                      title="Delete preset"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-[10px] text-[#6e6e6e] italic">
            No brand presets saved yet. Customize parameters above and save your favorite styles for rapid reuse.
          </p>
        )}
      </div>
    </div>
  );
};
