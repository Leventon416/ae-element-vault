import React, { useRef, useEffect } from 'react';
import {
  Search,
  X,
  Volume2,
  Star,
  ArrowUpDown,
} from 'lucide-react';
import { SortOption } from '../../hooks/useLibrary';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  filterEssentialOnly: boolean;
  onToggleEssentialOnly: () => void;
  filterHasAudio: boolean;
  onToggleHasAudio: () => void;
  totalResultsCount: number;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  filterEssentialOnly,
  onToggleEssentialOnly,
  filterHasAudio,
  onToggleHasAudio,
  totalResultsCount,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Global keyboard shortcut to focus search (/ or Ctrl+F / Cmd+F)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if already inside an input or textarea
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if (e.key === '/' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f')) {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 bg-[#252525] border-b border-[#333333] select-none text-[11px]">
      {/* Search Input Box */}
      <div className="relative flex-1 min-w-[200px] max-w-md">
        <Search className="w-3.5 h-3.5 text-[#6e6e6e] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          ref={inputRef}
          id="library-search-input"
          data-testid="search-input"
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search library elements, tags, essential properties..."
          className="w-full pl-8 pr-16 py-1 rounded bg-[#191919] border border-[#333333] focus:border-[#1473E6] focus:outline-none text-[#e1e1e1] placeholder-[#6e6e6e] text-[11px] transition-colors"
        />

        {searchQuery ? (
          <button
            id="clear-search-btn"
            onClick={() => {
              onSearchChange('');
              inputRef.current?.focus();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-[#333333] text-[#909090] hover:text-white transition-colors"
            title="Clear search"
          >
            <X className="w-3 h-3" />
          </button>
        ) : (
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 px-1 py-0.2 rounded bg-[#2a2a2a] border border-[#383838] text-[9px] font-mono text-[#8e8e8e] pointer-events-none">
            /
          </kbd>
        )}
      </div>

      {/* Controls: Filter Toggles & Sort Dropdown */}
      <div className="flex items-center gap-1.5">
        {/* Filter Toggle: Essential Graphics Only */}
        <button
          id="filter-eg-toggle"
          onClick={onToggleEssentialOnly}
          className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold border transition-all ${
            filterEssentialOnly
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-sm'
              : 'bg-[#1e1e1e] border-[#333333] text-[#8e8e8e] hover:text-[#e1e1e1] hover:bg-[#2a2a2a]'
          }`}
          title="Filter to show only templates with Essential Properties"
        >
          <Star className={`w-3 h-3 ${filterEssentialOnly ? 'text-amber-400 fill-amber-400' : 'text-[#6e6e6e]'}`} />
          <span>Essential Only</span>
        </button>

        {/* Filter Toggle: Has Audio */}
        <button
          id="filter-audio-toggle"
          onClick={onToggleHasAudio}
          className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold border transition-all ${
            filterHasAudio
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-sm'
              : 'bg-[#1e1e1e] border-[#333333] text-[#8e8e8e] hover:text-[#e1e1e1] hover:bg-[#2a2a2a]'
          }`}
          title="Filter elements that contain audio tracks"
        >
          <Volume2 className={`w-3 h-3 ${filterHasAudio ? 'text-emerald-400' : 'text-[#6e6e6e]'}`} />
          <span>Has Audio</span>
        </button>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-1 pl-1 border-l border-[#333333]">
          <ArrowUpDown className="w-3 h-3 text-[#6e6e6e]" />
          <select
            id="sort-by-select"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="px-2 py-1 rounded bg-[#1e1e1e] border border-[#333333] text-[#e1e1e1] text-[10px] font-medium focus:border-[#1473E6] focus:outline-none cursor-pointer"
            title="Sort library items"
          >
            <option value="newest">Newest First</option>
            <option value="name">Name (A-Z)</option>
            <option value="duration">Duration (Short to Long)</option>
            <option value="essential">Essential Properties First</option>
          </select>
        </div>

        {/* Result Count Indicator */}
        <span
          id="results-counter"
          className="text-[10px] text-[#8e8e8e] font-mono px-1.5 py-0.5 rounded bg-[#1e1e1e] border border-[#333333]"
        >
          {totalResultsCount} items
        </span>
      </div>
    </div>
  );
};
