/**
 * Element Vault Local Storage & Database Manager
 * Uses Node.js fs/path when running inside Adobe CEP, with seamless localStorage fallback for browser mode.
 */

import { LibraryDatabase, LibraryItem } from '../types/library';

const LOCAL_STORAGE_KEY = 'element_vault_database';
const DEFAULT_VERSION = '1.0.0';

const INITIAL_CATEGORIES = [
  'Titles & Typography',
  'Transitions',
  'VFX & Overlays',
  'Motion Graphics',
  'Lower Thirds',
  'Camera Rigs'
];

/**
 * Access Node.js runtime modules if available in CEP
 */
function getNodeEnv() {
  if (typeof window !== 'undefined' && typeof window.require === 'function') {
    try {
      const fs = window.require('fs');
      const path = window.require('path');
      const os = window.require('os');
      const process = window.require('process');
      if (fs && path && os) {
        return { fs, path, os, process };
      }
    } catch {
      // In browser mode, window.require is unavailable
    }
  }
  return null;
}

/**
 * Resolves the OS-specific default library directory path
 */
export function getLibraryPath(): string {
  const node = getNodeEnv();

  if (node) {
    const { path, os, process } = node;
    const isWin = os.platform() === 'win32';
    const isMac = os.platform() === 'darwin';

    if (isWin) {
      const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
      return path.join(appData, 'ElementVault', 'Library');
    } else if (isMac) {
      return path.join(os.homedir(), 'Library', 'Application Support', 'ElementVault', 'Library');
    } else {
      return path.join(os.homedir(), '.elementvault', 'Library');
    }
  }

  // Browser Fallback path simulation
  const isWindowsNav = typeof navigator !== 'undefined' && /Win/i.test(navigator.userAgent || navigator.platform);
  if (isWindowsNav) {
    return 'C:\\Users\\User\\AppData\\Roaming\\ElementVault\\Library';
  }
  return '/Users/User/Library/Application Support/ElementVault/Library';
}

/**
 * Creates default empty database structure
 */
function createDefaultDatabase(libPath: string): LibraryDatabase {
  return {
    version: DEFAULT_VERSION,
    defaultLibraryPath: libPath,
    items: [],
    categories: [...INITIAL_CATEGORIES]
  };
}

/**
 * Initializes the library folders and database file.
 * Creates Library/, Library/assets/, Library/previews/, and database.json.
 */
export async function initLibrary(): Promise<string> {
  const libPath = getLibraryPath();
  const node = getNodeEnv();

  if (node) {
    const { fs, path } = node;
    const assetsDir = path.join(libPath, 'assets');
    const previewsDir = path.join(libPath, 'previews');
    const dbFile = path.join(libPath, 'database.json');

    try {
      if (!fs.existsSync(libPath)) fs.mkdirSync(libPath, { recursive: true });
      if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });
      if (!fs.existsSync(previewsDir)) fs.mkdirSync(previewsDir, { recursive: true });

      if (!fs.existsSync(dbFile)) {
        const initialDb = createDefaultDatabase(libPath);
        fs.writeFileSync(dbFile, JSON.stringify(initialDb, null, 2), 'utf-8');
      }
      return libPath;
    } catch (err: any) {
      console.error('Node.js initLibrary failed:', err);
      throw new Error(`Failed to initialize filesystem library: ${err.message}`);
    }
  }

  // Browser mode fallback via localStorage
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!stored) {
      const initialDb = createDefaultDatabase(libPath);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialDb));
    }
  }

  return libPath;
}

/**
 * Reads and returns the complete LibraryDatabase
 */
export async function getLibrary(): Promise<LibraryDatabase> {
  const libPath = getLibraryPath();
  const node = getNodeEnv();

  if (node) {
    const { fs, path } = node;
    const dbFile = path.join(libPath, 'database.json');

    try {
      if (!fs.existsSync(dbFile)) {
        await initLibrary();
      }

      const content = fs.readFileSync(dbFile, 'utf-8');
      const parsed: LibraryDatabase = JSON.parse(content);
      return parsed;
    } catch (err: any) {
      console.warn('Error reading filesystem database, resetting to default:', err);
      const fallback = createDefaultDatabase(libPath);
      try {
        fs.writeFileSync(dbFile, JSON.stringify(fallback, null, 2), 'utf-8');
      } catch {}
      return fallback;
    }
  }

  // Browser fallback using localStorage
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored) as LibraryDatabase;
      } catch (e) {
        console.warn('Failed to parse localStorage database, resetting:', e);
      }
    }
    const defaultDb = createDefaultDatabase(libPath);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(defaultDb));
    return defaultDb;
  }

  return createDefaultDatabase(libPath);
}

/**
 * Saves or updates a LibraryItem in the database
 */
export async function saveItem(item: LibraryItem): Promise<void> {
  const currentDb = await getLibrary();
  const libPath = getLibraryPath();
  const node = getNodeEnv();

  // Upsert item
  const existingIdx = currentDb.items.findIndex((i) => i.id === item.id);
  if (existingIdx >= 0) {
    currentDb.items[existingIdx] = { ...item };
  } else {
    currentDb.items.push({ ...item });
  }

  // Add category if not present
  if (item.category && !currentDb.categories.includes(item.category)) {
    currentDb.categories.push(item.category);
  }

  // Persist
  if (node) {
    const { fs, path } = node;
    const dbFile = path.join(libPath, 'database.json');
    fs.writeFileSync(dbFile, JSON.stringify(currentDb, null, 2), 'utf-8');
  } else if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(currentDb));
  }
}

/**
 * Deletes a LibraryItem by id and removes its associated local asset/preview files if present
 */
export async function deleteItem(id: string): Promise<void> {
  const currentDb = await getLibrary();
  const libPath = getLibraryPath();
  const node = getNodeEnv();

  const itemToDelete = currentDb.items.find((i) => i.id === id);

  // If node is available, delete associated .aep and preview files if stored in our library
  if (node && itemToDelete) {
    const { fs } = node;
    try {
      if (itemToDelete.aepPath && itemToDelete.aepPath.startsWith(libPath) && fs.existsSync(itemToDelete.aepPath)) {
        fs.unlinkSync(itemToDelete.aepPath);
      }
      if (itemToDelete.previewPath && itemToDelete.previewPath.startsWith(libPath) && fs.existsSync(itemToDelete.previewPath)) {
        fs.unlinkSync(itemToDelete.previewPath);
      }
    } catch (e) {
      console.warn('Failed to delete physical files for item:', id, e);
    }
  }

  // Update item list
  currentDb.items = currentDb.items.filter((i) => i.id !== id);

  // Persist
  if (node) {
    const { fs, path } = node;
    const dbFile = path.join(libPath, 'database.json');
    fs.writeFileSync(dbFile, JSON.stringify(currentDb, null, 2), 'utf-8');
  } else if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(currentDb));
  }
}
