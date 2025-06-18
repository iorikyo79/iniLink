import React, { useRef, useEffect, useMemo, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Toolbar } from './components/Toolbar';
import { FileUpload } from './components/FileUpload';
import { TreeView } from './components/TreeView';
import { EditorForm } from './components/EditorForm';
import { ChangeLog } from './components/ChangeLog';
import { ShareModal } from './components/ShareModal';
import { useIniEditor } from './hooks/useIniEditor';
import { generateChangeLog, getValidationSummary, parseIniFile } from './utils/iniParser';
import { generateShareUrl, parseShareUrl, clearShareUrl, validateShareData } from './utils/shareUtils';

function App() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  const {
    state,
    loadFile,
    updateKey,
    addSection,
    deleteSection,
    renameSection,
    addKey,
    deleteKey,
    renameKey,
    selectKey,
    setSearchQuery,
    toggleSection,
    undo,
    redo,
    exportData,
    reset,
    canUndo,
    canRedo,
  } = useIniEditor();

  const [activeTab, setActiveTab] = React.useState<'editor' | 'changes'>('editor');
  const [error, setError] = React.useState<string | null>(null);
  const [shareModal, setShareModal] = React.useState<{
    isOpen: boolean;
    url: string;
    length: number;
  }>({
    isOpen: false,
    url: '',
    length: 0
  });
  
  // Track if the current file was loaded from a share URL
  const [isSharedFile, setIsSharedFile] = React.useState(false);

  // Memoize validation summary for performance
  const validationSummary = useMemo(() => {
    return state.data?.validationErrors ? 
      getValidationSummary(state.data.validationErrors) : 
      { errorCount: 0, warningCount: 0, criticalIssues: [] };
  }, [state.data?.validationErrors]);

  // Close mobile sidebar when clicking outside or selecting a key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isMobileSidebarOpen && !target.closest('.mobile-sidebar') && !target.closest('.mobile-menu-button')) {
        setIsMobileSidebarOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMobileSidebarOpen]);

  // Close mobile sidebar when a key is selected
  useEffect(() => {
    if (state.selectedKey) {
      setIsMobileSidebarOpen(false);
    }
  }, [state.selectedKey]);

  // Check for shared configuration on app load
  useEffect(() => {
    const loadSharedConfig = async () => {
      try {
        const shareData = parseShareUrl();
        if (shareData && validateShareData(shareData)) {
          // Parse the shared INI data
          const iniData = parseIniFile(shareData.data, shareData.filename);
          
          // Create a synthetic file object for the loadFile function
          const syntheticFile = new File([shareData.data], shareData.filename, {
            type: 'text/plain'
          });
          
          await loadFile(syntheticFile);
          
          // Mark this as a shared file so Save button is enabled
          setIsSharedFile(true);
          
          // Clear the URL parameter to clean up the address bar
          clearShareUrl();
          
          // Show success message
          setError(null);
          
          // Optional: Show a notification that shared config was loaded
          const notification = document.createElement('div');
          notification.className = 'fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded z-50';
          notification.innerHTML = `
            <div class="flex items-center space-x-2">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
              </svg>
              <span>Shared configuration loaded successfully! You can now review and download it.</span>
            </div>
          `;
          document.body.appendChild(notification);
          
          // Remove notification after 4 seconds
          setTimeout(() => {
            if (document.body.contains(notification)) {
              document.body.removeChild(notification);
            }
          }, 4000);
        }
      } catch (error) {
        console.error('Failed to load shared configuration:', error);
        setError(`Failed to load shared configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
        
        // Clear the invalid URL parameter
        clearShareUrl();
      }
    };

    loadSharedConfig();
  }, [loadFile]);

  const handleFileUpload = async (file: File) => {
    try {
      setError(null);
      setIsSharedFile(false); // Reset shared file flag when uploading a new file
      await loadFile(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load file');
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleSave = () => {
    const data = exportData();
    if (data && state.data) {
      const blob = new Blob([data], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = state.data.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleShare = () => {
    if (!state.data) return;
    
    try {
      const { url, length } = generateShareUrl(state.data);
      setShareModal({
        isOpen: true,
        url,
        length
      });
    } catch (error) {
      setError(`Failed to generate share URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleExportLog = () => {
    const log = generateChangeLog(state.changes);
    const blob = new Blob([log], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'change-log.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleKeySelect = (key: any) => {
    selectKey(key);
    // Auto-close mobile sidebar when key is selected
    setIsMobileSidebarOpen(false);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <input
        ref={fileInputRef}
        type="file"
        accept=".ini,.txt"
        onChange={handleFileInputChange}
        className="hidden"
      />
      
      <Toolbar
        onUpload={handleUploadClick}
        onSave={handleSave}
        onExportLog={handleExportLog}
        onShare={handleShare}
        onUndo={undo}
        onRedo={redo}
        onReset={reset}
        canUndo={canUndo}
        canRedo={canRedo}
        hasData={!!state.data}
        isDirty={state.isDirty}
        isSharedFile={isSharedFile}
        searchQuery={state.searchQuery}
        onSearchChange={setSearchQuery}
        validationSummary={validationSummary}
        onMobileMenuToggle={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        isMobileSidebarOpen={isMobileSidebarOpen}
      />
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-600 min-h-11 min-w-11 flex items-center justify-center"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Critical validation issues banner */}
      {validationSummary.criticalIssues.length > 0 && (
        <div className="bg-red-100 border-l-4 border-red-500 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">
                <strong>Critical Issues Found:</strong> {validationSummary.criticalIssues.length} critical validation error{validationSummary.criticalIssues.length !== 1 ? 's' : ''} detected. 
                Please review and fix these issues before saving.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Shared file notification banner */}
      {isSharedFile && (
        <div className="bg-blue-100 border-l-4 border-blue-500 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-800">
                <strong>Shared Configuration:</strong> This file was loaded from a shared link. You can review, edit, and download it directly.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex-1 flex overflow-hidden relative">
        {!state.data ? (
          <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
            <FileUpload onFileUpload={handleFileUpload} className="max-w-md w-full" />
          </div>
        ) : (
          <>
            {/* Mobile Sidebar Overlay */}
            {isMobileSidebarOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-50 z-40 sm:hidden" />
            )}

            {/* Left Sidebar - Tree View */}
            <div className={`
              mobile-sidebar
              ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
              sm:translate-x-0
              fixed sm:relative
              top-0 left-0
              w-80 sm:w-80
              h-full sm:h-auto
              flex-shrink-0
              transition-transform duration-300 ease-in-out
              z-50 sm:z-auto
              bg-white sm:bg-transparent
            `}>
              <TreeView
                sections={state.data.sections}
                selectedKey={state.selectedKey}
                searchQuery={state.searchQuery}
                validationErrors={state.data.validationErrors}
                onKeySelect={handleKeySelect}
                onToggleSection={toggleSection}
                onAddSection={addSection}
                onDeleteSection={deleteSection}
                onRenameSection={renameSection}
                onAddKey={addKey}
                onDeleteKey={deleteKey}
                onRenameKey={renameKey}
              />
            </div>
            
            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* Tab Navigation */}
              <div className="border-b border-gray-200 bg-white">
                <nav className="flex space-x-4 sm:space-x-8 px-4 overflow-x-auto">
                  <button
                    onClick={() => setActiveTab('editor')}
                    className={`py-3 px-1 border-b-2 font-medium text-sm sm:text-base transition-colors whitespace-nowrap min-h-11 ${
                      activeTab === 'editor'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Editor
                    {validationSummary.errorCount > 0 && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {validationSummary.errorCount}
                      </span>
                    )}
                    {validationSummary.warningCount > 0 && validationSummary.errorCount === 0 && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        {validationSummary.warningCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('changes')}
                    className={`py-3 px-1 border-b-2 font-medium text-sm sm:text-base transition-colors whitespace-nowrap min-h-11 ${
                      activeTab === 'changes'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Changes ({state.changes.length})
                  </button>
                </nav>
              </div>
              
              {/* Tab Content */}
              <div className="flex-1 overflow-hidden">
                {activeTab === 'editor' ? (
                  <EditorForm
                    selectedKey={state.selectedKey}
                    validationErrors={state.data.validationErrors}
                    onSave={updateKey}
                    onCancel={() => selectKey(null)}
                  />
                ) : (
                  <ChangeLog changes={state.changes} />
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={shareModal.isOpen}
        onClose={() => setShareModal(prev => ({ ...prev, isOpen: false }))}
        shareUrl={shareModal.url}
        urlLength={shareModal.length}
      />
    </div>
  );
}

export default App;