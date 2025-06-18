import React from 'react';
import { 
  Upload, 
  Download, 
  FileText, 
  Undo, 
  Redo, 
  Search,
  RotateCcw,
  AlertTriangle,
  XCircle,
  Share2,
  Menu
} from 'lucide-react';

interface ValidationSummary {
  errorCount: number;
  warningCount: number;
  criticalIssues: any[];
}

interface ToolbarProps {
  onUpload: () => void;
  onSave: () => void;
  onExportLog: () => void;
  onShare: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
  canUndo: boolean;
  canRedo: boolean;
  hasData: boolean;
  isDirty: boolean;
  isSharedFile?: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  validationSummary?: ValidationSummary;
  onMobileMenuToggle?: () => void;
  isMobileSidebarOpen?: boolean;
}

export function Toolbar({
  onUpload,
  onSave,
  onExportLog,
  onShare,
  onUndo,
  onRedo,
  onReset,
  canUndo,
  canRedo,
  hasData,
  isDirty,
  isSharedFile = false,
  searchQuery,
  onSearchChange,
  validationSummary,
  onMobileMenuToggle,
  isMobileSidebarOpen = false,
}: ToolbarProps) {
  const hasValidationIssues = validationSummary && (validationSummary.errorCount > 0 || validationSummary.warningCount > 0);
  const hasCriticalIssues = validationSummary && validationSummary.criticalIssues.length > 0;

  // Save button should be enabled if:
  // 1. Has data AND (has changes OR is a shared file) AND no critical issues
  const canSave = hasData && (isDirty || isSharedFile) && !hasCriticalIssues;

  return (
    <div className="bg-white border-b border-gray-200 px-2 sm:px-4 py-2 sm:py-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center space-x-1 sm:space-x-2">
          {/* Mobile Menu Button */}
          {hasData && (
            <button
              onClick={onMobileMenuToggle}
              className="mobile-menu-button sm:hidden flex items-center justify-center min-h-11 min-w-11 p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              <Menu size={20} />
            </button>
          )}
          
          <button
            onClick={onUpload}
            className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors min-h-11 text-sm sm:text-base"
          >
            <Upload size={16} />
            <span className="hidden sm:inline">Upload INI</span>
            <span className="sm:hidden">Upload</span>
          </button>
          
          <button
            onClick={onSave}
            disabled={!canSave}
            className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors min-h-11 text-sm sm:text-base"
            title={
              hasCriticalIssues 
                ? 'Cannot save: Critical validation errors present' 
                : isSharedFile && !isDirty
                  ? 'Download shared configuration'
                  : 'Save changes'
            }
          >
            <Download size={16} />
            <span className="hidden sm:inline">{isSharedFile && !isDirty ? 'Download' : 'Save'}</span>
            <span className="sm:hidden">{isSharedFile && !isDirty ? 'DL' : 'Save'}</span>
          </button>
          
          <button
            onClick={onShare}
            disabled={!hasData}
            className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors min-h-11 text-sm sm:text-base"
            title="Share configuration via URL"
          >
            <Share2 size={16} />
            <span className="hidden sm:inline">Share</span>
          </button>
          
          <button
            onClick={onExportLog}
            disabled={!hasData || !isDirty}
            className="hidden sm:flex items-center space-x-2 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors min-h-11"
          >
            <FileText size={16} />
            <span>Export Log</span>
          </button>
          
          <div className="flex items-center space-x-1 border-l border-gray-300 pl-1 sm:pl-2 ml-1 sm:ml-2">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className="p-2 text-gray-600 hover:text-gray-800 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors min-h-11 min-w-11 flex items-center justify-center rounded-lg hover:bg-gray-100"
              title="Undo"
            >
              <Undo size={16} />
            </button>
            
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className="p-2 text-gray-600 hover:text-gray-800 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors min-h-11 min-w-11 flex items-center justify-center rounded-lg hover:bg-gray-100"
              title="Redo"
            >
              <Redo size={16} />
            </button>
            
            <button
              onClick={onReset}
              disabled={!hasData}
              className="p-2 text-red-600 hover:text-red-800 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors min-h-11 min-w-11 flex items-center justify-center rounded-lg hover:bg-red-50"
              title="Reset"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
          {/* Validation Status */}
          {hasValidationIssues && (
            <div className="hidden sm:flex items-center space-x-2">
              {validationSummary!.errorCount > 0 && (
                <div className="flex items-center space-x-1 text-red-600">
                  <XCircle size={16} />
                  <span className="text-sm font-medium">
                    {validationSummary!.errorCount} error{validationSummary!.errorCount !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
              {validationSummary!.warningCount > 0 && (
                <div className="flex items-center space-x-1 text-yellow-600">
                  <AlertTriangle size={16} />
                  <span className="text-sm font-medium">
                    {validationSummary!.warningCount} warning{validationSummary!.warningCount !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Status indicators */}
          {isSharedFile && !isDirty && (
            <span className="hidden sm:inline text-sm text-blue-600 font-medium">
              Shared file ready to download
            </span>
          )}
          
          {isDirty && (
            <span className="hidden sm:inline text-sm text-orange-600 font-medium">
              Unsaved changes
            </span>
          )}
          
          <div className="relative flex-shrink-0 min-w-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search keys..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-32 sm:w-48 text-base min-h-11"
            />
          </div>
        </div>
      </div>
    </div>
  );
}