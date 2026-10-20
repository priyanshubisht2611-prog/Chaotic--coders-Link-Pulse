import React, { useEffect, useState } from 'react';
import { X, Download, Copy, Check, QrCode } from 'lucide-react';
import { generateQrDataUrl } from '../services/qr';

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title?: string;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({ isOpen, onClose, url, title }) => {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && url) {
      setLoading(true);
      generateQrDataUrl(url)
        .then(res => {
          setDataUrl(res);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    }
  }, [isOpen, url]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `linkpulse-qr-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-sm w-full p-6 relative">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
            <QrCode className="w-4 h-4 text-blue-600" />
            <span>QR Code</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 flex flex-col items-center">
          <div className="w-56 h-56 bg-slate-50 border border-slate-200 rounded-md p-3 flex items-center justify-center">
            {loading ? (
              <span className="text-xs text-slate-400">Generating QR code...</span>
            ) : dataUrl ? (
              <img
                src={dataUrl}
                alt="QR Code"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="text-xs text-rose-500">Failed to render QR</span>
            )}
          </div>

          <div className="w-full mt-3">
            <div className="text-[11px] text-slate-400 uppercase font-medium tracking-wider">Destination / Short Link</div>
            <div className="text-xs text-slate-800 font-mono break-all truncate bg-slate-50 border border-slate-200 p-2 rounded-md mt-1">
              {url}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 w-full mt-4">
            <button
              onClick={handleCopy}
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md border border-slate-200 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied Link' : 'Copy Link'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PNG</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
