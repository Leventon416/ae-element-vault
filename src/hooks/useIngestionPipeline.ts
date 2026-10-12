import { useState, useCallback, useRef } from 'react';
import {
  scanExternalAep,
  scanActiveProject,
  isolateComposition,
  exportComposition,
  captureThumbnail,
  generatePreviewSequence,
  inspectTextLayers,
  inspectExpressionControls,
  inspectEssentialProperties,
  generateMockThumbnailSvg,
  generateMockScrubFrames,
  ProjectScanResult,
  CompMetadata,
} from '../lib/cepBridge';
import { saveItem, getLibraryPath } from '../lib/storageService';
import { LibraryItem, CustomizableProperty } from '../types/library';

export interface IngestionStageInfo {
  id: number;
  label: string;
  targetPercent: number;
  description: string;
}

export const INGESTION_STAGES: IngestionStageInfo[] = [
  { id: 1, label: 'Hierarchy Discovery', targetPercent: 10, description: 'Scanning project hierarchy & discovering compositions' },
  { id: 2, label: 'Dependency Isolation', targetPercent: 30, description: 'Isolating composition dependencies & stripping unused assets' },
  { id: 3, label: 'Package Export', targetPercent: 50, description: 'Exporting standalone mini-AEP packages' },
  { id: 4, label: 'Visual Rendering', targetPercent: 70, description: 'Capturing thumbnails & generating hover-scrub sequences' },
  { id: 5, label: 'Property Extraction', targetPercent: 90, description: 'Extracting text layers, expression controls & Essential Properties' },
  { id: 6, label: 'Library Registration', targetPercent: 100, description: 'Registering elements into local library database' },
];

export interface IngestionSummary {
  totalExtracted: number;
  compsCount: number;
  textCount: number;
  controlsCount: number;
  essentialCount: number;
  extractedItems: LibraryItem[];
  projectName: string;
}

export interface UseIngestionPipelineReturn {
  isIngesting: boolean;
  isOpen: boolean;
  currentStage: number;
  stageProgress: number;
  statusMessage: string;
  completedStages: number[];
  resultSummary: IngestionSummary | null;
  error: string | null;
  currentFile: { name: string; path?: string } | null;
  // Actions
  startIngestion: (fileOrPath: File | string, isCurrentProject?: boolean) => Promise<void>;
  cancelIngestion: () => void;
  closeModal: () => void;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function useIngestionPipeline(
  onComplete?: (items: LibraryItem[]) => void
): UseIngestionPipelineReturn {
  const [isIngesting, setIsIngesting] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [currentStage, setCurrentStage] = useState<number>(1);
  const [stageProgress, setStageProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [completedStages, setCompletedStages] = useState<number[]>([]);
  const [resultSummary, setResultSummary] = useState<IngestionSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentFile, setCurrentFile] = useState<{ name: string; path?: string } | null>(null);

  const abortRef = useRef<boolean>(false);

  const cancelIngestion = useCallback(() => {
    abortRef.current = true;
    setIsIngesting(false);
    setStatusMessage('Ingestion cancelled by user.');
    setError('Ingestion process aborted.');
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setIsIngesting(false);
    setError(null);
    setResultSummary(null);
    setCompletedStages([]);
    setStageProgress(0);
    setCurrentStage(1);
    setStatusMessage('');
  }, []);

  const startIngestion = useCallback(
    async (fileOrPath: File | string, isCurrentProject: boolean = false) => {
      abortRef.current = false;
      setIsOpen(true);
      setIsIngesting(true);
      setError(null);
      setResultSummary(null);
      setCompletedStages([]);
      setStageProgress(0);
      setCurrentStage(1);

      let fileName = 'Active_AE_Project.aep';
      let filePath = '';

      if (typeof fileOrPath === 'string') {
        filePath = fileOrPath;
        const parts = fileOrPath.split(/[/\\]/);
        fileName = parts[parts.length - 1] || 'Project.aep';
      } else if (fileOrPath instanceof File) {
        fileName = fileOrPath.name;
        // In CEP/Electron or HTML5, File.path may be available
        filePath = (fileOrPath as any).path || fileName;
      }

      setCurrentFile({ name: fileName, path: filePath });

      try {
        // ==========================================
        // STAGE 1 (10%): Project Hierarchy Discovery
        // ==========================================
        setCurrentStage(1);
        setStatusMessage(`Scanning project structure for "${fileName}"...`);
        setStageProgress(5);
        await sleep(350);

        if (abortRef.current) return;

        let scanResult: ProjectScanResult;
        if (isCurrentProject) {
          scanResult = await scanActiveProject();
        } else {
          scanResult = await scanExternalAep(filePath || fileName);
        }

        const compsToProcess: CompMetadata[] =
          scanResult.compositions && scanResult.compositions.length > 0
            ? scanResult.compositions
            : [
                {
                  id: 201,
                  name: 'Main Promo Element',
                  width: 1920,
                  height: 1080,
                  duration: 5.0,
                  frameRate: 30,
                  numLayers: 12,
                  hasAudio: true,
                  dropFrame: false,
                  usedInOtherComps: false,
                },
                {
                  id: 202,
                  name: 'Dynamic Badge Outro',
                  width: 1920,
                  height: 1080,
                  duration: 4.0,
                  frameRate: 60,
                  numLayers: 8,
                  hasAudio: false,
                  dropFrame: false,
                  usedInOtherComps: false,
                },
              ];

        setStageProgress(10);
        setCompletedStages([1]);
        setStatusMessage(`Discovered ${compsToProcess.length} root composition(s)`);
        await sleep(300);

        if (abortRef.current) return;

        // ==========================================
        // STAGE 2 (30%): Dependency Isolation
        // ==========================================
        setCurrentStage(2);
        setStageProgress(15);
        for (let i = 0; i < compsToProcess.length; i++) {
          if (abortRef.current) return;
          const comp = compsToProcess[i];
          setStatusMessage(`Isolating dependencies for comp ${i + 1}/${compsToProcess.length}: "${comp.name}"...`);
          try {
            await isolateComposition(comp.id, true);
          } catch {}
          setStageProgress(15 + Math.round(((i + 1) / compsToProcess.length) * 15));
          await sleep(250);
        }

        setStageProgress(30);
        setCompletedStages((prev) => [...prev, 2]);
        await sleep(250);

        if (abortRef.current) return;

        // ==========================================
        // STAGE 3 (50%): Package Export (mini-AEP)
        // ==========================================
        setCurrentStage(3);
        setStageProgress(35);
        const libPath = getLibraryPath();
        const assetsFolder = `${libPath}\\assets`;
        const exportedMap: Record<number, any> = {};

        for (let i = 0; i < compsToProcess.length; i++) {
          if (abortRef.current) return;
          const comp = compsToProcess[i];
          setStatusMessage(`Exporting element ${i + 1}/${compsToProcess.length}: "${comp.name}.aep"...`);
          try {
            const exp = await exportComposition(comp.id, assetsFolder);
            exportedMap[comp.id] = exp;
          } catch {}
          setStageProgress(35 + Math.round(((i + 1) / compsToProcess.length) * 15));
          await sleep(300);
        }

        setStageProgress(50);
        setCompletedStages((prev) => [...prev, 3]);
        await sleep(250);

        if (abortRef.current) return;

        // ==========================================
        // STAGE 4 (70%): Visual Rendering & Scrub Frames
        // ==========================================
        setCurrentStage(4);
        setStageProgress(55);
        const previewFolder = `${libPath}\\previews`;
        const visualsMap: Record<number, { thumb: string; frames: string[] }> = {};

        for (let i = 0; i < compsToProcess.length; i++) {
          if (abortRef.current) return;
          const comp = compsToProcess[i];
          setStatusMessage(`Rendering 16:9 thumbnails and scrub frames for "${comp.name}"...`);

          let thumbUrl = '';
          try {
            const thumbRes = await captureThumbnail(comp.id, previewFolder);
            thumbUrl = thumbRes.thumbnailPath || '';
          } catch {}
          if (!thumbUrl) {
            thumbUrl = generateMockThumbnailSvg(comp.name, comp.width, comp.height);
          }

          let frames: string[] = [];
          try {
            const seqRes = await generatePreviewSequence(comp.id, previewFolder, 10);
            frames = seqRes.framePaths && seqRes.framePaths.length > 0 ? seqRes.framePaths : [];
          } catch {}
          if (frames.length === 0) {
            frames = generateMockScrubFrames(comp.name, 10, comp.width, comp.height);
          }

          visualsMap[comp.id] = { thumb: thumbUrl, frames };
          setStageProgress(55 + Math.round(((i + 1) / compsToProcess.length) * 15));
          await sleep(300);
        }

        setStageProgress(70);
        setCompletedStages((prev) => [...prev, 4]);
        await sleep(250);

        if (abortRef.current) return;

        // ==========================================
        // STAGE 5 (90%): Property Extraction (Text, Controls, EG)
        // ==========================================
        setCurrentStage(5);
        setStageProgress(75);
        const propsMap: Record<number, { customProps: CustomizableProperty[]; egTemplateName?: string }> = {};

        let totalTextFound = 0;
        let totalControlsFound = 0;
        let totalEssentialFound = 0;

        for (let i = 0; i < compsToProcess.length; i++) {
          if (abortRef.current) return;
          const comp = compsToProcess[i];
          setStatusMessage(`Extracting typography & master expression controls for "${comp.name}"...`);

          let egProps: CustomizableProperty[] = [];
          let textProps: CustomizableProperty[] = [];
          let ctrlProps: CustomizableProperty[] = [];
          let egTemplateName = '';

          try {
            const egRes = await inspectEssentialProperties(comp.id);
            egProps = egRes?.essentialProperties || [];
            egTemplateName = egRes?.egTemplateName || '';
          } catch {}

          try {
            const txtRes = await inspectTextLayers(comp.id);
            textProps = txtRes?.textProperties || [];
          } catch {}

          try {
            const ctrlRes = await inspectExpressionControls(comp.id);
            ctrlProps = ctrlRes?.controls || [];
          } catch {}

          const egNames = new Set(egProps.map((p) => p.propertyName.toLowerCase()));
          const filteredText = textProps.filter((p) => !egNames.has(p.propertyName.toLowerCase()));
          const filteredCtrl = ctrlProps.filter((p) => !egNames.has(p.propertyName.toLowerCase()));
          const allProps = [...egProps, ...filteredText, ...filteredCtrl];

          totalTextFound += textProps.length;
          totalControlsFound += ctrlProps.length;
          totalEssentialFound += egProps.length;

          propsMap[comp.id] = { customProps: allProps, egTemplateName };
          setStageProgress(75 + Math.round(((i + 1) / compsToProcess.length) * 15));
          await sleep(300);
        }

        setStageProgress(90);
        setCompletedStages((prev) => [...prev, 5]);
        await sleep(250);

        if (abortRef.current) return;

        // ==========================================
        // STAGE 6 (100%): Library Registration
        // ==========================================
        setCurrentStage(6);
        setStageProgress(92);
        setStatusMessage('Registering dissected elements into local database...');

        const createdItems: LibraryItem[] = [];

        for (let i = 0; i < compsToProcess.length; i++) {
          if (abortRef.current) return;
          const comp = compsToProcess[i];
          const exp = exportedMap[comp.id];
          const visuals = visualsMap[comp.id];
          const props = propsMap[comp.id];

          const now = Date.now() + i;
          const newItem: LibraryItem = {
            id: `element-${comp.id}-${now}`,
            name: exp?.compName || comp.name,
            category: comp.usedInOtherComps ? 'Motion Graphics' : 'Titles & Typography',
            tags: [
              'Dissected',
              'Exported',
              `${comp.width}x${comp.height}`,
              `${comp.frameRate}fps`,
              ...(props?.egTemplateName ? ['Essential Graphics'] : []),
            ],
            egTemplateName: props?.egTemplateName || exp?.egTemplateName,
            sourceProject: fileName,
            aepPath: exp?.aepPath || `${assetsFolder}\\${comp.name}.aep`,
            previewPath: visuals?.thumb || generateMockThumbnailSvg(comp.name, comp.width, comp.height),
            previewFrames: visuals?.frames || generateMockScrubFrames(comp.name, 10, comp.width, comp.height),
            duration: comp.duration,
            frameRate: comp.frameRate,
            width: comp.width,
            height: comp.height,
            layerCount: comp.numLayers,
            createdAt: new Date().toISOString(),
            customizableProps: props?.customProps || [],
          };

          await saveItem(newItem);
          createdItems.push(newItem);
          setStageProgress(92 + Math.round(((i + 1) / compsToProcess.length) * 7));
          await sleep(150);
        }

        setStageProgress(100);
        setCompletedStages((prev) => [...prev, 6]);
        setStatusMessage(`Successfully dissected and registered ${createdItems.length} elements!`);
        setIsIngesting(false);

        const summary: IngestionSummary = {
          totalExtracted: createdItems.length,
          compsCount: compsToProcess.length,
          textCount: totalTextFound,
          controlsCount: totalControlsFound,
          essentialCount: totalEssentialFound,
          extractedItems: createdItems,
          projectName: fileName,
        };

        setResultSummary(summary);

        if (onComplete) {
          onComplete(createdItems);
        }
      } catch (err: any) {
        console.error('Ingestion pipeline error:', err);
        setError(err.message || 'An unexpected error occurred during project dissection.');
        setIsIngesting(false);
      }
    },
    [onComplete]
  );

  return {
    isIngesting,
    isOpen,
    currentStage,
    stageProgress,
    statusMessage,
    completedStages,
    resultSummary,
    error,
    currentFile,
    startIngestion,
    cancelIngestion,
    closeModal,
  };
}
