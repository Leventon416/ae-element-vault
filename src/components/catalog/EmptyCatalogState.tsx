import React from 'react';
import { Film, FilterX, UploadCloud, Sparkles, PlusCircle, FolderPlus } from 'lucide-react';

interface EmptyCatalogStateProps {
  onClearFilters: () => void;
  onImportAep: () => void;
  searchQuery?: string;
  activeCategory?: string;
  onAddMockItem?: () => Promise<void>;
  onInitLibraryFolder?: () => Promise<void>;
  isStorageLoading?: boolean;
}

export const EmptyCatalogState: React.FC<EmptyCatalogStateProps> = ({
  onClearFilters,
  onImportAep,
  searchQuery,
  activeCategory,
  onAddMockItem,
  onInitLibraryFolder,
  isStorageLoading = false,
}) => {
  const isFiltered = Boolean((searchQuery && searchQuery.trim().length > 0) || (activeCategory && activeCategory !== 'All'));

  return (
    <div
      id="empty-catalog-state"
      className="flex flex-col items-center justify-center p-8 text-center text-[#8e8e8e] space-y-4 max-w-md mx-auto select-none animate-in fade-in duration-200"
    >
      {/* Decorative Icon */}
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1e1e1e] to-[#141414] border border-[#333333] flex items-center justify-center shadow-lg shadow-black/40 ring-1 ring-white/5">
          <Film className="w-8 h-8 text-[#555555]" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#1473E6]/20 border border-[#1473E6]/40 flex items-center justify-center text-[#1473E6]">
          <Sparkles className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-[#e1e1e1] tracking-wide">
          {isFiltered ? 'No Matching Elements Found' : 'Your Element Vault is Empty'}
        </h3>
        <p className="text-[11px] text-[#888888] leading-relaxed max-w-xs mx-auto">
          {isFiltered
            ? `No assets match your current filters${searchQuery ? ` ("${searchQuery}")` : ''}${activeCategory && activeCategory !== 'All' ? ` in ${activeCategory}` : ''}. Try resetting filters or importing more projects.`
            : 'Drop any .aep project file or dissect your active After Effects workspace to automatically extract and catalog isolated motion graphics.'}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
        {isFiltered ? (
          <button
            id="clear-filters-btn"
            type="button"
            onClick={onClearFilters}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#252525] hover:bg-[#2e2e2e] active:bg-[#383838] text-white text-[11px] font-semibold transition-all border border-[#383838] shadow-sm hover:border-[#484848]"
            title="Reset category tabs, search query, and property filters"
          >
            <FilterX className="w-3.5 h-3.5 text-blue-400" />
            <span>Clear Filters</span>
          </button>
        ) : (
          <>
            {onAddMockItem && (
              <button
                id="add-mock-item-btn-empty"
                type="button"
                onClick={onAddMockItem}
                disabled={isStorageLoading}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#252525] hover:bg-[#2e2e2e] text-[#b3b3b3] hover:text-white text-[11px] font-semibold transition-all border border-[#383838]"
              >
                <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Add Mock Item</span>
              </button>
            )}

            {onInitLibraryFolder && (
              <button
                id="init-library-btn-empty"
                type="button"
                onClick={onInitLibraryFolder}
                disabled={isStorageLoading}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#252525] hover:bg-[#2e2e2e] text-[#b3b3b3] hover:text-white text-[11px] font-semibold transition-all border border-[#383838]"
              >
                <FolderPlus className="w-3.5 h-3.5 text-blue-400" />
                <span>Init Library Folder</span>
              </button>
            )}
          </>
        )}

        <button
          id="empty-import-btn"
          type="button"
          onClick={onImportAep}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#1473E6] hover:bg-[#0d66d0] active:bg-blue-800 text-white text-[11px] font-semibold transition-all shadow-md shadow-blue-900/40"
          title="Import and dissect an After Effects project (.aep)"
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span>Import .AEP</span>
        </button>
      </div>
    </div>
  );
};
