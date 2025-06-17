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
  Share2
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
  searchQuery: string;
  onSearchChange: (query: string) => void;
  validationSummary?: ValidationSummary;
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
  searchQuery,
  onSearchChange,
  validationSummary,
}: ToolbarProps) {
  const hasValidationIssues = validationSummary && (validationSummary.errorCount > 0 || validationSummary.warningCount > 0);
  const hasCriticalIssues = validationSummary && validationSummary.criticalIssues.length > 0;

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={onUpload}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Upload size={16} />
            <span>Upload INI</span>
          </button>
          
          <button
            onClick={onSave}
            disabled={!hasData || !isDirty || hasCriticalIssues}
            className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            title={hasCriticalIssues ? 'Cannot save: Critical validation errors present' : ''}
          >
            <Download size={16} />
            <span>Save</span>
          </button>
          
          <button
            onClick={onShare}
            disabled={!hasData}
            className="flex items-center space-x-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            title="Share configuration via URL"
          >
            <Share2 size={16} />
            <span>Share</span>
          </button>
          
          <button
            onClick={onExportLog}
            disabled={!hasData || !isDirty}
            className="flex items-center space-x-2 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <FileText size={16} />
            <span>Export Log</span>
          </button>
          
          <div className="flex items-center space-x-1 border-l border-gray-300 pl-2 ml-2">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className="p-2 text-gray-600 hover:text-gray-800 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
              title="Undo"
            >
              <Undo size={16} />
            </button>
            
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className="p-2 text-gray-600 hover:text-gray-800 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
              title="Redo"
            >
              <Redo size={16} />
            </button>
            
            <button
              onClick={onReset}
              disabled={!hasData}
              className="p-2 text-red-600 hover:text-red-800 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
              title="Reset"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Validation Status */}
          {hasValidationIssues && (
            <div className="flex items-center space-x-2">
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

          {isDirty && (
            <span className="text-sm text-orange-600 font-medium">
              Unsaved changes
            </span>
          )}
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search keys..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>
    </div>
  );
}