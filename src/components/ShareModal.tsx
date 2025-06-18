import React, { useState, useEffect } from 'react';
import { X, Copy, Check, AlertTriangle, Share2, ExternalLink } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareUrl: string;
  urlLength: number;
}

export function ShareModal({ isOpen, onClose, shareUrl, urlLength }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  // URL length limits for different browsers/contexts
  const URL_LIMITS = {
    SAFE: 2000,      // Safe limit for all browsers
    WARNING: 8000,   // Warning threshold
    DANGER: 32000,   // Danger threshold (some browsers may fail)
  };

  const getUrlStatus = () => {
    if (urlLength <= URL_LIMITS.SAFE) {
      return { level: 'safe', message: 'URL is safe for all browsers and platforms' };
    } else if (urlLength <= URL_LIMITS.WARNING) {
      return { level: 'warning', message: 'URL may not work in some email clients or older browsers' };
    } else if (urlLength <= URL_LIMITS.DANGER) {
      return { level: 'danger', message: 'URL is very long and may fail in many contexts' };
    } else {
      return { level: 'critical', message: 'URL exceeds safe limits and will likely fail' };
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setCopyError(false);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      setCopyError(true);
      setTimeout(() => setCopyError(false), 2000);
    }
  };

  const handleTestUrl = () => {
    window.open(shareUrl, '_blank');
  };

  useEffect(() => {
    if (!isOpen) {
      setCopied(false);
      setCopyError(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const urlStatus = getUrlStatus();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Share2 className="text-blue-600" size={24} />
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Share INI Configuration</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors min-h-11 min-w-11 flex items-center justify-center rounded-lg hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          {/* URL Status Indicator */}
          <div className={`p-4 rounded-lg border ${
            urlStatus.level === 'safe' ? 'bg-green-50 border-green-200' :
            urlStatus.level === 'warning' ? 'bg-yellow-50 border-yellow-200' :
            urlStatus.level === 'danger' ? 'bg-orange-50 border-orange-200' :
            'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center space-x-2 mb-2">
              {urlStatus.level === 'safe' ? (
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              ) : urlStatus.level === 'warning' ? (
                <AlertTriangle className="text-yellow-600" size={16} />
              ) : urlStatus.level === 'danger' ? (
                <AlertTriangle className="text-orange-600" size={16} />
              ) : (
                <AlertTriangle className="text-red-600" size={16} />
              )}
              <span className={`font-medium text-sm ${
                urlStatus.level === 'safe' ? 'text-green-800' :
                urlStatus.level === 'warning' ? 'text-yellow-800' :
                urlStatus.level === 'danger' ? 'text-orange-800' :
                'text-red-800'
              }`}>
                URL Length: {urlLength.toLocaleString()} characters
              </span>
            </div>
            <p className={`text-sm ${
              urlStatus.level === 'safe' ? 'text-green-700' :
              urlStatus.level === 'warning' ? 'text-yellow-700' :
              urlStatus.level === 'danger' ? 'text-orange-700' :
              'text-red-700'
            }`}>
              {urlStatus.message}
            </p>
          </div>

          {/* URL Display and Copy */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Shareable URL
            </label>
            <div className="flex flex-col space-y-2">
              <div className="relative">
                <textarea
                  value={shareUrl}
                  readOnly
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mt-3">
              <button
                onClick={handleCopy}
                disabled={copied || copyError}
                className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors min-h-11 text-base ${
                  copied 
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : copyError
                    ? 'bg-red-100 text-red-800 border border-red-200'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {copied ? (
                  <>
                    <Check size={16} />
                    <span>Copied!</span>
                  </>
                ) : copyError ? (
                  <>
                    <X size={16} />
                    <span>Failed to copy</span>
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    <span>Copy URL</span>
                  </>
                )}
              </button>
              
              <button
                onClick={handleTestUrl}
                className="flex items-center justify-center space-x-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors min-h-11 text-base"
              >
                <ExternalLink size={16} />
                <span>Test URL</span>
              </button>
            </div>
          </div>

          {/* Usage Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">How to use this shared link:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Share this URL with others to let them view and edit your INI configuration</li>
              <li>• The configuration data is embedded in the URL (no server storage required)</li>
              <li>• Recipients can make changes and generate their own share links</li>
              <li>• The original file is not modified - each share creates an independent copy</li>
            </ul>
          </div>

          {/* Technical Details */}
          <details className="border border-gray-200 rounded-lg">
            <summary className="px-4 py-3 cursor-pointer text-sm font-medium text-gray-700 hover:bg-gray-50">
              Technical Details
            </summary>
            <div className="px-4 pb-4 text-sm text-gray-600 space-y-2">
              <p><strong>Compression:</strong> Data is compressed using LZ-String algorithm</p>
              <p><strong>Encoding:</strong> Base64 URL-safe encoding for compatibility</p>
              <p><strong>Data included:</strong> INI structure and values (comments and change history excluded)</p>
              <p><strong>Security:</strong> No data is sent to external servers - everything is client-side</p>
            </div>
          </details>

          {/* Warnings for large URLs */}
          {urlStatus.level !== 'safe' && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Recommendations for large configurations:</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Consider removing unnecessary sections or keys before sharing</li>
                <li>• Test the URL in your target environment before sharing widely</li>
                <li>• For very large files, consider using traditional file sharing methods</li>
                <li>• Some platforms (email, chat apps) may truncate or reject long URLs</li>
              </ul>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 p-4 sm:p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors min-h-11 text-base"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}