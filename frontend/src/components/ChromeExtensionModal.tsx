import React, { useState } from 'react';
import { X, Chrome, FolderCode, Check, Copy, ExternalLink, Shield } from 'lucide-react';

interface ChromeExtensionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChromeExtensionModal: React.FC<ChromeExtensionModalProps> = ({ isOpen, onClose }) => {
  const [copiedPath, setCopiedPath] = useState(false);

  if (!isOpen) return null;

  const extensionPath = './extension';

  const copyPath = () => {
    navigator.clipboard.writeText(extensionPath).then(() => {
      setCopiedPath(true);
      setTimeout(() => setCopiedPath(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-md w-full p-6 relative">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
              <Chrome className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">
              Install LinkPulse Local Extension
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            LinkPulse includes a pre-configured Chrome extension in your project's repository. Follow these four quick steps to load it into Google Chrome:
          </p>

          <ol className="space-y-3 text-xs text-slate-700">
            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-semibold flex items-center justify-center shrink-0 text-[11px]">
                1
              </span>
              <div>
                Open <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-800">chrome://extensions</code> in your Google Chrome browser address bar.
              </div>
            </li>

            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-semibold flex items-center justify-center shrink-0 text-[11px]">
                2
              </span>
              <div>
                Toggle on <span className="font-semibold text-slate-900">Developer mode</span> using the switch in the top-right corner.
              </div>
            </li>

            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-semibold flex items-center justify-center shrink-0 text-[11px]">
                3
              </span>
              <div>
                Click the <span className="font-semibold text-slate-900">"Load unpacked"</span> button in the top-left toolbar.
              </div>
            </li>

            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-semibold flex items-center justify-center shrink-0 text-[11px]">
                4
              </span>
              <div>
                Select the project's <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-800">extension</code> folder.
              </div>
            </li>
          </ol>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-500 font-medium">Extension Folder Path:</span>
              <button
                onClick={copyPath}
                className="text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium transition-colors"
              >
                {copiedPath ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy Folder Name</span>
                  </>
                )}
              </button>
            </div>
            <div className="font-mono text-xs text-slate-800 font-semibold bg-white px-2.5 py-1.5 rounded border border-slate-200 flex items-center justify-between">
              <span>{extensionPath}</span>
              <FolderCode className="w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>

          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-md text-[11px] text-amber-800 flex items-start gap-2">
            <Shield className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Local Developer Build:</span> This is an unpacked developer extension located directly in your workspace repository, not published on the Chrome Web Store.
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
