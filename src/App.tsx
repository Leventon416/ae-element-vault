import React, { useState, useEffect, useCallback } from 'react';
import { Check, X, AlertTriangle, Loader2 } from 'lucide-react';
import { Header, ViewMode } from './components/layout/Header';
import { CategoryNav } from './components/layout/CategoryNav';
import { SearchBar } from './components/layout/SearchBar';
import { StatusBar } from './components/layout/StatusBar';
import { LibraryCatalogView } from './components/catalog/LibraryCatalogView';
import { ProjectDissectorView } from './components/dissector/ProjectDissectorView';
import { IngestionProgressModal } from './components/ingest/IngestionProgressModal';
import { ErrorBoundary } from './components/common/ErrorBoundary';

import { useLibrary } from './hooks/useLibrary';
import { useScanner } from './hooks/useScanner';
import { useIngestionPipeline } from './hooks/useIngestionPipeline';
import {
  isCEP,
  evalScript,
  AEPingData,
  insertElement,
  formatInsertionTimecode,
  InsertionOptions,
  sanitizeFileName,
} from './lib/cepBridge';
import { csBridge } from './utils/csinterface';

export const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('catalog');
  const [isRefreshingComp, setIsRefreshingComp] = useState<boolean>(false);

  // ExtendScript Connection Test State
  const [isPinging, setIsPinging] = useState<boolean>(false);
  const [pingData, setPingData] = useState<AEPingData | null>(null);
  const [pingError, setPingError] = useState<string | null>(null);
  const [lastPingTime, setLastPingTime] = useState<string | null>(null);

  // Timeline Insertion Feedback States
  const [insertionToast, setInsertionToast] = useState<{
    elementName: string;
    timecode: string;
    compName: string;
  } | null>(null);
  const [insertionError, setInsertionError] = useState<string | null>(null);

  // Custom Hooks for State Management
  const library = useLibrary();
  const scanner = useScanner();
  const ingestion = useIngestionPipeline(
    useCallback(async () => {
      await library.refreshLibrary();
    }, [library])
  );

  const handleViewIngestedInLibrary = useCallback(() => {
    ingestion.closeModal();
    setViewMode('catalog');
    library.refreshLibrary();
  }, [ingestion, library]);

  const isNative = isCEP();

  const handleTestAEConnection = useCallback(async () => {
    setIsPinging(true);
    setPingError(null);
    try {
      const response = await evalScript<AEPingData>('ElementVault.ping()');
      setPingData(response);
      setLastPingTime(new Date().toLocaleTimeString());
    } catch (err: any) {
      console.error('Connection test error:', err);
      setPingError(err.message || 'Failed to communicate with After Effects host');
    } finally {
      setIsPinging(false);
    }
  }, []);

  const handleRefreshComp = useCallback(async () => {
    setIsRefreshingComp(true);
    try {
      await csBridge.getActiveComp();
    } catch (e) {
      console.warn('Failed to fetch active comp:', e);
    } finally {
      setIsRefreshingComp(false);
    }
  }, []);

  // When exporting a single composition from Dissector, add it to library
  const handleExportCompWrapper = useCallback(
    async (comp: any) => {
      const savedItem = await scanner.exportComp(comp, async (newItem) => {
        await library.addItem(newItem);
      });
      if (savedItem) {
        await library.refreshLibrary();
      }
    },
    [scanner, library]
  );

  // When batch exporting all compositions from Dissector, add them to library
  const handleExportAllCompsWrapper = useCallback(async () => {
    await scanner.exportAllComps(async (newItems) => {
      for (const item of newItems) {
        await library.addItem(item);
      }
      await library.refreshLibrary();
    });
  }, [scanner, library]);

  // Wrapper for scanProject: auto-switch to Dissector view so user/test sees the comps
  const handleScanProjectWrapper = useCallback(async () => {
    setViewMode('dissector');
    return await scanner.scanProject();
  }, [scanner]);

  // Timeline Insertion Handler
  const handleInsertElement = useCallback(
    async (
      item: any,
      customParams?: Record<string, any>,
      retargetOptions?: Partial<InsertionOptions>
    ) => {
      setInsertionError(null);
      try {
        const targetAep = item.aepPath || item.sourceProjectPath || item.sourceProject || `${library.storagePath}\\assets\\${sanitizeFileName(item.name)}.aep`;
        const res = await insertElement(targetAep, {
          elementName: item.name,
          compId: item.id,
          sourceProjectPath: item.sourceProjectPath || item.sourceProject,
          sourceProject: item.sourceProject,
          customParams,
          ...retargetOptions,
        });

        const tc = formatInsertionTimecode(res.startTime, res.compFps || 30);
        setInsertionToast({
          elementName: res.layerName || item.name,
          timecode: tc,
          compName: res.compName || 'Active Comp',
        });

        setTimeout(() => {
          setInsertionToast((cur) => (cur?.elementName === (res.layerName || item.name) ? null : cur));
        }, 4000);
      } catch (err: any) {
        console.error('Insertion failed:', err);
        const errMsg = err.message || String(err);
        if (
          errMsg.toLowerCase().includes('open a composition') ||
          errMsg.toLowerCase().includes('no active composition')
        ) {
          setInsertionError('No active composition open in timeline. Please open or create a comp first.');
        } else {
          setInsertionError(errMsg || 'No active composition open in timeline. Please open or create a comp first.');
        }
        setTimeout(() => {
          setInsertionError(null);
        }, 5000);
      }
    },
    [library.storagePath]
  );

  useEffect(() => {
    handleRefreshComp();
    handleTestAEConnection();
  }, [handleRefreshComp, handleTestAEConnection]);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#1e1e1e] text-[#e1e1e1] select-none overflow-hidden font-sans">
      {/* 1. Header with View Mode Switcher, Storage Status Popover, and Host Indicators */}
      <Header
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        itemCount={library.items.length}
        storagePath={library.storagePath}
        isAE={isNative}
        onImportAep={(file) => ingestion.startIngestion(file, false)}
        onRefreshComp={handleRefreshComp}
        isRefreshing={isRefreshingComp}
        onTestAE={handleTestAEConnection}
        isPinging={isPinging}
        onInitLibrary={library.initLibraryFolder}
        onAddMockItem={library.addMockItem}
        isStorageLoading={library.isStorageLoading}
        storageStatusMsg={library.storageStatusMsg}
        version={library.libraryDb?.version || '1.0.0'}
      />

      {/* Main View Area: Seamless switching between "Library Catalog" and "Project Dissector" */}
      <main className="flex-1 overflow-hidden relative flex flex-col">
        {/* VIEW 1: Library Catalog */}
        <div
          className={`${
            viewMode === 'catalog' ? 'flex flex-col flex-1 overflow-hidden' : 'hidden'
          }`}
        >
          {/* Category Navigation Bar */}
          <CategoryNav
            activeCategory={library.activeCategory}
            onSelectCategory={library.setActiveCategory}
            categoryCounts={library.categoryCounts}
          />

          {/* Search, Sort, and Filter Toolbar */}
          <SearchBar
            searchQuery={library.searchQuery}
            onSearchChange={library.setSearchQuery}
            sortBy={library.sortBy}
            onSortChange={library.setSortBy}
            filterEssentialOnly={library.filterEssentialOnly}
            onToggleEssentialOnly={() => library.setFilterEssentialOnly((prev) => !prev)}
            filterHasAudio={library.filterHasAudio}
            onToggleHasAudio={() => library.setFilterHasAudio((prev) => !prev)}
            totalResultsCount={library.filteredItems.length}
          />

          {/* Catalog Asset Grid & Hover-Scrub Cards */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <ErrorBoundary
              fallbackTitle="Error loading Library Catalog"
              onReset={() => library.refreshLibrary()}
            >
              <LibraryCatalogView
                items={library.filteredItems}
                storagePath={library.storagePath}
                favorites={library.favorites}
                onToggleFavorite={library.toggleFavorite}
                onDeleteItem={library.deleteItem}
                onUpdateItem={library.updateItem}
                onAddMockItem={library.addMockItem}
                onInitLibraryFolder={library.initLibraryFolder}
                isStorageLoading={library.isStorageLoading}
                onClearFilters={() => {
                  library.setActiveCategory('All');
                  library.setSearchQuery('');
                  library.setFilterEssentialOnly(false);
                  library.setFilterHasAudio(false);
                }}
                onImportAep={() => {
                  const headerInput = document.querySelector('#header-aep-file-input') as HTMLInputElement;
                  headerInput?.click();
                }}
                searchQuery={library.searchQuery}
                activeCategory={library.activeCategory}
                sortBy={library.sortBy}
                filterEssentialOnly={library.filterEssentialOnly}
                filterHasAudio={library.filterHasAudio}
                deletingIds={library.deletingIds}
                onInsert={handleInsertElement}
              />
            </ErrorBoundary>
          </div>
        </div>

        {/* VIEW 2: Project Dissector */}
        <div
          className={`${
            viewMode === 'dissector' ? 'flex flex-col flex-1 overflow-hidden' : 'hidden'
          }`}
        >
          <div className="flex-1 overflow-y-auto">
            <ProjectDissectorView
              onFileSelected={(file, isCurrent) => ingestion.startIngestion(file, isCurrent)}
              scanResult={scanner.scanResult}
              isScanning={scanner.isScanning}
              scanError={scanner.scanError}
              expandedCompId={scanner.expandedCompId}
              isolatingCompId={scanner.isolatingCompId}
              reductionResults={scanner.reductionResults}
              isolationError={scanner.isolationError}
              exportingCompIds={scanner.exportingCompIds}
              isBatchExporting={scanner.isBatchExporting}
              exportStatus={scanner.exportStatus}
              batchExportStatus={scanner.batchExportStatus}
              compTextResults={scanner.compTextResults}
              inspectingTextCompIds={scanner.inspectingTextCompIds}
              compControlsResults={scanner.compControlsResults}
              inspectingControlsCompIds={scanner.inspectingControlsCompIds}
              compEgResults={scanner.compEgResults}
              inspectingEgCompIds={scanner.inspectingEgCompIds}
              expandedEgItemIds={scanner.expandedEgItemIds}
              expandedTextItemIds={scanner.expandedTextItemIds}
              expandedControlsItemIds={scanner.expandedControlsItemIds}
              onScanProject={handleScanProjectWrapper}
              onIsolateComp={scanner.isolateComp}
              onExportComp={handleExportCompWrapper}
              onExportAllComps={handleExportAllCompsWrapper}
              onInspectCompText={scanner.inspectCompText}
              onInspectCompControls={scanner.inspectCompControls}
              onInspectCompEg={scanner.inspectCompEg}
              onToggleExpandedEg={scanner.toggleExpandedEg}
              onToggleExpandedText={scanner.toggleExpandedText}
              onToggleExpandedControls={scanner.toggleExpandedControls}
            />
          </div>
        </div>
      </main>

      {/* Multi-Stage Ingestion Progress Modal */}
      <IngestionProgressModal
        isOpen={ingestion.isOpen}
        isIngesting={ingestion.isIngesting}
        currentStage={ingestion.currentStage}
        stageProgress={ingestion.stageProgress}
        statusMessage={ingestion.statusMessage}
        completedStages={ingestion.completedStages}
        resultSummary={ingestion.resultSummary}
        error={ingestion.error}
        fileName={ingestion.currentFile?.name}
        onCancel={ingestion.cancelIngestion}
        onClose={ingestion.closeModal}
        onViewInLibrary={handleViewIngestedInLibrary}
      />

      {/* Persistent Status Bar */}
      <StatusBar
        isAE={isNative}
        totalActiveItems={library.items.length}
        storagePath={library.storagePath}
        pingData={pingData}
        pingError={pingError}
        lastPingTime={lastPingTime}
        version={library.libraryDb?.version || '1.0.0'}
      />

      {/* Floating Insertion Confirmation Toast */}
      {insertionToast && (
        <div
          id="insertion-toast"
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 max-w-md p-3 rounded-xl bg-[#1a2332]/95 border border-[#1473E6] shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 text-white animate-in slide-in-from-bottom-4 duration-200"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#1473E6]/20 border border-[#1473E6]/40 flex items-center justify-center text-[#1473E6] flex-shrink-0">
              <Check className="w-4 h-4 text-cyan-300" />
            </div>
            <div className="min-w-0 space-y-0.5">
              <p id="insertion-toast-msg" className="text-xs font-semibold text-white truncate">
                Inserted <span className="text-cyan-300 font-bold">{insertionToast.elementName}</span> at{' '}
                <span className="font-mono text-amber-300">[{insertionToast.timecode}]</span> on{' '}
                <span className="text-blue-300 font-bold">[{insertionToast.compName}]</span>
              </p>
              <p id="insertion-undo-hint" className="text-[10px] text-[#9e9e9e] flex items-center gap-1 font-mono">
                <span className="px-1 py-0.2 rounded bg-black/50 border border-white/10 text-white text-[9px]">
                  Ctrl+Z / Cmd+Z
                </span>{' '}
                to undo in After Effects
              </p>
            </div>
          </div>
          <button
            id="dismiss-insertion-toast-btn"
            type="button"
            onClick={() => setInsertionToast(null)}
            className="p-1 rounded text-[#8e8e8e] hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
            title="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Error Alert Banner when No Active Composition is Open */}
      {insertionError && (
        <div
          id="insertion-error-banner"
          role="alert"
          className="fixed top-14 left-1/2 -translate-x-1/2 z-50 max-w-lg w-[90%] p-3 rounded-xl bg-[#2a1717]/95 border border-rose-500/60 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 text-rose-200 animate-in slide-in-from-top-3 duration-200"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 flex-shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <p className="text-xs font-medium text-rose-200">
              {insertionError}
            </p>
          </div>
          <button
            id="dismiss-insertion-error-btn"
            type="button"
            onClick={() => setInsertionError(null)}
            className="p-1 rounded text-rose-400 hover:text-rose-200 hover:bg-rose-500/20 transition-colors flex-shrink-0"
            title="Dismiss alert"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Floating Deletion Progress Toast */}
      {library.deletionToast && (
        <div
          id="deletion-toast"
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-6 z-50 max-w-sm p-3 rounded-xl bg-[#1e1b24]/95 border border-rose-500/50 shadow-2xl backdrop-blur-md flex items-center gap-3 text-white animate-in slide-in-from-bottom-4 duration-200"
        >
          <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 flex-shrink-0">
            {library.deletingIds.size > 0 ? (
              <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
            ) : (
              <Check className="w-4 h-4 text-emerald-400" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p id="deletion-toast-msg" className="text-xs font-semibold text-rose-200 truncate">
              {library.deletionToast}
            </p>
            {library.deletingIds.size > 0 && (
              <div className="w-full bg-[#332228] h-1 rounded-full mt-1.5 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-rose-500 via-amber-400 to-rose-500 rounded-full animate-pulse w-full" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
