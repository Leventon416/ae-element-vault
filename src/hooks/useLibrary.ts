import { useState, useEffect, useMemo, useCallback } from 'react';
import { LibraryItem, LibraryDatabase } from '../types/library';
import {
  getLibrary,
  saveItem,
  deleteItem as deleteItemFromDb,
  initLibrary,
  getLibraryPath,
} from '../lib/storageService';
import { generateMockThumbnailSvg, generateMockScrubFrames } from '../lib/cepBridge';

export type SortOption = 'newest' | 'name' | 'duration' | 'essential';

export interface UseLibraryReturn {
  items: LibraryItem[];
  filteredItems: LibraryItem[];
  activeCategory: string;
  searchQuery: string;
  sortBy: SortOption;
  filterEssentialOnly: boolean;
  filterHasAudio: boolean;
  favorites: Record<string, boolean>;
  storagePath: string;
  isStorageLoading: boolean;
  storageStatusMsg: string | null;
  libraryDb: LibraryDatabase | null;
  categoryCounts: Record<string, number>;
  // Actions
  setActiveCategory: (cat: string) => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (sort: SortOption) => void;
  setFilterEssentialOnly: (val: boolean | ((prev: boolean) => boolean)) => void;
  setFilterHasAudio: (val: boolean | ((prev: boolean) => boolean)) => void;
  toggleFavorite: (itemId: string) => void;
  addItem: (item: LibraryItem) => Promise<void>;
  deleteItem: (itemId: string) => Promise<void>;
  refreshLibrary: () => Promise<void>;
  initLibraryFolder: () => Promise<void>;
  addMockItem: () => Promise<void>;
  updateItem: (item: LibraryItem) => Promise<void>;
}

export const CATEGORIES = [
  'All',
  'Titles',
  'Lower Thirds',
  'Transitions',
  'Social',
  'Essential Graphics',
  'Favorites',
] as const;

export function useLibrary(): UseLibraryReturn {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [libraryDb, setLibraryDb] = useState<LibraryDatabase | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterEssentialOnly, setFilterEssentialOnly] = useState<boolean>(false);
  const [filterHasAudio, setFilterHasAudio] = useState<boolean>(false);
  const [favorites, setFavorites] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('ae_element_vault_favorites');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [storagePath, setStoragePath] = useState<string>('');
  const [isStorageLoading, setIsStorageLoading] = useState<boolean>(false);
  const [storageStatusMsg, setStorageStatusMsg] = useState<string | null>(null);

  // Load database on mount
  const refreshLibrary = useCallback(async () => {
    setIsStorageLoading(true);
    try {
      const p = getLibraryPath();
      setStoragePath(p);
      const db = await getLibrary();
      setLibraryDb(db);
      setItems(db.items || []);
    } catch (err: any) {
      console.error('Error refreshing library:', err);
      setStorageStatusMsg(`Error: ${err.message}`);
    } finally {
      setIsStorageLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshLibrary();
  }, [refreshLibrary]);

  // Persist favorites
  const toggleFavorite = useCallback((itemId: string) => {
    setFavorites((prev) => {
      const next = { ...prev, [itemId]: !prev[itemId] };
      try {
        localStorage.setItem('ae_element_vault_favorites', JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const initLibraryFolder = useCallback(async () => {
    setIsStorageLoading(true);
    try {
      const p = await initLibrary();
      setStoragePath(p);
      const db = await getLibrary();
      setLibraryDb(db);
      setItems(db.items || []);
      setStorageStatusMsg(`✓ Initialized folder tree and database.json at: ${p}`);
    } catch (err: any) {
      setStorageStatusMsg(`Error initializing: ${err.message}`);
    } finally {
      setIsStorageLoading(false);
      setTimeout(() => setStorageStatusMsg(null), 4000);
    }
  }, []);

  const addItem = useCallback(async (newItem: LibraryItem) => {
    setIsStorageLoading(true);
    try {
      await saveItem(newItem);
      const db = await getLibrary();
      setLibraryDb(db);
      setItems(db.items || []);
      setStorageStatusMsg(`✓ Added "${newItem.name}"`);
    } catch (err: any) {
      setStorageStatusMsg(`Error adding: ${err.message}`);
    } finally {
      setIsStorageLoading(false);
      setTimeout(() => setStorageStatusMsg(null), 3000);
    }
  }, []);

  const updateItem = useCallback(async (updatedItem: LibraryItem) => {
    try {
      await saveItem(updatedItem);
      const db = await getLibrary();
      setLibraryDb(db);
      setItems(db.items || []);
    } catch (err: any) {
      console.error('Failed to update item:', err);
    }
  }, []);

  const deleteItem = useCallback(async (itemId: string) => {
    setIsStorageLoading(true);
    try {
      await deleteItemFromDb(itemId);
      const db = await getLibrary();
      setLibraryDb(db);
      setItems(db.items || []);
      setStorageStatusMsg(`✓ Item removed`);
    } catch (err: any) {
      setStorageStatusMsg(`Error removing: ${err.message}`);
    } finally {
      setIsStorageLoading(false);
      setTimeout(() => setStorageStatusMsg(null), 3000);
    }
  }, []);

  const addMockItem = useCallback(async () => {
    setIsStorageLoading(true);
    try {
      const currentCount = items.length;
      const num = currentCount + 1;
      const now = Date.now();
      const currentPath = storagePath || getLibraryPath();

      const mockLowerThird: LibraryItem = {
        id: `lower-third-${now}`,
        name: `Cyber Broadcast Lower Third #${num}`,
        category: 'Lower Thirds',
        tags: ['Lower Third', 'Broadcast', 'Typography', 'Cyberpunk', 'Essential Graphics'],
        egTemplateName: 'Cyber Broadcast EG Package',
        sourceProject: 'Essential_Motion_2026.aep',
        aepPath: `${currentPath}\\assets\\lower_third_${now}.aep`,
        previewPath: generateMockThumbnailSvg(`Cyber Broadcast Lower Third #${num}`, 1920, 1080),
        previewFrames: generateMockScrubFrames(`Cyber Broadcast Lower Third #${num}`, 10, 1920, 1080),
        duration: 5.5,
        frameRate: 60,
        width: 1920,
        height: 1080,
        layerCount: 8,
        createdAt: new Date().toISOString(),
        customizableProps: [
          {
            id: 'prop-name',
            type: 'text',
            layerName: 'Presenter Name',
            layerIndex: 1,
            propertyName: 'Source Text',
            defaultValue: `Alex Vance (Guest #${num})`,
            font: 'Montserrat-Bold',
            fontSize: 48,
            justification: 'LEFT',
            tracking: 10,
            isEssentialProperty: true,
            egTemplateName: 'Cyber Broadcast EG Package',
          },
          {
            id: 'prop-role',
            type: 'text',
            layerName: 'Subtitle / Role',
            layerIndex: 2,
            propertyName: 'Source Text',
            defaultValue: 'Lead Technical Director',
            font: 'Inter-Medium',
            fontSize: 24,
            justification: 'LEFT',
            tracking: 15,
          },
          {
            id: 'prop-color',
            type: 'color',
            layerName: 'Accent Gradient',
            layerIndex: 3,
            propertyName: 'Primary Accent Color',
            defaultValue: '#1473E6',
            rawValue: [0.08, 0.45, 0.9, 1],
            isMasterControl: true,
            isEssentialProperty: true,
            egTemplateName: 'Cyber Broadcast EG Package',
          },
          {
            id: 'prop-radius',
            type: 'slider',
            layerName: 'Box Styling',
            layerIndex: 4,
            propertyName: 'Corner Radius',
            defaultValue: 24,
            min: 0,
            max: 100,
            isMasterControl: true,
          },
          {
            id: 'prop-glow',
            type: 'checkbox',
            layerName: 'Neon Glow Effect',
            layerIndex: 5,
            propertyName: 'Enable Glow FX',
            defaultValue: true,
            isMasterControl: true,
          },
        ],
      };

      await addItem(mockLowerThird);
    } catch (err: any) {
      setStorageStatusMsg(`Error adding mock item: ${err.message}`);
    } finally {
      setIsStorageLoading(false);
    }
  }, [items.length, storagePath, addItem]);

  // Helper function to check if item belongs to category
  const itemMatchesCategory = useCallback((item: LibraryItem, cat: string): boolean => {
    if (cat === 'All') return true;
    if (cat === 'Favorites') return Boolean(favorites[item.id]);
    if (cat === 'Essential Graphics') {
      return Boolean(
        item.egTemplateName ||
        item.customizableProps?.some((p) => p.isEssentialProperty) ||
        item.tags?.some((t) => t.toLowerCase().includes('essential'))
      );
    }
    const catLower = cat.toLowerCase();
    const itemCat = (item.category || '').toLowerCase();
    const itemTags = (item.tags || []).map((t) => t.toLowerCase());

    if (cat === 'Titles') {
      return itemCat.includes('title') || itemCat.includes('typography') || itemTags.includes('title') || itemTags.includes('typography');
    }
    if (cat === 'Lower Thirds') {
      return itemCat.includes('lower') || itemCat.includes('third') || itemTags.includes('lower third');
    }
    if (cat === 'Transitions') {
      return itemCat.includes('transition') || itemTags.includes('transition');
    }
    if (cat === 'Social') {
      return itemCat.includes('social') || itemCat.includes('broadcast') || itemTags.includes('social') || itemTags.includes('broadcast');
    }

    return itemCat === catLower || itemTags.includes(catLower);
  }, [favorites]);

  // Compute category counts for navigation badges
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const cat of CATEGORIES) {
      counts[cat] = items.filter((item) => itemMatchesCategory(item, cat)).length;
    }
    return counts;
  }, [items, itemMatchesCategory]);

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let result = items.filter((item) => {
      // Category filter
      if (!itemMatchesCategory(item, activeCategory)) {
        return false;
      }

      // Essential Graphics Only toggle
      if (filterEssentialOnly) {
        const hasEg = Boolean(
          item.egTemplateName ||
          item.customizableProps?.some((p) => p.isEssentialProperty)
        );
        if (!hasEg) return false;
      }

      // Has Audio filter
      if (filterHasAudio) {
        const hasAudioTag = item.tags?.some((t) => t.toLowerCase().includes('audio'));
        if (!hasAudioTag) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const inName = item.name.toLowerCase().includes(query);
        const inCategory = item.category.toLowerCase().includes(query);
        const inTags = item.tags?.some((t) => t.toLowerCase().includes(query));
        const inEgName = item.egTemplateName?.toLowerCase().includes(query);
        const inProps = item.customizableProps?.some(
          (p) =>
            p.propertyName.toLowerCase().includes(query) ||
            p.layerName.toLowerCase().includes(query) ||
            (typeof p.defaultValue === 'string' && p.defaultValue.toLowerCase().includes(query))
        );
        if (!inName && !inCategory && !inTags && !inEgName && !inProps) {
          return false;
        }
      }

      return true;
    });

    // Sorting
    result = [...result].sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'duration') {
        return (a.duration || 0) - (b.duration || 0);
      }
      if (sortBy === 'essential') {
        const aHasEg = a.egTemplateName || a.customizableProps?.some((p) => p.isEssentialProperty) ? 1 : 0;
        const bHasEg = b.egTemplateName || b.customizableProps?.some((p) => p.isEssentialProperty) ? 1 : 0;
        if (bHasEg !== aHasEg) return bHasEg - aHasEg;
        return Date.parse(b.createdAt) - Date.parse(a.createdAt);
      }
      // Default: newest first
      return Date.parse(b.createdAt) - Date.parse(a.createdAt);
    });

    return result;
  }, [items, activeCategory, filterEssentialOnly, filterHasAudio, searchQuery, sortBy, itemMatchesCategory]);

  return {
    items,
    filteredItems,
    activeCategory,
    searchQuery,
    sortBy,
    filterEssentialOnly,
    filterHasAudio,
    favorites,
    storagePath,
    isStorageLoading,
    storageStatusMsg,
    libraryDb,
    categoryCounts,
    setActiveCategory,
    setSearchQuery,
    setSortBy,
    setFilterEssentialOnly,
    setFilterHasAudio,
    toggleFavorite,
    addItem,
    deleteItem,
    refreshLibrary,
    initLibraryFolder,
    addMockItem,
    updateItem,
  };
}
