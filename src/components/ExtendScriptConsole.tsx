import React, { useState } from 'react';
import { Play, RotateCcw, Code, CheckCircle, AlertTriangle } from 'lucide-react';
import { csBridge } from '../utils/csinterface';

const SAMPLE_SNIPPETS = [
  { label: 'ElementVault.ping() (Standardized JSON)', code: 'ElementVault.ping()' },
  { label: 'Get Active Comp Name', code: 'app.project.activeItem ? app.project.activeItem.name : "No active comp"' },
  { label: 'Get After Effects Version', code: 'app.version + " (" + app.appName + ")"' },
  { label: 'Count Project Items', code: '"Total Items: " + app.project.numItems' },
  { label: 'List Selected Layer Names', code: 'var c = app.project.activeItem; if (c) { var s = []; for (var i=0; i<c.selectedLayers.length; i++) s.push(c.selectedLayers[i].name); s.join(", "); } else { "No comp"; }' },
  { label: 'ExtendScript Engine OS info', code: '$.os + " | Memory: " + ($.memCache / 1024 / 1024).toFixed(1) + " MB"' }
];

export const ExtendScriptConsole: React.FC = () => {
  const [script, setScript] = useState('app.project.activeItem ? app.project.activeItem.name : "No Active Comp"');
  const [output, setOutput] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isError, setIsError] = useState(false);

  const runScript = async () => {
    setIsRunning(true);
    setIsError(false);
    try {
      const res = await csBridge.evalScript(script);
      setOutput(res);
      if (res && res.toLowerCase().includes('evalscript error')) {
        setIsError(true);
      }
    } catch (err: any) {
      setIsError(true);
      setOutput(err?.message || String(err));
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="p-3.5 space-y-3 flex flex-col h-full overflow-y-auto">
      <div className="flex items-center justify-between pb-1 border-b border-[#303038]">
        <div className="flex items-center gap-2">
          <Code className="w-4 h-4 text-purple-400" />
          <h3 className="text-xs font-semibold text-neutral-200">ExtendScript REPL & Bridge</h3>
        </div>
        <span className="text-[10px] text-neutral-400 font-mono">evalScript API</span>
      </div>

      <div className="space-y-1.5">
        <label className="text-[11px] text-neutral-400">Quick ExtendScript Snippets</label>
        <select
          onChange={(e) => setScript(e.target.value)}
          className="w-full bg-[#1b1b20] border border-[#353540] text-neutral-300 text-xs rounded px-2.5 py-1.5 outline-none focus:border-blue-500"
        >
          <option value="">-- Choose a code snippet --</option>
          {SAMPLE_SNIPPETS.map((s, idx) => (
            <option key={idx} value={s.code}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1 flex-1 flex flex-col min-h-[140px]">
        <div className="flex items-center justify-between text-[11px] text-neutral-400">
          <span>JavaScript / ExtendScript</span>
          <button
            onClick={() => {
              setScript('');
              setOutput(null);
            }}
            className="text-[10px] text-neutral-400 hover:text-white flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" /> Clear
          </button>
        </div>
        <textarea
          value={script}
          onChange={(e) => setScript(e.target.value)}
          rows={5}
          placeholder="Enter ExtendScript code (e.g. app.project.activeItem.name)..."
          className="w-full flex-1 bg-[#151518] border border-[#34343e] focus:border-blue-500 text-xs text-neutral-200 font-mono p-2.5 rounded outline-none resize-none selection:bg-purple-900"
        />
      </div>

      <button
        onClick={runScript}
        disabled={isRunning || !script.trim()}
        className="w-full py-2 px-3 rounded bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm shadow-blue-900/30"
      >
        <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
        {isRunning ? 'Executing in AE...' : 'Execute Script in After Effects'}
      </button>

      {/* Output Console Box */}
      {output !== null && (
        <div className="rounded border border-[#34343e] bg-[#141416] p-2.5 space-y-1 font-mono text-xs">
          <div className="flex items-center justify-between text-[10px] pb-1 border-b border-[#28282e]">
            <span className="flex items-center gap-1 font-semibold text-neutral-400">
              {isError ? (
                <AlertTriangle className="w-3 h-3 text-red-400" />
              ) : (
                <CheckCircle className="w-3 h-3 text-emerald-400" />
              )}
              Host Return Output
            </span>
            <span className="text-neutral-500">{new Date().toLocaleTimeString()}</span>
          </div>
          <pre
            className={`whitespace-pre-wrap break-all text-[11px] max-h-36 overflow-y-auto ${
              isError ? 'text-rose-400' : 'text-emerald-300'
            }`}
          >
            {output || '(Empty string returned)'}
          </pre>
        </div>
      )}
    </div>
  );
};
