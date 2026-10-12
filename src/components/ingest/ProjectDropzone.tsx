import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FolderOpen,
  Zap,
  AlertCircle,
  X,
} from 'lucide-react';

interface ProjectDropzoneProps {
  onFileSelected: (file: File | string, isCurrentProject?: boolean) => void;
  disabled?: boolean;
}

export const ProjectDropzone: React.FC<ProjectDropzoneProps> = ({
  onFileSelected,
  disabled = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const validateAndProcessFile = (file: File) => {
    setErrorMessage(null);
    const fileName = file.name || '';
    if (!fileName.toLowerCase().endsWith('.aep')) {
      setErrorMessage(`Invalid file "${fileName}". Please drop a valid Adobe After Effects (.aep) project file.`);
      return;
    }
    onFileSelected(file, false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndProcessFile(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      validateAndProcessFile(file);
      e.target.value = '';
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleDissectActiveProject = () => {
    setErrorMessage(null);
    onFileSelected('Active_Workspace_Project.aep', true);
  };

  return (
    <div className="w-full space-y-2">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        id="aep-file-input"
        type="file"
        accept=".aep"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Drag & Drop Zone */}
      <div
        id="project-dropzone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative p-5 rounded-xl border-2 border-dashed transition-all select-none flex flex-col items-center justify-center text-center ${
          isDragOver
            ? 'border-[#1473E6] bg-blue-500/10 shadow-lg shadow-blue-500/25 ring-2 ring-[#1473E6]/40 scale-[1.008]'
            : 'border-[#333333] hover:border-[#4a4a4a] bg-[#222222]/80 hover:bg-[#252525]'
        } ${disabled ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}
        onClick={handleBrowseClick}
      >
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1473E6]/20 via-indigo-600/20 to-purple-600/20 border border-blue-500/30 flex items-center justify-center mb-2.5 shadow-inner">
          <UploadCloud
            className={`w-6 h-6 transition-transform duration-200 ${
              isDragOver ? 'scale-110 text-white animate-bounce' : 'text-[#1473E6]'
            }`}
          />
        </div>

        <div className="space-y-0.5">
          <h3 className="text-xs font-bold text-white tracking-wide">
            Drop After Effects Project (<span className="text-[#1473E6]">.AEP</span>)
          </h3>
          <p className="text-[10px] text-[#8e8e8e] max-w-xs">
            Drag and drop any .aep file to automatically scan, isolate dependencies, extract Master Properties, and export library elements
          </p>
        </div>

        <div className="flex items-center gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
          <button
            id="browse-aep-btn"
            type="button"
            onClick={handleBrowseClick}
            disabled={disabled}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#1473E6] hover:bg-[#0d66d0] active:bg-blue-800 text-white text-[10px] font-semibold transition-all shadow-sm shadow-blue-900/30"
          >
            <FolderOpen className="w-3 h-3" />
            <span>Browse Files</span>
          </button>

          <span className="text-[9px] text-[#6e6e6e] font-mono">or</span>

          <button
            id="dissect-active-project-btn"
            type="button"
            onClick={handleDissectActiveProject}
            disabled={disabled}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#2a2a2a] hover:bg-[#333333] active:bg-[#3d3d3d] text-[#e1e1e1] hover:text-white text-[10px] font-semibold transition-all border border-[#3d3d3d]"
            title="Single-click dissection of currently open After Effects workspace"
          >
            <Zap className="w-3 h-3 text-amber-400" />
            <span>Dissect Open AE Project</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div
          id="dropzone-error-alert"
          className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-300 text-[10px] flex items-center justify-between gap-2 animate-in fade-in duration-150"
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
            <span className="truncate">{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="p-0.5 rounded hover:bg-rose-500/20 text-rose-400 hover:text-white"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
};
