import React, { useState } from 'react';
import { ArrowDownToLine } from 'lucide-react';
import { LibraryItem } from '../../types/library';
import { AssetGrid } from './AssetGrid';
import { ElementInspector } from '../inspector/ElementInspector';
import { useAssetDrag } from '../../hooks/useAssetDrag';
import { InsertionOptions } from '../../lib/cepBridge';

interface LibraryCatalogViewProps {
  items: LibraryItem[];
  storagePath: string;
  favorites: Record<string, boolean>;
  onToggleFavorite: (id: string) => void;
  onDeleteItem: (id: string) => void;
  onUpdateItem: (item: LibraryItem) => Promise<void>;
  onAddMockItem: () => Promise<void>;
  onInitLibraryFolder: () => Promise<void>;
  isStorageLoading?: boolean;
  onClearFilters?: () => void;
  onImportAep?: () => void;
  onInsert?: (
    item: LibraryItem,
    customParams?: Record<string, any>,
    retargetOptions?: Partial<InsertionOptions>
  ) => void;
  searchQuery?: string;
  activeCategory?: string;
  sortBy?: string;
  filterEssentialOnly?: boolean;
  filterHasAudio?: boolean;
}

export const LibraryCatalogView: React.FC<LibraryCatalogViewProps> = ({
  items,
  storagePath,
  favorites,
  onToggleFavorite,
  onDeleteItem,
  onUpdateItem,
  onAddMockItem,
  onInitLibraryFolder,
  isStorageLoading = false,
  onClearFilters = () => {},
  onImportAep = () => {},
  onInsert,
  searchQuery,
  activeCategory,
  sortBy,
  filterEssentialOnly,
  filterHasAudio,
}) => {
  const [customizingItem, setCustomizingItem] = useState<LibraryItem | null>(null);
  // Persist parameter edits in local state while browsing across elements
  const [customizedValuesMap, setCustomizedValuesMap] = useState<Record<string, Record<string, any>>>({});

  // Ensure customizingItem is kept in sync if items list updates in background
  const activeCustomizingItem = customizingItem
    ? items.find((i) => i.id === customizingItem.id) || customizingItem
    : null;

  const handleCustomize = (item: LibraryItem) => {
    setCustomizingItem(item);
  };

  const handleCloseInspector = () => {
    setCustomizingItem(null);
  };

  const handleValuesChange = (newValues: Record<string, any>) => {
    if (activeCustomizingItem) {
      setCustomizedValuesMap((prev) => ({
        ...prev,
        [activeCustomizingItem.id]: newValues,
      }));
    }
  };

  // Reusable Drag & Drop Hook
  const {
    draggedItem,
    isDragging,
    isOverDropZone,
    handleDragStart,
    handleDragEnd,
    handleDropZoneDragOver,
    handleDropZoneDragEnter,
    handleDropZoneDragLeave,
    handleDropZoneDrop,
  } = useAssetDrag({
    items,
    onDropItem: (item) => {
      if (onInsert) {
        onInsert(item);
      }
    },
  });

  return (
    <div className="flex-1 h-full overflow-hidden flex flex-col relative">
      {/* Top Main Area: Asset Catalog Grid + Slide-Over Inspector */}
      <div className="flex-1 overflow-hidden flex relative min-h-0">
        {/* 1. Main Asset Catalog Grid */}
        <div className="flex-1 h-full overflow-hidden flex flex-col">
          <AssetGrid
            items={items}
            favorites={favorites}
            onToggleFavorite={onToggleFavorite}
            onInsert={onInsert}
            onDeleteItem={(id) => {
              if (customizingItem?.id === id) {
                setCustomizingItem(null);
              }
              onDeleteItem(id);
            }}
            onUpdateItem={onUpdateItem}
            storagePath={storagePath}
            onClearFilters={onClearFilters}
            onImportAep={onImportAep}
            searchQuery={searchQuery}
            activeCategory={activeCategory}
            sortBy={sortBy}
            filterEssentialOnly={filterEssentialOnly}
            filterHasAudio={filterHasAudio}
            onAddMockItem={onAddMockItem}
            onInitLibraryFolder={onInitLibraryFolder}
            isStorageLoading={isStorageLoading}
            onCustomize={handleCustomize}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            draggedItemId={draggedItem?.id}
          />
        </div>

        {/* 2. Slide-Over Parameter Customization Inspector Panel */}
        {activeCustomizingItem && (
          <div
            id="customization-inspector-panel"
            className="absolute inset-y-0 right-0 z-40 w-full sm:w-[480px] md:w-[520px] max-w-[90vw] h-full shadow-2xl transition-all duration-200 animate-in slide-in-from-right"
          >
            <ElementInspector
              item={activeCustomizingItem}
              initialValues={customizedValuesMap[activeCustomizingItem.id]}
              onClose={handleCloseInspector}
              onValuesChange={handleValuesChange}
              onUpdateItem={onUpdateItem}
              onInsert={onInsert}
              onInsertCustomized={(item, values, retargetOptions) =>
                onInsert && onInsert(item, values, retargetOptions)
              }
              storagePath={storagePath}
            />
          </div>
        )}
      </div>

      {/* 3. Global Drag Overlay & Timeline Simulator Docked at Bottom */}
      <div className="w-full flex-shrink-0 bg-[#161616] border-t border-[#262626] select-none">
        {/* Subtle Bottom Bar Indicator during drag */}
        {isDragging && (
          <div
            id="drag-timeline-indicator-bar"
            className="px-3 py-1.5 bg-[#1473E6]/10 border-b border-[#1473E6]/30 flex items-center justify-between text-xs text-blue-300 animate-in slide-in-from-bottom-1 duration-150"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span id="drag-indicator-text" className="font-medium text-[11px] text-[#93c5fd]">
                Drag onto After Effects Timeline or Composition Viewer to Insert
              </span>
            </div>
            {draggedItem && (
              <span
                id="dragged-item-pill"
                className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1473E6]/25 border border-blue-400/30 text-white font-semibold truncate max-w-[200px]"
              >
                {draggedItem.name}
              </span>
            )}
          </div>
        )}

        {/* In-Panel Quick Drop Zone (#quick-timeline-dropzone) */}
        <div
          id="quick-timeline-dropzone"
          data-testid="quick-timeline-dropzone"
          onDragOver={handleDropZoneDragOver}
          onDragEnter={handleDropZoneDragEnter}
          onDragLeave={handleDropZoneDragLeave}
          onDrop={(e) => {
            handleDropZoneDrop(e, (item) => {
              if (onInsert) {
                onInsert(item);
              }
            });
          }}
          className={`relative m-2.5 p-2.5 rounded-xl transition-all duration-200 border-2 border-dashed flex items-center justify-between gap-3 ${
            isOverDropZone
              ? 'border-[#1473E6] bg-[#1473E6]/25 shadow-[0_0_25px_rgba(20,115,230,0.5)] ring-2 ring-[#1473E6]/60 animate-pulse text-white cursor-copy'
              : isDragging
              ? 'border-[#1473E6]/70 bg-[#1473E6]/10 shadow-lg text-[#d1d1d1] cursor-pointer'
              : 'border-[#333333] hover:border-[#4d4d4d] bg-[#1c1c1c]/90 text-[#8e8e8e]'
          }`}
        >
          {/* Timeline Visual & Instructions */}
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Playhead CTI Marker / Icon */}
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                isOverDropZone
                  ? 'bg-[#1473E6] text-white shadow-md shadow-blue-900/60'
                  : isDragging
                  ? 'bg-[#1473E6]/30 text-cyan-300'
                  : 'bg-[#282828] text-[#8e8e8e]'
              }`}
            >
              <ArrowDownToLine className="w-3.5 h-3.5" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span
                  id="dropzone-status-title"
                  className={`text-xs font-bold ${
                    isOverDropZone ? 'text-white' : isDragging ? 'text-cyan-200' : 'text-[#e1e1e1]'
                  }`}
                >
                  {isOverDropZone
                    ? `Drop to Insert ${draggedItem ? `"${draggedItem.name}"` : 'Element'} at Playhead (CTI)`
                    : isDragging
                    ? 'Drop Here for Quick In-Panel Timeline Insertion'
                    : 'Quick Timeline Drop Zone'}
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-black/50 border border-white/10 text-cyan-400">
                  CTI
                </span>
              </div>
              <p id="dropzone-status-subtitle" className="text-[10px] text-[#7e7e7e] truncate mt-0.5">
                {isOverDropZone
                  ? 'Release mouse to insert directly into active composition'
                  : isDragging
                  ? 'Drop card here or drag out to AE Timeline / Comp Viewer'
                  : 'Drag and drop any element card here to insert into active comp'}
              </p>
            </div>
          </div>

          {/* Shortcut / Hint Badge */}
          <div className="flex items-center gap-2 flex-shrink-0 text-[10px] font-mono text-[#6e6e6e]">
            <span className="hidden sm:inline px-2 py-0.5 rounded bg-black/40 border border-[#2e2e2e]">
              Ctrl+Z to Undo
            </span>
            <div
              id="dropzone-indicator-light"
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                isOverDropZone
                  ? 'bg-cyan-400 shadow-[0_0_8px_#38bdf8]'
                  : isDragging
                  ? 'bg-[#1473E6]'
                  : 'bg-[#3a3a3a]'
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
