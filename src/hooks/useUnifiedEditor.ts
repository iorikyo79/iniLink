import { useState, useCallback, useMemo } from 'react';
import { EditorState, UnifiedNode, Change, FileType } from '../types/unified';
import { FileProcessor } from '../utils/fileProcessor';
import { ValidationEngine } from '../utils/validation';

export function useUnifiedEditor() {
  const [state, setState] = useState<EditorState>({
    currentFile: null,
    selectedNode: null,
    changeHistory: [],
    isModified: false,
    searchQuery: '',
    expandedPaths: new Set(),
    history: [],
    historyIndex: -1,
  });

  const fileProcessor = useMemo(() => new FileProcessor(), []);
  const validationEngine = useMemo(() => new ValidationEngine(), []);

  const loadFile = useCallback(async (file: File) => {
    try {
      // Validate file
      const validation = fileProcessor.validateFile(file);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Read file content
      const content = await file.text();
      const sanitizedContent = fileProcessor.sanitizeInput(content);
      
      // Detect file type and parse
      const fileType = fileProcessor.detectFileType(file);
      
      // Parse content (now properly handling async XML parsing)
      const parsedContent = await fileProcessor.parseContent(sanitizedContent, fileType, file.name);
      
      // Create new state
      const newFile = {
        type: fileType,
        content: parsedContent,
        originalContent: sanitizedContent,
        filename: file.name
      };

      setState(prev => ({
        ...prev,
        currentFile: newFile,
        changeHistory: [],
        selectedNode: null,
        isModified: false,
        expandedPaths: new Set([parsedContent.path]),
        history: [parsedContent],
        historyIndex: 0,
      }));
    } catch (error) {
      console.error('File loading error:', error);
      throw error;
    }
  }, [fileProcessor]);

  const updateNode = useCallback((path: string, newValue: any, comment?: string) => {
    setState(prev => {
      if (!prev.currentFile) return prev;

      const updateNodeRecursive = (node: UnifiedNode): UnifiedNode => {
        if (node.path === path) {
          const isModified = node.metadata?.originalValue !== newValue;
          return {
            ...node,
            value: newValue,
            metadata: {
              ...node.metadata,
              isModified,
              lastModified: new Date(),
            }
          };
        }

        if (node.children) {
          return {
            ...node,
            children: node.children.map(updateNodeRecursive)
          };
        }

        return node;
      };

      const updatedContent = updateNodeRecursive(prev.currentFile.content);
      
      // Create change record
      const change: Change = {
        id: `${path}-${Date.now()}`,
        timestamp: new Date(),
        path,
        oldValue: findNodeByPath(prev.currentFile.content, path)?.value,
        newValue,
        comment,
        type: 'modify'
      };

      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push(updatedContent);

      return {
        ...prev,
        currentFile: {
          ...prev.currentFile,
          content: updatedContent
        },
        changeHistory: [...prev.changeHistory, change],
        isModified: true,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  }, []);

  const addNode = useCallback((parentPath: string, key: string, value: any, type: string) => {
    setState(prev => {
      if (!prev.currentFile) return prev;

      const newPath = parentPath ? `${parentPath}.${key}` : key;
      
      const addNodeRecursive = (node: UnifiedNode): UnifiedNode => {
        if (node.path === parentPath) {
          const newNode: UnifiedNode = {
            path: newPath,
            key,
            value,
            type: type as any,
            metadata: {
              originalFormat: prev.currentFile!.type,
              lastModified: new Date(),
              isModified: true,
              originalValue: null
            }
          };

          return {
            ...node,
            children: [...(node.children || []), newNode]
          };
        }

        if (node.children) {
          return {
            ...node,
            children: node.children.map(addNodeRecursive)
          };
        }

        return node;
      };

      const updatedContent = addNodeRecursive(prev.currentFile.content);
      
      const change: Change = {
        id: `add-${newPath}-${Date.now()}`,
        timestamp: new Date(),
        path: newPath,
        oldValue: null,
        newValue: value,
        type: 'add'
      };

      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push(updatedContent);

      return {
        ...prev,
        currentFile: {
          ...prev.currentFile,
          content: updatedContent
        },
        changeHistory: [...prev.changeHistory, change],
        isModified: true,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  }, []);

  const deleteNode = useCallback((path: string) => {
    setState(prev => {
      if (!prev.currentFile) return prev;

      const nodeToDelete = findNodeByPath(prev.currentFile.content, path);
      if (!nodeToDelete) return prev;

      const deleteNodeRecursive = (node: UnifiedNode): UnifiedNode => {
        if (node.children) {
          return {
            ...node,
            children: node.children
              .filter(child => child.path !== path)
              .map(deleteNodeRecursive)
          };
        }
        return node;
      };

      const updatedContent = deleteNodeRecursive(prev.currentFile.content);
      
      const change: Change = {
        id: `delete-${path}-${Date.now()}`,
        timestamp: new Date(),
        path,
        oldValue: nodeToDelete.value,
        newValue: null,
        type: 'delete'
      };

      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push(updatedContent);

      return {
        ...prev,
        currentFile: {
          ...prev.currentFile,
          content: updatedContent
        },
        changeHistory: [...prev.changeHistory, change],
        isModified: true,
        selectedNode: prev.selectedNode === path ? null : prev.selectedNode,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  }, []);

  const selectNode = useCallback((path: string | null) => {
    setState(prev => ({ ...prev, selectedNode: path }));
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    setState(prev => ({ ...prev, searchQuery: query }));
  }, []);

  const toggleExpanded = useCallback((path: string) => {
    setState(prev => {
      const newExpanded = new Set(prev.expandedPaths);
      if (newExpanded.has(path)) {
        newExpanded.delete(path);
      } else {
        newExpanded.add(path);
      }
      return { ...prev, expandedPaths: newExpanded };
    });
  }, []);

  const undo = useCallback(() => {
    setState(prev => {
      if (prev.historyIndex > 0) {
        const newIndex = prev.historyIndex - 1;
        const content = prev.history[newIndex];
        
        return {
          ...prev,
          currentFile: prev.currentFile ? {
            ...prev.currentFile,
            content
          } : null,
          historyIndex: newIndex,
          isModified: newIndex > 0,
        };
      }
      return prev;
    });
  }, []);

  const redo = useCallback(() => {
    setState(prev => {
      if (prev.historyIndex < prev.history.length - 1) {
        const newIndex = prev.historyIndex + 1;
        const content = prev.history[newIndex];
        
        return {
          ...prev,
          currentFile: prev.currentFile ? {
            ...prev.currentFile,
            content
          } : null,
          historyIndex: newIndex,
          isModified: true,
        };
      }
      return prev;
    });
  }, []);

  const exportData = useCallback(() => {
    if (!state.currentFile) return null;
    return fileProcessor.serializeContent(state.currentFile.content, state.currentFile.type);
  }, [state.currentFile, fileProcessor]);

  const reset = useCallback(() => {
    setState({
      currentFile: null,
      selectedNode: null,
      changeHistory: [],
      isModified: false,
      searchQuery: '',
      expandedPaths: new Set(),
      history: [],
      historyIndex: -1,
    });
  }, []);

  const validateCurrentFile = useCallback(() => {
    if (!state.currentFile) return [];
    return validationEngine.validateNode(state.currentFile.content);
  }, [state.currentFile, validationEngine]);

  return {
    state,
    fileProcessor,
    validationEngine,
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
    canUndo: state.historyIndex > 0,
    canRedo: state.historyIndex < state.history.length - 1,
  };
}

function findNodeByPath(root: UnifiedNode, path: string): UnifiedNode | null {
  if (root.path === path) return root;
  
  if (root.children) {
    for (const child of root.children) {
      const found = findNodeByPath(child, path);
      if (found) return found;
    }
  }
  
  return null;
}