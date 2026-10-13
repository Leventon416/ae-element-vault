import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutGrid,
  Grid,
  Trash2,
  AlertTriangle,
  Loader2,
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
  onDeleteBatchItems?: (ids: string[]) => Promise<void>;
  onUpdateItem: (item: LibraryItem) => Promise<void>;
  storagePath: string;
  onClearFilters: () => void;
  onImportAep: () => void;
  searchQuery?: string;
  activeCategory?: string;
  sortBy?: string;
  filterEssentialOnly?: boolean;
  filterHasAudio?: boolean;
  onAddMockItem?: () => Promise<void>;
  onInitLibraryFolder?: () => Promise<void>;
  isStorageLoading?: boolean;
  onCustomize?: (item: LibraryItem) => void;
  onDragStart?: (item: LibraryItem, e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  draggedItemId?: string | null;
  deletingIds?: Set<string>;
}

export const AssetGrid: React.FC<AssetGridProps> = ({
  items,
  favorites,
  onToggleFavorite,
  onInsert,
  onDeleteItem,
  onDeleteBatchItems,
  onUpdateItem,
  storagePath,
  onClearFilters,
  onImportAep,
  searchQuery,
  activeCategory,
  sortBy,
  filterEssentialOnly,
  filterHasAudio,
  onAddMockItem,
  onInitLibraryFolder,
  isStorageLoading = false,
  onCustomize,
  onDragStart,
  onDragEnd,
  draggedItemId,
  deletingIds,
}) => {
  const [viewDensity, setViewDensity] = useState<ViewDensity>(() => {
    try {
      return (localStorage.getItem('ae_element_vault_density') as ViewDensity) || 'comfortable';
    } catch {
      return 'comfortable';
    }
  });

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [isBatchDeleting, setIsBatchDeleting] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Pagination for high-performance rendering (e.g. 200+ elements)
  const ITEMS_PER_PAGE = 24;
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Reset to page 1 whenever search, filter, or sorting changes
  useEffect(() => {
    setCurrentPage(1);
  }, [items, searchQuery, activeCategory, sortBy, filterEssentialOnly, filterHasAudio]);

  const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));
  const activePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (activePage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, items.length);
  const paginatedItems = items.slice(startIndex, endIndex);

  // Sync selectedIds with items when items change (e.g. after deletion or external updates)
  useEffect(() => {
    setSelectedIds((prev) => {
      if (prev.size === 0) return prev;
      const currentIds = new Set(items.map((i) => i.id));
      const next = new Set<string>();
      for (const id of prev) {
        if (currentIds.has(id)) next.add(id);
      }
      return next.size === prev.size ? prev : next;
    });
  }, [items]);

  // Master selection computations
  const isAllPaginatedSelected = paginatedItems.length > 0 && paginatedItems.every((item) => selectedIds.has(item.id));
  const isSomePaginatedSelected = paginatedItems.some((item) => selectedIds.has(item.id)) && !isAllPaginatedSelected;

  const handleToggleSelectAllPaginated = () => {
    if (isAllPaginatedSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const item of paginatedItems) {
          next.delete(item.id);
        }
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const item of paginatedItems) {
          next.add(item.id);
        }
        return next;
      });
    }
  };

  const handleSelectAllCatalog = () => {
    setSelectedIds(new Set(items.map((i) => i.id)));
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleToggleSelectCard = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleExecuteBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    setIsBatchDeleting(true);
    try {
      const ids = Array.from(selectedIds);
      setShowDeleteConfirm(false);
      setSelectedIds(new Set());
      if (onDeleteBatchItems) {
        await onDeleteBatchItems(ids);
      } else {
        for (const id of ids) {
          onDeleteItem(id);
        }
      }
    } catch (err) {
      console.error('Batch delete failed:', err);
    } finally {
      setIsBatchDeleting(false);
    }
  };

  // Scroll grid to top on page change
  useEffect(() => {
    if (containerRef.current) {
      const scrollableArea = containerRef.current.querySelector('#asset-grid-container')?.parentElement;
      if (scrollableArea) {
        scrollableArea.scrollTop = 0;
      }
    }
  }, [activePage]);

  // Set selected item on first load or when items change
  useEffect(() => {
    if (paginatedItems.length > 0) {
      if (!selectedItemId || !paginatedItems.some((i) => i.id === selectedItemId)) {
        setSelectedItemId(paginatedItems[0].id);
      }
    } else {
      setSelectedItemId(null);
    }
  }, [paginatedItems, selectedItemId]);

  const handleDensityChange = (density: ViewDensity) => {
    setViewDensity(density);
    try {
      localStorage.setItem('ae_element_vault_density', density);
    } catch {}
  };

  // Keyboard navigation across the grid
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (paginatedItems.length === 0) return;
    const currentIndex = paginatedItems.findIndex((i) => i.id === selectedItemId);
    const cols = viewDensity === 'compact' ? 3 : 2; // Approximate column step

    switch (e.key) {
      case 'ArrowRight': {
        e.preventDefault();
        const next = Math.min(currentIndex + 1, paginatedItems.length - 1);
        setSelectedItemId(paginatedItems[next].id);
        break;
      }
      case 'ArrowLeft': {
        e.preventDefault();
        const prev = Math.max(currentIndex - 1, 0);
        setSelectedItemId(paginatedItems[prev].id);
        break;
      }
      case 'ArrowDown': {
        e.preventDefault();
        const nextRow = Math.min(currentIndex + cols, paginatedItems.length - 1);
        setSelectedItemId(paginatedItems[nextRow].id);
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        const prevRow = Math.max(currentIndex - cols, 0);
        setSelectedItemId(paginatedItems[prevRow].id);
        break;
      }
      case 'Enter':
      case ' ': {
        e.preventDefault();
        if (selectedItemId) {
          const item = paginatedItems.find((i) => i.id === selectedItemId);
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
        <div className="flex items-center gap-2.5">
          {/* Master Select All Checkbox */}
          <label
            id="select-all-toolbar-label"
            className="flex items-center gap-1.5 cursor-pointer text-[10px] text-[#b0b0b0] hover:text-white px-2 py-0.5 rounded bg-[#1c1c1c] hover:bg-[#252525] border border-[#2e2e2e] transition-colors"
            title={isAllPaginatedSelected ? 'Deselect visible elements' : 'Select all visible elements on this page'}
          >
            <input
              id="select-all-checkbox"
              data-testid="select-all-checkbox"
              type="checkbox"
              checked={isAllPaginatedSelected}
              ref={(el) => {
                if (el) el.indeterminate = isSomePaginatedSelected;
              }}
              onChange={handleToggleSelectAllPaginated}
              className="w-3.5 h-3.5 rounded bg-[#141414] border-[#444] text-blue-500 accent-blue-500 cursor-pointer"
            />
            <span className="font-semibold text-white">Select All</span>
          </label>

          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-[#e1e1e1]">
              {items.length} Element{items.length !== 1 ? 's' : ''}
            </span>
            {activeCategory && activeCategory !== 'All' && (
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                {activeCategory}
              </span>
            )}
            {selectedIds.size > 0 && (
              <span
                id="selected-count-badge"
                className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold font-mono"
              >
                {selectedIds.size} selected
              </span>
            )}
          </div>
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
          {paginatedItems.map((item) => (
            <AssetCard
              key={item.id}
              item={item}
              isSelected={selectedIds.has(item.id)}
              onToggleSelect={handleToggleSelectCard}
              isCompact={viewDensity === 'compact'}
              isFavorited={Boolean(favorites[item.id])}
              isDeleting={Boolean(deletingIds?.has(item.id))}
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

      {/* Sticky / Floating Batch Actions Bar */}
      {selectedIds.size > 0 && (
        <div
          id="batch-actions-bar"
          role="region"
          aria-label="Batch actions toolbar"
          className="mx-3 my-2 p-2 rounded-xl bg-[#18181b]/95 border border-blue-500/40 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 text-white flex-shrink-0 animate-in slide-in-from-bottom-2 duration-150"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span
              id="batch-selected-count"
              className="px-2 py-0.5 rounded-md bg-blue-500/20 border border-blue-500/30 text-blue-300 font-mono text-xs font-bold"
            >
              {selectedIds.size}
            </span>
            <span className="text-xs font-medium text-neutral-200 truncate">
              {selectedIds.size === 1 ? 'element' : 'elements'} selected
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {selectedIds.size < items.length && (
              <button
                id="select-all-catalog-btn"
                type="button"
                onClick={handleSelectAllCatalog}
                className="px-2.5 py-1 rounded-lg bg-[#27272a] hover:bg-[#3f3f46] text-neutral-200 text-[11px] font-semibold border border-[#3f3f46] transition-colors"
                title="Select all elements across the entire catalog"
              >
                Select All ({items.length})
              </button>
            )}

            <button
              id="deselect-all-btn"
              type="button"
              onClick={handleDeselectAll}
              className="px-2.5 py-1 rounded-lg bg-[#27272a] hover:bg-[#3f3f46] text-neutral-300 text-[11px] font-semibold border border-[#3f3f46] transition-colors"
            >
              Deselect All
            </button>

            <button
              id="delete-selected-btn"
              type="button"
              disabled={isBatchDeleting}
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 active:bg-rose-700 disabled:opacity-50 text-white text-[11px] font-bold shadow-md shadow-rose-950 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected ({selectedIds.size})</span>
            </button>
          </div>
        </div>
      )}

      {/* Batch Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div
          id="batch-delete-confirm-modal"
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl bg-[#202022] border border-[#383838] p-4 shadow-2xl space-y-3 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs font-bold text-white">
                  Delete {selectedIds.size} Selected {selectedIds.size === 1 ? 'Element' : 'Elements'}?
                </h3>
                <p className="text-[10px] text-neutral-400 mt-0.5 leading-normal">
                  This will permanently remove the selected elements and their asset files from your vault. This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#2e2e30]">
              <button
                id="cancel-batch-delete-btn"
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 rounded-lg bg-[#2a2a2c] hover:bg-[#333336] text-neutral-300 text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                id="confirm-batch-delete-btn"
                type="button"
                disabled={isBatchDeleting}
                onClick={handleExecuteBatchDelete}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 active:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold transition-colors shadow-md"
              >
                {isBatchDeleting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>Delete {selectedIds.size} Elements</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pagination Controls Bar */}
      {totalPages > 1 && (
        <div
          id="pagination-controls-bar"
          className="flex items-center justify-between px-3 py-2 border-t border-[#2b2b2b] bg-[#1a1a1a] text-[10px] select-none flex-shrink-0"
        >
          <button
            id="prev-page-btn"
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={activePage === 1}
            className="px-2.5 py-1 rounded bg-[#252525] hover:bg-[#303030] disabled:opacity-30 disabled:pointer-events-none text-white font-medium border border-[#333333] transition-all cursor-pointer flex items-center gap-1"
          >
            <span>← Previous</span>
          </button>

          <span id="pagination-counter" className="text-[#a0a0a0] font-mono text-[10px]">
            Showing {startIndex + 1}-{endIndex} of {items.length} (Page {activePage} of {totalPages})
          </span>

          <button
            id="next-page-btn"
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={activePage === totalPages}
            className="px-2.5 py-1 rounded bg-[#252525] hover:bg-[#303030] disabled:opacity-30 disabled:pointer-events-none text-white font-medium border border-[#333333] transition-all cursor-pointer flex items-center gap-1"
          >
            <span>Next →</span>
          </button>
        </div>
      )}
    </div>
  );
};
