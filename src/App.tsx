import React, { useRef, useEffect, useMemo, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Toolbar } from './components/Toolbar';
import { UnifiedFileUpload } from './components/UnifiedFileUpload';
import { UnifiedTreeView } from './components/UnifiedTreeView';
import { UnifiedEditorForm } from './components/UnifiedEditorForm';
import { UnifiedChangeLog } from './components/UnifiedChangeLog';
import { ShareModal } from './components/ShareModal';
import { useUnifiedEditor } from './hooks/useUnifiedEditor';
import { generateShareUrl, parseShareUrl, clearShareUrl, validateShareData } from './utils/shareUtils';

function App() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  const {
    state,
    loadFile,
    updateNode,
    addNode,
    deleteNode,
    selectNode,
    setSearchQuery,
    toggleExpanded,
    undo,
    redo,
    exportData,
    reset,
    validateCurrentFile,
    canUndo,
    canRedo,
  } = useUnifiedEditor();

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
  
  const [isSharedFile, setIsSharedFile] = React.useState(false);

  // Get selected node object
  const selectedNodeObject = useMemo(() => {
    if (!state.selectedNode || !state.currentFile) return null;
    
    function findNode(node: any, path: string): any {
      if (node.path === path) return node;
      if (node.children) {
        for (const child of node.children) {
          const found = findNode(child, path);
          if (found) return found;
        }
      }
      return null;
    }
    
    return findNode(state.currentFile.content, state.selectedNode);
  }, [state.selectedNode, state.currentFile]);

  // Validation summary
  const validationSummary = useMemo(() => {
    try {
      const errors = validateCurrentFile();
      return {
        errorCount: errors.filter(e => e.severity === 'error').length,
        warningCount: errors.filter(e => e.severity === 'warning').length,
        criticalIssues: errors.filter(e => e.severity === 'error')
      };
    } catch (error) {
      console.error('검증 요약 생성 오류:', error);
      return {
        errorCount: 0,
        warningCount: 0,
        criticalIssues: []
      };
    }
  }, [validateCurrentFile]);

  // Close mobile sidebar when clicking outside or selecting a node
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

  useEffect(() => {
    if (state.selectedNode) {
      setIsMobileSidebarOpen(false);
    }
  }, [state.selectedNode]);

  // Check for shared configuration on app load
  useEffect(() => {
    const loadSharedConfig = async () => {
      try {
        const shareData = parseShareUrl();
        if (shareData && validateShareData(shareData)) {
          const syntheticFile = new File([shareData.content], shareData.filename, {
            type: shareData.fileType === 'json' ? 'application/json' :
                  shareData.fileType === 'xml' ? 'application/xml' :
                  'text/plain'
          });
          
          await loadFile(syntheticFile);
          setIsSharedFile(true);
          clearShareUrl();
          setError(null);
          
          // Show success notification
          const notification = document.createElement('div');
          notification.className = 'fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded z-50';
          notification.innerHTML = `
            <div class="flex items-center space-x-2">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
              </svg>
              <span>공유된 구성 파일이 성공적으로 로드되었습니다!</span>
            </div>
          `;
          document.body.appendChild(notification);
          
          setTimeout(() => {
            if (document.body.contains(notification)) {
              document.body.removeChild(notification);
            }
          }, 4000);
        }
      } catch (error) {
        console.error('공유 구성 로드 실패:', error);
        setError(`공유 구성 로드 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
        clearShareUrl();
      }
    };

    loadSharedConfig();
  }, [loadFile]);

  const handleFileUpload = async (file: File) => {
    try {
      setError(null);
      setIsSharedFile(false);
      await loadFile(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : '파일 로드 실패');
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
    try {
      const data = exportData();
      if (data && state.currentFile) {
        const blob = new Blob([data], { 
          type: state.currentFile.type === 'json' ? 'application/json' :
                state.currentFile.type === 'xml' ? 'application/xml' :
                'text/plain'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = state.currentFile.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      setError(`파일 저장 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  const handleShare = () => {
    if (!state.currentFile) return;
    
    try {
      const shareData = {
        version: '2.0',
        fileType: state.currentFile.type,
        content: exportData() || '',
        filename: state.currentFile.filename
      };
      
      const { url, length } = generateShareUrl(shareData as any);
      setShareModal({
        isOpen: true,
        url,
        length
      });
    } catch (error) {
      setError(`공유 URL 생성 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  const handleExportLog = () => {
    const log = generateChangeLog(state.changeHistory);
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

  const generateChangeLog = (changes: any[]) => {
    let log = `ConfigLink 변경 로그\n`;
    log += `생성일: ${new Date().toISOString()}\n`;
    log += `총 변경 사항: ${changes.length}\n\n`;

    changes.forEach((change, index) => {
      log += `${index + 1}. ${change.type.toUpperCase()}\n`;
      log += `   경로: ${change.path}\n`;
      log += `   시간: ${change.timestamp.toISOString()}\n`;
      
      if (change.oldValue !== null && change.oldValue !== undefined) {
        log += `   이전 값: ${JSON.stringify(change.oldValue)}\n`;
      }
      if (change.newValue !== null && change.newValue !== undefined) {
        log += `   새 값: ${JSON.stringify(change.newValue)}\n`;
      }
      if (change.comment) {
        log += `   설명: ${change.comment}\n`;
      }
      log += '\n';
    });

    return log;
  };

  const handleNodeSelect = (path: string) => {
    selectNode(path);
    setIsMobileSidebarOpen(false);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <input
        ref={fileInputRef}
        type="file"
        accept=".ini,.json,.xml,.cfg,.conf,.config,.txt"
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
        hasData={!!state.currentFile}
        isDirty={state.isModified}
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
                <strong>중요한 문제 발견:</strong> {validationSummary.criticalIssues.length}개의 중요한 검증 오류가 감지되었습니다.
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
                <strong>공유된 구성 파일:</strong> 이 파일은 공유 링크에서 로드되었습니다. 검토, 편집 및 다운로드할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex-1 flex overflow-hidden relative">
        {!state.currentFile ? (
          <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
            <UnifiedFileUpload onFileUpload={handleFileUpload} className="max-w-2xl w-full" />
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
              <UnifiedTreeView
                data={state.currentFile.content}
                fileType={state.currentFile.type}
                selectedNode={state.selectedNode}
                searchQuery={state.searchQuery}
                expandedPaths={state.expandedPaths}
                onNodeSelect={handleNodeSelect}
                onToggleExpanded={toggleExpanded}
                onAddNode={addNode}
                onDeleteNode={deleteNode}
                onUpdateNode={updateNode}
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
                    편집기
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
                    변경 사항 ({state.changeHistory.length})
                  </button>
                </nav>
              </div>
              
              {/* Tab Content */}
              <div className="flex-1 overflow-hidden">
                {activeTab === 'editor' ? (
                  <UnifiedEditorForm
                    selectedNode={selectedNodeObject}
                    onSave={updateNode}
                    onCancel={() => selectNode(null)}
                  />
                ) : (
                  <UnifiedChangeLog changes={state.changeHistory} />
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