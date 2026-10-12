import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutGrid,
  Grid,
} from 'lucide-react';
import { LibraryItem } from '../../types/library';
import { AssetCard } from './AssetCard';
import { EmptyCatalogState } from './EmptyCatalogState';

export type ViewDensity = 'comfortable' | 'compact';

interface AssetGridProps {
  items: LibraryItem[];
  favorites: Record<string, boolean>;
  onToggleFavorite: (id: string) => void;
  onInsert?: (item: LibraryItem) => void;
  onDeleteItem: (id: string) => void;
  onUpdateItem: (item: LibraryItem) => Promise<void>;
  storagePath: string;
  onClearFilters: () => void;
  onImportAep: () => void;
  searchQuery?: string;
  activeCategory?: string;
  onAddMockItem?: () => Promise<void>;
  onInitLibraryFolder?: () => Promise<void>;
  isStorageLoading?: boolean;
  onCustomize?: (item: LibraryItem) => void;
  onDragStart?: (item: LibraryItem, e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  draggedItemId?: string | null;
}

export const AssetGrid: React.FC<AssetGridProps> = ({
  items,
  favorites,
  onToggleFavorite,
  onInsert,
  onDeleteItem,
  onUpdateItem,
  storagePath,
  onClearFilters,
  onImportAep,
  searchQuery,
  activeCategory,
  onAddMockItem,
  onInitLibraryFolder,
  isStorageLoading = false,
  onCustomize,
  onDragStart,
  onDragEnd,
  draggedItemId,
}) => {
  const [viewDensity, setViewDensity] = useState<ViewDensity>(() => {
    try {
      return (localStorage.getItem('ae_element_vault_density') as ViewDensity) || 'comfortable';
    } catch {
      return 'comfortable';
    }
  });

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Set selected item on first load or when items change
  useEffect(() => {
    if (items.length > 0) {
      if (!selectedItemId || !items.some((i) => i.id === selectedItemId)) {
        setSelectedItemId(items[0].id);
      }
    } else {
      setSelectedItemId(null);
    }
  }, [items, selectedItemId]);

  const handleDensityChange = (density: ViewDensity) => {
    setViewDensity(density);
    try {
      localStorage.setItem('ae_element_vault_density', density);
    } catch {}
  };

  // Keyboard navigation across the grid
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (items.length === 0) return;
    const currentIndex = items.findIndex((i) => i.id === selectedItemId);
    const cols = viewDensity === 'compact' ? 3 : 2; // Approximate column step

    switch (e.key) {
      case 'ArrowRight': {
        e.preventDefault();
        const next = Math.min(currentIndex + 1, items.length - 1);
        setSelectedItemId(items[next].id);
        break;
      }
      case 'ArrowLeft': {
        e.preventDefault();
        const prev = Math.max(currentIndex - 1, 0);
        setSelectedItemId(items[prev].id);
        break;
      }
      case 'ArrowDown': {
        e.preventDefault();
        const nextRow = Math.min(currentIndex + cols, items.length - 1);
        setSelectedItemId(items[nextRow].id);
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        const prevRow = Math.max(currentIndex - cols, 0);
        setSelectedItemId(items[prevRow].id);
        break;
      }
      case 'Enter':
      case ' ': {
        e.preventDefault();
        if (selectedItemId) {
          const item = items.find((i) => i.id === selectedItemId);
          if (item && onInsert) {
            onInsert(item);
          }
        }
        break;
      }
      default:
        break;
    }
  };

  if (items.length === 0) {
    return (
      <EmptyCatalogState
        onClearFilters={onClearFilters}
        onImportAep={onImportAep}
        searchQuery={searchQuery}
        activeCategory={activeCategory}
        onAddMockItem={onAddMockItem}
        onInitLibraryFolder={onInitLibraryFolder}
        isStorageLoading={isStorageLoading}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="flex flex-col h-full focus:outline-none select-none"
    >
      {/* Grid Toolbar: Item Counts & View Density Switcher */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#2b2b2b] bg-[#1a1a1a]/80 text-[10px] text-[#8e8e8e]">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-[#e1e1e1]">
            {items.length} Element{items.length !== 1 ? 's' : ''}
          </span>
          {activeCategory && activeCategory !== 'All' && (
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
              {activeCategory}
            </span>
          )}
        </div>

        {/* View Density Switcher */}
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-[#6e6e6e] uppercase tracking-wider font-semibold mr-1">
            Density:
          </span>

          <div className="flex items-center p-0.5 rounded-lg bg-[#141414] border border-[#2e2e2e]">
            {/* Comfortable Grid */}
            <button
              id="density-comfortable-btn"
              type="button"
              onClick={() => handleDensityChange('comfortable')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-semibold transition-all ${
                viewDensity === 'comfortable'
                  ? 'bg-[#1473E6] text-white shadow-sm'
                  : 'text-[#8e8e8e] hover:text-[#d1d1d1]'
              }`}
              title="Comfortable Grid (Large visual 16:9 cards)"
            >
              <LayoutGrid className="w-3 h-3" />
              <span>Comfortable</span>
            </button>

            {/* Compact Grid */}
            <button
              id="density-compact-btn"
              type="button"
              onClick={() => handleDensityChange('compact')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-semibold transition-all ${
                viewDensity === 'compact'
                  ? 'bg-[#1473E6] text-white shadow-sm'
                  : 'text-[#8e8e8e] hover:text-[#d1d1d1]'
              }`}
              title="Compact Grid (Denser multi-column layout for power users)"
            >
              <Grid className="w-3 h-3" />
              <span>Compact</span>
            </button>
          </div>
        </div>
      </div>

      {/* Responsive Asset Cards Grid */}
      <div className="flex-1 overflow-y-auto p-3">
        <div
          id="asset-grid-container"
          className={
            viewDensity === 'comfortable'
              ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3'
              : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2'
          }
        >
          {items.map((item) => (
            <AssetCard
              key={item.id}
              item={item}
              isSelected={selectedItemId === item.id}
              isCompact={viewDensity === 'compact'}
              isFavorited={Boolean(favorites[item.id])}
              onSelect={(selected) => setSelectedItemId(selected.id)}
              onToggleFavorite={onToggleFavorite}
              onInsert={onInsert}
              onDeleteItem={onDeleteItem}
              onUpdateItem={onUpdateItem}
              storagePath={storagePath}
              onCustomize={onCustomize}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              isDragging={draggedItemId === item.id}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
