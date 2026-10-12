import React from 'react';
import {
  Layers,
  Type,
  AlignLeft,
  MoveRight,
  Share2,
  Star,
  Heart,
} from 'lucide-react';
import { CATEGORIES } from '../../hooks/useLibrary';

interface CategoryNavProps {
  activeCategory: string;
  onSelectCategory: (category: string) => void;
  categoryCounts: Record<string, number>;
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  All: Layers,
  Titles: Type,
  'Lower Thirds': AlignLeft,
  Transitions: MoveRight,
  Social: Share2,
  'Essential Graphics': Star,
  Favorites: Heart,
};

export const CategoryNav: React.FC<CategoryNavProps> = ({
  activeCategory,
  onSelectCategory,
  categoryCounts,
}) => {
  return (
    <nav className="flex items-center px-2 border-b border-[#333333] bg-[#1a1a1a] overflow-x-auto no-scrollbar select-none text-[11px] font-medium">
      <div className="flex items-center gap-0.5 py-1">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat;
          const count = categoryCounts[cat] ?? 0;
          const Icon = CATEGORY_ICONS[cat] || Layers;
          const slug = cat.toLowerCase().replace(/\s+/g, '-');

          return (
            <button
              key={cat}
              id={`category-tab-${slug}`}
              onClick={() => onSelectCategory(cat)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-all relative group flex-shrink-0 ${
                isActive
                  ? 'bg-[#252525] text-white font-semibold'
                  : 'text-[#8e8e8e] hover:text-[#e1e1e1] hover:bg-[#222222]'
              }`}
            >
              <Icon
                className={`w-3 h-3 ${
                  isActive
                    ? cat === 'Essential Graphics'
                      ? 'text-amber-400 fill-amber-400'
                      : cat === 'Favorites'
                      ? 'text-rose-400 fill-rose-400'
                      : 'text-[#1473E6]'
                    : 'text-[#6e6e6e] group-hover:text-[#b3b3b3]'
                }`}
              />
              <span className="ae-category-header tracking-wider">{cat}</span>
              <span
                id={`category-count-${slug}`}
                className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-medium ${
                  isActive
                    ? 'bg-[#1473E6] text-white'
                    : 'bg-[#2a2a2a] text-[#8e8e8e] group-hover:text-[#b3b3b3]'
                }`}
              >
                {count}
              </span>

              {/* Active Tab Indicator Bar in Adobe Blue */}
              {isActive && (
                <span className="absolute bottom-[-5px] left-1 right-1 h-[2px] bg-[#1473E6] rounded-full shadow-sm shadow-blue-500/50" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
