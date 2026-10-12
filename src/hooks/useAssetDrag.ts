import { useState, useCallback, useRef } from 'react';
import { LibraryItem } from '../types/library';

export interface UseAssetDragOptions {
  onDropItem?: (item: LibraryItem) => void;
  items?: LibraryItem[];
}

export function useAssetDrag(options?: UseAssetDragOptions) {
  const [draggedItem, setDraggedItem] = useState<LibraryItem | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isOverDropZone, setIsOverDropZone] = useState<boolean>(false);
  const ghostRef = useRef<HTMLElement | null>(null);

  /**
   * Creates a compact drag ghost preview pill showing the element name and category
   */
  const createDragGhost = useCallback((item: LibraryItem): HTMLElement => {
    // Clean up any stale ghosts
    if (ghostRef.current && ghostRef.current.parentNode) {
      ghostRef.current.parentNode.removeChild(ghostRef.current);
      ghostRef.current = null;
    }

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
    const safeCategory = (item.category || 'Element').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    ghost.innerHTML = `
      <span style="font-size:12px;line-height:1;">🎬</span>
      <span style="max-width:160px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:700;">${safeName}</span>
      <span style="font-size:9px;background:rgba(0,0,0,0.35);padding:1px 6px;border-radius:10px;font-family:monospace;letter-spacing:0.5px;">${safeCategory}</span>
    `;

    document.body.appendChild(ghost);
    ghostRef.current = ghost;
    return ghost;
  }, []);

  /**
   * Standard onDragStart handler for asset cards conforming to CEP drag-out standards
   */
  const handleDragStart = useCallback(
    (item: LibraryItem, e: React.DragEvent) => {
      setDraggedItem(item);
      setIsDragging(true);

      const aepPath = item.aepPath || '';
      const formattedUri = 'file:///' + aepPath.replace(/\\/g, '/');

      // 1. Plain text path
      e.dataTransfer.setData('text/plain', aepPath);

      // 2. URI list for file dropping
      e.dataTransfer.setData('text/uri-list', formattedUri);

      // 3. Adobe CEP / Chromium DownloadURL format for dragging into native applications
      e.dataTransfer.setData(
        'DownloadURL',
        'application/octet-stream:' + item.name + '.aep:' + formattedUri
      );

      // 4. Structured JSON data for within-panel drop zones
      try {
        e.dataTransfer.setData('application/json', JSON.stringify(item));
        e.dataTransfer.setData('ae-element-vault/id', item.id);
        e.dataTransfer.setData('ae-element-vault/name', item.name);
      } catch (err) {
        console.warn('Failed to serialize item for drag transfer:', err);
      }

      // 5. Allowed drag effect
      e.dataTransfer.effectAllowed = 'copyMove';

      // 6. Custom Ghost Preview Pill
      try {
        const ghost = createDragGhost(item);
        e.dataTransfer.setDragImage(ghost, 20, 16);
        setTimeout(() => {
          if (ghost.parentNode) {
            ghost.parentNode.removeChild(ghost);
          }
        }, 100);
      } catch (err) {
        console.warn('Failed to set drag image:', err);
      }
    },
    [createDragGhost]
  );

  /**
   * Reset states on drag end
   */
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setDraggedItem(null);
    setIsOverDropZone(false);

    if (ghostRef.current && ghostRef.current.parentNode) {
      ghostRef.current.parentNode.removeChild(ghostRef.current);
      ghostRef.current = null;
    }
  }, []);

  /**
   * Dropzone drag over handler
   */
  const handleDropZoneDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    setIsOverDropZone(true);
  }, []);

  /**
   * Dropzone drag enter handler
   */
  const handleDropZoneDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOverDropZone(true);
  }, []);

  /**
   * Dropzone drag leave handler
   */
  const handleDropZoneDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const related = e.relatedTarget as Node | null;
    if (!e.currentTarget.contains(related)) {
      setIsOverDropZone(false);
    }
  }, []);

  /**
   * Dropzone drop handler
   */
  const handleDropZoneDrop = useCallback(
    (e: React.DragEvent, onCustomDrop?: (item: LibraryItem) => void) => {
      e.preventDefault();
      e.stopPropagation();
      setIsOverDropZone(false);
      setIsDragging(false);

      let itemToInsert: LibraryItem | null = draggedItem;

      if (!itemToInsert) {
        // Try extracting from application/json
        try {
          const rawJson = e.dataTransfer.getData('application/json');
          if (rawJson) {
            itemToInsert = JSON.parse(rawJson);
          }
        } catch {
          // Ignore parse errors
        }
      }

      if (!itemToInsert && options?.items) {
        // Fallback: match by ID or path from transfer
        const id = e.dataTransfer.getData('ae-element-vault/id');
        const text = e.dataTransfer.getData('text/plain');
        if (id) {
          itemToInsert = options.items.find((i) => i.id === id) || null;
        } else if (text) {
          itemToInsert = options.items.find((i) => i.aepPath === text) || null;
        }
      }

      if (itemToInsert) {
        if (onCustomDrop) {
          onCustomDrop(itemToInsert);
        } else if (options?.onDropItem) {
          options.onDropItem(itemToInsert);
        }
      }

      setDraggedItem(null);
      return itemToInsert;
    },
    [draggedItem, options]
  );

  return {
    draggedItem,
    isDragging,
    isOverDropZone,
    handleDragStart,
    handleDragEnd,
    handleDropZoneDragOver,
    handleDropZoneDragEnter,
    handleDropZoneDragLeave,
    handleDropZoneDrop,
    setDraggedItem,
    setIsDragging,
  };
}
