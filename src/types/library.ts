/**
 * Type interfaces for the Element Vault local library ecosystem
 */

export interface CustomizableProperty {
  id: string;
  type: 'text' | 'color' | 'slider' | 'checkbox';
  layerName: string;
  propertyName: string;
  defaultValue: any;
  min?: number;
  max?: number;
  font?: string;
  fontSize?: number;
  layerIndex?: number;
  justification?: string;
  fillColor?: number[] | null;
  tracking?: number;
  rawValue?: number[];
  isMasterControl?: boolean;
  isEssentialProperty?: boolean;
  egTemplateName?: string;
}

export interface TextInspectionResult {
  compId: number;
  compName: string;
  textCount: number;
  textProperties: CustomizableProperty[];
}

export interface ControlsInspectionResult {
  compId: number;
  compName: string;
  controlsCount: number;
  controls: CustomizableProperty[];
}

export interface EssentialPropsResult {
  compId: number;
  compName: string;
  egTemplateName: string;
  essentialCount: number;
  essentialProperties: CustomizableProperty[];
}


export interface ParameterPreset {
  id: string;
  name: string;
  createdAt: string;
  values: Record<string, any>;
}

export interface LibraryItem {
  id: string;
  name: string;
  category: string;
  tags: string[];
  sourceProject: string;
  sourceProjectPath?: string;
  aepPath: string;
  previewPath: string;
  duration: number;
  frameRate: number;
  width: number;
  height: number;
  layerCount: number;
  createdAt: string;
  customizableProps: CustomizableProperty[];
  egTemplateName?: string;
  previewVideoPath?: string;
  previewFrames?: string[];
  presets?: ParameterPreset[];
}

export interface PreviewSequenceResult {
  compId: number;
  compName: string;
  frameCount: number;
  framePaths: string[];
  sequenceFolder: string;
}

export interface PreviewVideoResult {
  compId: number;
  previewVideoPath: string;
}

export interface LibraryDatabase {
  version: string;
  defaultLibraryPath: string;
  items: LibraryItem[];
  categories: string[];
}

