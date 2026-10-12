import { useState, useCallback } from 'react';
import {
  scanActiveProject,
  isolateComposition,
  exportComposition,
  exportBatchCompositions,
  inspectTextLayers,
  inspectExpressionControls,
  inspectEssentialProperties,
  generateMockThumbnailSvg,
  generateMockScrubFrames,
  ProjectScanResult,
  ReductionResult,
  CompMetadata,
} from '../lib/cepBridge';
import { getLibraryPath } from '../lib/storageService';
import { LibraryItem, CustomizableProperty } from '../types/library';

export interface UseScannerReturn {
  scanResult: ProjectScanResult | null;
  isScanning: boolean;
  scanError: string | null;
  expandedCompId: number | null;
  isolatingCompId: number | null;
  reductionResults: Record<number, ReductionResult>;
  isolationError: string | null;
  exportingCompIds: Record<number, boolean>;
  isBatchExporting: boolean;
  exportStatus: Record<number, { success: boolean; fileName: string }>;
  batchExportStatus: string | null;
  // Inspection results
  compTextResults: Record<number, CustomizableProperty[]>;
  inspectingTextCompIds: Record<number, boolean>;
  compControlsResults: Record<number, CustomizableProperty[]>;
  inspectingControlsCompIds: Record<number, boolean>;
  compEgResults: Record<number, CustomizableProperty[]>;
  inspectingEgCompIds: Record<number, boolean>;
  expandedEgItemIds: Record<string, boolean>;
  expandedTextItemIds: Record<string, boolean>;
  expandedControlsItemIds: Record<string, boolean>;
  // Actions
  scanProject: () => Promise<ProjectScanResult | null>;
  isolateComp: (compId: number) => Promise<ReductionResult | null>;
  exportComp: (comp: CompMetadata, onSaved?: (item: LibraryItem) => Promise<void>) => Promise<LibraryItem | null>;
  exportAllComps: (onBatchSaved?: (items: LibraryItem[]) => Promise<void>) => Promise<LibraryItem[]>;
  inspectCompText: (compId: number) => Promise<void>;
  inspectCompControls: (compId: number) => Promise<void>;
  inspectCompEg: (compId: number) => Promise<void>;
  setExpandedCompId: React.Dispatch<React.SetStateAction<number | null>>;
  toggleExpandedEg: (key: string) => void;
  toggleExpandedText: (key: string) => void;
  toggleExpandedControls: (key: string) => void;
}

export function useScanner(): UseScannerReturn {
  const [scanResult, setScanResult] = useState<ProjectScanResult | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanError, setScanError] = useState<string | null>(null);

  const [expandedCompId, setExpandedCompId] = useState<number | null>(null);
  const [isolatingCompId, setIsolatingCompId] = useState<number | null>(null);
  const [reductionResults, setReductionResults] = useState<Record<number, ReductionResult>>({});
  const [isolationError, setIsolationError] = useState<string | null>(null);

  const [exportingCompIds, setExportingCompIds] = useState<Record<number, boolean>>({});
  const [isBatchExporting, setIsBatchExporting] = useState<boolean>(false);
  const [exportStatus, setExportStatus] = useState<Record<number, { success: boolean; fileName: string }>>({});
  const [batchExportStatus, setBatchExportStatus] = useState<string | null>(null);

  const [compTextResults, setCompTextResults] = useState<Record<number, CustomizableProperty[]>>({});
  const [inspectingTextCompIds, setInspectingTextCompIds] = useState<Record<number, boolean>>({});

  const [compControlsResults, setCompControlsResults] = useState<Record<number, CustomizableProperty[]>>({});
  const [inspectingControlsCompIds, setInspectingControlsCompIds] = useState<Record<number, boolean>>({});

  const [compEgResults, setCompEgResults] = useState<Record<number, CustomizableProperty[]>>({});
  const [inspectingEgCompIds, setInspectingEgCompIds] = useState<Record<number, boolean>>({});

  const [expandedEgItemIds, setExpandedEgItemIds] = useState<Record<string, boolean>>({});
  const [expandedTextItemIds, setExpandedTextItemIds] = useState<Record<string, boolean>>({});
  const [expandedControlsItemIds, setExpandedControlsItemIds] = useState<Record<string, boolean>>({});

  const toggleExpandedEg = useCallback((key: string) => {
    setExpandedEgItemIds((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const toggleExpandedText = useCallback((key: string) => {
    setExpandedTextItemIds((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const toggleExpandedControls = useCallback((key: string) => {
    setExpandedControlsItemIds((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const scanProject = useCallback(async () => {
    setIsScanning(true);
    setScanError(null);
    try {
      const result = await scanActiveProject();
      setScanResult(result);
      return result;
    } catch (err: any) {
      console.error('Scan project error:', err);
      setScanError(err.message || 'Failed to scan After Effects project');
      return null;
    } finally {
      setIsScanning(false);
    }
  }, []);

  const isolateComp = useCallback(async (compId: number) => {
    setIsolatingCompId(compId);
    setIsolationError(null);
    try {
      const result = await isolateComposition(compId, true);
      setReductionResults((prev) => ({ ...prev, [compId]: result }));
      setExpandedCompId((prev) => (prev === compId ? null : compId));
      return result;
    } catch (err: any) {
      console.error('Isolate composition error:', err);
      setIsolationError(err.message || 'Failed to isolate composition');
      return null;
    } finally {
      setIsolatingCompId(null);
    }
  }, []);

  const inspectCompText = useCallback(async (compId: number) => {
    setInspectingTextCompIds((prev) => ({ ...prev, [compId]: true }));
    try {
      const res = await inspectTextLayers(compId);
      setCompTextResults((prev) => ({ ...prev, [compId]: res.textProperties }));
    } catch (err: any) {
      console.error('Failed to inspect text layers:', err);
    } finally {
      setInspectingTextCompIds((prev) => ({ ...prev, [compId]: false }));
    }
  }, []);

  const inspectCompControls = useCallback(async (compId: number) => {
    setInspectingControlsCompIds((prev) => ({ ...prev, [compId]: true }));
    try {
      const res = await inspectExpressionControls(compId);
      setCompControlsResults((prev) => ({ ...prev, [compId]: res.controls }));
    } catch (err: any) {
      console.error('Failed to inspect expression controls:', err);
    } finally {
      setInspectingControlsCompIds((prev) => ({ ...prev, [compId]: false }));
    }
  }, []);

  const inspectCompEg = useCallback(async (compId: number) => {
    setInspectingEgCompIds((prev) => ({ ...prev, [compId]: true }));
    try {
      const res = await inspectEssentialProperties(compId);
      setCompEgResults((prev) => ({ ...prev, [compId]: res.essentialProperties }));
    } catch (err: any) {
      console.error('Failed to inspect essential properties:', err);
    } finally {
      setInspectingEgCompIds((prev) => ({ ...prev, [compId]: false }));
    }
  }, []);

  const exportComp = useCallback(
    async (comp: CompMetadata, onSaved?: (item: LibraryItem) => Promise<void>) => {
      setExportingCompIds((prev) => ({ ...prev, [comp.id]: true }));
      try {
        const libPath = getLibraryPath();
        const assetsFolder = `${libPath}\\assets`;
        const exportRes = await exportComposition(comp.id, assetsFolder);

        // Detect or reuse text properties & expression controls
        let customProps = exportRes.customizableProps || [];
        if (!customProps || customProps.length === 0) {
          try {
            const inspectedEg = await inspectEssentialProperties(comp.id);
            const inspectedText = await inspectTextLayers(comp.id);
            const inspectedControls = await inspectExpressionControls(comp.id);
            const egProps = inspectedEg?.essentialProperties || [];
            const textProps = inspectedText?.textProperties || [];
            const ctrlProps = inspectedControls?.controls || [];
            const egNames = new Set(egProps.map((p) => p.propertyName.toLowerCase()));
            const filteredText = textProps.filter((p) => !egNames.has(p.propertyName.toLowerCase()));
            const filteredCtrl = ctrlProps.filter((p) => !egNames.has(p.propertyName.toLowerCase()));
            customProps = [...egProps, ...filteredText, ...filteredCtrl];
          } catch {}
        }

        const egTemplateName = exportRes.egTemplateName || customProps.find((p) => p.egTemplateName)?.egTemplateName;

        const now = Date.now();
        const newItem: LibraryItem = {
          id: `element-${comp.id}-${now}`,
          name: exportRes.compName || comp.name,
          category: comp.usedInOtherComps ? 'Motion Graphics' : 'Titles & Typography',
          tags: ['Isolated', 'Exported', `${comp.width}x${comp.height}`, `${comp.frameRate}fps`],
          egTemplateName: egTemplateName,
          sourceProject: scanResult?.projectName || 'Project.aep',
          aepPath: exportRes.aepPath,
          previewPath: exportRes.thumbnailPath || generateMockThumbnailSvg(comp.name, comp.width, comp.height),
          previewFrames: generateMockScrubFrames(comp.name, 10, comp.width, comp.height),
          duration: comp.duration,
          frameRate: comp.frameRate,
          width: comp.width,
          height: comp.height,
          layerCount: comp.numLayers,
          createdAt: new Date().toISOString(),
          customizableProps: customProps,
        };

        if (onSaved) {
          await onSaved(newItem);
        }

        setExportStatus((prev) => ({
          ...prev,
          [comp.id]: {
            success: true,
            fileName: exportRes.fileName,
          },
        }));

        return newItem;
      } catch (err: any) {
        console.error('Export composition failed:', err);
        setExportStatus((prev) => ({
          ...prev,
          [comp.id]: {
            success: false,
            fileName: err.message || 'Export failed',
          },
        }));
        return null;
      } finally {
        setExportingCompIds((prev) => ({ ...prev, [comp.id]: false }));
      }
    },
    [scanResult]
  );

  const exportAllComps = useCallback(
    async (onBatchSaved?: (items: LibraryItem[]) => Promise<void>) => {
      if (!scanResult || scanResult.compositions.length === 0) return [];
      setIsBatchExporting(true);
      setBatchExportStatus(null);
      const exportedItems: LibraryItem[] = [];

      try {
        const libPath = getLibraryPath();
        const assetsFolder = `${libPath}\\assets`;
        const compIds = scanResult.compositions.map((c) => c.id);
        const batchResults = await exportBatchCompositions(compIds, assetsFolder);

        for (const res of batchResults) {
          const comp = scanResult.compositions.find((c) => c.id === res.compId);
          let customProps = res.customizableProps || [];
          if (!customProps || customProps.length === 0) {
            try {
              const inspectedEg = await inspectEssentialProperties(res.compId);
              const inspectedText = await inspectTextLayers(res.compId);
              const inspectedControls = await inspectExpressionControls(res.compId);
              const egProps = inspectedEg?.essentialProperties || [];
              const textProps = inspectedText?.textProperties || [];
              const ctrlProps = inspectedControls?.controls || [];
              const egNames = new Set(egProps.map((p) => p.propertyName.toLowerCase()));
              const filteredText = textProps.filter((p) => !egNames.has(p.propertyName.toLowerCase()));
              const filteredCtrl = ctrlProps.filter((p) => !egNames.has(p.propertyName.toLowerCase()));
              customProps = [...egProps, ...filteredText, ...filteredCtrl];
            } catch {}
          }

          const egTemplateName = res.egTemplateName || customProps.find((p) => p.egTemplateName)?.egTemplateName;
          const now = Date.now();
          const newItem: LibraryItem = {
            id: `element-${res.compId}-${now}`,
            name: res.compName,
            category: comp?.usedInOtherComps ? 'Motion Graphics' : 'Titles & Typography',
            tags: ['Isolated', 'Exported', `${comp?.width || 1920}x${comp?.height || 1080}`],
            egTemplateName: egTemplateName,
            sourceProject: scanResult.projectName || 'Project.aep',
            aepPath: res.aepPath,
            previewPath: res.thumbnailPath || generateMockThumbnailSvg(res.compName, comp?.width || 1920, comp?.height || 1080),
            previewFrames: generateMockScrubFrames(res.compName, 10, comp?.width || 1920, comp?.height || 1080),
            duration: comp?.duration || 5,
            frameRate: comp?.frameRate || 30,
            width: comp?.width || 1920,
            height: comp?.height || 1080,
            layerCount: comp?.numLayers || 4,
            createdAt: new Date().toISOString(),
            customizableProps: customProps,
          };

          exportedItems.push(newItem);
          setExportStatus((prev) => ({
            ...prev,
            [res.compId]: {
              success: true,
              fileName: res.fileName,
            },
          }));
        }

        if (onBatchSaved) {
          await onBatchSaved(exportedItems);
        }

        setBatchExportStatus(`✓ Successfully exported all ${batchResults.length} compositions into Library!`);
      } catch (err: any) {
        console.error('Batch export failed:', err);
        setBatchExportStatus(`Batch export error: ${err.message}`);
      } finally {
        setIsBatchExporting(false);
        setTimeout(() => setBatchExportStatus(null), 5000);
      }

      return exportedItems;
    },
    [scanResult]
  );

  return {
    scanResult,
    isScanning,
    scanError,
    expandedCompId,
    isolatingCompId,
    reductionResults,
    isolationError,
    exportingCompIds,
    isBatchExporting,
    exportStatus,
    batchExportStatus,
    compTextResults,
    inspectingTextCompIds,
    compControlsResults,
    inspectingControlsCompIds,
    compEgResults,
    inspectingEgCompIds,
    expandedEgItemIds,
    expandedTextItemIds,
    expandedControlsItemIds,
    scanProject,
    isolateComp,
    exportComp,
    exportAllComps,
    inspectCompText,
    inspectCompControls,
    inspectCompEg,
    setExpandedCompId,
    toggleExpandedEg,
    toggleExpandedText,
    toggleExpandedControls,
  };
}
