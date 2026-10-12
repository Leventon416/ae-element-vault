import React, { useState, useEffect } from 'react';
import { Cpu, CheckCircle2, ShieldCheck, Folder, HardDrive } from 'lucide-react';
import { getNodeSystemReport, NodeSystemReport } from '../utils/nodeIntegration';

export const NodeStatusPanel: React.FC = () => {
  const [report, setReport] = useState<NodeSystemReport | null>(null);
  const [fsTestLog, setFsTestLog] = useState<string | null>(null);

  useEffect(() => {
    setReport(getNodeSystemReport());
  }, []);

  const runFsTest = () => {
    if (typeof window !== 'undefined' && typeof window.require === 'function') {
      try {
        const fs = window.require('fs');
        const os = window.require('os');
        const path = window.require('path');
        const testFile = path.join(os.tmpdir(), 'ae-vault-test.json');

        const payload = JSON.stringify({
          app: 'AE Element Vault',
          timestamp: new Date().toISOString(),
          test: 'Node.js filesystem integration in Adobe CEP'
        });

        fs.writeFileSync(testFile, payload, 'utf-8');
        const readBack = fs.readFileSync(testFile, 'utf-8');
        fs.unlinkSync(testFile);

        setFsTestLog(`✓ Successfully verified Node.js fs read/write in CEF!\nFile tested: ${testFile}\nPayload: ${readBack}`);
      } catch (e: any) {
        setFsTestLog(`✗ Node.js FS Error: ${e.message}`);
      }
    } else {
      setFsTestLog('ℹ Browser Dev Simulation: In a standard web browser, window.require is unavailable. When loaded inside Adobe After Effects with CEP --enable-nodejs, direct local filesystem and child_process APIs are active.');
    }
  };

  return (
    <div className="p-3.5 space-y-3.5 overflow-y-auto">
      {/* Node Status Banner */}
      <div className="rounded-lg bg-[#24242a] border border-[#363640] p-3.5 space-y-3 shadow-sm">
        <div className="flex items-center justify-between pb-2 border-b border-[#303038]">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-semibold text-neutral-200">CEF Node.js Integration</h3>
          </div>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium border ${
              report?.isNodeAvailable
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
            }`}
          >
            {report?.isNodeAvailable ? 'Active in CEP' : 'Configured in Manifest'}
          </span>
        </div>

        <p className="text-[11px] text-neutral-400 leading-relaxed">
          Node.js integration is enabled in <code className="text-blue-300 font-mono">CSXS/manifest.xml</code> via the{' '}
          <code className="text-amber-300 font-mono">--enable-nodejs</code> and{' '}
          <code className="text-amber-300 font-mono">--mixed-context</code> Chromium CEF parameters.
        </p>

        {/* Configuration Flags Matrix */}
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between p-2 rounded bg-[#1b1b20] border border-[#2e2e36]">
            <span className="text-neutral-300 flex items-center gap-1.5 font-mono text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              --enable-nodejs
            </span>
            <span className="text-[10px] text-emerald-400 font-medium">ENABLED</span>
          </div>

          <div className="flex items-center justify-between p-2 rounded bg-[#1b1b20] border border-[#2e2e36]">
            <span className="text-neutral-300 flex items-center gap-1.5 font-mono text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              --mixed-context
            </span>
            <span className="text-[10px] text-emerald-400 font-medium">ENABLED</span>
          </div>

          <div className="flex items-center justify-between p-2 rounded bg-[#1b1b20] border border-[#2e2e36]">
            <span className="text-neutral-300 flex items-center gap-1.5 font-mono text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              --allow-file-access-from-files
            </span>
            <span className="text-[10px] text-emerald-400 font-medium">ENABLED</span>
          </div>
        </div>
      </div>

      {/* System Diagnostics */}
      <div className="rounded-lg bg-[#24242a] border border-[#363640] p-3.5 space-y-2.5 shadow-sm">
        <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
          <HardDrive className="w-3.5 h-3.5 text-blue-400" />
          Runtime Environment Telemetry
        </h4>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 rounded bg-[#1b1b20] border border-[#2d2d34]">
            <span className="text-[10px] text-neutral-500 block">Platform</span>
            <span className="text-neutral-200 font-mono font-medium truncate block">
              {report?.platform}
            </span>
          </div>

          <div className="p-2 rounded bg-[#1b1b20] border border-[#2d2d34]">
            <span className="text-[10px] text-neutral-500 block">Architecture</span>
            <span className="text-neutral-200 font-mono font-medium truncate block">
              {report?.arch}
            </span>
          </div>

          <div className="p-2 rounded bg-[#1b1b20] border border-[#2d2d34] col-span-2">
            <span className="text-[10px] text-neutral-500 block">Temp Directory</span>
            <span className="text-neutral-300 font-mono text-[11px] truncate block">
              {report?.tempDirectory || '%TEMP%'}
            </span>
          </div>
        </div>

        {/* Live File System Test Action */}
        <button
          onClick={runFsTest}
          className="w-full py-2 px-3 rounded bg-[#303038] hover:bg-[#3b3b46] text-neutral-200 hover:text-white text-xs font-medium flex items-center justify-center gap-1.5 border border-[#40404a] transition-all"
        >
          <Folder className="w-3.5 h-3.5 text-blue-400" />
          Test Local Filesystem Bridge (Node fs)
        </button>

        {fsTestLog && (
          <div className="p-2.5 rounded bg-[#161618] border border-[#32323a] text-[11px] font-mono text-neutral-300 whitespace-pre-wrap break-all">
            {fsTestLog}
          </div>
        )}
      </div>

      {/* Docking Architecture Card */}
      <div className="rounded-lg bg-[#24242a] border border-[#363640] p-3 space-y-1.5 shadow-sm text-xs">
        <div className="flex items-center gap-1.5 text-neutral-200 font-semibold text-xs">
          <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
          Panel Docking Architecture
        </div>
        <p className="text-[11px] text-neutral-400 leading-relaxed">
          The panel type is set to <code className="text-blue-300 font-mono">&lt;Type&gt;Panel&lt;/Type&gt;</code> in manifest.xml with responsive min/max geometry constraints (260px - 1800px width), allowing After Effects editors to dock it seamlessly into any timeline, effects, or workspace panel group.
        </p>
      </div>
    </div>
  );
};
