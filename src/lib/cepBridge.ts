/**
 * Typed, Promise-based Adobe CEP ExtendScript Communication Bridge
 * ae-element-vault
 */

import { CSInterface, HostEnvironment } from '../types/cep';
import {
  PreviewSequenceResult,
  PreviewVideoResult,
  CustomizableProperty,
  TextInspectionResult,
  ControlsInspectionResult,
  EssentialPropsResult,
} from '../types/library';

export type {
  PreviewSequenceResult,
  PreviewVideoResult,
  TextInspectionResult,
  ControlsInspectionResult,
  EssentialPropsResult,
  CustomizableProperty,
};

export interface ExtendScriptResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  [key: string]: any;
}

export interface HostInfo {
  appName: string;
  appVersion: string;
  appLocale: string;
  isMock: boolean;
}

export interface AEPingData {
  appName: string;
  version: string;
  hasActiveProject: boolean;
  projectName: string | null;
  os?: string;
  locale?: string;
}

export interface CompMetadata {
  id: number;
  name: string;
  width: number;
  height: number;
  duration: number;
  frameRate: number;
  numLayers: number;
  hasAudio: boolean;
  dropFrame: boolean;
  usedInOtherComps: boolean;
}

export interface ProjectScanResult {
  projectName: string;
  projectPath: string;
  compCount: number;
  compositions: CompMetadata[];
}

export interface DependencyTree {
  comps: string[];
  footages: string[];
  solids: string[];
}

export interface ReductionResult {
  compName: string;
  itemsRemoved: number;
  remainingCount: number;
  dependencies: DependencyTree;
  directDependencies?: DependencyTree;
  categorized?: {
    compositions: number;
    footages: number;
    solids: number;
    folders: number;
  };
}

export interface ExportResult {
  compId: number;
  compName: string;
  egTemplateName?: string;
  aepPath: string;
  fileName: string;
  fileSize: number;
  thumbnailPath?: string;
  thumbnailFileName?: string;
  width?: number;
  height?: number;
  duration?: number;
  frameRate?: number;
  numLayers?: number;
  customizableProps?: CustomizableProperty[];
}

export interface ThumbnailResult {
  compId: number;
  compName: string;
  captureTime: number;
  thumbnailPath: string;
  fileName: string;
  width?: number;
  height?: number;
}

export interface InsertionResult {
  layerIndex: number;
  layerName: string;
  startTime: number;
  compName: string;
  compWidth: number;
  compHeight: number;
  compFps: number;
  scaleApplied?: number;
  positionApplied?: [number, number];
  originalDimensions?: [number, number];
  targetDimensions?: [number, number];
  fpsMatched?: boolean;
}

export interface SyncResult {
  layerName: string;
  updatedCount: number;
  updatedProperties: string[];
}

export interface InsertionOptions {
  elementName?: string;
  compId?: number | string;
  sourceProjectPath?: string;
  sourceProject?: string;
  targetTime?: number;
  scaleMode?: 'auto' | 'fit-width' | 'fill' | 'original';
  positionMode?: 'center' | 'lower-third' | 'top-third';
  matchFps?: boolean;
  customParams?: Record<string, any>;
}

/**
 * Sanitizes a string for safe filesystem filename usage
 * Replaces Unicode symbols (e.g. arrows) with clean ascii representations or underscores
 */
export function sanitizeFileName(str: string): string {
  if (!str) return 'unnamed_comp';
  let clean = String(str);
  clean = clean.replace(/[\u2193\u21E3\u2B07\u21E9]|↓/g, '_down_');
  clean = clean.replace(/[\u2191\u21E1\u2B06\u21E7]|↑/g, '_up_');
  clean = clean.replace(/[\u2192\u21E2\u279C\u27A1\u21E8]|→/g, '_right_');
  clean = clean.replace(/[\u2190\u21E0\u2B05\u21E6]|←/g, '_left_');
  clean = clean.replace(/[\u2197]|↗/g, '_up_right_');
  clean = clean.replace(/[\u2198]|↘/g, '_down_right_');
  clean = clean.replace(/[\u2199]|↙/g, '_down_left_');
  clean = clean.replace(/[\u2196]|↖/g, '_up_left_');
  clean = clean.replace(/[\u2194]|↔/g, '_left_right_');
  clean = clean.replace(/[\u2195]|↕/g, '_up_down_');
  clean = clean.replace(/["'“”‘’`]/g, '_');
  clean = clean.replace(/[^a-zA-Z0-9_\-]/g, '_');
  clean = clean.replace(/_+/g, '_');
  clean = clean.replace(/^_+|_+$/g, '');
  return clean.length > 0 ? clean : 'comp';
}

/**
 * Generates an ultra-crisp, stylish SVG thumbnail Data URL for browser development and simulation
 */
export function generateMockThumbnailSvg(compName: string, width: number = 1920, height: number = 1080): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 270" width="100%" height="100%">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#141419" />
        <stop offset="50%" stop-color="#1e1e28" />
        <stop offset="100%" stop-color="#0e0e13" />
      </linearGradient>
      <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#3b82f6" />
        <stop offset="50%" stop-color="#8b5cf6" />
        <stop offset="100%" stop-color="#ec4899" />
      </linearGradient>
      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#262634" stroke-width="0.5" />
      </pattern>
    </defs>
    <rect width="480" height="270" fill="url(#bgGrad)" />
    <rect width="480" height="270" fill="url(#grid)" opacity="0.4" />
    <circle cx="240" cy="135" r="90" fill="#3b82f6" opacity="0.1" />
    <rect x="40" y="55" width="400" height="160" rx="8" fill="#181820" fill-opacity="0.85" stroke="#333344" stroke-width="1" />
    <rect x="40" y="55" width="400" height="4" fill="url(#accentGrad)" />
    <text x="240" y="115" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="700" fill="#f3f4f6" text-anchor="middle">${compName}</text>
    <rect x="180" y="135" width="120" height="20" rx="4" fill="#22222d" stroke="#3d3d50" stroke-width="0.5" />
    <text x="240" y="149" font-family="monospace" font-size="10" font-weight="600" fill="#60a5fa" text-anchor="middle">${width}×${height} • 60fps</text>
    <text x="240" y="185" font-family="system-ui, sans-serif" font-size="11" fill="#9ca3af" text-anchor="middle">AE Element Vault • Visual Snapshot</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Generates an array of simulated SVG frame Data URLs with animated indicators and scrub timeline progress
 */
export function generateMockScrubFrames(compName: string, count: number = 10, width: number = 1920, height: number = 1080): string[] {
  const frames: string[] = [];
  const total = Math.max(2, count);

  for (let i = 0; i < total; i++) {
    const progress = i / (total - 1);
    const percent = Math.round(progress * 100);
    const orbX = 60 + progress * 360;
    const orbY = 135 + Math.sin(progress * Math.PI * 2) * 28;
    const barW = Math.round(380 * progress);
    const rotation = Math.round(progress * 360);

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 270" width="100%" height="100%">
      <defs>
        <linearGradient id="bgGrad_${i}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#111116" />
          <stop offset="50%" stop-color="#191924" />
          <stop offset="100%" stop-color="#0a0a0f" />
        </linearGradient>
        <linearGradient id="accentGrad_${i}" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#3b82f6" />
          <stop offset="50%" stop-color="#8b5cf6" />
          <stop offset="100%" stop-color="#06b6d4" />
        </linearGradient>
        <pattern id="grid_${i}" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#232332" stroke-width="0.5" />
        </pattern>
      </defs>
      <rect width="480" height="270" fill="url(#bgGrad_${i})" />
      <rect width="480" height="270" fill="url(#grid_${i})" opacity="0.35" />
      
      <path d="M 60 135 Q 240 100 420 135" fill="none" stroke="#2e2e42" stroke-width="2" stroke-dasharray="4 4" />
      
      <g transform="translate(${orbX.toFixed(1)}, ${orbY.toFixed(1)}) rotate(${rotation})">
        <circle r="22" fill="#3b82f6" fill-opacity="0.25" />
        <rect x="-10" y="-10" width="20" height="20" rx="4" fill="url(#accentGrad_${i})" />
      </g>

      <rect x="50" y="45" width="380" height="150" rx="8" fill="#16161e" fill-opacity="0.88" stroke="#313145" stroke-width="1" />
      <rect x="50" y="45" width="380" height="3" fill="url(#accentGrad_${i})" />
      <text x="240" y="90" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="700" fill="#f8fafc" text-anchor="middle">${compName}</text>
      
      <rect x="150" y="105" width="180" height="22" rx="4" fill="#20202c" stroke="#3d3d52" stroke-width="0.6" />
      <text x="240" y="120" font-family="monospace" font-size="11" font-weight="700" fill="#60a5fa" text-anchor="middle">Frame ${i + 1}/${total} • ${percent}%</text>
      
      <text x="240" y="152" font-family="monospace" font-size="9" fill="#94a3b8" text-anchor="middle">${width}×${height} • 60fps • Scrub Sequence</text>

      <rect x="50" y="215" width="380" height="5" rx="2.5" fill="#252533" />
      <rect x="50" y="215" width="${Math.max(4, barW)}" height="5" rx="2.5" fill="url(#accentGrad_${i})" />
      <circle cx="${Math.min(430, Math.max(50, 50 + barW))}" cy="217.5" r="5" fill="#60a5fa" stroke="#1e1e2d" stroke-width="1.5" />
    </svg>`;

    frames.push(`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`);
  }

  return frames;
}

/**
 * Returns mock customizable text layers for simulated compositions in browser dev mode
 */
export function getMockTextPropertiesForComp(compId: number): CustomizableProperty[] {
  if (compId === 101) {
    return [
      {
        id: 'text_101_1',
        type: 'text',
        layerName: 'Main Headline',
        layerIndex: 1,
        propertyName: 'Source Text',
        defaultValue: 'FUTURE OF MOTION',
        font: 'Montserrat-Bold',
        fontSize: 72,
        justification: 'CENTER',
        tracking: 50,
      },
      {
        id: 'text_101_2',
        type: 'text',
        layerName: 'Subtitle / Tagline',
        layerIndex: 2,
        propertyName: 'Source Text',
        defaultValue: 'NEXT-GEN CREATIVE SUITE',
        font: 'Inter-Medium',
        fontSize: 32,
        justification: 'CENTER',
        tracking: 100,
      },
    ];
  } else if (compId === 102) {
    return [
      {
        id: 'text_102_1',
        type: 'text',
        layerName: 'Brand Tagline',
        layerIndex: 1,
        propertyName: 'Source Text',
        defaultValue: 'INNOVATION IN MOTION',
        font: 'HelveticaNeue-Bold',
        fontSize: 40,
        justification: 'CENTER',
        tracking: 25,
      },
    ];
  } else if (compId === 103) {
    return [
      {
        id: 'text_103_1',
        type: 'text',
        layerName: 'Presenter Name',
        layerIndex: 1,
        propertyName: 'Source Text',
        defaultValue: 'ALEX VANCE',
        font: 'Montserrat-ExtraBold',
        fontSize: 44,
        justification: 'LEFT',
        tracking: 10,
      },
      {
        id: 'text_103_2',
        type: 'text',
        layerName: 'Presenter Role / Title',
        layerIndex: 2,
        propertyName: 'Source Text',
        defaultValue: 'CREATIVE DIRECTOR & FOUNDER',
        font: 'Inter-Regular',
        fontSize: 22,
        justification: 'LEFT',
        tracking: 15,
      },
      {
        id: 'text_103_3',
        type: 'text',
        layerName: '[Social_Precomp] / Handle',
        layerIndex: 3,
        propertyName: 'Source Text',
        defaultValue: '@alexvance_motion',
        font: 'JetBrainsMono-Regular',
        fontSize: 18,
        justification: 'LEFT',
        tracking: 0,
      },
    ];
  }
  return [
    {
      id: `text_${compId}_1`,
      type: 'text',
      layerName: 'Title Text',
      layerIndex: 1,
      propertyName: 'Source Text',
      defaultValue: 'ELEMENT VAULT',
      font: 'Montserrat-Bold',
      fontSize: 64,
      justification: 'CENTER',
      tracking: 0,
    },
    {
      id: `text_${compId}_2`,
      type: 'text',
      layerName: 'Subtitle Text',
      layerIndex: 2,
      propertyName: 'Source Text',
      defaultValue: 'MOTION GRAPHICS ASSET',
      font: 'Inter-Regular',
      fontSize: 28,
      justification: 'CENTER',
      tracking: 0,
    },
  ];
}

/**
 * Returns mock customizable expression controls for simulated compositions in browser dev mode
 */
export function getMockExpressionControlsForComp(compId: number): CustomizableProperty[] {
  if (compId === 101) {
    return [
      {
        id: 'ctrl_color_101_1',
        type: 'color',
        layerName: 'Global Controls',
        layerIndex: 1,
        propertyName: 'Accent Color',
        defaultValue: '#1473E6',
        rawValue: [0.078, 0.451, 0.902, 1.0],
        isMasterControl: true,
      },
      {
        id: 'ctrl_color_101_2',
        type: 'color',
        layerName: 'Global Controls',
        layerIndex: 1,
        propertyName: 'Background Color',
        defaultValue: '#1E1E1E',
        rawValue: [0.118, 0.118, 0.118, 1.0],
        isMasterControl: true,
      },
      {
        id: 'ctrl_slider_101_3',
        type: 'slider',
        layerName: 'Global Controls',
        layerIndex: 1,
        propertyName: 'Corner Radius',
        defaultValue: 24,
        min: 0,
        max: 100,
        isMasterControl: true,
      },
      {
        id: 'ctrl_check_101_4',
        type: 'checkbox',
        layerName: 'Global Controls',
        layerIndex: 1,
        propertyName: 'Show Drop Shadow',
        defaultValue: true,
        isMasterControl: true,
      },
    ];
  } else if (compId === 102) {
    return [
      {
        id: 'ctrl_color_102_1',
        type: 'color',
        layerName: 'Logo Settings',
        layerIndex: 1,
        propertyName: 'Glow Color',
        defaultValue: '#00E5FF',
        rawValue: [0.0, 0.898, 1.0, 1.0],
        isMasterControl: true,
      },
      {
        id: 'ctrl_slider_102_2',
        type: 'slider',
        layerName: 'Logo Settings',
        layerIndex: 1,
        propertyName: 'Logo Scale',
        defaultValue: 85,
        min: 0,
        max: 200,
        isMasterControl: true,
      },
      {
        id: 'ctrl_check_102_3',
        type: 'checkbox',
        layerName: 'Logo Settings',
        layerIndex: 1,
        propertyName: 'Enable Particle Burst',
        defaultValue: false,
        isMasterControl: true,
      },
    ];
  } else if (compId === 103) {
    return [
      {
        id: 'ctrl_color_103_1',
        type: 'color',
        layerName: 'Controls',
        layerIndex: 1,
        propertyName: 'Bar Primary Color',
        defaultValue: '#FF3366',
        rawValue: [1.0, 0.2, 0.4, 1.0],
        isMasterControl: true,
      },
      {
        id: 'ctrl_slider_103_2',
        type: 'slider',
        layerName: 'Controls',
        layerIndex: 1,
        propertyName: 'Box Width',
        defaultValue: 450,
        min: 100,
        max: 1000,
        isMasterControl: true,
      },
      {
        id: 'ctrl_check_103_3',
        type: 'checkbox',
        layerName: 'Controls',
        layerIndex: 1,
        propertyName: 'Show Social Icon',
        defaultValue: true,
        isMasterControl: true,
      },
    ];
  }
  return [
    {
      id: `ctrl_color_${compId}_1`,
      type: 'color',
      layerName: 'Settings',
      layerIndex: 1,
      propertyName: 'Primary Accent',
      defaultValue: '#3B82F6',
      rawValue: [0.231, 0.51, 0.965, 1.0],
      isMasterControl: true,
    },
    {
      id: `ctrl_slider_${compId}_2`,
      type: 'slider',
      layerName: 'Settings',
      layerIndex: 1,
      propertyName: 'Animation Speed',
      defaultValue: 100,
      min: 0,
      max: 200,
      isMasterControl: true,
    },
    {
      id: `ctrl_check_${compId}_3`,
      type: 'checkbox',
      layerName: 'Settings',
      layerIndex: 1,
      propertyName: 'Transparent BG',
      defaultValue: false,
      isMasterControl: true,
    },
  ];
}

/**
 * Returns mock curated Essential Properties (Master Properties) for simulated compositions in browser dev mode
 */
export function getMockEssentialPropertiesForComp(compId: number): CustomizableProperty[] {
  if (compId === 101) {
    return [
      {
        id: 'eg_prop_101_1',
        type: 'text',
        layerName: 'Intro Title (Master Property)',
        layerIndex: 0,
        propertyName: 'Essential Title',
        defaultValue: 'FUTURE OF MOTION',
        font: 'Montserrat-Bold',
        fontSize: 72,
        justification: 'CENTER',
        tracking: 50,
        isEssentialProperty: true,
        isMasterControl: true,
        egTemplateName: 'Cinematic Title Package',
      },
      {
        id: 'eg_prop_101_2',
        type: 'color',
        layerName: 'Intro Title (Master Property)',
        layerIndex: 0,
        propertyName: 'Essential Theme Color',
        defaultValue: '#FFB800',
        rawValue: [1.0, 0.72, 0.0, 1.0],
        isEssentialProperty: true,
        isMasterControl: true,
        egTemplateName: 'Cinematic Title Package',
      },
    ];
  } else if (compId === 102) {
    return [
      {
        id: 'eg_prop_102_1',
        type: 'color',
        layerName: 'Logo Reveal (Master Property)',
        layerIndex: 0,
        propertyName: 'Master Glow Color',
        defaultValue: '#00E5FF',
        rawValue: [0.0, 0.898, 1.0, 1.0],
        isEssentialProperty: true,
        isMasterControl: true,
        egTemplateName: 'Logo Reveal Pro',
      },
    ];
  } else if (compId === 103) {
    return [
      {
        id: 'eg_prop_103_1',
        type: 'text',
        layerName: 'Lower Third Minimal (Master Property)',
        layerIndex: 0,
        propertyName: 'Speaker Headline',
        defaultValue: 'ALEX VANCE',
        font: 'Montserrat-ExtraBold',
        fontSize: 44,
        justification: 'LEFT',
        isEssentialProperty: true,
        isMasterControl: true,
        egTemplateName: 'Lower Third Broadcast Kit',
      },
      {
        id: 'eg_prop_103_2',
        type: 'color',
        layerName: 'Lower Third Minimal (Master Property)',
        layerIndex: 0,
        propertyName: 'Accent Bar Color',
        defaultValue: '#FF3366',
        rawValue: [1.0, 0.2, 0.4, 1.0],
        isEssentialProperty: true,
        isMasterControl: true,
        egTemplateName: 'Lower Third Broadcast Kit',
      },
    ];
  }
  return [
    {
      id: `eg_prop_${compId}_1`,
      type: 'text',
      layerName: 'Headline (Master Property)',
      layerIndex: 0,
      propertyName: 'Main Title',
      defaultValue: 'PROMO ELEMENT',
      font: 'Montserrat-Bold',
      fontSize: 56,
      justification: 'CENTER',
      isEssentialProperty: true,
      isMasterControl: true,
      egTemplateName: 'Dissected Element Package',
    },
    {
      id: `eg_prop_${compId}_2`,
      type: 'color',
      layerName: 'Palette (Master Property)',
      layerIndex: 0,
      propertyName: 'Brand Accent',
      defaultValue: '#1473E6',
      rawValue: [0.08, 0.45, 0.9, 1.0],
      isEssentialProperty: true,
      isMasterControl: true,
      egTemplateName: 'Dissected Element Package',
    },
  ];
}

/**
 * Fallback Mock CSInterface for browser development / testing outside After Effects
 */
class MockCSInterface {
  public hostEnvironment: HostEnvironment = {
    appName: 'AEFT',
    appVersion: '25.2.0 (Simulated)',
    appLocale: 'en_US',
    appUILocale: 'en_US',
    appId: 'AEFT',
    isAppOnline: true,
    appSkinInfo: {
      baseFontFamily: 'Segoe UI',
      baseFontSize: 11,
      appBarBackgroundColor: { color: { red: 30, green: 30, blue: 30, alpha: 255 } },
      panelBackgroundColor: { color: { red: 34, green: 34, blue: 34, alpha: 255 } },
      systemHighlightColor: { color: { red: 20, green: 115, blue: 230, alpha: 255 } },
    },
  };

  public getHostEnvironment(): HostEnvironment {
    return this.hostEnvironment;
  }

  public getApplicationID(): string {
    return 'AEFT';
  }

  public closeExtension(): void {
    console.log('[Mock CSInterface] closeExtension called');
  }

  public getSystemPath(pathType: string): string {
    return `C:/Mock/Adobe/${pathType}`;
  }

  public evalScript(script: string, callback?: (result: string) => void): void {
    console.log('[Mock CSInterface evalScript]:', script);
    setTimeout(() => {
      let response: ExtendScriptResult;

      if (script.includes('ElementVault.ping') || script.includes('pingHost') || script.includes('ping')) {
        response = {
          success: true,
          data: {
            appName: 'Adobe After Effects (Browser Dev Simulation)',
            version: '25.2.0',
            hasActiveProject: true,
            projectName: 'Element_Vault_Demo.aep',
            os: 'Windows 11 (Simulated)',
            locale: 'en_US',
          },
        };
      } else if (script.includes('scanCurrentProject') || script.includes('ElementVault.scanCurrentProject')) {
        response = {
          success: true,
          data: {
            projectName: 'Cinematic_Brand_Package_2026.aep',
            projectPath: 'C:\\Projects\\AfterEffects\\Cinematic_Brand_Package_2026.aep',
            compCount: 3,
            compositions: [
              {
                id: 101,
                name: 'Intro Title',
                width: 3840,
                height: 2160,
                duration: 5.0,
                frameRate: 60,
                numLayers: 12,
                hasAudio: true,
                dropFrame: false,
                usedInOtherComps: false,
              },
              {
                id: 102,
                name: 'Logo Reveal',
                width: 1920,
                height: 1080,
                duration: 3.5,
                frameRate: 30,
                numLayers: 8,
                hasAudio: false,
                dropFrame: false,
                usedInOtherComps: true,
              },
              {
                id: 103,
                name: 'Lower Third Minimal',
                width: 1920,
                height: 1080,
                duration: 6.0,
                frameRate: 60,
                numLayers: 6,
                hasAudio: false,
                dropFrame: false,
                usedInOtherComps: false,
              },
            ],
          },
        };
      } else if (script.includes('scanAepFile') || script.includes('ElementVault.scanAepFile')) {
        response = {
          success: true,
          data: {
            projectName: 'External_Template.aep',
            projectPath: 'C:\\Templates\\External_Template.aep',
            compCount: 2,
            compositions: [
              {
                id: 201,
                name: 'Main Promo Final',
                width: 3840,
                height: 2160,
                duration: 15.0,
                frameRate: 60,
                numLayers: 24,
                hasAudio: true,
                dropFrame: false,
                usedInOtherComps: false,
              },
              {
                id: 202,
                name: 'Badge Outro',
                width: 1920,
                height: 1080,
                duration: 4.0,
                frameRate: 30,
                numLayers: 7,
                hasAudio: false,
                dropFrame: false,
                usedInOtherComps: true,
              },
            ],
          },
        };
      } else if (script.includes('isolateComposition') || script.includes('analyzeDependencies') || script.includes('ElementVault.isolateComposition')) {
        let compName = 'Intro Title';
        let itemsRemoved = 18;
        let dependencies: DependencyTree = {
          comps: [],
          footages: ['Montserrat-Bold.otf'],
          solids: ['Gold_Accent_Solid', 'Dark_Vignette_Solid'],
        };

        if (script.includes('102') || script.includes('Logo Reveal')) {
          compName = 'Logo Reveal';
          itemsRemoved = 22;
          dependencies = {
            comps: ['Glow_Particle_Subcomp'],
            footages: ['Vector_Logo.ai'],
            solids: ['Background_Deep_Navy'],
          };
        } else if (script.includes('103') || script.includes('Lower Third')) {
          compName = 'Lower Third Minimal';
          itemsRemoved = 14;
          dependencies = {
            comps: [],
            footages: ['Divider_Graphic.png'],
            solids: ['Primary_Bar_Cyan', 'Secondary_Bar_Dark'],
          };
        }

        const remainingCount = 1 + dependencies.comps.length + dependencies.footages.length + dependencies.solids.length;

        response = {
          success: true,
          data: {
            compName,
            itemsRemoved,
            remainingCount,
            dependencies,
            directDependencies: dependencies,
            categorized: {
              compositions: dependencies.comps.length,
              footages: dependencies.footages.length,
              solids: dependencies.solids.length,
              folders: 1,
            },
          },
        };
      } else if (script.includes('exportCompositionToAep') || script.includes('ElementVault.exportCompositionToAep')) {
        let compId = 101;
        const match = script.match(/exportCompositionToAep\((\d+)/);
        if (match) {
          compId = parseInt(match[1], 10);
        }
        let compName = 'Intro Title';
        let width = 3840;
        let height = 2160;
        let duration = 5.0;
        let frameRate = 60;
        let numLayers = 12;

        if (compId === 102) {
          compName = 'Logo Reveal';
          width = 1920;
          height = 1080;
          duration = 3.5;
          frameRate = 30;
          numLayers = 8;
        } else if (compId === 103) {
          compName = 'Lower Third Minimal';
          width = 1920;
          height = 1080;
          duration = 6.0;
          frameRate = 60;
          numLayers = 6;
        }

        const safeName = compName.replace(/[^a-zA-Z0-9_\-]/g, '_');
        const fileName = `${safeName}.aep`;
        const libPath = 'C:\\Users\\User\\AppData\\Roaming\\ElementVault\\Library';
        const aepPath = `${libPath}\\assets\\${fileName}`;
        const thumbnailPath = generateMockThumbnailSvg(compName, width, height);

        const egProps = getMockEssentialPropertiesForComp(compId);
        const textProps = getMockTextPropertiesForComp(compId);
        const ctrlProps = getMockExpressionControlsForComp(compId);
        const egNames = new Set(egProps.map((p) => p.propertyName.toLowerCase()));
        const filteredText = textProps.filter((p) => !egNames.has(p.propertyName.toLowerCase()));
        const filteredCtrl = ctrlProps.filter((p) => !egNames.has(p.propertyName.toLowerCase()));
        const customizableProps = [...egProps, ...filteredText, ...filteredCtrl];
        const egTemplateName = compId === 101 ? 'Cinematic Title Package' : (compId === 102 ? 'Logo Reveal Pro' : (compId === 103 ? 'Lower Third Broadcast Kit' : ''));

        response = {
          success: true,
          data: {
            compId,
            compName,
            egTemplateName,
            aepPath,
            fileName,
            fileSize: 1048576,
            thumbnailPath,
            thumbnailFileName: `thumb_${compId}_${safeName}.png`,
            width,
            height,
            duration,
            frameRate,
            numLayers,
            customizableProps,
          },
        };
      } else if (script.includes('captureCompThumbnail') || script.includes('ElementVault.captureCompThumbnail')) {
        let compId = 101;
        const match = script.match(/captureCompThumbnail\((\d+)/);
        if (match) compId = parseInt(match[1], 10);
        let compName = 'Intro Title';
        let width = 3840;
        let height = 2160;

        if (compId === 102) {
          compName = 'Logo Reveal';
          width = 1920;
          height = 1080;
        } else if (compId === 103) {
          compName = 'Lower Third Minimal';
          width = 1920;
          height = 1080;
        }

        const safeName = compName.replace(/[^a-zA-Z0-9_\-]/g, '_');
        const thumbnailPath = generateMockThumbnailSvg(compName, width, height);

        response = {
          success: true,
          data: {
            compId,
            compName,
            captureTime: 2.5,
            thumbnailPath,
            fileName: `thumb_${compId}_${safeName}.png`,
            width,
            height,
          },
        };
      } else if (script.includes('captureBatchThumbnails') || script.includes('ElementVault.captureBatchThumbnails')) {
        let compIds = [101, 102, 103];
        const match = script.match(/captureBatchThumbnails\(\[([^\]]+)\]/);
        if (match) {
          compIds = match[1].split(',').map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n));
        }

        const batchThumbs: ThumbnailResult[] = compIds.map((id) => {
          let name = 'Composition_' + id;
          let w = 1920, h = 1080;
          if (id === 101) { name = 'Intro Title'; w = 3840; h = 2160; }
          else if (id === 102) { name = 'Logo Reveal'; }
          else if (id === 103) { name = 'Lower Third Minimal'; }
          return {
            compId: id,
            compName: name,
            captureTime: 2.0,
            thumbnailPath: generateMockThumbnailSvg(name, w, h),
            fileName: `thumb_${id}.png`,
            width: w,
            height: h,
          };
        });

        response = {
          success: true,
          data: batchThumbs,
        };
      } else if (script.includes('exportBatchCompositions') || script.includes('ElementVault.exportBatchCompositions')) {
        let compIds = [101, 102, 103];
        const match = script.match(/exportBatchCompositions\(\[([^\]]+)\]/);
        if (match) {
          compIds = match[1].split(',').map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n));
        }

        const libPath = 'C:\\Users\\User\\AppData\\Roaming\\ElementVault\\Library';
        const batchResults: ExportResult[] = compIds.map((id) => {
          let name = 'Comp_' + id;
          let w = 1920, h = 1080, d = 5.0, fps = 30, layers = 6;
          if (id === 101) {
            name = 'Intro Title';
            w = 3840; h = 2160; d = 5.0; fps = 60; layers = 12;
          } else if (id === 102) {
            name = 'Logo Reveal';
            w = 1920; h = 1080; d = 3.5; fps = 30; layers = 8;
          } else if (id === 103) {
            name = 'Lower Third Minimal';
            w = 1920; h = 1080; d = 6.0; fps = 60; layers = 6;
          }

          const safe = name.replace(/[^a-zA-Z0-9_\-]/g, '_');
          const egProps = getMockEssentialPropertiesForComp(id);
          const textProps = getMockTextPropertiesForComp(id);
          const ctrlProps = getMockExpressionControlsForComp(id);
          const egNames = new Set(egProps.map((p) => p.propertyName.toLowerCase()));
          const filteredText = textProps.filter((p) => !egNames.has(p.propertyName.toLowerCase()));
          const filteredCtrl = ctrlProps.filter((p) => !egNames.has(p.propertyName.toLowerCase()));
          const customizableProps = [...egProps, ...filteredText, ...filteredCtrl];
          const egTemplateName = id === 101 ? 'Cinematic Title Package' : (id === 102 ? 'Logo Reveal Pro' : (id === 103 ? 'Lower Third Broadcast Kit' : ''));

          return {
            compId: id,
            compName: name,
            egTemplateName,
            aepPath: `${libPath}\\assets\\${safe}.aep`,
            fileName: `${safe}.aep`,
            fileSize: 1048576,
            thumbnailPath: generateMockThumbnailSvg(name, w, h),
            thumbnailFileName: `thumb_${id}_${safe}.png`,
            width: w,
            height: h,
            duration: d,
            frameRate: fps,
            numLayers: layers,
            customizableProps,
          };
        });

        response = {
          success: true,
          data: batchResults,
        };
      } else if (script.includes('getActiveComp')) {
        response = {
          success: true,
          data: {
            id: 101,
            name: 'Vault_Hero_Comp_4K',
            width: 3840,
            height: 2160,
            frameRate: 60,
            duration: 12.5,
            numLayers: 18,
            selectedLayersCount: 2,
            selectedLayers: ['Cinematic_Title_3D', 'Adjustment_Grade_Layer'],
          },
        };
      } else if (script.includes('createAdjustmentLayer')) {
        response = {
          success: true,
          data: { name: 'Adjustment Layer 1', index: 1 },
        };
      } else if (script.includes('createNullController')) {
        response = {
          success: true,
          data: { name: 'Vault_Null_Controller', index: 1 },
        };
      } else if (script.includes('addTextLayer')) {
        response = {
          success: true,
          data: { name: 'ELEMENT VAULT', index: 1 },
        };
      } else if (script.includes('applyElement')) {
        response = {
          success: true,
          data: { message: 'Preset element injected successfully', elementId: 'mock-element' },
        };
      } else if (script.includes('centerAnchorPoint')) {
        response = {
          success: true,
          data: { modifiedCount: 2 },
        };
      } else if (script.includes('renderPreviewSequence') || script.includes('ElementVault.renderPreviewSequence')) {
        let compId = 101;
        const match = script.match(/renderPreviewSequence\((\d+)/);
        if (match) compId = parseInt(match[1], 10);
        let count = 10;
        const countMatch = script.match(/renderPreviewSequence\(\d+,\s*[^,]+,\s*(\d+)/);
        if (countMatch) count = parseInt(countMatch[1], 10);
        if (isNaN(count) || count < 2) count = 10;

        let compName = 'Intro Title';
        let width = 3840;
        let height = 2160;
        if (compId === 102) {
          compName = 'Logo Reveal';
          width = 1920;
          height = 1080;
        } else if (compId === 103) {
          compName = 'Lower Third Minimal';
          width = 1920;
          height = 1080;
        }

        const frames = generateMockScrubFrames(compName, count, width, height);
        const safeName = compName.replace(/[^a-zA-Z0-9_\-]/g, '_');
        response = {
          success: true,
          data: {
            compId,
            compName,
            frameCount: frames.length,
            framePaths: frames,
            sequenceFolder: `C:\\Users\\User\\AppData\\Roaming\\ElementVault\\Library\\previews\\seq_${compId}_${safeName}`,
          },
        };
      } else if (script.includes('renderCompPreviewVideo') || script.includes('ElementVault.renderCompPreviewVideo')) {
        let compId = 101;
        const match = script.match(/renderCompPreviewVideo\((\d+)/);
        if (match) compId = parseInt(match[1], 10);
        let compName = 'Intro Title';
        if (compId === 102) compName = 'Logo Reveal';
        else if (compId === 103) compName = 'Lower Third Minimal';
        const safeName = compName.replace(/[^a-zA-Z0-9_\-]/g, '_');

        response = {
          success: true,
          data: {
            compId,
            previewVideoPath: `C:\\Users\\User\\AppData\\Roaming\\ElementVault\\Library\\previews\\preview_${compId}_${safeName}.mov`,
          },
        };
      } else if (script.includes('inspectTextLayers') || script.includes('ElementVault.inspectTextLayers')) {
        let compId = 101;
        const match = script.match(/inspectTextLayers\((\d+)/);
        if (match) compId = parseInt(match[1], 10);
        let compName = 'Intro Title';
        if (compId === 102) compName = 'Logo Reveal';
        else if (compId === 103) compName = 'Lower Third Minimal';

        const textProps = getMockTextPropertiesForComp(compId);
        response = {
          success: true,
          data: {
            compId,
            compName,
            textCount: textProps.length,
            textProperties: textProps,
          },
        };
      } else if (script.includes('inspectExpressionControls') || script.includes('ElementVault.inspectExpressionControls')) {
        let compId = 101;
        const match = script.match(/inspectExpressionControls\((\d+)/);
        if (match) compId = parseInt(match[1], 10);
        let compName = 'Intro Title';
        if (compId === 102) compName = 'Logo Reveal';
        else if (compId === 103) compName = 'Lower Third Minimal';

        const controls = getMockExpressionControlsForComp(compId);
        response = {
          success: true,
          data: {
            compId,
            compName,
            controlsCount: controls.length,
            controls,
          },
        };
      } else if (script.includes('inspectEssentialProperties') || script.includes('ElementVault.inspectEssentialProperties')) {
        let compId = 101;
        const match = script.match(/inspectEssentialProperties\((\d+)/);
        if (match) compId = parseInt(match[1], 10);
        let compName = 'Intro Title';
        if (compId === 102) compName = 'Logo Reveal';
        else if (compId === 103) compName = 'Lower Third Minimal';

        const egProps = getMockEssentialPropertiesForComp(compId);
        const egTemplateName = compId === 101 ? 'Cinematic Title Package' : (compId === 102 ? 'Logo Reveal Pro' : (compId === 103 ? 'Lower Third Broadcast Kit' : ''));

        response = {
          success: true,
          data: {
            compId,
            compName,
            egTemplateName,
            essentialCount: egProps.length,
            essentialProperties: egProps,
          },
        };
      } else if (
        script.includes('insertElementIntoActiveComp') ||
        script.includes('ElementVault.insertElementIntoActiveComp')
      ) {
        if (typeof window !== 'undefined' && (window as any).__MOCK_AE_NO_ACTIVE_COMP__) {
          response = {
            success: false,
            error: 'Please open a composition in the timeline to insert elements.',
          };
        } else {
          let elementName = 'Cyber Broadcast Lower Third';
          let targetTime = 2.5;
          let scaleMode: 'auto' | 'fit-width' | 'fill' | 'original' = 'auto';
          let positionMode: 'center' | 'lower-third' | 'top-third' = 'center';
          let matchFps = true;

          const matchName = script.match(/"elementName"\s*:\s*"([^"]+)"/);
          if (matchName) {
            elementName = matchName[1];
          }
          const matchTime = script.match(/"targetTime"\s*:\s*([0-9.]+)/);
          if (matchTime) {
            targetTime = parseFloat(matchTime[1]);
          }
          const matchScale = script.match(/"scaleMode"\s*:\s*"([^"]+)"/);
          if (matchScale) {
            scaleMode = matchScale[1] as any;
          }
          const matchPos = script.match(/"positionMode"\s*:\s*"([^"]+)"/);
          if (matchPos) {
            positionMode = matchPos[1] as any;
          }
          const matchFpsRegex = script.match(/"matchFps"\s*:\s*(true|false)/);
          if (matchFpsRegex) {
            matchFps = matchFpsRegex[1] === 'true';
          }

          // Simulate 4K active comp (3840x2160 @ 60fps) adapting a 1080p asset (1920x1080 @ 30fps)
          const compWidth = 3840;
          const compHeight = 2160;
          const compFps = 60;
          const masterWidth = 1920;
          const masterHeight = 1080;

          let scaleFactor = 100;
          if (scaleMode === 'fit-width') {
            scaleFactor = (compWidth / masterWidth) * 100; // 200%
          } else if (scaleMode === 'fill') {
            scaleFactor = Math.max(compWidth / masterWidth, compHeight / masterHeight) * 100; // 200%
          } else if (scaleMode === 'original') {
            scaleFactor = 100;
          } else {
            // 'auto'
            scaleFactor = Math.min(compWidth / masterWidth, compHeight / masterHeight) * 100; // 200%
          }

          let posX = compWidth / 2;
          let posY = compHeight / 2;
          if (positionMode === 'lower-third') {
            posY = compHeight * 0.8;
          } else if (positionMode === 'top-third') {
            posY = compHeight * 0.25;
          }

          response = {
            success: true,
            data: {
              layerIndex: 1,
              layerName: elementName,
              startTime: targetTime,
              compName: 'Main Render Comp',
              compWidth,
              compHeight,
              compFps,
              scaleApplied: scaleFactor,
              positionApplied: [posX, posY],
              originalDimensions: [masterWidth, masterHeight],
              targetDimensions: [compWidth, compHeight],
              fpsMatched: matchFps,
            },
          };
        }
      } else if (
        script.includes('syncToSelectedLayer') ||
        script.includes('ElementVault.syncToSelectedLayer')
      ) {
        if (typeof window !== 'undefined' && (window as any).__MOCK_AE_NO_ACTIVE_COMP__) {
          response = {
            success: false,
            error: 'Please open a composition in the timeline to sync.',
          };
        } else if (typeof window !== 'undefined' && (window as any).__MOCK_AE_NO_SELECTED_LAYER__) {
          response = {
            success: false,
            error: 'Please select the target layer in your After Effects timeline to sync.',
          };
        } else {
          let customParams: Record<string, any> = {};
          const match = script.match(/syncToSelectedLayer\(([\s\S]*)\)/);
          if (match && match[1]) {
            try {
              customParams = JSON.parse(match[1]);
            } catch (e) {
              customParams = {};
            }
          }
          const propKeys = Object.keys(customParams);
          const updatedCount = propKeys.length > 0 ? propKeys.length : 4;
          const updatedProperties = propKeys.length > 0 ? propKeys : ['Source Text', 'Color', 'Radius', 'Glow'];

          response = {
            success: true,
            data: {
              layerName: 'Cyber Broadcast Lower Third',
              updatedCount,
              updatedProperties,
            },
          };
        }
      } else {
        response = {
          success: true,
          data: { result: 'OK (Simulated ExtendScript response)' },
        };
      }

      if (callback) {
        callback(JSON.stringify(response));
      }
    }, 150);
  }

  public addEventListener(type: string, listener: any): void {
    window.addEventListener(type, listener);
  }

  public removeEventListener(type: string, listener: any): void {
    window.removeEventListener(type, listener);
  }

  public dispatchEvent(event: any): void {
    window.dispatchEvent(new CustomEvent(event.type, { detail: event }));
  }

  public openURLInDefaultBrowser(url: string): void {
    window.open(url, '_blank');
  }

  public resizeContent(): void {}
  public registerKeyEventsInterest(): void {}
  public setWindowTitle(title: string): void {
    document.title = title;
  }
  public getWindowTitle(): string {
    return document.title || 'AE Element Vault';
  }
}

/**
 * Checks whether the application is running inside a real Adobe CEP environment.
 */
export function isCEP(): boolean {
  return typeof window !== 'undefined' && Boolean(window.__adobe_cep__);
}

/**
 * Singleton instance of CSInterface, safely initialized for both CEP and Browser dev environments.
 */
let csInterfaceInstance: CSInterface | null = null;

export function getCSInterface(): CSInterface {
  if (!csInterfaceInstance) {
    if (typeof window !== 'undefined' && window.CSInterface && isCEP()) {
      try {
        csInterfaceInstance = new window.CSInterface();
      } catch (err) {
        console.warn('Failed to initialize native CSInterface, using fallback:', err);
        csInterfaceInstance = new MockCSInterface() as unknown as CSInterface;
      }
    } else {
      csInterfaceInstance = new MockCSInterface() as unknown as CSInterface;
    }
  }
  return csInterfaceInstance;
}

export const csInterface = getCSInterface();

/**
 * Evaluates an ExtendScript expression inside After Effects and returns a typed Promise.
 * Automatically parses JSON responses and handles ExtendScript errors.
 *
 * @param script The ExtendScript JavaScript string to execute
 * @returns Promise resolving to the typed parsed result T
 */
export function evalScript<T = any>(script: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const cs = getCSInterface();

    cs.evalScript(script, (rawResult: string) => {
      // 1. Handle native ExtendScript engine execution failure
      if (!rawResult || rawResult === 'EvalScript error.' || rawResult.startsWith('EvalScript error')) {
        return reject(
          new Error(`ExtendScript evaluation error: ${rawResult || 'Unknown execution fault'}`)
        );
      }

      // 2. Try parsing standardized JSON response from host
      try {
        const parsed = JSON.parse(rawResult);

        // Check standardized { success, data, error } protocol
        if (parsed && typeof parsed === 'object') {
          if (parsed.success === false) {
            return reject(
              new Error(parsed.error || parsed.message || 'ExtendScript execution failed')
            );
          }

          // If { success: true, data: ... }
          if (parsed.success === true && parsed.data !== undefined) {
            if (typeof parsed.data === 'object' && parsed.data !== null && !Array.isArray(parsed.data)) {
              return resolve({ ...parsed, ...parsed.data } as T);
            }
            return resolve(parsed.data as T);
          }
        }

        // Return parsed JSON object directly if no wrapper
        return resolve(parsed as T);
      } catch {
        // Fallback: If not JSON, but not an explicit error, resolve with raw string
        return resolve(rawResult as unknown as T);
      }
    });
  });
}

/**
 * Scans the active After Effects project and returns all compositions and their structural metadata
 */
export async function scanActiveProject(): Promise<ProjectScanResult> {
  return evalScript<ProjectScanResult>('ElementVault.scanCurrentProject()');
}

/**
 * Safely inspects an external .aep file on disk and returns its compositions
 */
export async function scanExternalAep(filePath: string): Promise<ProjectScanResult> {
  const safePath = filePath.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return evalScript<ProjectScanResult>(`ElementVault.scanAepFile("${safePath}")`);
}

/**
 * Non-destructively inspects a composition before reduction and identifies all dependencies
 */
export async function analyzeDependencies(compId: number): Promise<ReductionResult> {
  return evalScript<ReductionResult>(`ElementVault.analyzeDependencies(${compId})`);
}

/**
 * Isolates target composition into a lean dependency tree using reduceProject
 *
 * @param compId Composition ID to isolate
 * @param dryRun If true, non-destructively simulates reduction; if false, runs app.project.reduceProject()
 */
export async function isolateComposition(compId: number, dryRun: boolean = true): Promise<ReductionResult> {
  return evalScript<ReductionResult>(`ElementVault.isolateComposition(${compId}, { dryRun: ${dryRun ? 'true' : 'false'} })`);
}

/**
 * Safely exports an isolated composition into a standalone .aep file
 *
 * @param compId Composition ID to export
 * @param outputFolder Destination folder path for the exported .aep
 */
export async function exportComposition(compId: number, outputFolder?: string): Promise<ExportResult> {
  const targetFolder = outputFolder || '';
  const safeFolder = targetFolder.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return evalScript<ExportResult>(`ElementVault.exportCompositionToAep(${compId}, "${safeFolder}")`);
}

/**
 * Batch exports multiple compositions into standalone .aep files
 *
 * @param compIds Array of composition IDs to export
 * @param outputFolder Destination folder path
 */
export async function exportBatchCompositions(compIds: number[], outputFolder?: string): Promise<ExportResult[]> {
  const targetFolder = outputFolder || '';
  const safeFolder = targetFolder.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  const idsStr = JSON.stringify(compIds);
  return evalScript<ExportResult[]>(`ElementVault.exportBatchCompositions(${idsStr}, "${safeFolder}")`);
}

/**
 * Captures a visual PNG thumbnail snapshot from a composition
 *
 * @param compId Composition ID to snapshot
 * @param outputFolder Destination previews directory
 * @param time Optional specific capture time in seconds
 */
export async function captureThumbnail(compId: number, outputFolder?: string, time?: number): Promise<ThumbnailResult> {
  const targetFolder = outputFolder || '';
  const safeFolder = targetFolder.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  const timeArg = typeof time === 'number' ? time : -1;
  return evalScript<ThumbnailResult>(`ElementVault.captureCompThumbnail(${compId}, "${safeFolder}", ${timeArg})`);
}

/**
 * Batch captures visual PNG thumbnails for an array of compositions
 *
 * @param compIds Array of composition IDs
 * @param outputFolder Destination previews directory
 */
export async function captureBatchThumbnails(compIds: number[], outputFolder?: string): Promise<ThumbnailResult[]> {
  const targetFolder = outputFolder || '';
  const safeFolder = targetFolder.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  const idsStr = JSON.stringify(compIds);
  return evalScript<ThumbnailResult[]>(`ElementVault.captureBatchThumbnails(${idsStr}, "${safeFolder}")`);
}

/**
 * Renders an evenly spaced multi-frame scrub sequence for a composition
 *
 * @param compId Composition ID
 * @param outputFolder Destination directory
 * @param frameCount Number of frames to capture (default 10, between 8 and 12)
 */
export async function generatePreviewSequence(
  compId: number,
  outputFolder?: string,
  frameCount?: number
): Promise<PreviewSequenceResult> {
  const targetFolder = outputFolder || '';
  const safeFolder = targetFolder.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  const count = typeof frameCount === 'number' ? frameCount : 10;
  return evalScript<PreviewSequenceResult>(
    `ElementVault.renderPreviewSequence(${compId}, "${safeFolder}", ${count})`
  );
}

/**
 * Attempts to render a fast preview video with clean fallback to sequence
 *
 * @param compId Composition ID
 * @param outputFolder Destination directory
 */
export async function generatePreviewVideo(
  compId: number,
  outputFolder?: string
): Promise<{ compId: number; previewVideoPath: string }> {
  const targetFolder = outputFolder || '';
  const safeFolder = targetFolder.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return evalScript<{ compId: number; previewVideoPath: string }>(
    `ElementVault.renderCompPreviewVideo(${compId}, "${safeFolder}")`
  );
}

/**
 * Discovers and extracts all editable text layers in a composition
 *
 * @param compId Composition ID to inspect
 */
export async function inspectTextLayers(compId: number): Promise<TextInspectionResult> {
  return evalScript<TextInspectionResult>(`ElementVault.inspectTextLayers(${compId})`);
}

/**
 * Discovers and extracts all expression controls in a composition
 *
 * @param compId Composition ID to inspect
 */
export async function inspectExpressionControls(compId: number): Promise<ControlsInspectionResult> {
  return evalScript<ControlsInspectionResult>(`ElementVault.inspectExpressionControls(${compId})`);
}

/**
 * Discovers and extracts all exposed Essential Properties from a composition's Master Properties setup
 *
 * @param compId Composition ID to inspect
 */
export async function inspectEssentialProperties(compId: number): Promise<EssentialPropsResult> {
  return evalScript<EssentialPropsResult>(`ElementVault.inspectEssentialProperties(${compId})`);
}

/**
 * Imports an isolated .aep asset and places it into the active composition at the current playhead
 *
 * @param aepPath Target .aep file path on disk
 * @param options Optional insertion options (elementName, targetTime, customParams)
 */
export async function insertElement(
  aepPath: string,
  options?: InsertionOptions
): Promise<InsertionResult> {
  const safePath = (aepPath || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  const optStr = options ? JSON.stringify(options) : '{}';
  return evalScript<InsertionResult>(
    `ElementVault.insertElementIntoActiveComp("${safePath}", ${optStr})`
  );
}

/**
 * Synchronizes customized parameters directly to the currently selected layer in the active comp
 *
 * @param customParams Map of parameter IDs/names to updated values
 */
export async function syncParametersToSelectedLayer(
  customParams: Record<string, any>
): Promise<SyncResult> {
  const paramStr = JSON.stringify(customParams || {});
  return evalScript<SyncResult>(
    `ElementVault.syncToSelectedLayer(${paramStr})`
  );
}

if (typeof window !== 'undefined') {
  (window as any).__insertElement = insertElement;
  (window as any).__evalScript = evalScript;
  (window as any).__syncParametersToSelectedLayer = syncParametersToSelectedLayer;
}

/**
 * Formats seconds into standard timeline timecode (e.g. 00:02:15 at 30fps)
 */
export function formatInsertionTimecode(seconds: number, fps: number = 30): string {
  const totalSeconds = Math.max(0, seconds);
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = Math.floor(totalSeconds % 60);
  const frames = Math.floor((totalSeconds % 1) * fps);

  const pad = (n: number) => (n < 10 ? '0' + n : String(n));

  if (hrs > 0) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}:${pad(frames)}`;
  }
  return `${pad(mins)}:${pad(secs)}:${pad(frames)}`;
}

/**
 * Returns host application metadata: application name, version, and locale.
 */
export function getHostEnvironment(): HostInfo {
  const cs = getCSInterface();
  const env = cs.getHostEnvironment();

  if (isCEP() && env) {
    return {
      appName: env.appName || 'Adobe After Effects',
      appVersion: env.appVersion || 'Unknown',
      appLocale: env.appLocale || 'en_US',
      isMock: false,
    };
  }

  return {
    appName: 'Adobe After Effects (Simulated)',
    appVersion: '25.2.0',
    appLocale: 'en_US',
    isMock: true,
  };
}

/**
 * Safely opens an external URL in the user's default web browser.
 * Uses CSInterface in CEP, Node.js shell in CEF, or window.open in standard browsers.
 */
export function openURLInDefaultBrowser(url: string): void {
  const cs = getCSInterface();

  if (isCEP()) {
    try {
      cs.openURLInDefaultBrowser(url);
      return;
    } catch (e) {
      console.warn('CSInterface.openURLInDefaultBrowser failed:', e);
    }
  }

  // Node.js CEF fallback
  if (typeof window !== 'undefined' && typeof window.require === 'function') {
    try {
      const childProcess = window.require('child_process');
      const os = window.require('os');
      if (os.platform() === 'win32') {
        childProcess.exec(`start "" "${url}"`);
        return;
      } else if (os.platform() === 'darwin') {
        childProcess.exec(`open "${url}"`);
        return;
      }
    } catch {
      // ignore and fall through
    }
  }

  // Standard web browser fallback
  window.open(url, '_blank', 'noopener,noreferrer');
}
